/* ============================================================
   GRACECONNECT — APP40.JS
   1) Reply toggle + DOM-driven send for c26/gg comments.
   2) REPORTS TAB: visible to leadership ONLY (group + category).
      Members no longer see the Reports tab at all.
   ============================================================ */
(function () {
  'use strict';

  function db40() {
    try {
      if (typeof window.sb === 'function') { var c = window.sb(); if (c && c.from) return c; }
      if (window.sb && window.sb.from) return window.sb;
      if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
    } catch (e) {}
    return null;
  }
  function me40() { return window.user || null; }
  function isAdm40() { try { return !!(window.isAdmin && window.isAdmin()); } catch (e) { return false; } }

  /* ---------- toggle ---------- */
  function toggleBox(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
    if (el.style.display === 'block') { var i = el.querySelector('input'); if (i) setTimeout(function () { i.focus(); }, 80); }
  }
  window.c26gx_ToggleReply = function (id) { toggleBox('c26gx_reply_' + id); };
  window.gggx_ToggleReply  = function (id) { toggleBox('gggx_reply_' + id); };
  if (typeof window.c26GroupToggleReply !== 'function') window.c26GroupToggleReply = window.c26gx_ToggleReply;
  if (typeof window.ggGroupToggleReply  !== 'function') window.ggGroupToggleReply  = window.gggx_ToggleReply;

  /* ---------- reload surface ---------- */
  function reloadSurface() {
    if (document.getElementById('c26-feed') && typeof window.c26Tab === 'function') { window.c26Tab('feed'); return; }
    if (document.getElementById('gg-tab-feed') && typeof window.ggSwitchGroupTab === 'function') { window.ggSwitchGroupTab('feed'); return; }
    if (document.getElementById('h32c-forum') && typeof window.h32CatTab === 'function') { window.h32CatTab('forum'); return; }
    if (document.getElementById('h28ForumList') && typeof window.h28LoadForum === 'function') { window.h28LoadForum(); return; }
    if (document.getElementById('h27PostList') && typeof window.h27LoadForum === 'function') { window.h27LoadForum(); return; }
  }

  /* ---------- DOM-driven send ---------- */
  function sendFromButton(btn) {
    var box = btn.closest ? btn.closest('div[id*="_reply_"]') : null;
    if (box && /_replytext_/.test(box.id)) box = null;
    var input = box ? box.querySelector('input') : (btn.parentElement ? btn.parentElement.querySelector('input') : null);
    if (!input) { alert('Reply box not found.'); return; }
    var text = input.value.trim();
    if (!text) { alert('Write a reply first.'); return; }
    var m = me40(); if (!m) { alert('Log in first.'); return; }
    var c = db40(); if (!c) { alert('Not connected.'); return; }

    var parentId = null, postId = null;
    var rm = input.id.match(/_replytext_(.+)$/);
    if (rm) {
      parentId = rm[1];
      var card = input.closest('.card') || input.closest('div');
      var ci = card ? card.querySelector('input[id*="_comment_"]') : null;
      if (ci) postId = ci.id.split('_comment_')[1];
    } else {
      var cm = input.id.match(/_comment_(.+)$/);
      if (cm) postId = cm[1];
    }
    if (!postId) { alert('Could not find the post for this reply.'); return; }

    c.from('community_comments').insert([{
      post_id: postId,
      user_id: m.id,
      text: text,
      media_url: null,
      parent_comment_id: parentId || null
    }]).then(function (r) {
      if (r.error) { alert('Send failed: ' + r.error.message); return; }
      input.value = '';
      if (box) box.style.display = 'none';
      reloadSurface();
    });
  }

  /* ---------- router ---------- */
  function parseArgs(s) {
    var out = [], re = /'([^']*)'|"([^"]*)"|(null|true|false)|(-?\d+(?:\.\d+)?)/g, m;
    while ((m = re.exec(s))) {
      if (m[1] !== undefined) out.push(m[1]);
      else if (m[2] !== undefined) out.push(m[2]);
      else if (m[3] !== undefined) out.push(m[3] === 'null' ? null : (m[3] === 'true'));
      else out.push(parseFloat(m[4]));
    }
    return out;
  }
  function callSpan(oc, startIdx) {
    var depth = 0;
    for (var i = startIdx; i < oc.length; i++) {
      if (oc[i] === '(') depth++;
      else if (oc[i] === ')') { depth--; if (depth === 0) return oc.substring(startIdx + 1, i); }
    }
    return oc.substring(startIdx + 1);
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[onclick]') : null;
    if (!el) return;
    var oc = el.getAttribute('onclick') || '';
    var m = oc.match(/\b(c26gx|gggx)_([A-Za-z]+)\s*\(/);
    if (!m) return;
    var suffix = m[2];
    var realName = (m[1] === 'c26gx' ? 'c26Group' : 'ggGroup') + suffix;
    var openIdx = oc.indexOf(m[0]) + m[0].length - 1;
    var args = parseArgs(callSpan(oc, openIdx));
    if (suffix === 'ToggleReply') {
      e.preventDefault(); e.stopPropagation();
      toggleBox((m[1] === 'c26gx' ? 'c26gx_reply_' : 'gggx_reply_') + args[0]);
      return;
    }
    if (typeof window[realName] === 'function') {
      e.preventDefault(); e.stopPropagation();
      try { window[realName].apply(null, args); } catch (err) { console.error(err); }
      return;
    }
    if (/Comment|Reply|Send|Submit/i.test(suffix)) {
      e.preventDefault(); e.stopPropagation();
      sendFromButton(el);
    }
  }, true);

  /* ============================================================
     REPORTS = LEADERSHIP ONLY (group tab + category tab)
     ============================================================ */
  function groupLead40(gid) {
    if (isAdm40()) return Promise.resolve(true);
    var m = me40(); if (!m) return Promise.resolve(false);
    var c = db40(); if (!c) return Promise.resolve(false);
    return c.from('church_group_members').select('role').eq('group_id', gid).eq('user_id', m.id).limit(1)
      .then(function (r) {
        var role = String(((r.data || [])[0] || {}).role || '').toLowerCase();
        return ['leader', 'chairman'].indexOf(role) > -1;
      }).catch(function () { return false; });
  }
  function catLead40(cat) {
    if (isAdm40()) return Promise.resolve(true);
    var m = me40(); if (!m) return Promise.resolve(false);
    if (cat.teacher_id && m.id === cat.teacher_id) return Promise.resolve(true);
    var c = db40(); if (!c) return Promise.resolve(false);
    return c.from('church_group_members').select('role').eq('group_id', cat.group_id).eq('user_id', m.id).limit(1)
      .then(function (g) {
        var groles = String(((g.data || [])[0] || {}).role || '').toLowerCase();
        if (['leader', 'chairman'].indexOf(groles) > -1) return true;
        return c.from('church_group_category_members').select('role').eq('category_id', cat.id).eq('user_id', m.id).limit(1)
          .then(function (r) {
            var role = String(((r.data || [])[0] || {}).role || '').toLowerCase();
            return ['teacher', 'leader', 'chairman'].indexOf(role) > -1;
          });
      }).catch(function () { return false; });
  }

  function gateReports40() {
    /* Group page Reports tab */
    var gbtn = document.getElementById('gg-tabbtn-reports');
    if (gbtn && window._gg && window._gg.currentGroupId) {
      groupLead40(window._gg.currentGroupId).then(function (ok) {
        gbtn.style.display = ok ? '' : 'none';
        if (!ok) {
          var gp = document.getElementById('gg-tab-reports');
          if (gp && gp.style.display !== 'none' && typeof window.ggSwitchGroupTab === 'function') window.ggSwitchGroupTab('feed');
        }
      });
    }
    /* Category page Reports tab */
    var cbtn = document.getElementById('h32ct-reports');
    if (cbtn && window._h32Cat) {
      catLead40(window._h32Cat).then(function (ok) {
        cbtn.style.display = ok ? '' : 'none';
        if (!ok) {
          var cp = document.getElementById('h32c-reports');
          if (cp && cp.style.display !== 'none' && typeof window.h32CatTab === 'function') window.h32CatTab('forum');
        }
      });
    }
  }
  setInterval(gateReports40, 1500);
  if (window.MutationObserver && document.body) {
    var gt = null;
    new MutationObserver(function () { clearTimeout(gt); gt = setTimeout(gateReports40, 300); }).observe(document.body, { childList: true, subtree: true });
  }
  /* ============================================================
     M-PESA EXCLUSIVE: neutralize the injected gcPayMethod
     dropdown wherever it appears (Rally Cause + Give Now)
     ============================================================ */
  window.gcPayMethodChange = function () { return false; };

  function lockPayMethod40() {
    /* hide + lock every gcPayMethod select (hidden keeps .value='mpesa'
       so any old wrapper that reads it still gets mpesa, never crashes) */
    document.querySelectorAll('[id="gcPayMethod"]').forEach(function (sel) {
      try { sel.value = 'mpesa'; } catch (e) {}
      sel.onchange = null;
      sel.setAttribute('onchange', '');
      sel.style.display = 'none';
      var wrap = sel.closest ? sel.closest('.form-group') : (sel.parentElement || null);
      if (wrap) {
        var lb = wrap.querySelector ? wrap.querySelector('label') : null;
        if (lb && /payment method/i.test(lb.textContent || '')) lb.style.display = 'none';
        wrap.style.display = 'none';
      }
    });
    /* hide any other cash/bank method group in both giving modals */
    ['giveModal', 'givingModal'].forEach(function (id) {
      var modal = document.getElementById(id);
      if (!modal) return;
      modal.querySelectorAll('.form-group').forEach(function (g) {
        var t = (g.textContent || '').toLowerCase();
        if (/payment method/.test(t) && /cash/.test(t) && /bank/.test(t)) g.style.display = 'none';
      });
    });
  }
  setInterval(lockPayMethod40, 800);
  if (typeof window.openModal === 'function' && !window.openModal._gc40lock) {
    var om40 = window.openModal;
    window.openModal = function (id) {
      var r = om40.apply(this, arguments);
      if (id === 'givingModal' || id === 'giveModal') { setTimeout(lockPayMethod40, 150); setTimeout(lockPayMethod40, 600); }
      return r;
    };
    window.openModal._gc40lock = true;
  }
