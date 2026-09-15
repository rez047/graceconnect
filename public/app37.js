/* GRACECONNECT app37.js v2 — final chat unifier */
(function () {
  'use strict';

  function engine(uid) {
    if (!uid) return false;
    if (typeof window.c26OpenChat === 'function') { window.c26OpenChat(uid); return false; }
    if (typeof window.h27ChatWith === 'function') { window.h27ChatWith(uid); return false; }
    return false;
  }

  ['openChatWith','openUserChat','openDirectChat','startChat','startChatWith',
   'chatWith','openConvo','openConversation','openChat','h32CategoryChat','h32CatChat'
  ].forEach(function (n) { window[n] = function (uid) { return engine(uid); }; });

  function meId() {
    var u = window.user || window.currentUser || null;
    return u ? String(u.id) : null;
  }

  function makeBtn(uid) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-primary btn-sm';
    b.setAttribute('data-gc37-chat', '1');
    b.style.cssText = 'white-space:nowrap;margin-left:auto;';
    b.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
    b.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation(); engine(uid);
    });
    return b;
  }

  /* ID straight from the role-select / trash attributes already in the card */
  function uidFromCard(card) {
    var nodes = card.querySelectorAll('[onchange],[onclick]');
    for (var i = 0; i < nodes.length; i++) {
      var a = (nodes[i].getAttribute('onchange') || '') + (nodes[i].getAttribute('onclick') || '');
      var m = a.match(/['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/i);
      if (m) return m[1];
    }
    return null;
  }

  var mapCache = {};
  function nameMap(catId, done) {
    if (mapCache[catId]) return done(mapCache[catId]);
    var sbf = null;
    try {
      if (typeof window.sb === 'function') sbf = window.sb();
      else if (window.sb && window.sb.from) sbf = window.sb;
      else if (window.supabaseClient) sbf = window.supabaseClient;
    } catch (e) {}
    if (!sbf) return done({});
    sbf.from('church_group_category_members').select('user_id').eq('category_id', catId).then(function (mr) {
      var ids = (mr.data || []).map(function (x) { return x.user_id; });
      if (!ids.length) return done({});
      sbf.from('profiles').select('id,name').in('id', ids).then(function (pr) {
        var map = {};
        (pr.data || []).forEach(function (p) { map[(p.name || '').toLowerCase()] = p.id; });
        mapCache[catId] = map; done(map);
      });
    });
  }

  function injectCategory() {
    var box = document.getElementById('h32c-members');
    var cat = window._h32Cat;
    if (!box || !cat || !cat.id) return;
    var cards = box.querySelectorAll('.card');
    if (!cards.length) return;

    var apply = function (map) {
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.querySelector('[data-gc37-chat]')) continue;
        var uid = uidFromCard(card);
        if (!uid && map) {
          var txt = (card.textContent || '').toLowerCase();
          for (var n in map) { if (n && txt.indexOf(n) !== -1) { uid = map[n]; break; } }
        }
        if (!uid) continue;
        if (meId() && uid === meId()) continue;   /* same rule as Ushirika: never on your own row */
        var row = card.querySelector('[style*="display:flex"]') || card.firstElementChild || card;
        row.appendChild(makeBtn(uid));
      }
    };

    var needsMap = false;
    for (var i = 0; i < cards.length; i++) {
      if (!cards[i].querySelector('[data-gc37-chat]') && !uidFromCard(cards[i])) { needsMap = true; break; }
    }
    if (needsMap) nameMap(cat.id, apply); else apply(null);
  }
  window.gc37InjectCategoryChat = injectCategory;

  /* hijack old Discover/official chat buttons at click-time (capture phase) */
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('button,a,[role="button"],[onclick]') : null;
    if (!el) return;
    var oc = el.getAttribute('onclick') || '';
    if (!/openChatWith|openUserChat|openDirectChat|startChatWith|startChat\(|chatWith|openConvo|openConversation/i.test(oc)) return;
    var m = oc.match(/['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/i);
    var id = m ? m[1] : (el.getAttribute('data-id') || el.getAttribute('data-uid') || el.getAttribute('data-user-id'));
    if (!id) return;
    ev.preventDefault(); ev.stopPropagation();
    engine(id);
  }, true);

  var t = null;
  function schedule() { clearTimeout(t); t = setTimeout(injectCategory, 150); }
  if (window.MutationObserver) {
    new MutationObserver(schedule).observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
  setInterval(injectCategory, 1200);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})();
