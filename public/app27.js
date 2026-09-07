// public/app27.js — MERGED: original features + inbox + my list + delete + featured + ministries + verse + trivia

(function () {
  console.log('✝️ app27.js loaded');

  const FORUM_GID = '11111111-1111-1111-1111-111111111111';
  window._h27Media = window._h27Media || {};

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
  function ftime(t) { return t ? new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''; }
  function isOwner(row) { return me() && row && row.user_id === me().id; }

  async function users(force) {
    if (force) window.usersData = null;
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

  window.h27Attach = function (key, labelId) {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '*/*';
    i.onchange = function () {
      const f = i.files && i.files[0];
      if (!f) return;
      window._h27Media[key] = f;
      const label = document.getElementById(labelId);
      if (label) label.innerHTML = '<i class="fas fa-check-circle"></i> ' + esc(f.name);
    };
    i.click();
  };

  // ============ CHAT BUTTONS CSS ============
  function h27Css() {
    if (document.getElementById('h27Css')) return;
    const s = document.createElement('style');
    s.id = 'h27Css';
    s.textContent = `
      .h27-chat-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;min-width:74px!important;height:34px!important;padding:0 10px!important;border:none!important;border-radius:999px!important;background:linear-gradient(135deg,#4F46E5,#06B6D4)!important;color:#fff!important;font-size:.72rem!important;font-weight:800!important;box-shadow:0 8px 18px -8px rgba(79,70,229,.65)!important;z-index:5!important;flex-shrink:0!important}
      .h27-chat-float{position:absolute!important;top:10px!important;right:10px!important}
      .h27-post-delete{border:none!important;background:#FEE2E2!important;color:#DC2626!important;border-radius:999px!important;width:34px!important;height:34px!important;display:flex!important;align-items:center!important;justify-content:center!important}
      .post-avatar img{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}
    `;
    document.head.appendChild(s);
  }

  function openChat(uid) {
    if (!uid || (me() && uid === me().id)) return;
    if (typeof window.h27ChatWith === 'function') return window.h27ChatWith(uid);
    if (typeof window.c26OpenChat === 'function') return window.c26OpenChat(uid);
    alert('Chat module not loaded.');
  }

  async function injectChatButtons() {
    if (!me()) return;
    const us = await users();
    const c26MembersBox = document.getElementById('c26-members');
    if (c26MembersBox && window._c26 && Array.isArray(window._c26.members)) {
      const cards = Array.from(c26MembersBox.querySelectorAll('.card'));
      cards.forEach((card, idx) => {
        if (card.querySelector('.h27-chat-btn')) return;
        const m = window._c26.members[idx];
        if (!m || !m.user_id || m.user_id === me().id) return;
        card.style.position = 'relative';
        const btn = document.createElement('button');
        btn.className = 'h27-chat-btn h27-chat-float';
        btn.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
        btn.onclick = function () { openChat(m.user_id); };
        card.appendChild(btn);
      });
    }
    ['#c26-leadership', '#gg-tab-members', '#gg-tab-leadership', '#gg-members'].forEach(sel => {
      const box = document.querySelector(sel);
      if (!box) return;
      Array.from(box.querySelectorAll('.card, .member-card')).forEach(card => {
        if (card.querySelector('.h27-chat-btn')) return;
        const txt = (card.textContent || '').toLowerCase();
        const u = us.find(x => x.name && txt.includes(String(x.name).toLowerCase()) && x.id !== me().id);
        if (!u) return;
        card.style.position = 'relative';
        const btn = document.createElement('button');
        btn.className = 'h27-chat-btn h27-chat-float';
        btn.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
        btn.onclick = function () { openChat(u.id); };
        card.appendChild(btn);
      });
    });
  }

  // ============ SECTION SHELL ============
  function ensureSection() {
    let s = document.getElementById('section-h27');
    if (s) return s;
    s = document.createElement('div');
    s.id = 'section-h27'; s.className = 'section';
    s.innerHTML = '<div id="h27-root" class="sub-page active"></div>';
    (document.querySelector('main') || document.body).appendChild(s);
    return s;
  }

  function showPage(html) {
    const s = ensureSection();
    document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
    s.classList.add('active');
    document.getElementById('h27-root').innerHTML = html;
    window.scrollTo({ top: 0 });
  }

  window.h27BackHome = function () {
    if (window.c26OrigSwitch) window.c26OrigSwitch('home');
    else if (window.switchSection) window.switchSection('home');
  };

  function shell(title, icon, grad, body) {
    return '<button class="back-btn" onclick="h27BackHome()"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div style="border-radius:20px;padding:16px;color:#fff;background:' + grad + ';font-weight:800;font-size:1.15rem;margin-bottom:14px">'
      + '<i class="fas ' + icon + '"></i> ' + title + '</div>' + body;
  }

  // ============ PAGE ROUTER ============
  window.h27OpenPage = function (page) {
    if (page === 'forum') return h27OpenForum();
    if (page === 'prayer') return h27OpenPrayer();
    if (page === 'plans') return h27OpenPlans();
    if (page === 'inbox') return h27OpenInbox();
  };

  // ============ FORUM (with delete) ============
  function h27OpenForum() {
    showPage(shell('Public Forum', 'fa-comments', 'linear-gradient(135deg,#4F46E5,#06B6D4)',
      '<div class="card" style="border-radius:20px"><textarea class="form-textarea" id="h27ForumText" rows="2" placeholder="Post to the public forum..."></textarea>'
      + '<div class="media-upload" id="h27ForumUpload" onclick="h27Attach(\'forum_post\',\'h27ForumUpload\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media/video/file</span></div>'
      + '<button class="btn btn-primary btn-block" style="margin-top:8px" onclick="h27SubmitForumPost()"><i class="fas fa-paper-plane"></i> Post</button>'
      + '<div id="h27ForumList" style="margin-top:12px"></div></div>'));
    h27LoadForum();
  }

  window.h27SubmitForumPost = async function () {
    const t = document.getElementById('h27ForumText').value.trim();
    const f = window._h27Media.forum_post;
    if (!t && !f) return alert('Write something or add media.');
    let url = null;
    if (f) url = await upload(f, 'forum');
    const r = await sb().from('community_posts').insert([{group_type:'forum',group_id:FORUM_GID,user_id:me().id,text:t,media_url:url}]);
    if (r.error) return alert(r.error.message);
    window._h27Media.forum_post = null;
    document.getElementById('h27ForumText').value = '';
    document.getElementById('h27ForumUpload').innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Add media/video/file</span>';
    h27LoadForum();
  };

  async function h27LoadForum() {
    const box = document.getElementById('h27ForumList');
    if (!box) return;
    const posts = await sb().from('community_posts').select('*').eq('group_type','forum').eq('group_id',FORUM_GID).order('created_at',{ascending:false}).limit(50);
    if (posts.error) { box.innerHTML = '<div style="color:#EF4444">' + esc(posts.error.message) + '</div>'; return; }
    const ids = (posts.data || []).map(p => p.id);
    let comments = { data: [] };
    if (ids.length) comments = await sb().from('community_comments').select('*').in('post_id',ids).order('created_at');
    const us = await users();
    const byPost = {};
    (comments.data || []).forEach(c => { (byPost[c.post_id] = byPost[c.post_id] || []).push(c); });
    window._h27ForumUsers = us;
    box.innerHTML = (posts.data || []).map(p => {
      const u = us.find(x => x.id === p.user_id);
      const canDel = isAdmin() || isOwner(p);
      return '<div class="card" style="border-radius:16px;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center" data-h27-user="' + esc(p.user_id) + '">' + avatarHtml(u,38) + '<div style="flex:1"><b style="font-size:.9rem">' + esc((u&&u.name)||'Member') + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>' + (canDel ? '<button class="h27-post-delete" onclick="h27DeleteForumPost(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div><div style="white-space:pre-wrap;margin:8px 0">' + esc(p.text||'') + '</div>' + mediaHtml(p.media_url) + h27RenderForumComments(buildTree(byPost[p.id]||[]),0,p.id) + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center"><input class="form-input" id="h27fc-' + p.id + '" placeholder="Comment..." style="flex:1"><button class="btn btn-secondary btn-sm" onclick="h27Attach(\'fc_' + p.id + '\',\'h27fcu-' + p.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h27fcu-' + p.id + '" style="font-size:.65rem;color:var(--text-light)"></span><button class="btn btn-primary btn-sm" onclick="h27SubmitForumComment(\'' + p.id + '\',null)"><i class="fas fa-paper-plane"></i></button></div></div>';
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;text-align:center">No posts yet.</div>';
    injectChatButtons();
  }

  window.h27DeleteForumPost = async function (postId) {
    if (!confirm('Delete this post?')) return;
    await sb().from('community_posts').delete().eq('id',postId);
    h27LoadForum();
  };

  function buildTree(list) {
    const map = {}; const roots = [];
    list.forEach(c => { c._kids = []; map[c.id] = c; });
    list.forEach(c => { if (c.parent_comment_id && map[c.parent_comment_id]) map[c.parent_comment_id]._kids.push(c); else roots.push(c); });
    return roots;
  }

  function h27RenderForumComments(list, depth, postId) {
    const us = window._h27ForumUsers || [];
    return list.map(c => {
      const u = us.find(x => x.id === c.user_id);
      const canDel = isAdmin() || isOwner(c);
      return '<div style="margin-left:' + Math.min(depth,4)*16 + 'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px"><div style="display:flex;gap:6px;align-items:center" data-h27-user="' + esc(c.user_id) + '">' + avatarHtml(u,28) + '<b style="font-size:.78rem;flex:1">' + esc((u&&u.name)||'Member') + '</b>' + (canDel ? '<button class="h27-post-delete" onclick="h27DeleteForumComment(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div><div style="font-size:.88rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text||'') + '</div>' + mediaHtml(c.media_url) + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:4px" onclick="h27Toggle(\'h27fr-' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button><div id="h27fr-' + c.id + '" style="display:none;margin-top:6px"><div style="display:flex;gap:6px;align-items:center"><input class="form-input" id="h27frt-' + c.id + '" placeholder="Reply..." style="flex:1"><button class="btn btn-secondary btn-sm" onclick="h27Attach(\'fr_' + c.id + '\',\'h27fru-' + c.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h27fru-' + c.id + '" style="font-size:.65rem;color:var(--text-light)"></span><button class="btn btn-primary btn-sm" onclick="h27SubmitForumComment(\'' + postId + '\',\'' + c.id + '\')"><i class="fas fa-paper-plane"></i></button></div></div>' + h27RenderForumComments(c._kids||[],depth+1,postId) + '</div>';
    }).join('');
  }

  window.h27DeleteForumComment = async function (id) {
    if (!confirm('Delete this comment?')) return;
    await sb().from('community_comments').delete().eq('id',id);
    h27LoadForum();
  };

  window.h27SubmitForumComment = async function (postId, parentId) {
    const inputId = parentId ? 'h27frt-' + parentId : 'h27fc-' + postId;
    const key = parentId ? 'fr_' + parentId : 'fc_' + postId;
    const t = document.getElementById(inputId).value.trim();
    const f = window._h27Media[key];
    if (!t && !f) return;
    let url = null;
    if (f) url = await upload(f, 'forum-comments');
    const r = await sb().from('community_comments').insert([{post_id:postId,user_id:me().id,text:t,media_url:url,parent_comment_id:parentId||null}]);
    if (r.error) return alert(r.error.message);
    window._h27Media[key] = null;
    h27LoadForum();
  };

  window.h27Toggle = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };

  // ============ PRAYER (with delete) ============
  function h27OpenPrayer() {
    showPage(shell('Prayer Wall', 'fa-hands-praying', 'linear-gradient(135deg,#8B5CF6,#EC4899)',
      '<div class="card" style="border-radius:20px"><textarea class="form-textarea" id="h27PrayerText" rows="2" placeholder="Share a prayer request..."></textarea><div style="display:flex;gap:10px;align-items:center;margin:8px 0"><span style="font-size:.8rem;color:var(--text-light)">Anonymous</span><input type="checkbox" id="h27PrayerAnon"></div><button class="btn btn-primary btn-block" onclick="h27SubmitPrayer()"><i class="fas fa-paper-plane"></i> Pray</button><div id="h27PrayerList" style="margin-top:12px"></div></div>'));
    h27LoadPrayers();
  }

  window.h27SubmitPrayer = async function () {
    const t = document.getElementById('h27PrayerText').value.trim();
    if (!t) return alert('Write a prayer.');
    const r = await sb().from('community_prayers').insert([{user_id:me().id,text:t,anonymous:document.getElementById('h27PrayerAnon').checked}]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h27PrayerText').value = '';
    h27LoadPrayers();
  };

  window.h27DeletePrayer = async function (id) {
    if (!confirm('Delete this prayer?')) return;
    await sb().from('community_prayers').delete().eq('id',id);
    h27LoadPrayers();
  };

  window.h27DeletePrayerComment = async function (id) {
    if (!confirm('Delete this comment?')) return;
    await sb().from('community_prayer_comments').delete().eq('id',id);
    h27LoadPrayers();
  };

  async function h27LoadPrayers() {
    const box = document.getElementById('h27PrayerList');
    if (!box) return;
    const prayers = await sb().from('community_prayers').select('*').order('created_at',{ascending:false}).limit(40);
    if (prayers.error) { box.innerHTML = '<div style="color:#EF4444">' + esc(prayers.error.message) + '</div>'; return; }
    const ids = (prayers.data || []).map(p => p.id);
    let comments = { data: [] };
    if (ids.length) comments = await sb().from('community_prayer_comments').select('*').in('prayer_id',ids).order('created_at');
    const us = await users();
    window._h27PrayerUsers = us;
    const byPrayer = {};
    (comments.data || []).forEach(c => { (byPrayer[c.prayer_id] = byPrayer[c.prayer_id] || []).push(c); });
    box.innerHTML = (prayers.data || []).map(p => {
      const u = us.find(x => x.id === p.user_id);
      const name = p.anonymous ? '🕊️ Anonymous' : ((u&&u.name)||'Member');
      const canDel = isAdmin() || isOwner(p);
      return '<div class="card" style="border-radius:16px;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center">' + (p.anonymous ? '<div class="post-avatar">🙏</div>' : avatarHtml(u,38)) + '<div style="flex:1"><b style="font-size:.9rem">' + esc(name) + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>' + (canDel ? '<button class="h27-post-delete" onclick="h27DeletePrayer(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div><div style="white-space:pre-wrap;margin:8px 0">' + esc(p.text||'') + '</div>' + h27RenderPrayerComments(buildTree(byPrayer[p.id]||[]),0,p.id) + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center"><input class="form-input" id="h27pc-' + p.id + '" placeholder="Comment..." style="flex:1"><button class="btn btn-secondary btn-sm" onclick="h27Attach(\'pc_' + p.id + '\',\'h27pcu-' + p.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h27pcu-' + p.id + '" style="font-size:.65rem;color:var(--text-light)"></span><button class="btn btn-primary btn-sm" onclick="h27SubmitPrayerComment(\'' + p.id + '\',null)"><i class="fas fa-paper-plane"></i></button></div></div>';
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;text-align:center">No prayers yet.</div>';
  }

  function h27RenderPrayerComments(list, depth, prayerId) {
    const us = window._h27PrayerUsers || [];
    return list.map(c => {
      const u = us.find(x => x.id === c.user_id);
      const canDel = isAdmin() || isOwner(c);
      return '<div style="margin-left:' + Math.min(depth,4)*16 + 'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px"><div style="display:flex;gap:6px;align-items:center" data-h27-user="' + esc(c.user_id) + '">' + avatarHtml(u,28) + '<b style="font-size:.78rem;flex:1">' + esc((u&&u.name)||'Member') + '</b>' + (canDel ? '<button class="h27-post-delete" onclick="h27DeletePrayerComment(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div><div style="font-size:.88rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text||'') + '</div>' + mediaHtml(c.media_url) + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:4px" onclick="h27Toggle(\'h27pr-' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button><div id="h27pr-' + c.id + '" style="display:none;margin-top:6px"><div style="display:flex;gap:6px;align-items:center"><input class="form-input" id="h27prt-' + c.id + '" placeholder="Reply..." style="flex:1"><button class="btn btn-secondary btn-sm" onclick="h27Attach(\'pr_' + c.id + '\',\'h27pru-' + c.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h27pru-' + c.id + '" style="font-size:.65rem;color:var(--text-light)"></span><button class="btn btn-primary btn-sm" onclick="h27SubmitPrayerComment(\'' + prayerId + '\',\'' + c.id + '\')"><i class="fas fa-paper-plane"></i></button></div></div>' + h27RenderPrayerComments(c._kids||[],depth+1,prayerId) + '</div>';
    }).join('');
  }

  window.h27SubmitPrayerComment = async function (prayerId, parentId) {
    const inputId = parentId ? 'h27prt-' + parentId : 'h27pc-' + prayerId;
    const key = parentId ? 'pr_' + parentId : 'pc_' + prayerId;
    const t = document.getElementById(inputId).value.trim();
    const f = window._h27Media[key];
    if (!t && !f) return;
    let url = null;
    if (f) url = await upload(f, 'prayer-comments');
    const r = await sb().from('community_prayer_comments').insert([{prayer_id:prayerId,user_id:me().id,parent_comment_id:parentId||null,text:t,media_url:url}]);
    if (r.error) return alert(r.error.message);
    window._h27Media[key] = null;
    h27LoadPrayers();
  };

  // ============ PLANS (with delete) ============
  function h27OpenPlans() {
    showPage(shell('Plans', 'fa-calendar-check', 'linear-gradient(135deg,#F59E0B,#EF4444)',
      '<div class="card" style="border-radius:20px"><button class="btn btn-warm btn-block" onclick="h27PlanModal()"><i class="fas fa-plus"></i> Create Plan</button><div id="h27PlanList" style="margin-top:12px"></div></div>'));
    h27LoadPlans();
  }

  window.h27PlanModal = function () {
    document.body.insertAdjacentHTML('beforeend','<div class="modal-overlay show" id="h27PlanM" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-calendar-check"></i> Create Plan</div><div class="form-group"><label class="form-label">Type</label><select class="form-select" id="h27PlanType"><option>Personal (Private)</option><option>Personal (Public)</option><option>Community</option></select></div><div class="form-group"><label class="form-label">Title</label><input class="form-input" id="h27PlanTitle"></div><div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="h27PlanDesc" rows="2"></textarea></div><div class="form-group"><label class="form-label">Date</label><input class="form-input" id="h27PlanDate" type="datetime-local"></div><button class="btn btn-primary btn-block" onclick="h27SavePlan()">Create</button></div></div>');
  };

  window.h27SavePlan = async function () {
    const t = document.getElementById('h27PlanTitle').value.trim();
    if (!t) return alert('Title required.');
    const r = await sb().from('community_plans').insert([{user_id:me().id,type:document.getElementById('h27PlanType').value,title:t,description:document.getElementById('h27PlanDesc').value.trim(),plan_date:document.getElementById('h27PlanDate').value||null}]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h27PlanM').remove();
    h27LoadPlans();
  };

  window.h27DeletePlan = async function (id) {
    if (!confirm('Delete this plan?')) return;
    await sb().from('community_plans').delete().eq('id',id);
    h27LoadPlans();
  };

  window.h27ToggleJoin = async function (id) {
    const e = await sb().from('community_plan_members').select('*').eq('plan_id',id).eq('user_id',me().id);
    if ((e.data||[]).length) { await sb().from('community_plan_members').delete().eq('plan_id',id).eq('user_id',me().id); }
    else { const r = await sb().from('community_plan_members').insert([{plan_id:id,user_id:me().id}]); if (r.error) return alert(r.error.message); }
    h27LoadPlans();
  };

  async function h27LoadPlans() {
    const box = document.getElementById('h27PlanList');
    if (!box) return;
    const r = await sb().from('community_plans').select('*').order('created_at',{ascending:false}).limit(40);
    if (r.error) { box.innerHTML = esc(r.error.message); return; }
    const us = await users();
    const ids = (r.data||[]).map(p=>p.id);
    let pm = { data: [] };
    if (ids.length) pm = await sb().from('community_plan_members').select('*').in('plan_id',ids);
    const j = {};
    (pm.data||[]).forEach(m => { (j[m.plan_id]=j[m.plan_id]||[]).push(m.user_id); });
    box.innerHTML = (r.data||[]).map(p => {
      const u = us.find(x=>x.id===p.user_id);
      const mem = j[p.id]||[];
      const iAm = me() && mem.includes(me().id);
      const canDel = isAdmin() || isOwner(p);
      return '<div style="background:var(--bg);border-radius:14px;padding:10px;margin-bottom:8px"><div style="display:flex;justify-content:space-between"><b style="font-size:.9rem">' + esc(p.title) + '</b><span style="font-size:.65rem;background:var(--gradient-warm);color:#fff;padding:2px 8px;border-radius:20px">' + esc(p.type) + '</span></div>' + (p.description ? '<div style="font-size:.8rem;color:var(--text-light)">' + esc(p.description) + '</div>' : '') + '<div style="font-size:.7rem;color:var(--text-lighter);margin-top:4px">' + (u&&u.name ? esc(u.name)+' • ' : '') + mem.length + ' joined</div><div style="display:flex;gap:8px;margin-top:6px"><button class="btn ' + (iAm?'btn-danger':'btn-primary') + ' btn-sm" onclick="h27ToggleJoin(\'' + p.id + '\')">' + (iAm?'Leave':'Join') + '</button>' + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h27DeletePlan(\'' + p.id + '\')"><i class="fas fa-trash"></i> Delete</button>' : '') + '</div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No plans yet.</div>';
  }

  // ============ INBOX ============
  function h27OpenInbox() {
    showPage(shell('My Inbox', 'fa-inbox', 'linear-gradient(135deg,#4F46E5,#7C3AED)', '<div id="h27Inbox"></div>'));
    h27LoadInbox();
  }

  async function h27LoadInbox() {
    const box = document.getElementById('h27Inbox');
    if (!box) return;
    const r = await sb().from('community_chat').select('*').or('sender_id.eq.'+me().id+',receiver_id.eq.'+me().id).order('created_at',{ascending:false}).limit(500);
    if (r.error) { box.innerHTML = esc(r.error.message); return; }
    const us = await users();
    const map = {};
    (r.data||[]).forEach(function(m){ const o=m.sender_id===me().id?m.receiver_id:m.sender_id; if(!map[o])map[o]={uid:o,last:m}; });
    box.innerHTML = Object.values(map).map(c => {
      const u = us.find(x=>x.id===c.uid);
      return '<div class="card" style="border-radius:16px;margin-bottom:8px;display:flex;gap:10px;align-items:center;cursor:pointer" onclick="h27ChatWith(\'' + c.uid + '\')">' + avatarHtml(u,44) + '<div style="flex:1;min-width:0"><b style="font-size:.9rem">' + esc((u&&u.name)||'Member') + '</b><div style="font-size:.78rem;color:var(--text-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(c.last.text||'📎 Media') + '</div></div><div style="font-size:.65rem;color:var(--text-lighter)">' + ftime(c.last.created_at) + '</div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No messages yet.</div>';
  }

  // ============ CHAT PANEL ============
  window.h27ChatWith = async function (uid) {
    if (!me()) return alert('Log in first.');
    if (!uid || uid === me().id) return;
    window._h27Media.chatUid = uid;
    window._h27Media.chatOpen = true;
    window._h27Media.chatFile = null;
    const us = await users();
    window._h27Media.chatUser = us.find(u=>u.id===uid) || {name:'Chat'};
    if (!document.getElementById('h27Chat')) {
      const d = document.createElement('div');
      d.id = 'h27Chat';
      d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;flex-direction:column';
      d.innerHTML = '<div style="display:flex;gap:10px;align-items:center;padding:12px 14px;background:var(--gradient);color:#fff"><button onclick="h27ChatClose()" style="border:none;background:none;color:#fff;font-size:1.1rem"><i class="fas fa-arrow-left"></i></button><span id="h27ChatAv"></span><div style="flex:1"><div id="h27ChatName" style="font-weight:800"></div><div style="font-size:.7rem;opacity:.85">Chat</div></div></div><div id="h27ChatMsgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px"></div><div style="display:flex;gap:6px;align-items:center;padding:10px;border-top:1px solid var(--border);background:#fff"><button class="btn btn-secondary btn-sm" onclick="h27ChatAttach()"><i class="fas fa-paperclip"></i></button><span id="h27ChatFile" style="font-size:.7rem;color:var(--text-light);max-width:70px;overflow:hidden"></span><input class="form-input" id="h27ChatInput" placeholder="Message..." style="flex:1" onkeypress="if(event.key===\'Enter\')h27ChatSend()"><button class="btn btn-primary btn-sm" onclick="h27ChatSend()"><i class="fas fa-paper-plane"></i></button></div>';
      document.body.appendChild(d);
    }
    document.getElementById('h27ChatName').textContent = (window._h27Media.chatUser&&window._h27Media.chatUser.name)||'Chat';
    document.getElementById('h27ChatAv').innerHTML = avatarHtml(window._h27Media.chatUser, 36);
    h27ChatLoad();
  };

  window.h27ChatClose = function () {
    window._h27Media.chatOpen = false;
    const e = document.getElementById('h27Chat');
    if (e) e.remove();
  };

  window.h27ChatAttach = function () {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = '*/*';
    i.onchange = function () {
      const f = i.files && i.files[0];
      if (!f) return;
      window._h27Media.chatFile = f;
      document.getElementById('h27ChatFile').textContent = f.name;
    };
    i.click();
  };

  window.h27ChatSend = async function () {
    const inp = document.getElementById('h27ChatInput');
    const t = inp.value.trim();
    if (!t && !window._h27Media.chatFile) return;
    let url = null;
    if (window._h27Media.chatFile) url = await upload(window._h27Media.chatFile, 'chat');
    const r = await sb().from('community_chat').insert([{sender_id:me().id,receiver_id:window._h27Media.chatUid,text:t,media_url:url}]);
    if (r.error) return alert(r.error.message);
    inp.value = '';
    window._h27Media.chatFile = null;
    document.getElementById('h27ChatFile').textContent = '';
    h27ChatLoad();
  };

  window.h27ChatDel = async function (id) {
    if (!confirm('Delete this message?')) return;
    await sb().from('community_chat').delete().eq('id',id).eq('sender_id',me().id);
    h27ChatLoad();
  };

  async function h27ChatLoad() {
    const box = document.getElementById('h27ChatMsgs');
    if (!box || !window._h27Media.chatOpen) return;
    const a = me().id, b = window._h27Media.chatUid;
    const r = await sb().from('community_chat').select('*').or('and(sender_id.eq.'+a+',receiver_id.eq.'+b+'),and(sender_id.eq.'+b+',receiver_id.eq.'+a+')').order('created_at',{ascending:true}).limit(300);
    if (r.error) { box.innerHTML = esc(r.error.message); return; }
    box.innerHTML = (r.data||[]).map(m => {
      const mine = m.sender_id === a;
      return '<div style="align-self:' + (mine?'flex-end':'flex-start') + ';max-width:78%;border-radius:16px;padding:8px 12px;' + (mine?'background:var(--gradient);color:#fff':'background:#fff;border:1px solid var(--border)') + '">' + (m.text?'<div style="white-space:pre-wrap;font-size:.9rem">' + esc(m.text) + '</div>':'') + mediaHtml(m.media_url) + '<div style="display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:4px"><span style="font-size:.6rem;opacity:.7">' + ftime(m.created_at) + '</span>' + (mine?'<button onclick="h27ChatDel(\'' + m.id + '\')" style="border:none;background:none;color:#fff;font-size:.7rem"><i class="fas fa-trash"></i></button>':'') + '</div></div>';
    }).join('') || '<div style="text-align:center;color:var(--text-light);font-size:.85rem;margin:auto">No messages yet. Say hi! 👋</div>';
    box.scrollTop = box.scrollHeight;
  }

  setInterval(function () { if (window._h27Media.chatOpen) h27ChatLoad(); }, 3000);

  // ============ MY LIST CARD ============
  function tile(icon, grad, name, role, onclick) {
    return '<div onclick="' + onclick + '" style="min-width:150px;border-radius:16px;padding:14px;background:' + grad + ';color:#fff;cursor:pointer;flex-shrink:0"><i class="fas ' + icon + '"></i><div style="font-weight:800;margin-top:6px">' + esc(name||'') + '</div><span style="font-size:.65rem;background:rgba(255,255,255,.25);padding:2px 8px;border-radius:20px">' + esc(role||'Member') + '</span></div>';
  }

  async function myListCard() {
    const hm = document.getElementById('home-main') || document.querySelector('#section-home');
    if (!hm || document.getElementById('h27MyList') || !me()) return;
    const old = document.querySelector('.my-depts-section');
    if (old) old.style.display = 'none';
    const card = document.createElement('div');
    card.id = 'h27MyList'; card.className = 'card'; card.style.cssText = 'border-radius:20px;margin-bottom:16px';
    card.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><i class="fas fa-list-ul" style="color:var(--primary)"></i><b style="font-size:1.05rem">My List</b><button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="h27MyListModal()">View All</button></div><div id="h27Tiles" style="display:flex;gap:10px;overflow-x:auto"></div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn btn-secondary btn-sm" onclick="ggOpenHome && ggOpenHome()">Browse Groups</button><button class="btn btn-secondary btn-sm" onclick="c26OpenHome(\'department\')">Browse Departments</button><button class="btn btn-secondary btn-sm" onclick="c26OpenHome(\'ushirika\')">Browse Ushirika</button></div>';
    const emo = hm.querySelector('.emotional-card');
    if (emo) hm.insertBefore(card, emo);
    else hm.appendChild(card);
    const res = await Promise.all([
      sb().from('church_group_members').select('role,church_groups(id,name)').eq('user_id',me().id),
      sb().from('ushirika_members').select('role,ushirikas(id,name)').eq('user_id',me().id),
      sb().from('department_members').select('role,departments(id,name)').eq('user_id',me().id)
    ]);
    let html = '';
    (res[0].data||[]).forEach(m => { const g=m.church_groups||{}; html += tile('fa-users','linear-gradient(135deg,#F59E0B,#EF4444)',g.name,m.role,"ggOpenGroup && ggOpenGroup('"+g.id+"')"); });
    (res[1].data||[]).forEach(m => { const u=m.ushirikas||{}; html += tile('fa-people-group','linear-gradient(135deg,#10B981,#06B6D4)',u.name,m.role,"c26OpenGroup('ushirika','"+u.id+"')"); });
    (res[2].data||[]).forEach(m => { const d=m.departments||{}; html += tile('fa-building','linear-gradient(135deg,#8B5CF6,#EC4899)',d.name,m.role,"c26OpenGroup('department','"+d.id+"')"); });
    document.getElementById('h27Tiles').innerHTML = html || '<div style="color:var(--text-light);font-size:.85rem">Not a member yet — use Browse to join.</div>';
  }

  window.h27MyListModal = async function () {
    if (!me()) return alert('Log in first.');
    const d = await sb().from('department_members').select('role,departments(id,name)').eq('user_id',me().id);
    const u = await sb().from('ushirika_members').select('role,ushirikas(id,name)').eq('user_id',me().id);
    const g = await sb().from('church_group_members').select('role,church_groups(id,name)').eq('user_id',me().id);
    function row(icon, grad, name, role, oc) {
      return '<div onclick="' + oc + '" style="display:flex;gap:10px;align-items:center;padding:10px;border-radius:14px;background:var(--bg);margin-bottom:8px;cursor:pointer"><div style="width:40px;height:40px;border-radius:12px;background:' + grad + ';color:#fff;display:flex;align-items:center;justify-content:center"><i class="fas ' + icon + '"></i></div><div style="flex:1"><div style="font-weight:700">' + esc(name) + '</div><div style="font-size:.7rem;color:var(--text-light)">' + esc(role) + '</div></div><i class="fas fa-chevron-right" style="color:var(--text-lighter)"></i></div>';
    }
    let html = '<div class="modal-overlay show" id="h27MyListM" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-list-ul"></i> My List</div><div style="font-weight:800;margin:8px 0 6px;color:var(--secondary)">My Groups</div>' + ((g.data||[]).map(m => row('fa-users','var(--gradient-warm)',(m.church_groups||{}).name,m.role,"this.closest('.modal-overlay').remove();ggOpenGroup && ggOpenGroup('"+(m.church_groups||{}).id+"')")).join('') || '<div style="color:var(--text-light);font-size:.85rem;margin-bottom:8px">None</div>') + '<div style="font-weight:800;margin:8px 0 6px;color:var(--accent)">My Ushirikas</div>' + ((u.data||[]).map(m => row('fa-people-group','var(--gradient-chat)',(m.ushirikas||{}).name,m.role,"this.closest('.modal-overlay').remove();c26OpenGroup('ushirika','"+(m.ushirikas||{}).id+"')")).join('') || '<div style="color:var(--text-light);font-size:.85rem;margin-bottom:8px">None</div>') + '<div style="font-weight:800;margin:8px 0 6px;color:var(--primary)">My Departments</div>' + ((d.data||[]).map(m => row('fa-building','var(--gradient-dept)',(m.departments||{}).name,m.role,"this.closest('.modal-overlay').remove();c26OpenGroup('department','"+(m.departments||{}).id+"')")).join('') || '<div style="color:var(--text-light);font-size:.85rem;margin-bottom:8px">None</div>') + '<button class="btn btn-secondary-alt btn-block" onclick="this.closest(\'.modal-overlay\').remove()">Close</button></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ============ HOME TILES ============
  function homeTiles() {
    const hm = document.getElementById('home-main');
    if (!hm || document.getElementById('h27-tiles')) return;
    const t = document.createElement('div');
    t.id = 'h27-tiles';
    t.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px';
    t.innerHTML = '<div onclick="h27OpenPage(\'prayer\')" style="border-radius:18px;padding:16px 10px;text-align:center;color:#fff;background:linear-gradient(135deg,#8B5CF6,#EC4899);cursor:pointer"><i class="fas fa-hands-praying" style="font-size:1.3rem"></i><div style="font-weight:800;font-size:.75rem;margin-top:6px">Prayer Wall</div></div><div onclick="h27OpenPage(\'forum\')" style="border-radius:18px;padding:16px 10px;text-align:center;color:#fff;background:linear-gradient(135deg,#4F46E5,#06B6D4);cursor:pointer"><i class="fas fa-comments" style="font-size:1.3rem"></i><div style="font-weight:800;font-size:.75rem;margin-top:6px">Public Forum</div></div><div onclick="h27OpenPage(\'plans\')" style="border-radius:18px;padding:16px 10px;text-align:center;color:#fff;background:linear-gradient(135deg,#F59E0B,#EF4444);cursor:pointer"><i class="fas fa-calendar-check" style="font-size:1.3rem"></i><div style="font-weight:800;font-size:.75rem;margin-top:6px">Plans</div></div>';
    hm.appendChild(t);
    const grid = document.querySelector('#quickActionModal .grid-2');
    if (grid && !grid.dataset.h27q) {
      grid.dataset.h27q = '1';
      const prayer = Array.from(grid.children).find(c => /prayer/i.test(c.textContent||''));
      if (prayer) { prayer.setAttribute('onclick','closeModalDirect();h27OpenPage(\'inbox\')'); prayer.innerHTML = '<i class="fas fa-inbox"></i><div class="mc-title">Inbox</div>'; }
      grid.insertAdjacentHTML('beforeend','<div class="mini-card mc-purple" onclick="closeModalDirect();h27OpenPage(\'forum\')"><i class="fas fa-comments"></i><div class="mc-title">Forum</div></div><div class="mini-card mc-gold" onclick="closeModalDirect();h27OpenPage(\'plans\')"><i class="fas fa-calendar-check"></i><div class="mc-title">Plans</div></div><div class="mini-card mc-green" onclick="closeModalDirect();h27OpenPage(\'prayer\')"><i class="fas fa-hands-praying"></i><div class="mc-title">Prayer Wall</div></div>');
    }
  }

  // ============ FEATURED REPAIR ============
  window.loadFeatured = function () {
    return sb().from('featured_people').select('*').order('sort',{ascending:true}).then(r => { window._featured=r.data||[]; return window._featured; }).catch(() => sb().from('featured_people').select('*').then(r => { window._featured=r.data||[]; return window._featured; }).catch(() => { window._featured=[]; return []; }));
  };

  window.feAdd21 = function (uid) {
    if (!uid) return alert('No member id received.');
    sb().from('profiles').select('id,name,role,profile_pic').eq('id',uid).single().then(pr => {
      if (pr.error) return alert('Could not load member: '+pr.error.message);
      const u = pr.data;
      const base = { user_id:uid, name:u.name||'Member', role:u.role||'member', image_url:u.profile_pic||null };
      function done() { window.loadFeatured().then(() => { if (typeof feRender21==='function') feRender21(); if (typeof feShowPicker21==='function') feShowPicker21(true); if (typeof renderFeaturedLanding==='function') renderFeaturedLanding(); alert('✅ '+base.name+' added to front page.'); }); }
      function fail(m) { alert('⚠️ Could not add featured member:\n'+m+'\n\nRun the featured_people SQL in Supabase.'); }
      sb().from('featured_people').insert([Object.assign({},base,{sort:(window._featured||[]).length})]).then(r1 => { if(!r1.error)return done(); sb().from('featured_people').insert([base]).then(r2 => { if(!r2.error)return done(); sb().from('featured_people').insert([{user_id:uid,name:base.name}]).then(r3 => { if(!r3.error)return done(); fail(r3.error.message); }); }); });
    });
  };

  // ============ VERSE SHARE ============
  function verseText() {
    let ref = '';
    const r = document.querySelector('[style*="92400E"]');
    if (r) ref = (r.textContent||'').trim();
    const sel = window._selectedVerses || [];
    let body = sel.length ? sel.map(v => typeof v==='string' ? v : ((v.verse?v.verse+' ':'')+(v.text||''))).join('\n') : (window._bibleVerses||[]).map(v => (v.verse?v.verse+' ':'')+(v.text||'')).join('\n');
    return { ref:ref, body:body };
  }

  window.openShareVerses = function () {
    const v = verseText();
    if (!v.body) return alert('Select verse(s) first by tapping them.');
    document.body.insertAdjacentHTML('beforeend','<div class="modal-overlay show" id="h27Share" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-share"></i> Share Verse</div><div style="background:var(--bg);border-radius:12px;padding:10px;margin-bottom:10px;white-space:pre-wrap;font-size:.85rem">' + esc(v.ref+'\n'+v.body).slice(0,400) + '</div><button class="btn btn-primary btn-block" onclick="h27ShareForum()"><i class="fas fa-comments"></i> Share to Public Forum</button><button class="btn btn-secondary btn-block" style="margin-top:8px" onclick="h27SharePick()"><i class="fas fa-user"></i> Share Privately (inbox)</button><button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button></div></div>');
  };

  window.h27ShareForum = async function () {
    const v = verseText();
    const r = await sb().from('community_posts').insert([{group_type:'forum',group_id:FORUM_GID,user_id:me().id,text:'📖 '+(v.ref?v.ref+'\n':'')+v.body,media_url:null}]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h27Share').remove();
    alert('✅ Shared to Public Forum.');
    h27OpenForum();
  };

  window.h27SharePick = async function () {
    const us = await users();
    document.getElementById('h27Share').remove();
    document.body.insertAdjacentHTML('beforeend','<div class="modal-overlay show" id="h27Priv" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-user"></i> Send to member</div><div style="max-height:320px;overflow-y:auto">' + us.filter(u => !me()||u.id!==me().id).map(u => '<div onclick="h27ShareSend(\'' + u.id + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">' + avatarHtml(u,32) + '<div style="flex:1"><b style="font-size:.85rem">' + esc(u.name) + '</b></div><i class="fas fa-paper-plane" style="color:var(--primary)"></i></div>').join('') + '</div></div></div>');
  };

  window.h27ShareSend = async function (uid) {
    const v = verseText();
    const r = await sb().from('community_chat').insert([{sender_id:me().id,receiver_id:uid,text:'📖 '+(v.ref?v.ref+'\n':'')+v.body,media_url:null}]);
    if (r.error) return alert(r.error.message);
    sb().from('notifications').insert([{user_id:uid,title:'📖 Verse shared with you',message:v.ref||'A bible verse',body:v.ref||''}]).then(function(){});
    document.getElementById('h27Priv').remove();
    alert('✅ Sent to member inbox.');
  };

  // ============ MINISTRIES SYNC ============
  async function ministriesSync() {
    if (!me() || !sb()) return;
    const g = await sb().from('church_groups').select('id,name,description,additional_info');
    const m = await sb().from('ministries').select('id,name');
    if (g.error || m.error) return;
    const have = (m.data||[]).map(x => String(x.name||'').toLowerCase());
    for (const x of (g.data||[]).filter(y => !have.includes(String(y.name||'').toLowerCase()))) {
      const story = (x.description||'') + (x.additional_info ? '\n'+x.additional_info : '');
      await sb().from('ministries').insert([{name:x.name,story:story}]);
    }
  }

  document.addEventListener('click', function (e) {
    const landing = document.querySelector('.public-landing');
    if (!landing || landing.classList.contains('hidden')) return;
    const sec = Array.from(landing.querySelectorAll('section')).find(s => /ministries/i.test(s.textContent||''));
    if (!sec || !sec.contains(e.target)) return;
    if (!me()) { e.preventDefault(); e.stopPropagation(); alert('Please log in first, or register if you do not have an account.'); return; }
    const card = e.target.closest('div,a,button');
    if (!card) return;
    const name = (card.textContent||'').split('\n')[0].trim();
    sb().from('church_groups').select('id').ilike('name',name).limit(1).then(r => { if (r.data && r.data[0] && window.ggOpenGroup) window.ggOpenGroup(r.data[0].id); });
  }, true);

  // ============ CATEGORY DELETE ============
  function catDelete() {
    const box = document.getElementById('gg-tab-categories');
    if (!box) return;
    Array.from(box.querySelectorAll('[onclick*="ggOpenCategory"]')).forEach(btn => {
      const card = btn.closest('.card');
      if (!card || card.querySelector('[data-h27del]')) return;
      const m = (btn.getAttribute('onclick')||'').match(/ggOpenCategory\('([^']+)'\)/);
      if (!m) return;
      const b = document.createElement('button');
      b.className = 'btn btn-danger btn-sm';
      b.setAttribute('data-h27del','1');
      b.style.marginLeft = '8px';
      b.innerHTML = '<i class="fas fa-trash"></i> Delete';
      b.onclick = function (ev) { ev.stopPropagation(); delCategory(m[1]); };
      btn.parentNode.insertBefore(b, btn.nextSibling);
    });
  }

  async function delCategory(id) {
    if (!confirm('Delete this category?')) return;
    const gid = window._h29GroupId || (window._c26 && window._c26.currentId);
    let ok = isAdmin();
    if (!ok && gid) {
      const r = await sb().from('church_group_members').select('role').eq('group_id',gid).eq('user_id',me().id).limit(1);
      ok = ['leader','chairman'].includes(String(((r.data||[])[0]||{}).role||'').toLowerCase());
    }
    if (!ok) return alert('Only Admin or Group Leader/Chairman can delete categories.');
    await sb().from('church_group_categories').delete().eq('id',id);
    alert('Category deleted.');
    if (window.ggSwitchGroupTab) window.ggSwitchGroupTab('categories');
  }

  // ============ MULTIPLAYER HIDE + TRIVIA NEXT ============
  function hideMultiplayer() {
    document.querySelectorAll('button, .btn, [onclick]').forEach(el => {
      const oc = (el.getAttribute && el.getAttribute('onclick')) || '';
      const tx = (el.textContent||'').trim();
      if (/multiplayerModal/i.test(oc) || /^multiplayer$/i.test(tx)) el.style.display = 'none';
    });
  }

  function nextResolver() {
    const c = ['nextTrivia','nextTriviaQuestion','triviaNext','newTrivia','loadTrivia','loadTriviaQuestion','nextQuestion','showNextQuestion','nextQ'];
    for (const n of c) if (typeof window[n]==='function') return function(){ window[n](); };
    const b = Array.from(document.querySelectorAll('button')).find(x => {
      const card = x.closest('.card') || x.parentElement;
      return /next/i.test(x.textContent||'') && /trivia|question/i.test((card&&card.textContent)||'');
    });
    if (b) return function(){ b.click(); };
    return null;
  }

  function triviaNext() {
    document.querySelectorAll('.sub-page.active, .modal-overlay.show').forEach(scope => {
      if (!/trivia/i.test(scope.textContent||'')) return;
      Array.from(scope.querySelectorAll('*')).filter(el => el.children.length===0 && /trivia/i.test(el.textContent||'')).forEach(hd => {
        const cont = hd.closest('.card') || hd.closest('.sub-page') || hd.parentElement;
        if (!cont || cont.querySelector('[data-h27next]')) return;
        if (Array.from(cont.querySelectorAll('button')).some(b => /next/i.test(b.textContent||''))) return;
        const b = document.createElement('button');
        b.className = 'btn btn-primary btn-block';
        b.style.marginTop = '10px';
        b.setAttribute('data-h27next','1');
        b.innerHTML = '<i class="fas fa-forward"></i> Next Question';
        b.onclick = function(){ const r=nextResolver(); if(r)r(); else alert('Next question not available here.'); };
        cont.appendChild(b);
      });
    });
  }

  // ============ PICS FRESHNESS ============
  if (window.saveProfileEdit && !window.saveProfileEdit._h27) {
    const _sp = window.saveProfileEdit;
    window.saveProfileEdit = function(){ const r=_sp.apply(this,arguments); setTimeout(function(){ users(true); },800); return r; };
    window.saveProfileEdit._h27 = true;
  }
  setInterval(function(){ users(true); }, 45000);

  async function pics() {
    const us = window.usersData && window.usersData.length ? window.usersData : await users();
    if (!us || !us.length) return;
    document.querySelectorAll('div.post-avatar').forEach(el => {
      if (el.querySelector('img')) return;
      const scope = el.parentElement || el;
      const leaves = Array.from(scope.querySelectorAll('div,b,strong,span')).filter(d => d.children.length===0);
      for (let i=0; i<leaves.length; i++) {
        const nm = (leaves[i].textContent||'').trim();
        if (nm.length<2 || nm.length>40) continue;
        const u = us.find(x => x.name && x.profile_pic && x.name.trim().toLowerCase()===nm.toLowerCase());
        if (u) { el.innerHTML = '<img src="' + u.profile_pic + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block">'; return; }
      }
    });
  }

  // ============ SYNC ============
  function sync() {
    h27Css();
    homeTiles();
    myListCard();
    hideMultiplayer();
    triviaNext();
    catDelete();
    pics();
    injectChatButtons();
  }
  sync();
  setInterval(sync, 1500);
  setInterval(ministriesSync, 20000);
  ministriesSync();
})();
