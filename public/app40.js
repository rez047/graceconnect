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
     M-PESA EXCLUSIVE: kill any injected payment-method UI
     (gcPayMethodChange + its selector re-rendered by old patches)
     ============================================================ */
  window.gcPayMethodChange = function () { return false; };   /* neutralize handler */

  function sweepPayMethod40() {
    var modal = document.getElementById('giveModal');
    if (!modal) return;
    /* remove selects / segmented buttons / radios tied to method */
    modal.querySelectorAll('select, [onclick*="gcPayMethodChange"], [data-pay-method], .pay-method, .payment-method').forEach(function (el) {
      if (el.id === 'gc40MpesaPhone') return;
      var wrap = el.closest ? el.closest('.form-group') : null;
      if (wrap && /method/i.test(wrap.textContent || '') && !/M-Pesa Number/i.test(wrap.textContent || '')) wrap.remove();
      else if (el.parentNode) el.parentNode.removeChild(el);
    });
    /* remove any form-group whose text is about payment method / bank / cash */
    modal.querySelectorAll('.form-group').forEach(function (g) {
      var t = (g.textContent || '').toLowerCase();
      if (/payment method|method\s*:/.test(t) || (/bank/.test(t) && /cash/.test(t))) {
        if (!/m-pesa number/i.test(t)) g.remove();
      }
    });
    /* remove bank/cash radios or checkboxes if injected */
    modal.querySelectorAll('input[type="radio"],input[type="checkbox"]').forEach(function (r) {
      var n = ((r.name || '') + ' ' + (r.value || '') + ' ' + (r.id || '')).toLowerCase();
      if (/bank|cash|method/.test(n)) {
        var w = r.closest ? (r.closest('.form-group') || r.parentElement) : r.parentElement;
        if (w && w.parentNode) w.parentNode.removeChild(w);
      }
    });
  }

  /* sweep continuously (old patch re-renders on a timer) + right after modal opens */
  setInterval(sweepPayMethod40, 1200);
  if (typeof window._gcGive === 'function' && !window._gcGive._gc40sweep) {
    var g40s = window._gcGive;
    window._gcGive = function () {
      var r = g40s.apply(this, arguments);
      setTimeout(sweepPayMethod40, 200);
      setTimeout(sweepPayMethod40, 700);
      return r;
    };
    window._gcGive._gc40sweep = true;
  }
/* ============================================================
     M-PESA DARAJA (STK Push) — Give Now flow
     ============================================================ */
  var origConfirm40 = window.confirmGiving;
  function normPhone40(p) {
    p = String(p || '').replace(/\s+/g, '');
    if (p.charAt(0) === '+') p = p.slice(1);
    if (p.charAt(0) === '0') p = '254' + p.slice(1);
    return p;
  }
  function injectMpesaPhone40() {
    var modal = document.getElementById('giveModal');
    if (!modal || document.getElementById('gc40MpesaPhone')) return;
    var amount = document.getElementById('giveAmount');
    if (!amount || !amount.closest('.form-group')) return;
    var g = document.createElement('div');
    g.className = 'form-group';
    g.innerHTML = '<label class="form-label">M-Pesa Number</label><input class="form-input" id="gc40MpesaPhone" placeholder="07XX XXX XXX" value="' + ((window.profile && window.profile.phone) || '') + '">';
    amount.closest('.form-group').parentNode.insertBefore(g, amount.closest('.form-group').nextSibling);
  }
  if (typeof window._gcGive === 'function' && !window._gcGive._gc40mpesa) {
    var origGive40 = window._gcGive;
    window._gcGive = function (id, title) {
      var r = origGive40.apply(this, arguments);
      setTimeout(injectMpesaPhone40, 250);
      setTimeout(injectMpesaPhone40, 800);
      return r;
    };
    window._gcGive._gc40mpesa = true;
  }
  window.confirmGiving = function () {
    var amount = parseFloat((document.getElementById('giveAmount') || {}).value || 0);
    var phone = normPhone40(((document.getElementById('gc40MpesaPhone') || {}).value) || (window.profile && window.profile.phone));
    var cid = window._gcCurrentCauseId;
    if (!amount) return alert('Amount required');
    if (!/^254\d{9}$/.test(phone)) return alert('Enter a valid Safaricom number e.g. 0712345678');
    if (!cid) return alert('No cause selected');
    fetch('/api/mpesa-stk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, amount: amount, causeId: cid, userId: window.user ? window.user.id : null })
    }).then(function (r) {
      if (r.status === 404 && origConfirm40) return origConfirm40();   /* api not deployed yet → old manual flow */
      return r.json().then(function (j) {
        if (!r.ok || !j.checkoutRequestID) { alert('M-Pesa error: ' + (j.error || 'STK push failed')); return; }
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
  console.log('✝️ app40.js loaded — reply fix + Reports tab leadership-only');
})();
