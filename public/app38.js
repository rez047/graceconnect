/* ============================================================
   GRACECONNECT — APP38.JS (additive, non-destructive)
   1) Reports: "Total Students Present" = ONE date only
      (default latest session; date picker included),
      per-category counts use that same date.
      Offering totals stay cumulative (all dates).
   2) Students roster per category: add student by name or from
      group members; take-attendance loads the roster as
      "Present" chips with a remove (×) button for absentees.
   Touches nothing else.
   ============================================================ */
(function () {
  'use strict';

  function db() {
    try {
      if (typeof window.sb === 'function') { var a = window.sb(); if (a && a.from) return a; }
      if (window.sb && window.sb.from) return window.sb;
      if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
    } catch (e) {}
    return null;
  }
  function me() { return window.user || null; }
  function isAdm() { try { return !!(window.isAdmin && window.isAdmin()); } catch (e) { return false; } }
  function esc38(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function visible(el) { return !!el && el.getClientRects().length > 0; }

  /* ═══════════ ROSTER (Supabase table, localStorage fallback) ═══════════ */
  var LS = 'gc38_students_', rosterCache = {};
  function lsGet(cid) { try { return JSON.parse(localStorage.getItem(LS + cid) || '[]'); } catch (e) { return []; } }
  function lsSet(cid, a) { try { localStorage.setItem(LS + cid, JSON.stringify(a)); } catch (e) {} rosterCache[cid] = a; }
  function loadRoster(cid) {
    var c = db();
    if (!c) return Promise.resolve(rosterCache[cid] || lsGet(cid));
    return c.from('church_group_category_students').select('*').eq('category_id', cid).order('name').then(function (r) {
      if (r.error) return rosterCache[cid] || lsGet(cid);
      rosterCache[cid] = r.data || []; return rosterCache[cid];
    }).catch(function () { return rosterCache[cid] || lsGet(cid); });
  }
  function addStudent(cid, gid, name, uid) {
    var c = db();
    if (c) return c.from('church_group_category_students').insert([{ category_id: cid, group_id: gid || null, name: name, user_id: uid || null }]).then(function (r) {
      if (r.error) { var a = lsGet(cid); a.push({ id: 'ls' + Date.now(), name: name }); lsSet(cid, a); }
      else rosterCache[cid] = null;
    });
    var a2 = lsGet(cid); a2.push({ id: 'ls' + Date.now(), name: name }); lsSet(cid, a2); return Promise.resolve();
  }
  function removeStudent(cid, id) {
    var c = db();
    if (c && String(id).indexOf('ls') !== 0) return c.from('church_group_category_students').delete().eq('id', id).then(function () { rosterCache[cid] = null; });
    lsSet(cid, lsGet(cid).filter(function (x) { return x.id !== id; })); return Promise.resolve();
  }

  /* role helpers (mirror app32) */
  async function groupRole38(gid) { if (!me()) return ''; var r = await db().from('church_group_members').select('role').eq('group_id', gid).eq('user_id', me().id).limit(1); return String(((r.data || [])[0] || {}).role || '').toLowerCase(); }
  async function catRole38(cid) { if (!me()) return ''; var r = await db().from('church_group_category_members').select('role').eq('category_id', cid).eq('user_id', me().id).limit(1); return String(((r.data || [])[0] || {}).role || '').toLowerCase(); }
  async function catManage38(cat) {
    if (!cat) return false;
    if (isAdm()) return true;
    if (cat.teacher_id && me() && cat.teacher_id === me().id) return true;
    if (['leader', 'chairman'].indexOf(await groupRole38(cat.group_id)) > -1) return true;
    return ['teacher', 'leader', 'chairman'].indexOf(await catRole38(cat.id)) > -1;
  }

  /* ═══════════ ATTENDANCE UI: roster card + present chips ═══════════ */
  function chip38(name, absent) {
    return '<span class="chip ' + (absent ? '' : 'chip-green') + '" data-gc38chip="1" data-name="' + esc38(name) + '" style="' + (absent ? 'background:#FEE2E2;color:#991B1B;' : '') + 'display:inline-flex;align-items:center;gap:6px">'
      + esc38(name)
      + '<button type="button" style="border:none;background:none;color:' + (absent ? '#065F46' : '#991B1B') + ';font-weight:800;cursor:pointer;font-size:.8rem" onclick="gc38FlipChip(this,' + (absent ? 'false' : 'true') + ')">' + (absent ? '+' : '×') + '</button></span>';
  }
  window.gc38FlipChip = function (btn, toAbsent) {
    var chip = btn.closest('[data-gc38chip]'); if (!chip) return;
    var name = chip.getAttribute('data-name');
    var target = document.getElementById(toAbsent ? 'gc38-absent' : 'gc38-present');
    chip.remove();
    if (target) target.insertAdjacentHTML('beforeend', chip38(name, toAbsent));
    var aw = document.getElementById('gc38-absentWrap');
    var ab = document.getElementById('gc38-absent');
    if (aw) aw.style.display = (ab && ab.children.length) ? '' : 'none';
    gc38UpdateCount();
  };
  function gc38UpdateCount() {
    var pc = document.getElementById('gc38-present'); if (!pc) return;
    var n = pc.querySelectorAll('[data-gc38chip]').length;
    var lab = document.getElementById('gc38-pcount'); if (lab) lab.textContent = n;
    var pi = document.getElementById('h32mPresent'); if (pi) pi.value = n;
  }

  async function injectAttendance38() {
    if (window.__gc38injecting) return;
    var dateInput = document.getElementById('h32mDate');
    var box = document.getElementById('h32c-meetings');
    var cat = window._h32Cat;
    if (!dateInput || !box || !cat || document.getElementById('gc38-rosterCard')) return;
    window.__gc38injecting = true;
    try {
      var cm = await catManage38(cat);
      var roster = await loadRoster(cat.id);
      var formCard = dateInput.closest('.card');

      /* --- Students roster card (above the form) --- */
      var rows = roster.map(function (s) {
        return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">'
          + '<i class="fas fa-child" style="color:var(--primary)"></i><div style="flex:1;font-weight:600;font-size:.85rem">' + esc38(s.name) + '</div>'
          + (cm ? '<button class="btn btn-danger btn-sm" onclick="gc38DelStudent(\'' + s.id + '\')"><i class="fas fa-trash"></i></button>' : '')
          + '</div>';
      }).join('');
      var rosterCard = document.createElement('div');
      rosterCard.className = 'card'; rosterCard.id = 'gc38-rosterCard';
      rosterCard.innerHTML = '<b>🧒 Students List (' + roster.length + ')</b>'
        + (cm ? '<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" id="gc38-newName" placeholder="New student name" style="flex:1;margin:0">'
            + '<button class="btn btn-primary btn-sm" onclick="gc38AddStudent()"><i class="fas fa-plus"></i></button>'
            + '<button class="btn btn-warm btn-sm" title="Add from group members" onclick="gc38AddFromMembers()"><i class="fas fa-users"></i></button></div>' : '')
        + '<div id="gc38-rosterList" style="margin-top:6px">' + (rows || '<div style="font-size:.8rem;color:var(--text-light)">No students yet. Add your class list once — attendance will use it every time.</div>') + '</div>';
      if (formCard) formCard.parentNode.insertBefore(rosterCard, formCard);

      /* --- Present chips inside the form (only when we have a roster) --- */
      if (cm && roster.length && formCard) {
        var saveBtn = formCard.querySelector('button[onclick="h32SaveRecord()"]');
        var wrap = document.createElement('div');
        wrap.id = 'gc38-chipsWrap';
        wrap.style.cssText = 'margin-top:10px';
        wrap.innerHTML = '<b>✅ Present today (<span id="gc38-pcount">' + roster.length + '</span>)</b>'
          + '<div style="font-size:.72rem;color:var(--text-light);margin:2px 0 6px">Tap × beside a name to mark absent.</div>'
          + '<div id="gc38-present" style="display:flex;flex-wrap:wrap;gap:6px">' + roster.map(function (s) { return chip38(s.name, false); }).join('') + '</div>'
          + '<div id="gc38-absentWrap" style="display:none;margin-top:8px"><b style="font-size:.8rem">Absent (tap + to restore):</b><div id="gc38-absent" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px"></div></div>';
        if (saveBtn) formCard.insertBefore(wrap, saveBtn); else formCard.appendChild(wrap);
        var ni = document.getElementById('h32mNames'), pi = document.getElementById('h32mPresent');
        if (ni) ni.style.display = 'none';
        if (pi) pi.style.display = 'none';
        gc38UpdateCount();
      }
    } finally { window.__gc38injecting = false; }
  }

  function reinject38() {
    var r = document.getElementById('gc38-rosterCard'); if (r) r.remove();
    var w = document.getElementById('gc38-chipsWrap'); if (w) w.remove();
    injectAttendance38();
  }
  window.gc38AddStudent = async function () {
    var cat = window._h32Cat, i = document.getElementById('gc38-newName');
    var n = i ? i.value.trim() : ''; if (!n) return alert('Enter student name');
    await addStudent(cat.id, cat.group_id, n, null); reinject38();
  };
  window.gc38DelStudent = async function (id) {
    if (!confirm('Remove this student from the list?')) return;
    await removeStudent(window._h32Cat.id, id); reinject38();
  };
  window.gc38AddFromMembers = async function () {
    var cat = window._h32Cat, c = db();
    var gm = await c.from('church_group_members').select('user_id').eq('group_id', cat.group_id);
    var roster = await loadRoster(cat.id);
    var have = {}; roster.forEach(function (s) { if (s.user_id) have[s.user_id] = 1; have['n:' + String(s.name).toLowerCase()] = 1; });
    var us = window.usersData || [];
    if (!us.length) { var pr = await c.from('profiles').select('id,name'); us = pr.data || []; }
    var list = (gm.data || []).map(function (g) { return us.find(function (u) { return u.id === g.user_id; }); }).filter(function (u) { return u && !have[u.id] && !have['n:' + u.name.toLowerCase()]; });
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="gc38AM" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div>'
      + '<div class="modal-title">Add student from group members</div><div style="max-height:320px;overflow-y:auto">'
      + (list.map(function (u) { return '<div onclick="gc38AddMember(\'' + u.id + '\',\'' + esc38(u.name).replace(/'/g, "\\'") + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer"><div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">' + esc38((u.name || '?').slice(0, 2).toUpperCase()) + '</div><b style="font-size:.85rem">' + esc38(u.name) + '</b></div>'; }).join('') || '<div class="card">No more members to add.</div>')
      + '</div></div></div>');
  };
  window.gc38AddMember = async function (uid, name) {
    var m = document.getElementById('gc38AM'); if (m) m.remove();
    await addStudent(window._h32Cat.id, window._h32Cat.group_id, name, uid); reinject38();
  };

  /* --- save override: present chips → names + count --- */
  var origSave38 = window.h32SaveRecord;
  window.h32SaveRecord = function () {
    var pc = document.getElementById('gc38-present');
    if (pc) {
      var names = [];
      pc.querySelectorAll('[data-gc38chip]').forEach(function (ch) { names.push(ch.getAttribute('data-name')); });
      var ni = document.getElementById('h32mNames'), pi = document.getElementById('h32mPresent');
      if (ni) { ni.style.display = ''; ni.value = names.join(', '); }
      if (pi) { pi.style.display = ''; pi.value = names.length; }
    }
    if (origSave38) return origSave38.apply(this, arguments);
  };

  /* ═══════════ REPORTS: same-date totals ═══════════ */
  function dates38(R) { var d = {}; R.forEach(function (r) { if (r.record_date) d[r.record_date] = 1; }); return Object.keys(d).sort().reverse(); }
  function presentOn38(R, date, catFilter) {
    var t = 0;
    R.forEach(function (r) {
      if (r.record_date !== date) return;
      if (catFilter && r.category_id !== catFilter) return;
      t += Number(r.students_present || 0);
    });
    return t;
  }
  function offeringAll38(R) { var o = 0; R.forEach(function (r) { o += Number(r.total_offering || 0); }); return o; }
  function dateSelect38(dl, sel) {
    return '<div style="font-size:.72rem;color:var(--text-light);margin-bottom:6px">Attendance date: <select class="form-select" style="display:inline-block;width:auto;padding:4px 8px;font-size:.75rem" onchange="gc38RDate(this.value)">'
      + dl.map(function (d) { return '<option value="' + d + '"' + (d === sel ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></div>';
  }
  window.gc38RDate = function (v) { window._gc38SelDate = v; fixGroupReports38(); fixCatReports38(); };

  async function fixGroupReports38() {
    var gid = window._h32GroupId, box = document.getElementById('gg-tab-reports');
    if (!gid || !visible(box)) return;
    var c = db(); if (!c) return;
    var recs = await c.from('church_group_category_records').select('*').eq('group_id', gid);
    if (recs.error) return;
    var R = recs.data || []; if (!R.length) return;
    var dl = dates38(R);
    var sel = window._gc38SelDate; if (!sel || dl.indexOf(sel) < 0) sel = dl[0];
    var cats = await c.from('church_group_categories').select('id,name').eq('group_id', gid);
    var nameId = {}; (cats.data || []).forEach(function (x) { nameId[x.name] = x.id; });
    /* per-category cards: users icon = present on selected date */
    box.querySelectorAll('.card').forEach(function (card) {
      var b = card.querySelector('b'); if (!b) return;
      var cid = nameId[b.textContent.trim()]; if (!cid) return;
      var spans = card.querySelectorAll('span');
      for (var i = 0; i < spans.length; i++) {
        if (spans[i].querySelector('i.fa-users')) { spans[i].innerHTML = '<i class="fas fa-users"></i> ' + presentOn38(R, sel, cid); break; }
      }
    });
    /* totals card */
    var tcard = null;
    box.querySelectorAll('.card').forEach(function (cd) { if (!tcard && /Total Students Present/.test(cd.textContent)) tcard = cd; });
    if (!tcard) return;
    var total = presentOn38(R, sel, null), oo = offeringAll38(R);
    var seeOffer = /Total Offering \(all categories\):/.test(tcard.innerHTML);
    var sig = 'g|' + sel + '|' + total + '|' + oo.toFixed(2) + '|' + seeOffer + '|' + R.length;
    if (tcard.getAttribute('data-gc38-sig') === sig) return;
    tcard.setAttribute('data-gc38-sig', sig);
    tcard.innerHTML = dateSelect38(dl, sel)
      + 'Total Students Present: ' + total
      + (seeOffer ? '<br>Total Offering (all categories, all dates): ' + oo.toFixed(2)
                  : '<br><span style="font-size:.75rem;color:var(--text-lighter)">Offering totals visible to leadership only</span>');
  }

  async function fixCatReports38() {
    var cat = window._h32Cat, box = document.getElementById('h32c-reports');
    if (!cat || !visible(box)) return;
    var c = db(); if (!c) return;
    var recs = await c.from('church_group_category_records').select('*').eq('category_id', cat.id);
    if (recs.error) return;
    var R = recs.data || []; if (!R.length) return;
    var dl = dates38(R);
    var sel = window._gc38SelDate; if (!sel || dl.indexOf(sel) < 0) sel = dl[0];
    var tcard = null;
    box.querySelectorAll('.card').forEach(function (cd) { if (!tcard && /Total Students Present/.test(cd.textContent)) tcard = cd; });
    if (!tcard) return;
    var p = presentOn38(R, sel, cat.id), oo = offeringAll38(R);
    var seeOffer = /Total Offering:\s*\d/.test(tcard.innerHTML);
    var sig = 'c|' + sel + '|' + p + '|' + oo.toFixed(2) + '|' + seeOffer + '|' + R.length;
    if (tcard.getAttribute('data-gc38-sig') === sig) return;
    tcard.setAttribute('data-gc38-sig', sig);
    tcard.innerHTML = dateSelect38(dl, sel)
      + 'Total Students Present: ' + p
      + (seeOffer ? '<br>Total Offering: ' + oo.toFixed(2)
                  : '<br><span style="font-size:.72rem;color:var(--text-lighter)">Offering totals hidden for members</span>');
  }

  async function fixMeetingsTotal38() {
    var cat = window._h32Cat, box = document.getElementById('h32c-meetings');
    if (!cat || !visible(box)) return;
    var c = db(); if (!c) return;
    var recs = await c.from('church_group_category_records').select('*').eq('category_id', cat.id);
    if (recs.error) return;
    var R = recs.data || []; if (!R.length) return;
    var dl = dates38(R), latest = dl[0];
    var tcard = null;
    box.querySelectorAll('.card').forEach(function (cd) { if (/Total Students Present/.test(cd.textContent)) tcard = cd; });
    if (!tcard) return;
    var p = presentOn38(R, latest, cat.id), oo = offeringAll38(R);
    var seeOffer = /Total Offering:\s*\d/.test(tcard.innerHTML);
    var sig = 'm|' + latest + '|' + p + '|' + oo.toFixed(2) + '|' + seeOffer + '|' + R.length;
    if (tcard.getAttribute('data-gc38-sig') === sig) return;
    tcard.setAttribute('data-gc38-sig', sig);
    tcard.innerHTML = 'Total Students Present (' + latest + '): ' + p
      + (seeOffer ? '<br>Total Offering: ' + oo.toFixed(2)
                  : '<br><span style="font-size:.72rem;color:var(--text-lighter)">Offering visible to leadership/teacher only</span>');
  }

  /* ═══════════ hooks + loop ═══════════ */
  function schedule38() { setTimeout(function () { injectAttendance38(); fixGroupReports38(); fixCatReports38(); fixMeetingsTotal38(); }, 300); setTimeout(function () { fixGroupReports38(); fixCatReports38(); fixMeetingsTotal38(); }, 900); }
  if (!window.__gc38hooks) {
    window.__gc38hooks = true;
    if (typeof window.h32CatTab === 'function') { var _ct = window.h32CatTab; window.h32CatTab = function () { var r = _ct.apply(this, arguments); schedule38(); return r; }; }
    if (typeof window.ggSwitchGroupTab === 'function') { var _gs = window.ggSwitchGroupTab; window.ggSwitchGroupTab = function () { var r = _gs.apply(this, arguments); schedule38(); return r; }; }
  }
  setInterval(function () { injectAttendance38(); fixGroupReports38(); fixCatReports38(); fixMeetingsTotal38(); }, 1500);
  console.log('✝️ app38.js loaded — same-date attendance totals + students roster');
})();
