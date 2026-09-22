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
     FIX: Back buttons for Public Forum / Plans (h28BackHome was undefined)
     ============================================================ */
  window.h28BackHome = function () {
    if (typeof window.switchSection === 'function') {
      window.switchSection('home');
    } else {
      document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
      var h = document.getElementById('section-home'); if (h) h.classList.add('active');
      var hm = document.getElementById('home-main'); if (hm) hm.classList.add('active');
      window.scrollTo({ top: 0 });
    }
  };
/* ============================================================
     BROWSER HISTORY: device back button navigates within app
     ============================================================ */
  if (!window._gcHistoryInit) {
    window._gcHistoryInit = true;
    var gcNavStack = [];
    
    /* Push state when navigating to sub-pages */
    function gcPushNav(label) {
      try {
        var state = { gcNav: label, ts: Date.now() };
        window.history.pushState(state, '', '#' + label);
        gcNavStack.push(label);
      } catch (e) {}
    }
    
    /* Intercept section switches */
    if (typeof window.switchSection === 'function') {
      var origSwitch = window.switchSection;
      window.switchSection = function (name) {
        gcPushNav('section-' + name);
        return origSwitch.apply(this, arguments);
      };
    }
    
    /* Intercept sub-page switches */
    if (typeof window.showSubPage === 'function') {
      var origShowSub = window.showSubPage;
      window.showSubPage = function (id) {
        gcPushNav(id);
        return origShowSub.apply(this, arguments);
      };
    }
    
    /* Intercept full-page opens (Forum, Plans, Trivia, etc.) */
    ['h28OpenForum', 'h28OpenPrayer', 'h27OpenPage', 'gcOpenTrivia', 'gcOpenBible', 'gcOpenCharacters', 'gcOpenDevotional', 'ggOpenCategory'].forEach(function (fn) {
      if (typeof window[fn] === 'function') {
        var orig = window[fn];
        window[fn] = function () {
          gcPushNav(fn);
          return orig.apply(this, arguments);
        };
      }
    });
    
    /* Intercept _gcOpenDept (department pages) */
    if (typeof window._gcOpenDept === 'function') {
      var origOpenDept = window._gcOpenDept;
      window._gcOpenDept = function (id) {
        gcPushNav('dept-' + id);
        return origOpenDept.apply(this, arguments);
      };
    }
    
    /* Handle browser back button */
    window.addEventListener('popstate', function (e) {
      if (!e.state || !e.state.gcNav) return;
      var nav = e.state.gcNav;
      gcNavStack.pop();
      
      /* Map nav labels to app actions */
      if (nav === 'section-home') {
        if (window.switchSection) window.switchSection('home');
      } else if (nav.indexOf('section-') === 0) {
        var sec = nav.replace('section-', '');
        if (window.switchSection) window.switchSection(sec);
      } else if (nav.indexOf('dept-') === 0) {
        /* Back to previous view from department */
        if (window.switchSection) window.switchSection('home');
        if (window.showSubPage) setTimeout(function() { window.showSubPage('home-main'); }, 50);
      } else if (nav === 'h28OpenForum' || nav === 'h28OpenPrayer' || nav === 'h27OpenPage') {
        if (window.h28BackHome) window.h28BackHome();
        else if (window.h27BackHome) window.h27BackHome();
        else if (window.switchSection) window.switchSection('home');
      } else if (nav === 'gcOpenTrivia' || nav === 'gcOpenBible' || nav === 'gcOpenCharacters' || nav === 'gcOpenDevotional') {
        if (window.gcBackHome) window.gcBackHome();
        else if (window.switchSection) window.switchSection('home');
      } else if (nav === 'ggOpenCategory') {
        if (window.ggSwitchGroupTab) window.ggSwitchGroupTab('categories');
        else if (window.h32CatTab) window.h32CatTab('forum');
      } else {
        /* Generic sub-page */
        if (window.showSubPage) window.showSubPage(nav);
      }
    });
    
    /* Initialize with current state */
    try { window.history.replaceState({ gcNav: 'home' }, '', window.location.pathname); } catch (e) {}
  }
