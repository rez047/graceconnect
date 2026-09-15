/* ============================================================
   GRACECONNECT — APP40.JS
   FIX: Ushirika / Department / Groups Reply buttons call
   c26gx_* / gggx_* but the real functions are named
   c26Group* / ggGroup*. This file bridges the two names so
   the EXISTING working handlers run. Nothing else touched.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1) direct aliases for the toggle (most-clicked) ---------- */
  function toggleBox(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
    if (el.style.display === 'block') { var i = el.querySelector('input'); if (i) setTimeout(function () { i.focus(); }, 80); }
  }
  window.c26gx_ToggleReply = function (id) { toggleBox('c26gx_reply_' + id); };
  window.gggx_ToggleReply  = function (id) { toggleBox('gggx_reply_' + id); };
  /* also cover the correctly-named ones in case a build lacks them */
  if (typeof window.c26GroupToggleReply !== 'function') window.c26GroupToggleReply = window.c26gx_ToggleReply;
  if (typeof window.ggGroupToggleReply  !== 'function') window.ggGroupToggleReply  = window.gggx_ToggleReply;

  /* ---------- 2) arg parser + paren scanner (safe, no eval) ---------- */
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
    var depth = 0, i = startIdx;
    for (; i < oc.length; i++) {
      if (oc[i] === '(') depth++;
      else if (oc[i] === ')') { depth--; if (depth === 0) return oc.substring(startIdx + 1, i); }
    }
    return oc.substring(startIdx + 1);
  }

  /* ---------- 3) router: any c26gx_X / gggx_X click → real c26GroupX / ggGroupX ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[onclick]') : null;
    if (!el) return;
    var oc = el.getAttribute('onclick') || '';
    var m = oc.match(/\b(c26gx|gggx)_([A-Za-z]+)\s*\(/);
    if (!m) return;

    var realName = (m[1] === 'c26gx' ? 'c26Group' : 'ggGroup') + m[2];
    var openIdx = oc.indexOf(m[0]) + m[0].length - 1;
    var args = parseArgs(callSpan(oc, openIdx));

    if (typeof window[realName] === 'function') {
      e.preventDefault(); e.stopPropagation();
      try { window[realName].apply(null, args); } catch (err) { console.error(err); }
      return;
    }

    /* fallback if even the real name is missing */
    if (m[2] === 'ToggleReply') {
      e.preventDefault(); e.stopPropagation();
      toggleBox((m[1] === 'c26gx' ? 'c26gx_reply_' : 'gggx_reply_') + args[0]);
    }
  }, true);

  console.log('✝️ app40.js loaded — c26gx_/gggx_ reply names bridged to working handlers');
})();
