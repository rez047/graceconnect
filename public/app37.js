/* ============================================================
   GRACECONNECT — APP37.JS : FINAL CHAT UNIFIER
   1) Routes EVERY legacy chat call to the working Ushirika/Dept engine
   2) Intercepts the removed discover-chat section
   3) Force-injects a Chat button next to every NON-SELF category member
   ============================================================ */
(function () {
    'use strict';

    function engine(uid) {
        if (!uid) return false;
        if (typeof window.c26OpenChat === 'function') { window.c26OpenChat(uid); return false; }
        if (typeof window.h27ChatWith === 'function') { window.h27ChatWith(uid); return false; }
        alert('Chat is not available.');
        return false;
    }

    /* ---------- 1) Route every legacy chat name ---------- */
    ['openChatWith', 'openUserChat', 'openDirectChat', 'startChat',
     'startChatWith', 'chatWith', 'openConvo', 'openConversation',
     'openChat', 'h32CategoryChat', 'h32CatChat'
    ].forEach(function (n) {
        window[n] = function (uid) { return engine(uid); };
    });

    /* ---------- 2) Intercept the removed discover-chat section ---------- */
    var _activate = window.activateSection;
    window.activateSection = function (sec, sub, ctx) {
        if (sub === 'discover-chat' || sec === 'discover-chat') {
            var uid = window.currentChatUserId ||
                      (window.H && window.H.chatUid) || null;
            if (uid) return engine(uid);
            return false;
        }
        if (typeof _activate === 'function') return _activate.apply(this, arguments);
    };

    /* ---------- 3) Force category member chat buttons ---------- */
    function inject() {
        var box = document.getElementById('h32c-members');
        var cat = window._h32Cat;
        if (!box || !cat || !cat.id) return;

        var sbf = null;
        try {
            if (typeof window.sb === 'function') sbf = window.sb();
            else if (window.sb && window.sb.from) sbf = window.sb;
            else if (window.supabaseClient) sbf = window.supabaseClient;
        } catch (e) {}
        if (!sbf) return;

        sbf.from('church_group_category_members')
            .select('user_id')
            .eq('category_id', cat.id)
            .then(function (mr) {
                var ids = (mr.data || []).map(function (x) { return x.user_id; });
                if (!ids.length) return;

                sbf.from('profiles').select('id,name').in('id', ids).then(function (pr) {
                    var me = window.user || window.currentUser || null;
                    var meId = me ? String(me.id) : null;

                    (pr.data || []).forEach(function (p) {
                        /* never add a chat button next to yourself */
                        if (meId && String(p.id) === meId) return;

                        var cards = box.querySelectorAll('.card');
                        for (var i = 0; i < cards.length; i++) {
                            var card = cards[i];
                            if (card.querySelector('[data-gc37-chat]')) continue;
                            var name = (p.name || '').toLowerCase();
                            var txt = (card.textContent || '').toLowerCase();
                            if (!name || txt.indexOf(name) === -1) continue;

                            var row = card.querySelector('[style*="display:flex"]') ||
                                      card.firstElementChild || card;

                            var b = document.createElement('button');
                            b.type = 'button';
                            b.className = 'btn btn-primary btn-sm';
                            b.setAttribute('data-gc37-chat', '1');
                            b.style.cssText = 'white-space:nowrap;margin-left:auto;';
                            b.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
                            b.onclick = function (ev) {
                                ev.preventDefault();
                                ev.stopPropagation();
                                engine(p.id);
                            };
                            row.appendChild(b);
                            break;
                        }
                    });
                });
            });
    }
    window.gc37InjectCategoryChat = inject;

    /* hook the category tab + members renderer */
    ['h32CatTab', 'h32CatMembers'].forEach(function (n) {
        var fn = window[n];
        if (typeof fn === 'function' && !fn.__gc37) {
            var w = function () {
                var r = fn.apply(this, arguments);
                setTimeout(inject, 150);
                setTimeout(inject, 600);
                setTimeout(inject, 1500);
                return r;
            };
            w.__gc37 = true;
            window[n] = w;
        }
    });

    /* watch for re-renders */
    function observe() {
        var box = document.getElementById('h32c-members');
        if (box && !box.__gc37obs && window.MutationObserver) {
            box.__gc37obs = true;
            var t = null;
            new MutationObserver(function () {
                clearTimeout(t);
                t = setTimeout(inject, 200);
            }).observe(box, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { observe(); inject(); });
    } else {
        observe(); inject();
    }
    setInterval(observe, 2000);
})();
