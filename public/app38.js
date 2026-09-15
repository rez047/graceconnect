/* ============================================================
   GRACECONNECT — APP38.JS (additive, non-destructive)
   1) Reports total ATTENDANCE per single date (picker, default
      latest) across categories — no more cumulative headcount.
      Offering totals remain all-time.
   2) Category Students Roster (list + add new student) and
      attendance taking filled from the roster with a remove
      button per name (absentees), count = remaining names.
   Uses existing table church_group_category_records unchanged.
   ============================================================ */
(function () {
  'use strict';

  function db38() {
    try {
      if (typeof window.sb === 'function') { var a = window.sb(); if (a && a.from) return a; }
      if (window.sb && window.sb.from) return window.sb;
      if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
    } catch (e) {}
    return null;
  }
  function esc38(s) { if (typeof window.esc === 'function') return window.esc(s); return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function q38(s) { return String(s).replace(/'/g, "\\'"); }
  function media38(u) { if (!u) return ''; if (typeof window.mediaHtml === 'function') return window.mediaHtml(u); return '<div class="post-media" style="margin-top:8px"><img src="' + u + '"></div>'; }
  function dates38(recs) {
    var set = {}; (recs || []).forEach(function (x) { if (x.record_date) set[x.record_date] = 1; });
    return Object.keys(set).sort().reverse();
  }

  window._h38 = window._h38 || { present: [], absent: [], roster: [] };

  /* ═══════════ ROSTER ═══════════ */
  function h38RenderRoster() {
    var box = document.getElementById('h38RosterList'); if (!box) return;
    var r = window._h38.roster || [];
    if (!r.length) { box.innerHTML = '<div style="font-size:.8rem;color:var(--text-lighter)">No students yet — add the first one above.</div>'; return; }
    box.innerHTML = r.map(function (s) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">'
        + '<i class="fas fa-child" style="color:var(--primary)"></i><span style="flex:1;font-weight:600;font-size:.88rem">' + esc38(s.name) + '</span>'
        + '<button class="btn btn-danger btn-sm" onclick="h38DelStudent(\'' + s.id + '\')"><i class="fas fa-trash"></i></button></div>';
    }).join('');
  }
  window.h38AddStudent = async function () {
    var cat = window._h32Cat; if (!cat) return;
    var inp = document.getElementById('h38NewStudent');
    var name = ((inp && inp.value) || '').trim();
    if (!name) return alert('Enter student name');
    var c = db38(); if (!c) return alert('Supabase not ready');
    var r = await c.from('church_group_students').insert([{ category_id: cat.id, group_id: cat.group_id, name: name }]);
    if (r.error) return alert(r.error.message);
    if (inp) inp.value = '';
    h32CatMeetings();
  };
  window.h38DelStudent = async function (id) {
    if (!confirm('Remove this student from the list?')) return;
    var c = db38(); var r = await c.from('church_group_students').delete().eq('id', id);
    if (r.error) return alert(r.error.message);
    h32CatMeetings();
  };

  /* ═══════════ ATTENDANCE LIST (from roster, remove = absent) ═══════════ */
  function h38RenderAttendance() {
    var list = document.getElementById('h38PresentList'); if (!list) return;
    var P = window._h38.present, A = window._h38.absent;
    var cnt = document.getElementById('h38Count'); if (cnt) cnt.textContent = P.length;
    if (!P.length) list.innerHTML = '<div style="font-size:.8rem;color:var(--text-lighter)">No students present — add students to the roster first.</div>';
    else list.innerHTML = P.map(function (n) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">'
        + '<i class="fas fa-user-check" style="color:#10B981"></i><span style="flex:1;font-size:.88rem">' + esc38(n) + '</span>'
        + '<button class="btn btn-danger btn-sm" style="white-space:nowrap" onclick="h38MarkAbsent(\'' + q38(n) + '\')"><i class="fas fa-user-minus"></i> Remove</button></div>';
    }).join('');
    var w = document.getElementById('h38AbsentWrap');
    if (w) w.innerHTML = A.length ? '<div style="font-size:.75rem;color:var(--text-light);margin-top:4px">Absent (tap to restore): ' + A.map(function (n) {
      return '<button class="chip" style="background:#FEE2E2;color:#991B1B;margin:2px" onclick="h38Restore(\'' + q38(n) + '\')">' + esc38(n) + '</button>';
    }).join('') + '</div>' : '';
  }
  window.h38MarkAbsent = function (name) {
    var P = window._h38.present, i = P.indexOf(name);
    if (i > -1) { P.splice(i, 1); window._h38.absent.push(name); }
    h38RenderAttendance();
  };
  window.h38Restore = function (name) {
    var A = window._h38.absent, i = A.indexOf(name);
    if (i > -1) { A.splice(i, 1); window._h38.present.push(name); }
    h38RenderAttendance();
  };

  /* ═══════════ CATEGORY MEETINGS / TAKE ATTENDANCE (override) ═══════════ */
  window.h32CatMeetings = async function () {
    var cat = window._h32Cat, box = document.getElementById('h32c-meetings'); if (!box || !cat) return;
    var c = db38(); if (!c) return;
    var cm = await catManage(cat);
    var r = await c.from('church_group_category_records').select('*').eq('category_id', cat.id).order('record_date', { ascending: false }).limit(100);
    var recs = r.data || [];
    var html = '';

    if (cm) {
      html += '<div class="card"><b>🧒 Students List (Roster)</b>'
        + '<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" id="h38NewStudent" placeholder="New student name" style="margin:0">'
        + '<button class="btn btn-primary" style="white-space:nowrap" onclick="h38AddStudent()"><i class="fas fa-plus"></i> Add</button></div>'
        + '<div id="h38RosterList" style="margin-top:8px"></div></div>';

      html += '<div class="card"><b>📝 Take Category Attendance / Meeting</b>'
        + '<div class="grid-2" style="margin-top:8px"><input class="form-input" id="h32mDate" type="date"><input class="form-input" id="h32mOffering" type="number" step="0.01" placeholder="Total offering"></div>'
        + '<div style="margin-top:10px;font-weight:700;font-size:.85rem">Present (remove absentees): <span id="h38Count" class="chip chip-green">0</span></div>'
        + '<div id="h38PresentList" style="margin-top:6px"></div>'
        + '<div id="h38AbsentWrap"></div>'
        + '<input class="form-input" id="h32mLesson" placeholder="Lesson / theme" style="margin-top:8px">'
        + '<div class="media-upload" id="h32mUp" style="margin-top:8px" onclick="h32Attach(\'mmedia\',\'h32mUp\')"><i class="fas fa-cloud-upload-alt"></i><span>Upload media (optional)</span></div>'
        + '<button class="btn btn-primary btn-block" onclick="h32SaveRecord()"><i class="fas fa-save"></i> Save Record</button></div>';
    }

    /* records list (same look as before) */
    var dts = dates38(recs), latest = dts[0] || null, tp = 0, to = 0;
    recs.forEach(function (x) {
      if (latest && x.record_date === latest) tp += Number(x.students_present || 0);
      to += Number(x.total_offering || 0);
      html += '<div class="card"><b>' + esc38(x.lesson || 'Meeting') + '</b><div style="font-size:.78rem;color:var(--text-light)">' + esc38(x.record_date || '') + '</div>'
        + '<div style="margin-top:4px"><i class="fas fa-users"></i> ' + esc38(x.students_present || 0) + ' present' + (cm ? ' &nbsp; <i class="fas fa-coins"></i> ' + Number(x.total_offering || 0) : '') + '</div>'
        + (x.student_names ? '<div style="font-size:.78rem;white-space:pre-wrap;margin-top:4px">' + esc38(x.student_names) + '</div>' : '')
        + media38(x.media_url) + '</div>';
    });
    html += '<div class="card" style="text-align:center;font-weight:800">Total Students Present (' + esc38(latest || 'no date') + '): ' + tp
      + (cm ? '<br>Total Offering (all dates): ' + to.toFixed(2) : '<br><span style="font-size:.72rem;color:var(--text-lighter)">Offering visible to leadership/teacher only</span>') + '</div>';
    box.innerHTML = html || '<div class="card">No meetings yet.</div>';

    if (cm) {
      var rr = await c.from('church_group_students').select('*').eq('category_id', cat.id).order('name');
      window._h38.roster = rr.data || [];
      window._h38.present = window._h38.roster.map(function (s) { return s.name; });
      window._h38.absent = [];
      h38RenderRoster(); h38RenderAttendance();
    }
  };

  /* save record — same table/columns as before */
  window.h32SaveRecord = async function () {
    var cat = window._h32Cat; if (!cat) return;
    var c = db38(); if (!c) return alert('Supabase not ready');
    var f = window._h32Media && window._h32Media.mmedia;
    var url = f ? await upload(f, 'category-records') : null;
    var names = (window._h38.present || []).slice();
    var g = function (id) { return document.getElementById(id); };
    var r = await c.from('church_group_category_records').insert([{
      category_id: cat.id, group_id: cat.group_id,
      record_date: (g('h32mDate') || {}).value || null,
      student_names: names.join(', '),
      students_present: names.length,
      total_offering: Number((g('h32mOffering') || {}).value || 0),
      lesson: ((g('h32mLesson') || {}).value || '').trim(),
      media_url: url
    }]);
    if (r.error) return alert(r.error.message);
    window._h32Media.mmedia = null;
    h32CatMeetings();
  };

  /* ═══════════ CATEGORY REPORTS (per-date attendance) ═══════════ */
  window.h32CatReports = async function () {
    var cat = window._h32Cat, box = document.getElementById('h32c-reports'); if (!box || !cat) return;
    var c = db38(); if (!c) return;
    var cm = await catManage(cat);
    var r = await c.from('church_group_category_records').select('*').eq('category_id', cat.id);
    var recs = r.data || [], dts = dates38(recs);
    var sel = (window._h38CatDate && dts.indexOf(window._h38CatDate) > -1) ? window._h38CatDate : dts[0];
    var tp = 0, td = 0, ta = 0;
    recs.forEach(function (x) {
      if (x.record_date === sel) { tp += Number(x.students_present || 0); td += Number(x.total_offering || 0); }
      ta += Number(x.total_offering || 0);
    });
    var html = dts.length ? '<div class="card"><b>📅 Attendance date</b><select class="form-select" onchange="window._h38CatDate=this.value;h32CatReports()">'
      + dts.map(function (d) { return '<option' + (d === sel ? ' selected' : '') + '>' + esc38(d) + '</option>'; }).join('') + '</select></div>' : '';
    html += '<div class="card" style="text-align:center;font-weight:800">Total Students Present (' + esc38(sel || 'no date') + '): ' + tp
      + (cm ? '<br>Total Offering (' + esc38(sel || '-') + '): ' + td.toFixed(2) + '<br><span style="font-size:.75rem;font-weight:600;color:var(--text-light)">Total Offering (all dates): ' + ta.toFixed(2) + '</span>'
             : '<br><span style="font-size:.72rem;color:var(--text-lighter)">Offering totals hidden for members</span>') + '</div>';
    if (cm) html += '<div class="card">' + recs.map(function (x) {
      return '<div style="display:flex;justify-content:space-between;font-size:.82rem;padding:4px 0;border-bottom:1px solid var(--border)"><span>' + esc38(x.record_date || '') + ' • ' + esc38(x.lesson || 'Record') + '</span><b>' + Number(x.total_offering || 0).toFixed(2) + '</b></div>';
    }).join('') + '</div>';
    box.innerHTML = html;
  };

  /* ═══════════ GROUP REPORTS (per-date attendance, all categories) ═══════════ */
  window.h32GroupReports = async function () {
    var gid = window._h32GroupId, box = document.getElementById('gg-tab-reports'); if (!gid || !box) return;
    var c = db38(); if (!c) return;
    var see = await groupManage(gid);
    var cats = await c.from('church_group_categories').select('*').eq('group_id', gid).order('name');
    var recs = await c.from('church_group_category_records').select('*').eq('group_id', gid);
    var all = recs.data || [], dts = dates38(all);
    var sel = (window._h38RepDate && dts.indexOf(window._h38RepDate) > -1) ? window._h38RepDate : dts[0];
    var per = {}, op = 0, oo = 0;
    all.forEach(function (x) {
      per[x.category_id] = per[x.category_id] || { p: 0, o: 0 };
      if (x.record_date === sel) { per[x.category_id].p += Number(x.students_present || 0); op += Number(x.students_present || 0); }
      per[x.category_id].o += Number(x.total_offering || 0);
      oo += Number(x.total_offering || 0);
    });
    var html = dts.length ? '<div class="card"><b>📅 Attendance date</b><select class="form-select" onchange="window._h38RepDate=this.value;h32GroupReports()">'
      + dts.map(function (d) { return '<option' + (d === sel ? ' selected' : '') + '>' + esc38(d) + '</option>'; }).join('') + '</select>'
      + '<div style="font-size:.72rem;color:var(--text-light);margin-top:4px">Students present = attendance of this date across all categories. Offering = all dates.</div></div>' : '';
    (cats.data || []).forEach(function (ct) {
      var t = per[ct.id] || { p: 0, o: 0 };
      html += '<div class="card"><b>' + esc38(ct.name) + '</b><div style="font-size:.78rem;color:var(--text-light)">Age: ' + esc38(ct.min_age || 0) + ' - ' + esc38(ct.max_age || 99) + '</div>'
        + '<div style="margin-top:6px;display:flex;gap:14px"><span><i class="fas fa-users"></i> ' + t.p + '</span>'
        + (see ? '<span><i class="fas fa-coins"></i> ' + t.o.toFixed(2) + '</span>' : '') + '</div></div>';
    });
    html += '<div class="card" style="text-align:center;font-weight:800">Total Students Present (' + esc38(sel || 'no date') + '): ' + op
      + (see ? '<br>Total Offering (all categories, all dates): ' + oo.toFixed(2) : '<br><span style="font-size:.75rem;color:var(--text-lighter)">Offering totals visible to leadership only</span>') + '</div>';
    box.innerHTML = html;
  };

  console.log('✝️ app38.js loaded — per-date attendance reports + students roster');
})();