/* ============================================================
     M-PESA DARAJA (STK Push) — Give Now flow
     Phone box ONLY inside #giveModal (pre-filled from profile).
     Never in Rally Cause. No native prompts, no alerts asking.
     ============================================================ */
  var origConfirm40 = window.confirmGiving;
  function normPhone40(p) {
    p = String(p || '').replace(/\s+/g, '');
    if (p.charAt(0) === '+') p = p.slice(1);
    if (p.charAt(0) === '0') p = '254' + p.slice(1);
    return p;
  }
  function ensurePhoneInGiveModal40() {
    var modal = document.getElementById('giveModal');
    if (!modal || !modal.classList.contains('show')) return;
    if (modal.querySelector('[id="gc40MpesaPhone"]')) return;
    var amount = document.getElementById('giveAmount');
    if (!amount) return;
    var ag = amount.closest ? amount.closest('.form-group') : null;
    if (!ag) return;
    var g = document.createElement('div');
    g.className = 'form-group';
    g.innerHTML = '<label class="form-label">M-Pesa Number</label>'
      + '<input class="form-input" id="gc40MpesaPhone" placeholder="07XX XXX XXX" value="' + ((window.profile && window.profile.phone) || '') + '">';
    ag.parentNode.insertBefore(g, ag.nextSibling);
  }
  function purgePhoneElsewhere40() {
    document.querySelectorAll('[id="gc40MpesaPhone"]').forEach(function (el) {
      var inGive = !!(el.closest && el.closest('#giveModal'));
      if (inGive) return;
      var wrap = el.closest ? el.closest('.form-group') : (el.parentElement || null);
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      else if (el.parentNode) el.parentNode.removeChild(el);
    });
  }
  purgePhoneElsewhere40();
  setInterval(purgePhoneElsewhere40, 800);
  if (typeof window._gcGive === 'function' && !window._gcGive._gc40mpesa) {
    var origGive40 = window._gcGive;
    window._gcGive = function (id, title) {
      var r = origGive40.apply(this, arguments);
      setTimeout(ensurePhoneInGiveModal40, 200);
      setTimeout(ensurePhoneInGiveModal40, 600);
      setTimeout(purgePhoneElsewhere40, 300);
      return r;
    };
    window._gcGive._gc40mpesa = true;
  }
  window.confirmGiving = function () {
    var amount = parseFloat((document.getElementById('giveAmount') || {}).value || 0);
    var cid = window._gcCurrentCauseId;
    if (!amount) return alert('Amount required');
    if (!cid) return alert('No cause selected');
    var field = document.getElementById('gc40MpesaPhone');
    var phone = normPhone40((field && field.value) || (window.profile && window.profile.phone));
    if (!/^254\d{9}$/.test(phone)) {
      if (field) { field.focus(); field.style.borderColor = '#EF4444'; }
      return alert('Type the M-Pesa number in the M-Pesa Number box, then press Confirm.');
    }
    fetch('/api/mpesa-stk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, amount: amount, causeId: cid, userId: window.user ? window.user.id : null })
    }).then(function (r) {
      if (r.status === 404 && origConfirm40) return origConfirm40();
      return r.json().then(function (j) {
        if (!r.ok || !j.checkoutRequestID) { alert('M-Pesa error: ' + (j.error || 'STK push failed')); return; }
        try {
          if (window.sb && window.user && field && field.value.trim()) {
            window.sb.from('profiles').update({ phone: field.value.trim() }).eq('id', window.user.id).then(function () { if (window.profile) window.profile.phone = field.value.trim(); });
          }
        } catch (e) {}
        if (window.closeModalDirect) window.closeModalDirect();
        alert('📲 M-Pesa prompt sent to ' + phone + '. Enter your PIN to complete.');
        var cr = j.checkoutRequestID, tries = 0;
        var iv = setInterval(function () {
          tries++;
          fetch('/api/mpesa-status?cr=' + encodeURIComponent(cr)).then(function (x) { return x.json(); }).then(function (s) {
            if (s.status === 'completed') { clearInterval(iv); alert('🎉 Asante! Payment received.'); if (window.loadCauses) window.loadCauses(); }
            else if (s.status === 'failed') { clearInterval(iv); alert('Payment failed: ' + (s.desc || 'cancelled')); }
            else if (tries > 30) { clearInterval(iv); alert('Not confirmed yet — it will update automatically once M-Pesa confirms.'); }
          }).catch(function () {});
        }, 4000);
      });
    }).catch(function (e) { alert('M-Pesa not reachable: ' + e.message); });
  };
   /* ---- Guard 1: no patch may pop a prompt() asking for a phone number ---- */
  if (!window.prompt._gc40wrapped) {
    var origPrompt40 = window.prompt;
    window.prompt = function (msg, def) {
      var m = String(msg || '');
      if (/m-?pesa|phone|number|msisdn|07\d/i.test(m)) {
        var auto = (window.profile && window.profile.phone) || def || '';
        if (auto) return auto;          /* answer silently, never show dialog */
      }
      return origPrompt40.apply(this, arguments);
    };
    window.prompt._gc40wrapped = true;
  }

  /* ---- Guard 2: purge ANY phone / M-Pesa-number field from Rally Cause modal ---- */
  function purgePhoneFromRally40() {
    var modal = document.getElementById('givingModal');
    if (!modal) return;
    modal.querySelectorAll('.form-group').forEach(function (g) {
      var t = (g.textContent || '').toLowerCase();
      var inp = g.querySelector('input');
      var ph = inp && String(inp.placeholder || '').toLowerCase();
      if (/m-pesa number|mpesa number|phone/.test(t) || (ph && /07\d|phone/.test(ph))) g.remove();
    });
  }
  purgePhoneFromRally40();
  setInterval(purgePhoneFromRally40, 800);