/* ============================================================
     LANDING: church photo background + welcome video + register message
     ============================================================ */
  (function () {
    var st = document.createElement('style');
    st.textContent = '.hero-section::before{background:linear-gradient(to bottom,rgba(15,23,42,.25),rgba(15,23,42,.62))!important}'
      + '.gc-welcome-wrap{position:relative;z-index:2;max-width:680px;margin:20px auto 0;width:100%;padding:0 16px}'
      + '.gc-welcome-msg{background:rgba(255,255,255,.15);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.28);border-radius:14px;padding:10px 14px;font-size:.9rem;line-height:1.5;margin-bottom:12px}'
      + '.gc-welcome-video video{width:100%;border-radius:16px;background:#000;box-shadow:0 20px 50px rgba(0,0,0,.4);display:block}';
    document.head.appendChild(st);
  })();
  function landingExtras40() {
    var hero = document.getElementById('heroSection') || document.querySelector('.hero-section');
    if (!hero || hero.querySelector('.gc-welcome-wrap')) return;
    var wrap = document.createElement('div'); wrap.className = 'gc-welcome-wrap';
    wrap.innerHTML = '<div class="gc-welcome-msg">👋 <b>Karibu!</b> New here? Register with your <b>email</b> — or with your <b>phone number</b> if you don\'t have email (we text you a 6-digit code).</div>'
      + '<div class="gc-welcome-video"><video controls playsinline preload="metadata"><source src="' + (window.GC_WELCOME_VIDEO || '/welcome.mp4') + '" type="video/mp4"></video></div>';
    var btns = hero.querySelector('.hero-buttons');
    if (btns && btns.parentNode) btns.parentNode.insertBefore(wrap, btns.nextSibling); else hero.appendChild(wrap);
    var v = wrap.querySelector('video');
    v.addEventListener('error', function () { var b = wrap.querySelector('.gc-welcome-video'); if (b) b.style.display = 'none'; }, true);
    var im = new Image();
    im.onload = function () { if (!hero.style.backgroundImage) { hero.style.backgroundImage = 'url(/church-hero.jpg)'; hero.style.backgroundSize = 'cover'; hero.style.backgroundPosition = 'center'; } };
    im.src = '/church-hero.jpg';
    try {
      var c = db40();
      if (c) c.from('church_settings').select('welcome_video_url').limit(1).single().then(function (r) {
        if (r.data && r.data.welcome_video_url) { var s = wrap.querySelector('source'); if (s) { s.src = r.data.welcome_video_url; v.load(); } }
      }).catch(function () {});
    } catch (e) {}
  }
  setInterval(landingExtras40, 2000);

  /* ============================================================
     PHONE REGISTRATION (SMS OTP) + phone login
     ============================================================ */
  window.GC_SMS_DOMAIN = 'sms.elduconnect.app';
  window.gcPhoneMode = false;
  function injectPhoneMode40() {
    var ov = document.getElementById('onboardingOverlay');
    var ei = document.getElementById('ob-email');
    if (!ov || !ei || ov.dataset.gc40pm) return;
    ov.dataset.gc40pm = '1';
    var eg = ei.closest('.form-group'); if (!eg) return;
    var pg = document.createElement('div'); pg.className = 'form-group'; pg.id = 'gc40PhoneReg'; pg.style.display = 'none';
    pg.innerHTML = '<label class="form-label">Phone Number</label>'
      + '<div style="display:flex;gap:6px"><input class="form-input" id="ob-regphone" placeholder="07XX XXX XXX" style="flex:1;margin:0">'
      + '<button class="btn btn-warm btn-sm" type="button" id="gc40SendCode" onclick="gc40SendOtp()">Send Code</button></div>'
      + '<input class="form-input" id="ob-phonecode" placeholder="6-digit SMS code" style="margin-top:6px">';
    var tg = document.createElement('button'); tg.type = 'button'; tg.className = 'btn btn-secondary-alt btn-block'; tg.id = 'gc40PhoneToggle';
    tg.style.cssText = 'margin:6px 0;font-size:.78rem';
    tg.innerHTML = '📱 No email? Register with phone number instead';
    tg.onclick = function () {
      window.gcPhoneMode = !window.gcPhoneMode;
      eg.style.display = window.gcPhoneMode ? 'none' : '';
      pg.style.display = window.gcPhoneMode ? '' : 'none';
      tg.innerHTML = window.gcPhoneMode ? '✉️ Have an email? Use email instead' : '📱 No email? Register with phone number instead';
    };
    eg.parentNode.insertBefore(tg, eg);
    eg.parentNode.insertBefore(pg, eg.nextSibling);
  }
  setInterval(injectPhoneMode40, 1500);

  window.gc40SendOtp = async function () {
    var ph = normPhone40((document.getElementById('ob-regphone') || {}).value);
    if (!/^254\d{9}$/.test(ph)) return alert('Enter a valid phone number e.g. 0712345678');
    var b = document.getElementById('gc40SendCode'); if (b) { b.disabled = true; b.textContent = 'Sending…'; }
    try {
      var r = await fetch('/api/sms-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', phone: ph }) });
      var j = await r.json();
      if (!r.ok || !j.ok) alert('Could not send code: ' + (j.error || 'try again'));
      else alert('📨 Code sent to ' + ph + '. It expires in 10 minutes.');
    } catch (e) { alert('SMS service unreachable: ' + e.message); }
    if (b) { var s = 30; b.textContent = s + 's'; var iv = setInterval(function () { s--; if (s <= 0) { clearInterval(iv); b.disabled = false; b.textContent = 'Send Code'; } else b.textContent = s + 's'; }, 1000); }
  };

  async function gc40PhoneRegister() {
    var name = String((document.getElementById('ob-name') || {}).value || '').trim();
    var ph = normPhone40((document.getElementById('ob-regphone') || {}).value);
    var code = String((document.getElementById('ob-phonecode') || {}).value || '').trim();
    var pass = String((document.getElementById('ob-password') || {}).value || '');
    if (!name) return alert('Name required');
    if (!/^254\d{9}$/.test(ph)) return alert('Enter a valid phone number');
    if (!code) return alert('Enter the 6-digit code from SMS');
    if (pass.length < 6) return alert('Password must be at least 6 characters');
    var r = await fetch('/api/sms-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', phone: ph, code: code, password: pass, name: name }) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok || !j.ok) return alert(j.error || 'Registration failed');
    var sr = await window.sb.auth.signInWithPassword({ email: j.email, password: pass });
    if (sr.error) return alert('Login failed: ' + sr.error.message);
    var ov = document.getElementById('onboardingOverlay'); if (ov) ov.classList.remove('show');
    localStorage.setItem('onboarded', 'true');
    alert('🎉 Account created and verified!');
    if (window.hidePublicLanding) window.hidePublicLanding();
    if (window.refreshRole) return window.refreshRole().then(function () { if (window.loadAll) window.loadAll(); });
  }
  if (typeof window.completeOnboarding === 'function' && !window.completeOnboarding._gc40pm2) {
    var co40 = window.completeOnboarding;
    window.completeOnboarding = function () { if (window.gcPhoneMode) return gc40PhoneRegister(); return co40.apply(this, arguments); };
    window.completeOnboarding._gc40pm2 = true;
  }
  if (typeof window.doLogin === 'function' && !window.doLogin._gc40ph) {
    var dl40 = window.doLogin;
    window.doLogin = function () {
      var ei = document.getElementById('login-email');
      if (ei) { var n = normPhone40(ei.value); if (/^254\d{9}$/.test(n)) ei.value = n + '@' + window.GC_SMS_DOMAIN; }
      return dl40.apply(this, arguments);
    };
    window.doLogin._gc40ph = true;
  }
  setInterval(function () { var ei = document.getElementById('login-email'); if (ei && ei.placeholder !== 'Email or phone number') ei.placeholder = 'Email or phone number'; }, 2000);
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
