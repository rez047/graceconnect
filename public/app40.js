/* ============================================================
   GRACECONNECT — APP40.JS (additive, non-destructive)
   Adds the SAME Reply-to-comment UI that Public Forum/Category
   already have, to: USHIRIKA, DEPARTMENT and GROUPS threads.
   - Ushirika/Dept comments: post_comments table
   - Groups comments: community_comments table
   - Nested replies via parent_comment_id (graceful fallback
     if the column is missing on post_comments).
   Touches nothing else.
   ============================================================ */
(function () {
  'use strict';

  function db() {
    try {
      if (typeof window.sb === 'function') { var a = window.sb(); if (a && a.from) return a; }
      if (window.sb && window.sb.from) return window.sb;
      if (window.supabaseClient && window.supabaseClient.from) return window.supabaseClient;
    } catch (e) {}
    return null;
  }
  function me() { return window.user || null; }
  function esc40(s) { return window.esc ? window.esc(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function ini40(n) { return window.ini ? window.ini(n) : '?'; }
  function ago40(ts) { return window.ago ? window.ago(ts) : ''; }
  function users40() {
    if (window.usersData && window.usersData.length) return Promise.resolve(window.usersData);
    var c = db(); if (!c) return Promise.resolve([]);
    return c.from('profiles').select('id,name,profile_pic,role').order('name').then(function (r) { window.usersData = r.data || []; return window.usersData; });
  }
  function avatar40(u, s) {
    s = s || 24;
    if (u && u.profile_pic) return '<img src="' + u.profile_pic + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;object-fit:cover">';
    return '<div class="post-avatar" style="width:' + s + 'px;height:' + s + 'px;font-size:.65rem">' + ini40(u && u.name) + '</div>';
  }
  function tree40(list) {
    var map = {}, roots = [];
    list.forEach(function (c) { c._k = []; map[c.id] = c; });
    list.forEach(function (c) { if (c.parent_comment_id && map[c.parent_comment_id]) map[c.parent_comment_id]._k.push(c); else roots.push(c); });
    return roots;
  }
  window.gc40Toggle = function (id) { var e = document.getElementById(id); if (e) e.style.display = e.style.display === 'none' ? 'block' : 'none'; };

  /* ---------- one comment node with Reply button ---------- */
  function commentHtml40(c, depth, postId, kind, users) {
    var u = users.find(function (x) { return x.id === c.user_id; });
    var name = (u && u.name) || 'Member';
    var content = kind === 'pc' ? (c.content || '') : (c.text || '');
    return '<div class="comment-item" style="margin-left:' + Math.min(depth, 4) * 16 + 'px;margin-top:6px">'
      + '<div class="comment-header">' + avatar40(u) + '<span class="comment-name" style="margin-left:6px">' + esc40(name) + (c.is_anonymous ? ' <span class="anon-badge">Anonymous</span>' : '') + '</span><span class="comment-time">' + ago40(c.created_at) + '</span></div>'
      + '<div class="comment-text">' + esc40(content) + '</div>'
      + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:2px" onclick="gc40Toggle(\'gc40r-' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button>'
      + '<div id="gc40r-' + c.id + '" style="display:none;margin-top:6px"><div style="display:flex;gap:6px;align-items:center">'
      + '<input class="form-input" id="gc40rt-' + c.id + '" placeholder="Reply to ' + esc40(name) + '..." style="flex:1;margin:0" data-gc40-name="' + esc40(name) + '" data-gc40-post="' + postId + '" data-gc40-kind="' + kind + '">'
      + '<button class="btn btn-sm btn-primary" onclick="gc40Submit(\'' + c.id + '\')"><i class="fas fa-paper-plane"></i></button>'
      + '</div></div>'
      + (c._k || []).map(function (k) { return commentHtml40(k, depth + 1, postId, kind, users); }).join('')
      + '</div>';
  }

  /* ---------- render post_comments thread (ushirika / dept) ---------- */
  function renderPc40(postId, containerId) {
    var box = document.getElementById(containerId); if (!box) return Promise.resolve();
    var c = db(); if (!c) return Promise.resolve();
    return c.from('post_comments').select('*').eq('post_id', postId).order('created_at').then(function (r) {
      var list = r.data || [];
      return users40().then(function (us) {
        var h = tree40(list).map(function (x) { return commentHtml40(x, 0, postId, 'pc', us); }).join('');
        h += '<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" id="gc40nc-' + postId + '" data-gc40-post="' + postId + '" data-gc40-kind="pc" placeholder="Comment..." style="margin:0"><button class="btn btn-sm btn-primary" onclick="gc40Submit(null,\'' + postId + '\')"><i class="fas fa-paper-plane"></i></button></div>';
        box.innerHTML = h;
      });
    }).catch(function () {});
  }

  /* ---------- render community_comments thread (groups) ---------- */
  function renderCc40(postId, box) {
    var c = db(); if (!c) return;
    c.from('community_comments').select('*').eq('post_id', postId).order('created_at').then(function (r) {
      var list = r.data || [];
      users40().then(function (us) {
        var h = tree40(list).map(function (x) { return commentHtml40(x, 0, postId, 'cc', us); }).join('');
        h += '<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" id="gc40nc-' + postId + '" data-gc40-post="' + postId + '" data-gc40-kind="cc" placeholder="Comment..." style="margin:0"><button class="btn btn-sm btn-primary" onclick="gc40Submit(null,\'' + postId + '\')"><i class="fas fa-paper-plane"></i></button></div>';
        box.innerHTML = h;
      });
    });
  }
  window.gc40LoadGroup = function (postId) {
    var box = document.getElementById('gc40gc-' + postId); if (!box || box.dataset.loaded) return;
    box.dataset.loaded = '1';
    renderCc40(postId, box);
  };

  /* ---------- submit (reply or top-level) ---------- */
  window.gc40Submit = function (parentId, postId) {
    var input = parentId ? document.getElementById('gc40rt-' + parentId) : document.getElementById('gc40nc-' + postId);
    if (!input) return;
    var t = input.value.trim(); if (!t) return;
    var post = postId || input.getAttribute('data-gc40-post');
    var kind = input.getAttribute('data-gc40-kind') || 'pc';
    var targetName = input.getAttribute('data-gc40-name') || '';
    var m = me(); if (!m) return alert('Log in first');
    var c = db(); if (!c) return;
    var table = kind === 'pc' ? 'post_comments' : 'community_comments';
    var payload = kind === 'pc'
      ? { post_id: post, user_id: m.id, content: t, parent_comment_id: parentId || null, is_anonymous: false }
      : { post_id: post, user_id: m.id, text: t, parent_comment_id: parentId || null };
    c.from(table).insert([payload]).then(function (r) {
      if (r.error && /parent_comment_id/i.test(r.error.message)) {
        var fb = kind === 'pc'
          ? { post_id: post, user_id: m.id, content: '↪ @' + targetName + ': ' + t, is_anonymous: false }
          : { post_id: post, user_id: m.id, text: '↪ @' + targetName + ': ' + t };
        return c.from(table).insert([fb]);
      }
      if (r.error) { alert(r.error.message); return; }
      input.value = '';
      reload40(post, kind, parentId);
    });
  };
  function reload40(postId, kind, parentId) {
    if (kind === 'pc') {
      if (document.getElementById('ush-comments-' + postId)) renderPc40(postId, 'ush-comments-' + postId);
      if (document.getElementById('comments-' + postId)) renderPc40(postId, 'comments-' + postId);
    } else {
      var b = document.getElementById('gc40gc-' + postId);
      if (b) { b.dataset.loaded = ''; b.innerHTML = ''; window.gc40LoadGroup(postId); }
      else if (typeof window.ggSwitchGroupTab === 'function') window.ggSwitchGroupTab('feed');
    }
  }

  /* ---------- take over the two legacy loaders so Reply appears ---------- */
  window.loadPostComments = function (postId) { return renderPc40(postId, 'comments-' + postId); };      /* Department (+ old forum) */
  window.loadUshPostComments = function (postId) { return renderPc40(postId, 'ush-comments-' + postId); }; /* Ushirika */

  /* ---------- Groups: attach a comment thread to each post card ---------- */
  function injectGroupComments40() {
    var box = document.getElementById('gg-tab-feed'); if (!box) return;
    if (box.querySelector('input[id^="gggx_comment_"],input[id^="c26gx_comment_"]')) return; /* newer feed already has threads */
    var gid = window._gg && window._gg.currentGroupId; if (!gid) return;
    var cards = box.querySelectorAll('.card'); if (!cards.length) return;
    var postCards = [];
    Array.prototype.forEach.call(cards, function (cd) {
      if (cd.querySelector('textarea#ggPostText')) return;          /* composer card */
      if (cd.hasAttribute('data-gc40-postcard')) return;             /* already done */
      postCards.push(cd);
    });
    if (!postCards.length) return;
    var c = db(); if (!c) return;
    c.from('church_group_posts').select('*').eq('group_id', gid).order('created_at', { ascending: false }).limit(50).then(function (r) {
      var posts = r.data || [];
      postCards.forEach(function (cd, i) {
        var p = posts[i]; if (!p) return;
        cd.setAttribute('data-gc40-postcard', '1');
        var sec = document.createElement('div');
        sec.style.cssText = 'border-top:1px solid var(--border);margin-top:10px;padding-top:8px';
        sec.innerHTML = '<button class="post-action" onclick="gc40Toggle(\'gc40gc-' + p.id + '\');gc40LoadGroup(\'' + p.id + '\')"><i class="far fa-comment"></i> Comments</button><div id="gc40gc-' + p.id + '" style="display:none"></div>';
        cd.appendChild(sec);
      });
    });
  }

  setInterval(injectGroupComments40, 1500);
  if (window.MutationObserver && document.body) {
    var t = null;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(injectGroupComments40, 300); }).observe(document.body, { childList: true, subtree: true });
  }
  console.log('✝️ app40.js loaded — Reply buttons on Ushirika, Department & Groups comments');
})();