/* ============================================================
     CLEAN RALLY CAUSE: bypass old patch that demands a phone
     ============================================================ */
  window.createCause = function () {
    if (!window.user || !window.sb) return alert('Log in');
    var title = String((document.getElementById('causeTitle') || {}).value || '').trim();
    var desc = String((document.getElementById('causeDesc') || {}).value || '');
    var goal = parseFloat((document.getElementById('causeGoal') || {}).value);
    if (isNaN(goal) || goal < 0) goal = 0;
    if (!title) return alert('Title required');
    window.sb.from('giving_causes').insert([{
      title: title,
      description: desc,
      goal_amount: goal,
      raised_amount: 0,
      currency: 'KES',
      status: 'active',
      payment_method: 'mpesa_stk',
      created_by: window.user.id
    }]).then(function (r) {
      if (r.error) return alert(r.error.message);
      alert('✅ Launched!');
      if (window.closeModalDirect) window.closeModalDirect();
      var t = document.getElementById('causeTitle'); if (t) t.value = '';
      var d = document.getElementById('causeDesc'); if (d) d.value = '';
      var g = document.getElementById('causeGoal'); if (g) g.value = '';
      if (window.loadCauses) window.loadCauses();
    });
  };

  /* make sure the Launch button calls the clean function */
  setInterval(function () {
    var modal = document.getElementById('givingModal');
    if (!modal) return;
    modal.querySelectorAll('button').forEach(function (b) {
      if (/launch/i.test(b.textContent || '')) {
        var oc = (b.getAttribute('onclick') || '').trim();
        if (oc !== 'createCause()') b.setAttribute('onclick', 'createCause()');
      }
    });
  }, 1200);

  /* swallow any leftover "Enter the M-Pesa number" alert from old patches */
  if (!window.alert._gc40wrapped) {
    var origAlert40 = window.alert;
    window.alert = function (m) {
      if (/enter the m-?pesa number/i.test(String(m || ''))) return;
      return origAlert40.apply(this, arguments);
    };
    window.alert._gc40wrapped = true;
  }
  console.log('✝️ app40.js loaded — reply fix + Reports tab leadership-only');
})();
