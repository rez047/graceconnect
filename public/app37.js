/* ============================================================
   GRACECONNECT — APP37.JS
   ADDITIVE PATCH (non-destructive, DOM-level):
   1) Category Members tab  → adds the missing Chat button
   2) Servants of God list  → makes the chat bubble open chat
   Uses the SAME chat pipeline already working in Groups:
   c26OpenChat → h27ChatWith → openChatWith
   Nothing else in the system is modified.
   ============================================================ */
(function () {
  'use strict';

  function db37() {
    try {
      if (typeof window.sb === 'function') { var a = window.sb(); if (a && a.from) return a; }
      if (window.sb && window.sb.from) return window.sb;
      if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
    } catch (e) {}
    return null;
  }

  function norm37(s) { return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim(); }

  /* ---------- profiles cache (for name → id resolution) ---------- */
  var profCache = null, profTime = 0;
  function profiles37() {
    var now = Date.now();
    if (profCache && (now - profTime) < 60000) return Promise.resolve(profCache);
    var c = db37();
    if (!c) return Promise.resolve(profCache || []);
    return c.from('profiles').select('id,name,email,role').then(function (r) {
      if (!r.error && r.data) { profCache = r.data; profTime = Date.now(); }
      return profCache || [];
    }).catch(function () { return profCache || []; });
  }

  /* ---------- same opener chain as the working Group Chat button ---------- */
  function openChat37(uid) {
    if (!uid) return;
    if (typeof window.c26OpenChat === 'function') { window.c26OpenChat(uid); return; }
    if (typeof window.h27ChatWith === 'function') { window.h27ChatWith(uid); return; }
    if (typeof window.openChatWith === 'function') { window.openChatWith(uid); return; }
    alert('Chat is not available.');
  }
  window.gc37OpenChat = openChat37;

  /* ---------- helpers ---------- */
  function uidFromHtml37(html) {
    var m = String(html || '').match(/(?:c26OpenChat|h27ChatWith|openChatWith|gc36OpenChat|h32CategoryChat|h32CatSetRole|h32CatRemove)\(\s*'([^']+)'/);
    return m ? m[1] : null;
  }
  function uidByName37(text, profiles) {
    var t = norm37(text); if (!t) return null;
    var best = null;
    (profiles || []).forEach(function (p) {
      var n = norm37(p.name);
      if (n && t.indexOf(n) > -1) { if (!best || n.length > norm37(best.name).length) best = p; }
    });
    return best ? best.id : null;
  }
  function hasChat37(el) {
    return !!el.querySelector('[data-gc37-chat],[data-gc36-chat],.gc36-chat-button');
  }
  function hasChatText37(el) {
    var b = el.querySelectorAll('button,a');
    for (var i = 0; i < b.length; i++) {
      var tx = norm37(b[i].textContent);
      if (tx === 'chat' || tx === 'inbox') return true;
    }
    return false;
  }
  function makeChatBtn37(uid) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-primary btn-sm';
    b.setAttribute('data-gc37-chat', '1');
    b.style.cssText = 'white-space:nowrap;margin-top:8px;';
    b.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
    b.onclick = function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } openChat37(uid); return false; };
    return b;
  }

  /* ═══════════ 1) CATEGORY MEMBERS TAB → ADD CHAT BUTTON ═══════════ */
  function patchCategory37() {
    var box = document.getElementById('h32c-members');
    if (!box) return;
    var cards = box.querySelectorAll('.card');
    if (!cards.length) return;
    profiles37().then(function (profs) {
      Array.prototype.forEach.call(cards, function (card) {
        if (hasChat37(card) || hasChatText37(card)) return;      // never duplicate
        if (!norm37(card.textContent)) return;                   // skip empty/loading
        var uid = uidFromHtml37(card.innerHTML) || uidByName37(card.textContent, profs);
        if (!uid) return;
        card.appendChild(makeChatBtn37(uid));
      });
    });
  }

  /* ═══════════ 2) SERVANTS OF GOD → MAKE CHAT BUBBLE WORK ═══════════ */
  function servantRows37(box) {
    var r = box.querySelectorAll('.official-card');
    if (r.length) return r;
    r = box.querySelectorAll(':scope > div');
    if (r.length) return r;
    return box.children;
  }
  function patchServants37() {
    var box = document.getElementById('dyn-leaders');
    if (!box || !norm37(box.textContent)) return;
    profiles37().then(function (profs) {
      var rows = servantRows37(box);
      Array.prototype.forEach.call(rows, function (row) {
        if (!row || row.nodeType !== 1) return;
        var uid = row.getAttribute('data-gc37-uid') || uidFromHtml37(row.innerHTML) || uidByName37(row.textContent, profs);
        if (!uid) return;
        row.setAttribute('data-gc37-uid', uid);

        /* find the existing teal bubble (btn-chat / comment icon) */
        var bubble = null, cands = row.querySelectorAll('button,a');
        for (var i = 0; i < cands.length; i++) {
          var el = cands[i];
          if (el.classList.contains('btn-chat') || /fa-comment/.test(el.innerHTML) || el.hasAttribute('data-gc37-chat')) { bubble = el; break; }
        }

        if (bubble) {
          if (bubble.getAttribute('data-gc37-bound')) return;    // already wired
          bubble.setAttribute('data-gc37-bound', '1');
          bubble.removeAttribute('onclick');                     // drop dead handler
          bubble.onclick = function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } openChat37(uid); return false; };
        } else {
          if (row.querySelector('[data-gc37-chat]')) return;
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn btn-chat btn-sm';
          b.setAttribute('data-gc37-chat', '1');
          b.setAttribute('data-gc37-bound', '1');
          b.style.cssText = 'margin-left:auto;';
          b.innerHTML = '<i class="fas fa-comment-dots"></i>';
          b.onclick = function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } openChat37(uid); return false; };
          row.appendChild(b);
        }
      });
    });
  }

  /* ---------- run: observer + interval + hooks (idempotent) ---------- */
  function patchAll37() { patchCategory37(); patchServants37(); }
  var t37 = null;
  function queue37() { clearTimeout(t37); t37 = setTimeout(patchAll37, 250); }

  if (window.MutationObserver && document.body) {
    new MutationObserver(queue37).observe(document.body, { childList: true, subtree: true });
  }
  setInterval(patchAll37, 1500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchAll37);
  else patchAll37();

  console.log('✝️ app37.js loaded — Category Chat button + Servants of God chat wired');
})();
