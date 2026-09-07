// public/app28.js — patch for forum delete, prayer comments,
// visible chat buttons everywhere, Bible verse → forum sharing.

(function () {
  console.log('✝️ app28.js — forum/prayer/chat patch');

  const FORUM_GID = '11111111-1111-1111-1111-111111111111';
  window._h28Media = window._h28Media || {};

  function sb() { return window.sb; }
  function me() { return window.user; }
  function isAdmin() { return window.isAdmin ? window.isAdmin() : false; }
  function esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }
  function ini(n) {
    if (window.ini) return window.ini(n);
    return n ? String(n).split(' ').map(w => w[0] || '').join('').substring(0,2).toUpperCase() : '?';
  }
  function fdate(t) { return t ? new Date(t).toLocaleDateString() : ''; }
  function isOwner(row) { return me() && row && row.user_id === me().id; }

  async function users() {
    if (window.usersData && window.usersData.length) return window.usersData;
    let r = await sb().from('profiles').select('id,name,profile_pic,email,role').order('name');
    if (r.error) r = await sb().from('profiles').select('id,name,profile_pic,role').order('name');
    window.usersData = r.data || [];
    return window.usersData;
  }

  function avatarHtml(u, size) {
    size = size || 38;
    if (u && u.profile_pic) {
      return '<img src="' + u.profile_pic + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;object-fit:cover;flex-shrink:0">';
    }
    return '<div class="post-avatar" style="width:' + size + 'px;height:' + size + 'px">' + ini(u && u.name) + '</div>';
  }

  async function upload(file, path) {
    if (!file) return null;
    if (window.uploadMediaFile) {
      try { return await window.uploadMediaFile(file); } catch (e) {}
    }
    const name = (path || 'media') + '/' + Date.now() + '_' + file.name;
    const r = await sb().storage.from('media').upload(name, file);
    if (r.error) {
      alert('Upload failed: ' + r.error.message);
      return null;
    }
    return sb().storage.from('media').getPublicUrl(name).data.publicUrl;
  }

  function mediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
      return '<img src="'+url+'" style="width:100%;max-height:280px;object-fit:cover;border-radius:14px;margin-top:8px">';
    }
    if (/\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi|3gp|3gpp|flv|wmv)$/i.test(url)) {
      return '<video src="'+url+'" controls playsinline style="width:100%;max-height:320px;border-radius:14px;margin-top:8px"></video>';
    }
    if (/\.(mp3|wav|m4a|aac|ogg|opus)$/i.test(url)) {
      return '<audio src="'+url+'" controls style="width:100%;margin-top:8px"></audio>';
    }
    return '<a href="'+url+'" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:8px"><i class="fas fa-paperclip"></i> Attachment</a>';
  }

  window.h28Attach = function (key, labelId) {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '*/*';
    i.onchange = function () {
      const f = i.files && i.files[0];
      if (!f) return;
      window._h28Media[key] = f;
      const label = document.getElementById(labelId);
      if (label) label.innerHTML = '<i class="fas fa-check-circle"></i> ' + esc(f.name);
    };
    i.click();
  };

  // =====================================================
  // visible chat buttons everywhere
  // =====================================================
  function h28Css() {
    if (document.getElementById('h28Css')) return;
    const s = document.createElement('style');
    s.id = 'h28Css';
    s.textContent = `
      .h28-chat-btn{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:5px!important;
        min-width:74px!important;
        height:34px!important;
        padding:0 10px!important;
        border:none!important;
        border-radius:999px!important;
        background:linear-gradient(135deg,#4F46E5,#06B6D4)!important;
        color:#fff!important;
        font-size:.72rem!important;
        font-weight:800!important;
        box-shadow:0 8px 18px -8px rgba(79,70,229,.65)!important;
        z-index:5!important;
        flex-shrink:0!important;
      }
      .h28-chat-float{
        position:absolute!important;
        top:10px!important;
        right:10px!important;
      }
      .h28-post-delete{
        border:none!important;
        background:#FEE2E2!important;
        color:#DC2626!important;
        border-radius:999px!important;
        width:34px!important;
        height:34px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
      }
    `;
    document.head.appendChild(s);
  }

  function openChat(uid) {
    if (!uid || (me() && uid === me().id)) return;
    if (typeof window.h27ChatWith === 'function') return window.h27ChatWith(uid);
    if (typeof window.c26OpenChat === 'function') return window.c26OpenChat(uid);
    alert('Chat module not loaded.');
  }

  async function injectVisibleChatButtons() {
    if (!me()) return;
    const us = await users();

    // Department/Ushirika members from c26 exact state
    const c26MembersBox = document.getElementById('c26-members');
    if (c26MembersBox && window._c26 && Array.isArray(window._c26.members)) {
      const cards = Array.from(c26MembersBox.querySelectorAll('.card'));
      cards.forEach((card, idx) => {
        if (card.querySelector('.h28-chat-btn')) return;
        const m = window._c26.members[idx];
        if (!m || !m.user_id || m.user_id === me().id) return;
        card.style.position = 'relative';
        const btn = document.createElement('button');
        btn.className = 'h28-chat-btn h28-chat-float';
        btn.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
        btn.onclick = function () { openChat(m.user_id); };
        card.appendChild(btn);
      });
    }

    // Department/Ushirika leadership by name scan
    ['#c26-leadership', '#gg-tab-members', '#gg-tab-leadership', '#gg-members', '#ggMemberList'].forEach(sel => {
      const box = document.querySelector(sel);
      if (!box) return;
      Array.from(box.querySelectorAll('.card, .member-card, .list-item')).forEach(card => {
        if (card.querySelector('.h28-chat-btn')) return;
        const txt = (card.textContent || '').toLowerCase();
        const u = us.find(x => x.name && txt.includes(String(x.name).toLowerCase()) && x.id !== me().id);
        if (!u) return;
        card.style.position = 'relative';
        const btn = document.createElement('button');
        btn.className = 'h28-chat-btn h28-chat-float';
        btn.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
        btn.onclick = function () { openChat(u.id); };
        card.appendChild(btn);
      });
    });

    // Public forum post/comment authors
    const forum = document.getElementById('h28ForumList') || document.getElementById('h27PostList');
    if (forum) {
      Array.from(forum.querySelectorAll('[data-h28-user]')).forEach(el => {
        if (el.querySelector('.h28-chat-btn')) return;
        const uid = el.getAttribute('data-h28-user');
        if (!uid || uid === me().id) return;
        const btn = document.createElement('button');
        btn.className = 'h28-chat-btn';
        btn.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
        btn.onclick = function () { openChat(uid); };
        el.appendChild(btn);
      });
    }
  }

  // =====================================================
  // own full-page shell overriding h27OpenPage for forum/prayer
  // =====================================================
  function ensureSection() {
    let s = document.getElementById('section-h28');
    if (s) return s;
    s = document.createElement('div');
    s.id = 'section-h28';
    s.className = 'section';
    s.innerHTML = '<div id="h28-root" class="sub-page active"></div>';
    (document.querySelector('main') || document.body).appendChild(s);
    return s;
  }

  function showPage(html) {
    const s = ensureSection();
    document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
    s.classList.add('active');
    const root = document.getElementById('h28-root');
    root.innerHTML = html;
    window.scrollTo({ top: 0 });
  }

  window.h28BackHome = function () {
    if (window.c26OrigSwitch) window.c26OrigSwitch('home');
    else if (window.switchSection) window.switchSection('home');
  };

  function shell(title, icon, grad, body) {
    return '<button class="back-btn" onclick="h28BackHome()"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div style="border-radius:20px;padding:16px;color:#fff;background:' + grad + ';font-weight:800;font-size:1.15rem;margin-bottom:14px">'
      + '<i class="fas ' + icon + '"></i> ' + title + '</div>' + body;
  }

  const oldH27OpenPage = window.h27OpenPage;
  window.h27OpenPage = function (page) {
    if (page === 'forum') return h28OpenForum();
    if (page === 'prayer') return h28OpenPrayer();
    if (page === 'plans' && typeof oldH27OpenPage === 'function') return oldH27OpenPage('plans');
    if (typeof oldH27OpenPage === 'function') return oldH27OpenPage(page);
  };

  window.h28OpenForum = h28OpenForum;
  window.h28OpenPrayer = h28OpenPrayer;

  function h28OpenForum() {
    showPage(shell('Public Forum', 'fa-comments', 'linear-gradient(135deg,#4F46E5,#06B6D4)',
      '<div class="card" style="border-radius:20px">'
      + '<textarea class="form-textarea" id="h28ForumText" rows="2" placeholder="Post to the public forum..."></textarea>'
      + '<div class="media-upload" id="h28ForumUpload" onclick="h28Attach(\'forum_post\',\'h28ForumUpload\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media/video/file</span></div>'
      + '<button class="btn btn-primary btn-block" style="margin-top:8px" onclick="h28SubmitForumPost()"><i class="fas fa-paper-plane"></i> Post</button>'
      + '<div id="h28ForumList" style="margin-top:12px"></div>'
      + '</div>'
    ));
    h28LoadForum();
  }

  function h28OpenPrayer() {
    showPage(shell('Prayer Wall', 'fa-hands-praying', 'linear-gradient(135deg,#8B5CF6,#EC4899)',
      '<div class="card" style="border-radius:20px">'
      + '<textarea class="form-textarea" id="h28PrayerText" rows="2" placeholder="Share a prayer request..."></textarea>'
      + '<div style="display:flex;gap:10px;align-items:center;margin:8px 0"><span style="font-size:.8rem;color:var(--text-light)">Anonymous</span><input type="checkbox" id="h28PrayerAnon"></div>'
      + '<button class="btn btn-primary btn-block" onclick="h28SubmitPrayer()"><i class="fas fa-paper-plane"></i> Pray</button>'
      + '<div id="h28PrayerList" style="margin-top:12px"></div>'
      + '</div>'
    ));
    h28LoadPrayers();
  }

  // =====================================================
  // public forum: admin deletes all, user deletes own
  // =====================================================
  window.h28SubmitForumPost = async function () {
    const t = document.getElementById('h28ForumText').value.trim();
    const f = window._h28Media.forum_post;
    if (!t && !f) return alert('Write something or add media.');

    let url = null;
    if (f) url = await upload(f, 'forum');

    const r = await sb().from('community_posts').insert([{
      group_type: 'forum',
      group_id: FORUM_GID,
      user_id: me().id,
      text: t,
      media_url: url
    }]);

    if (r.error) return alert(r.error.message);

    window._h28Media.forum_post = null;
    document.getElementById('h28ForumText').value = '';
    document.getElementById('h28ForumUpload').innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Add media/video/file</span>';
    h28LoadForum();
  };

  async function h28LoadForum() {
    const box = document.getElementById('h28ForumList');
    if (!box) return;

    const posts = await sb().from('community_posts').select('*')
      .eq('group_type', 'forum')
      .eq('group_id', FORUM_GID)
      .order('created_at', { ascending: false })
      .limit(50);

    if (posts.error) {
      box.innerHTML = '<div style="color:#EF4444">' + esc(posts.error.message) + '</div>';
      return;
    }

    const ids = (posts.data || []).map(p => p.id);
    let comments = { data: [] };
    if (ids.length) {
      comments = await sb().from('community_comments').select('*').in('post_id', ids).order('created_at');
    }

    const us = await users();
    const byPost = {};
    (comments.data || []).forEach(c => {
      (byPost[c.post_id] = byPost[c.post_id] || []).push(c);
    });

    window._h28ForumUsers = us;

    box.innerHTML = (posts.data || []).map(p => {
      const u = us.find(x => x.id === p.user_id);
      const canDel = isAdmin() || isOwner(p);
      return '<div class="card" style="border-radius:16px;margin-bottom:10px">'
        + '<div style="display:flex;gap:8px;align-items:center" data-h28-user="' + esc(p.user_id) + '">'
        + avatarHtml(u, 38)
        + '<div style="flex:1"><b style="font-size:.9rem">' + esc((u && u.name) || 'Member') + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>'
        + (canDel ? '<button class="h28-post-delete" onclick="h28DeleteForumPost(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '')
        + '</div>'
        + '<div style="white-space:pre-wrap;margin:8px 0">' + esc(p.text || '') + '</div>'
        + mediaHtml(p.media_url)
        + renderForumComments(buildTree(byPost[p.id] || []), 0, p.id)
        + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center">'
        + '<input class="form-input" id="h28fc-' + p.id + '" placeholder="Comment..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h28Attach(\'fc_' + p.id + '\',\'h28fcu-' + p.id + '\')"><i class="fas fa-paperclip"></i></button>'
        + '<span id="h28fcu-' + p.id + '" style="font-size:.65rem;color:var(--text-light)"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h28SubmitForumComment(\'' + p.id + '\',null)"><i class="fas fa-paper-plane"></i></button>'
        + '</div>'
        + '</div>';
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;text-align:center">No posts yet.</div>';

    injectVisibleChatButtons();
  }

  window.h28DeleteForumPost = async function (postId) {
    if (!confirm('Delete this post?')) return;
    const r = await sb().from('community_posts').delete().eq('id', postId);
    if (r.error) return alert(r.error.message);
    h28LoadForum();
  };

  function buildTree(list) {
    const map = {};
    const roots = [];
    list.forEach(c => { c._kids = []; map[c.id] = c; });
    list.forEach(c => {
      if (c.parent_comment_id && map[c.parent_comment_id]) map[c.parent_comment_id]._kids.push(c);
      else roots.push(c);
    });
    return roots;
  }

  function renderForumComments(list, depth, postId) {
    const us = window._h28ForumUsers || [];
    return list.map(c => {
      const u = us.find(x => x.id === c.user_id);
      return '<div style="margin-left:' + Math.min(depth,4)*16 + 'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px">'
        + '<div style="display:flex;gap:6px;align-items:center" data-h28-user="' + esc(c.user_id) + '">'
        + avatarHtml(u, 28)
        + '<b style="font-size:.78rem;flex:1">' + esc((u && u.name) || 'Member') + '</b>'
        + '</div>'
        + '<div style="font-size:.88rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text || '') + '</div>'
        + mediaHtml(c.media_url)
        + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:4px" onclick="h28Toggle(\'h28fr-' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button>'
        + '<div id="h28fr-' + c.id + '" style="display:none;margin-top:6px">'
        + '<div style="display:flex;gap:6px;align-items:center">'
        + '<input class="form-input" id="h28frt-' + c.id + '" placeholder="Reply..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h28Attach(\'fr_' + c.id + '\',\'h28fru-' + c.id + '\')"><i class="fas fa-paperclip"></i></button>'
        + '<span id="h28fru-' + c.id + '" style="font-size:.65rem;color:var(--text-light)"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h28SubmitForumComment(\'' + postId + '\',\'' + c.id + '\')"><i class="fas fa-paper-plane"></i></button>'
        + '</div></div>'
        + renderForumComments(c._kids || [], depth + 1, postId)
        + '</div>';
    }).join('');
  }

  window.h28SubmitForumComment = async function (postId, parentId) {
    const inputId = parentId ? 'h28frt-' + parentId : 'h28fc-' + postId;
    const key = parentId ? 'fr_' + parentId : 'fc_' + postId;
    const t = document.getElementById(inputId).value.trim();
    const f = window._h28Media[key];

    if (!t && !f) return;

    let url = null;
    if (f) url = await upload(f, 'forum-comments');

    const r = await sb().from('community_comments').insert([{
      post_id: postId,
      user_id: me().id,
      text: t,
      media_url: url,
      parent_comment_id: parentId || null
    }]);

    if (r.error) return alert(r.error.message);

    window._h28Media[key] = null;
    h28LoadForum();
  };

  // =====================================================
  // prayer wall: users comment on prayers with media/replies
  // =====================================================
  window.h28SubmitPrayer = async function () {
    const t = document.getElementById('h28PrayerText').value.trim();
    const anon = document.getElementById('h28PrayerAnon').checked;
    if (!t) return alert('Write a prayer.');

    const r = await sb().from('community_prayers').insert([{
      user_id: me().id,
      text: t,
      anonymous: anon
    }]);

    if (r.error) return alert(r.error.message);

    document.getElementById('h28PrayerText').value = '';
    h28LoadPrayers();
  };

  async function h28LoadPrayers() {
    const box = document.getElementById('h28PrayerList');
    if (!box) return;

    const prayers = await sb().from('community_prayers').select('*')
      .order('created_at', { ascending: false })
      .limit(40);

    if (prayers.error) {
      box.innerHTML = '<div style="color:#EF4444">' + esc(prayers.error.message) + '</div>';
      return;
    }

    const ids = (prayers.data || []).map(p => p.id);
    let comments = { data: [] };
    if (ids.length) {
      comments = await sb().from('community_prayer_comments').select('*').in('prayer_id', ids).order('created_at');
    }

    const us = await users();
    window._h28PrayerUsers = us;

    const byPrayer = {};
    (comments.data || []).forEach(c => {
      (byPrayer[c.prayer_id] = byPrayer[c.prayer_id] || []).push(c);
    });

    box.innerHTML = (prayers.data || []).map(p => {
      const u = us.find(x => x.id === p.user_id);
      const name = p.anonymous ? '🕊️ Anonymous' : ((u && u.name) || 'Member');

      return '<div class="card" style="border-radius:16px;margin-bottom:10px">'
        + '<div style="display:flex;gap:8px;align-items:center">'
        + (p.anonymous ? '<div class="post-avatar">🙏</div>' : avatarHtml(u, 38))
        + '<div style="flex:1"><b style="font-size:.9rem">' + esc(name) + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>'
        + '</div>'
        + '<div style="white-space:pre-wrap;margin:8px 0">' + esc(p.text || '') + '</div>'
        + renderPrayerComments(buildTree(byPrayer[p.id] || []), 0, p.id)
        + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center">'
        + '<input class="form-input" id="h28pc-' + p.id + '" placeholder="Comment / encouragement..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h28Attach(\'pc_' + p.id + '\',\'h28pcu-' + p.id + '\')"><i class="fas fa-paperclip"></i></button>'
        + '<span id="h28pcu-' + p.id + '" style="font-size:.65rem;color:var(--text-light)"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h28SubmitPrayerComment(\'' + p.id + '\',null)"><i class="fas fa-paper-plane"></i></button>'
        + '</div>'
        + '</div>';
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;text-align:center">No prayers yet.</div>';
  }

  function renderPrayerComments(list, depth, prayerId) {
    const us = window._h28PrayerUsers || [];
    return list.map(c => {
      const u = us.find(x => x.id === c.user_id);
      return '<div style="margin-left:' + Math.min(depth,4)*16 + 'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px">'
        + '<div style="display:flex;gap:6px;align-items:center" data-h28-user="' + esc(c.user_id) + '">'
        + avatarHtml(u, 28)
        + '<b style="font-size:.78rem;flex:1">' + esc((u && u.name) || 'Member') + '</b>'
        + '</div>'
        + '<div style="font-size:.88rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text || '') + '</div>'
        + mediaHtml(c.media_url)
        + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:4px" onclick="h28Toggle(\'h28pr-' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button>'
        + '<div id="h28pr-' + c.id + '" style="display:none;margin-top:6px">'
        + '<div style="display:flex;gap:6px;align-items:center">'
        + '<input class="form-input" id="h28prt-' + c.id + '" placeholder="Reply..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h28Attach(\'pr_' + c.id + '\',\'h28pru-' + c.id + '\')"><i class="fas fa-paperclip"></i></button>'
        + '<span id="h28pru-' + c.id + '" style="font-size:.65rem;color:var(--text-light)"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h28SubmitPrayerComment(\'' + prayerId + '\',\'' + c.id + '\')"><i class="fas fa-paper-plane"></i></button>'
        + '</div></div>'
        + renderPrayerComments(c._kids || [], depth + 1, prayerId)
        + '</div>';
    }).join('');
  }

  window.h28SubmitPrayerComment = async function (prayerId, parentId) {
    const inputId = parentId ? 'h28prt-' + parentId : 'h28pc-' + prayerId;
    const key = parentId ? 'pr_' + parentId : 'pc_' + prayerId;
    const t = document.getElementById(inputId).value.trim();
    const f = window._h28Media[key];

    if (!t && !f) return;

    let url = null;
    if (f) url = await upload(f, 'prayer-comments');

    const r = await sb().from('community_prayer_comments').insert([{
      prayer_id: prayerId,
      user_id: me().id,
      parent_comment_id: parentId || null,
      text: t,
      media_url: url
    }]);

    if (r.error) return alert(r.error.message);

    window._h28Media[key] = null;
    h28LoadPrayers();
  };

  window.h28Toggle = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };

  // =====================================================
  // Bible verse sharing → public forum
  // =====================================================
  window.h28ShareVerseToForum = async function (reference, verseText) {
    if (!me()) return alert('Log in first.');
    const text = '📖 ' + (reference ? reference + '\n' : '') + (verseText || '');
    if (!text.trim()) return alert('No verse selected.');

    const r = await sb().from('community_posts').insert([{
      group_type: 'forum',
      group_id: FORUM_GID,
      user_id: me().id,
      text: text,
      media_url: null
    }]);

    if (r.error) return alert(r.error.message);

    alert('Bible verse shared to Public Forum.');
  };

  function patchVerseShareFunctions() {
    const names = [
      'shareVerse',
      'shareBibleVerse',
      'shareVerseToForum',
      'postVerseToForum',
      'shareDailyVerse',
      'shareVersePost'
    ];

    names.forEach(name => {
      if (typeof window[name] === 'function' && !window[name]._h28patched) {
        const old = window[name];
        const patched = async function () {
          let res;
          try { res = old.apply(this, arguments); } catch (e) {}

          const args = Array.from(arguments).map(x => typeof x === 'string' ? x : '');
          const joined = args.join('\n').trim();

          let ref = '';
          let txt = joined;

          const refEl = document.querySelector('#verseReference,#dailyVerseRef,.verse-reference,.bible-reference');
          const textEl = document.querySelector('#verseText,#dailyVerseText,.verse-text,.bible-verse-text');

          if (!txt && textEl) txt = textEl.textContent.trim();
          if (refEl) ref = refEl.textContent.trim();

          if (txt || ref) await window.h28ShareVerseToForum(ref, txt);

          return res;
        };
        patched._h28patched = true;
        window[name] = patched;
      }
    });
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('button, .btn, .mini-card');
    if (!btn) return;
    const txt = (btn.textContent || '').toLowerCase();
    if (!/verse/.test(txt) || !/forum|share|post/.test(txt)) return;

    setTimeout(async function () {
      const refEl = document.querySelector('#verseReference,#dailyVerseRef,.verse-reference,.bible-reference');
      const textEl = document.querySelector('#verseText,#dailyVerseText,.verse-text,.bible-verse-text');

      const ref = refEl ? refEl.textContent.trim() : '';
      const verse = textEl ? textEl.textContent.trim() : '';

      if (ref || verse) await window.h28ShareVerseToForum(ref, verse);
    }, 200);
  }, true);

  // =====================================================
  // sync
  // =====================================================
  function sync() {
    h28Css();
    patchVerseShareFunctions();
    injectVisibleChatButtons();
  }

  sync();
  setInterval(sync, 1500);
})();
