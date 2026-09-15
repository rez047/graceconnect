/* ============================================================
   GRACECONNECT — APP37.JS (v2)
   ADDITIVE PATCH (non-destructive, DOM-level):
   1) Category Members tab  → always shows the Chat button
   2) Servants of God list  → chat bubble opens chat (working)
   Same chat pipeline as Groups: c26OpenChat → h27ChatWith → openChatWith
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

  /* ---------- uid resolution (many fallbacks) ---------- */
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

  function makeChatBtn37() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-primary btn-sm';
    b.setAttribute('data-gc37-chat', '1');
    b.style.cssText = 'display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin-top:8px;';
    b.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
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

  /* ═══════════ 1) CATEGORY MEMBERS → CHAT BUTTON (hardened) ═══════════ */
  function containers37() {
    var list = [];
    var el = document.getElementById('h32c-members');
    if (el) list.push(el);
    var root = document.getElementById('gg-root') || document;
    var divs = root.querySelectorAll('div[id]');
    Array.prototype.forEach.call(divs, function (d) {
      var idl = (d.id || '').toLowerCase();
      if (idl.indexOf('member') > -1 && idl.indexOf('gg-tab-members') === -1 && list.indexOf(d) === -1) list.push(d);
    });
    return list;
  }

  function patchCategory37() {
    var box = document.getElementById('h32c-members');

    if (!box) return;

    /*
     * Category members are rendered differently from Group members.
     * Their cards do NOT contain c26OpenChat()/h27ChatWith().
     *
     * Therefore:
     * 1. Read the actual category membership rows.
     * 2. Use their user_id as the authoritative ID.
     * 3. Match those IDs to the rendered member cards by the
     *    member's displayed profile name.
     * 4. Add the same Chat button/pipeline used elsewhere.
     */

    var cat = window._h32Cat;

    if (!cat || !cat.id) return;

    var c = db37();

    if (!c) return;

    /*
     * Prevent multiple simultaneous queries caused by the
     * MutationObserver + interval.
     */
    if (box.getAttribute('data-gc37-loading') === '1') return;

    box.setAttribute('data-gc37-loading', '1');

    Promise.all([
        c
            .from('church_group_category_members')
            .select('user_id,role')
            .eq('category_id', cat.id),

        c
            .from('profiles')
            .select('id,name,profile_pic,email,role')
    ])
    .then(function (results) {

        var memberships = results[0] || {};
        var profiles = results[1] || {};

        if (memberships.error || profiles.error) {
            return;
        }

        var members = memberships.data || [];
        var profs = profiles.data || [];

        if (!members.length || !profs.length) return;

        /*
         * Build user_id -> profile lookup.
         */
        var profileMap = {};

        profs.forEach(function (p) {
            if (p && p.id) {
                profileMap[String(p.id)] = p;
            }
        });

        /*
         * The category renderer creates the member cards directly
         * inside #h32c-members.
         *
         * We deliberately do NOT use ".card" because that can also
         * catch unrelated nested cards.
         */
        var rows = [];

        Array.prototype.forEach.call(box.children, function (el) {

            if (!el || el.nodeType !== 1) return;

            /*
             * Ignore containers that are clearly not member rows.
             */
            var text = norm37(el.textContent || '');

            if (!text) return;

            rows.push(el);
        });

        if (!rows.length) return;

        /*
         * Find a member row by the actual profile name.
         * We search the rendered DOM rather than reconstructing
         * the Category member card.
         */
        members.forEach(function (m) {

            if (!m || !m.user_id) return;

            var uid = String(m.user_id);
            var profile = profileMap[uid];

            if (!profile || !profile.name) return;

            /*
             * If this member already has the button, leave it alone.
             */
            var existing = box.querySelector(
                '[data-gc37-chat-user="' +
                CSS.escape(uid) +
                '"]'
            );

            if (existing) return;

            var target = null;
            var wanted = norm37(profile.name);

            /*
             * First try direct member rows.
             */
            for (var i = 0; i < rows.length; i++) {

                var row = rows[i];

                /*
                 * Do not reuse a row already assigned to another
                 * Category member.
                 */
                if (row.getAttribute('data-gc37-member-id')) {
                    continue;
                }

                var rowText = norm37(row.textContent || '');

                if (
                    rowText &&
                    rowText.indexOf(wanted) !== -1
                ) {
                    target = row;
                    break;
                }
            }

            /*
             * If the renderer has wrapped the actual member card,
             * search descendants for the exact displayed name and
             * climb to the nearest useful container.
             */
            if (!target) {

                var walker = document.createTreeWalker(
                    box,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                var node;

                while ((node = walker.nextNode())) {

                    var nt = norm37(node.nodeValue || '');

                    if (
                        nt &&
                        nt.indexOf(wanted) !== -1
                    ) {

                        var parent = node.parentElement;

                        if (!parent) continue;

                        /*
                         * Prefer an existing card/container.
                         */
                        target =
                            parent.closest('.card') ||
                            parent.closest(
                                '[style*="border-radius"]'
                            ) ||
                            parent.parentElement;

                        if (target) break;
                    }
                }
            }

            if (!target) return;

            target.setAttribute(
                'data-gc37-member-id',
                uid
            );

            /*
             * Check again because the target may already contain
             * another Chat implementation.
             */
            var buttons = target.querySelectorAll(
                'button,a'
            );

            for (var j = 0; j < buttons.length; j++) {

                var b = buttons[j];

                var txt = norm37(
                    b.textContent || ''
                );

                if (
                    txt === 'chat' ||
                    txt === 'inbox' ||
                    b.getAttribute('data-gc36-chat') === '1'
                ) {
                    b.setAttribute(
                        'data-gc37-chat-user',
                        uid
                    );
                    return;
                }
            }

            /*
             * Create the missing button.
             */
            var chatButton = makeChatBtn37(uid);

            chatButton.setAttribute(
                'data-gc37-chat-user',
                uid
            );

            chatButton.style.marginTop = '8px';

            /*
             * Category cards have their role/remove controls in a
             * flex row when the viewer is a manager. Put Chat into
             * that row when available; otherwise append it safely.
             */
            var actionRow =
                target.querySelector(
                    '.d-flex,' +
                    '.btn-group,' +
                    '.actions,' +
                    '[style*="display:flex"]'
                );

            if (actionRow) {

                chatButton.style.marginTop = '0';
                chatButton.style.marginLeft = '8px';

                actionRow.appendChild(
                    chatButton
                );

            } else {

                target.appendChild(
                    chatButton
                );
            }
        });

    })
    .catch(function (err) {

        console.warn(
            'GC37 Category Chat patch:',
            err
        );

    })
    .finally(function () {

        box.removeAttribute(
            'data-gc37-loading'
        );

    });
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
  function queue37() { clearTimeout(t37); t37 = setTimeout(patchAll37, 250); }

  profiles37();                       /* warm the cache immediately */
  if (window.MutationObserver && document.body) {
    new MutationObserver(queue37).observe(document.body, { childList: true, subtree: true });
  }
  setInterval(patchAll37, 1200);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchAll37);
  else patchAll37();

  console.log('✝️ app37.js v2 loaded — category Chat button hardened + servants chat');
})();
