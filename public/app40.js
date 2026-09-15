/* ============================================================
   GRACECONNECT — APP40.JS
   Fixes Ushirika / Department / Groups comments:
   1) Reply toggle: c26gx_ToggleReply / gggx_ToggleReply now work.
   2) SEND: if the emitted send function is missing, app40 reads
      the reply input from the DOM and inserts the comment itself
      into community_comments, then reloads the feed.
   Nothing else touched.
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

  /* ---------- reload the surface that owns the comment ---------- */
  function reloadSurface() {
    if (document.getElementById('c26-feed') && typeof window.c26Tab === 'function') { window.c26Tab('feed'); return; }
    if (document.getElementById('gg-tab-feed') && typeof window.ggSwitchGroupTab === 'function') { window.ggSwitchGroupTab('feed'); return; }
    if (document.getElementById('h32c-forum') && typeof window.h32CatTab === 'function') { window.h32CatTab('forum'); return; }
    if (document.getElementById('h28ForumList') && typeof window.h28LoadForum === 'function') { window.h28LoadForum(); return; }
    if (document.getElementById('h27PostList') && typeof window.h27LoadForum === 'function') { window.h27LoadForum(); return; }
  }

  /* ---------- DOM-driven send (works even when handlers are missing) ---------- */
  function sendFromButton(btn) {
    var box = btn.closest ? btn.closest('div[id*="_reply_"]') : null;
    if (box && /_replytext_/.test(box.id)) box = null;             /* safety */
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

  /* ---------- arg parser + router ---------- */
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

    /* toggle: always handle ourselves (guaranteed) */
    if (suffix === 'ToggleReply') {
      e.preventDefault(); e.stopPropagation();
      toggleBox((m[1] === 'c26gx' ? 'c26gx_reply_' : 'gggx_reply_') + args[0]);
      return;
    }

    /* if the real handler exists, use it */
    if (typeof window[realName] === 'function') {
      e.preventDefault(); e.stopPropagation();
      try { window[realName].apply(null, args); } catch (err) { console.error(err); }
      return;
    }

    /* otherwise: send-like calls are handled from the DOM */
    if (/Comment|Reply|Send|Submit/i.test(suffix)) {
      e.preventDefault(); e.stopPropagation();
      sendFromButton(el);
    }
  }, true);

  console.log('✝️ app40.js loaded — reply toggle + DOM-driven send for c26/gg comments');
})();
