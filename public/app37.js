/* ============================================================
   GRACECONNECT — APP37.JS (v3)
   ADDITIVE, non-destructive DOM patch:
   1) Category Members tab → Chat button, injected EXACTLY the way
      the Groups tab gets its Chat button (post-render injection
      into member cards of the active section, same look & same
      chat pipeline: c26OpenChat → h27ChatWith → openChatWith)
   2) Servants of God (Discover) → chat bubble opens chat (working)
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

  var profCache = null, profTime = 0;
  function profiles37(force) {
    var now = Date.now();
    if (!force && profCache && (now - profTime) < 60000) return Promise.resolve(profCache);
    var c = db37();
    if (!c) return Promise.resolve(profCache || []);
    return c.from('profiles').select('id,name,email,role').then(function (r) {
      if (!r.error && r.data) { profCache = r.data; profTime = Date.now(); }
      return profCache || [];
    }).catch(function () { return profCache || []; });
  }

  function openChat37(uid) {
    if (!uid) return;
    if (typeof window.c26OpenChat === 'function') { window.c26OpenChat(uid); return; }
    if (typeof window.h27ChatWith === 'function') { window.h27ChatWith(uid); return; }
    if (typeof window.openChatWith === 'function') { window.openChatWith(uid); return; }
    alert('Chat is not available.');
  }
  window.gc37OpenChat = openChat37;

  /* ---------- uid resolution ---------- */
  function resolveUid37(card, profs) {
    var html = String(card.innerHTML || '');
    var m = html.match(/(?:c26OpenChat|h27ChatWith|openChatWith|gc36OpenChat|h32CategoryChat|h32CatSetRole|h32CatRemove|chatWith|startChat)\(\s*'([^']+)'/);
    if (m) return m[1];
    var u = html.match(/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i);
    if (u) return u[1];
    var t = norm37(card.textContent), best = null;
    (profs || []).forEach(function (p) { var n = norm37(p.name); if (n && t.indexOf(n) > -1) { if (!best || n.length > norm37(best.name).length) best = p; } });
    if (best) return best.id;
    (window.usersData || []).forEach(function (p) { var n = norm37(p.name); if (n && t.indexOf(n) > -1) { if (!best || n.length > norm37(best.name).length) best = p; } });
    return best ? best.id : null;
  }

  function chatExists37(el) {
    if (el.querySelector('[data-gc37-chat],[data-gc36-chat],.gc36-chat-button')) return true;
    var b = el.querySelectorAll('button,a');
    for (var i = 0; i < b.length; i++) { var tx = norm37(b[i].textContent); if (tx === 'chat' || tx === 'inbox') return true; }
    return false;
  }

  /* ---------- clone the EXACT Groups Chat button look ---------- */
  function groupChatTemplate37() {
    var srcs = document.querySelectorAll('#gg-tab-members button, .gc36-chat-button, [data-gc36-chat]');
    for (var i = 0; i < srcs.length; i++) {
      var b = srcs[i];
      if (norm37(b.textContent) === 'chat' || /fa-comment/.test(b.innerHTML)) return b;
    }
    return null;
  }
  function makeChatBtn37() {
    var b = document.createElement('button');
    var tpl = groupChatTemplate37();
    if (tpl) {                       /* same classes / icon / style as Groups */
      b.className = tpl.className;
      b.innerHTML = tpl.innerHTML;
      b.style.cssText = tpl.style.cssText + ';display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin-top:8px;';
    } else {
      b.className = 'btn btn-primary btn-sm';
      b.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
      b.style.cssText = 'display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin-top:8px;';
    }
    b.type = 'button';
    b.setAttribute('data-gc37-chat', '1');
    b.onclick = function (e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      var uid = b.getAttribute('data-uid');
      if (!uid) {
        var card = b.closest ? (b.closest('.card') || b.parentElement) : b.parentElement;
        uid = card ? resolveUid37(card, profCache) : null;
        if (uid) { b.setAttribute('data-uid', uid); openChat37(uid); return false; }
        profiles37(true).then(function (pr) {
          var id = card ? resolveUid37(card, pr) : null;
          if (id) { b.setAttribute('data-uid', id); openChat37(id); }
          else alert('Could not open chat for this member.');
        });
        return false;
      }
      openChat37(uid);
      return false;
    };
    return b;
  }

  /* ---------- member-card detection (no container id needed) ---------- */
  function hasRoleSelect37(card) {
    var s = card.querySelector('select');
    return !!s && /teacher|leader|chairman|treasurer/i.test(s.innerHTML);
  }
  function looksPerson37(card) {
    if (card.querySelector('textarea,.media-upload,input')) return false;
    if (/add member/i.test(card.textContent)) return false;
    if (card.querySelector('.post-avatar,.official-avatar,[class*="avatar"]')) return true;
    return !!card.querySelector('b,[style*="font-weight:800"],[style*="font-weight:700"]') && card.textContent.length < 200;
  }
  function isMemberCard37(card, ctx) {
    if (hasRoleSelect37(card)) return true;
    if (/h32Cat(SetRole|Remove|CategoryChat)|ggChangeMemberRole|ggRemoveMember/.test(card.innerHTML)) return true;
    if (ctx && looksPerson37(card) && !/no (category )?members|loading/i.test(card.textContent)) return true;
    return false;
  }

  /* ═══════════ 1) CATEGORY MEMBERS → CHAT (Groups-style injection) ═══════════ */
  function patchCategory37() {
    var sec = document.querySelector('.section.active') || document.body;
    var ctx = !!window._h32Cat || /Leave Category|Join Category|Assign Teacher|Age:\s*\d/.test(sec.textContent || '');
    if (!ctx) { window.__gc37 = { ctx: false, cards: 0, added: 0 }; return; }   /* not on a category page */

    var cards = sec.querySelectorAll('.card,.member-card,.list-item');
    if (!cards.length) {
      var all = sec.querySelectorAll('div'), pick = [];
      Array.prototype.forEach.call(all, function (d) {
        if (!d.querySelector('.card') && (hasRoleSelect37(d) || looksPerson37(d))) pick.push(d);
      });
      cards = pick;
    }

    var seen = 0, added = 0;
    Array.prototype.forEach.call(cards, function (card) {
      if (!card || card.nodeType !== 1) return;
      if (card.tagName === 'BUTTON' || card.tagName === 'A') return;
      if (!isMemberCard37(card, ctx)) return;
      seen++;
      if (chatExists37(card)) return;
      var b = makeChatBtn37();
      var uid = resolveUid37(card, profCache);
      if (uid) b.setAttribute('data-uid', uid);
      card.appendChild(b);
      added++;
    });
    window.__gc37 = { ctx: true, cards: seen, added: added, section: sec.id || sec.className };
    console.log('[gc37] category ctx:true memberCards:' + seen + ' chatButtonsAdded:' + added);
  }

  /* ═══════════ 2) SERVANTS OF GOD → CHAT BUBBLE (unchanged, working) ═══════════ */
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
        var uid = row.getAttribute('data-gc37-uid') || resolveUid37(row, profs);
        if (!uid) return;
        row.setAttribute('data-gc37-uid', uid);
        var bubble = null, cands = row.querySelectorAll('button,a');
        for (var i = 0; i < cands.length; i++) {
          var el = cands[i];
          if (el.classList.contains('btn-chat') || /fa-comment/.test(el.innerHTML) || el.hasAttribute('data-gc37-chat')) { bubble = el; break; }
        }
        if (bubble) {
          if (bubble.getAttribute('data-gc37-bound')) return;
          bubble.setAttribute('data-gc37-bound', '1');
          bubble.removeAttribute('onclick');
          bubble.onclick = function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } openChat37(uid); return false; };
        } else {
          if (row.querySelector('[data-gc37-chat]')) return;
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'btn btn-chat btn-sm';
          b.setAttribute('data-gc37-chat', '1'); b.setAttribute('data-gc37-bound', '1');
          b.style.cssText = 'margin-left:auto;';
          b.innerHTML = '<i class="fas fa-comment-dots"></i>';
          b.onclick = function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } openChat37(uid); return false; };
          row.appendChild(b);
        }
      });
    });
  }

  /* ---------- run ---------- */
  function patchAll37() { patchCategory37(); patchServants37(); }
  var t37 = null;
  function queue37() { clearTimeout(t37); t37 = setTimeout(patchAll37, 200); }

  profiles37();
  if (window.MutationObserver && document.body) {
    new MutationObserver(queue37).observe(document.body, { childList: true, subtree: true });
  }
  setInterval(patchAll37, 1000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchAll37);
  else patchAll37();

  console.log('✝️ app37.js v3 loaded — Groups-style Chat injection on category members');
})();
