// public/app32.js — CONSOLIDATED: verse share, forum/plans/prayer delete,
// Inbox, My List, ministries sync, featured repair, trivia Next, multiplayer hide.
(function () {
  console.log('✝️ app32.js loaded');
  window._app32 = true;

  const FORUM_GID = '11111111-1111-1111-1111-111111111111';
  window._h32Media = window._h32Media || {};

  function sb() { return window.sb; }
  function me() { return window.user; }
  function isAdmin() { return window.isAdmin ? window.isAdmin() : false; }
  function esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function ini(n) { return window.ini ? window.ini(n) : (n ? String(n).split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase() : '?'; }
  function fdate(t) { return t ? new Date(t).toLocaleDateString() : ''; }
  function ftime(t) { return t ? new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''; }
  function homeEl() { return document.querySelector('#section-home') || document.querySelector('#home-main'); }

  async function users(force) {
    if (force) window.usersData = null;
    if (window.usersData && window.usersData.length) return window.usersData;
    let r = await sb().from('profiles').select('id,name,profile_pic,email,role').order('name');
    if (r.error) r = await sb().from('profiles').select('id,name,profile_pic,role').order('name');
    window.usersData = r.data || [];
    return window.usersData;
  }
  function avatarHtml(u, s) {
    s = s || 40;
    if (u && u.profile_pic) return '<img src="' + u.profile_pic + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block">';
    return '<div class="post-avatar" style="width:' + s + 'px;height:' + s + 'px">' + ini(u && u.name) + '</div>';
  }
  function mediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return '<img src="'+url+'" style="width:100%;max-height:260px;object-fit:cover;border-radius:14px;margin-top:6px;display:block">';
    if (/\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi|3gp)$/i.test(url)) return '<video src="'+url+'" controls playsinline style="width:100%;max-height:300px;border-radius:14px;margin-top:6px;display:block"></video>';
    if (/\.(mp3|wav|m4a|aac)$/i.test(url)) return '<audio src="'+url+'" controls style="width:100%;margin-top:6px;display:block"></audio>';
    return '<a href="'+url+'" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:6px"><i class="fas fa-paperclip"></i> File</a>';
  }
  async function upload(file, path) {
    if (!file) return null;
    if (window.uploadMediaFile) { try { return await window.uploadMediaFile(file); } catch (e) {} }
    const n = (path||'media') + '/' + Date.now() + '_' + file.name;
    const r = await sb().storage.from('media').upload(n, file);
    if (r.error) { alert('Upload failed: ' + r.error.message); return null; }
    return sb().storage.from('media').getPublicUrl(n).data.publicUrl;
  }
  window.h32Attach = function (key, labelId) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '*/*';
    i.onchange = function () {
      const f = i.files && i.files[0]; if (!f) return;
      window._h32Media[key] = f;
      const l = document.getElementById(labelId);
      if (l) l.innerHTML = '<i class="fas fa-check-circle"></i> ' + esc(f.name);
    };
    i.click();
  };

  (function () {
    const s = document.createElement('style');
    s.textContent = '.post-avatar img{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}#pf_preview img{display:block;margin:0 auto;border-radius:50%}';
    document.head.appendChild(s);
  })();

  function showRoot(html) {
    let sec = document.getElementById('section-h32');
    if (!sec) {
      sec = document.createElement('div'); sec.id = 'section-h32'; sec.className = 'section';
      sec.innerHTML = '<div id="h32-root" class="sub-page active"></div>';
      (document.querySelector('main') || document.body).appendChild(sec);
    }
    document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
    sec.classList.add('active');
    document.getElementById('h32-root').innerHTML = html;
    window.scrollTo({ top: 0 });
  }
  function shell(title, icon, grad, body) {
    return '<button class="back-btn" onclick="h32Back()"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div style="border-radius:20px;padding:16px;color:#fff;background:' + grad + ';font-weight:800;font-size:1.15rem;margin-bottom:14px"><i class="fas ' + icon + '"></i> ' + title + '</div>' + body;
  }
  window.h32Back = function () {
    if (window.c26OrigSwitch) window.c26OrigSwitch('home');
    else if (window.switchSection) window.switchSection('home');
  };

  // rewire tiles once
  if (window.h27OpenPage && !window.h27OpenPage._h32) {
    const _op = window.h27OpenPage;
    window.h27OpenPage = function (p) {
      if (p === 'forum') return window.h32OpenForum();
      if (p === 'plans') return window.h32OpenPlans();
      if (p === 'prayer') return window.h32OpenPrayer();
      return _op(p);
    };
    window.h27OpenPage._h32 = true;
  }

  // ============ FORUM (delete posts/comments/replies) ============
  window.h32OpenForum = function () {
    showRoot(shell('Public Forum', 'fa-comments', 'linear-gradient(135deg,#4F46E5,#06B6D4)',
      '<div class="card" style="border-radius:20px"><textarea class="form-textarea" id="h32FText" rows="2" placeholder="Post to the public forum..."></textarea>'
      + '<div class="media-upload" id="h32FUpload" onclick="h32Attach(\'fp\',\'h32FUpload\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media/video/file</span></div>'
      + '<button class="btn btn-primary btn-block" style="margin-top:8px" onclick="h32Post()"><i class="fas fa-paper-plane"></i> Post</button>'
      + '<div id="h32FList" style="margin-top:12px"></div></div>'));
    h32LoadForum();
  };
  window.h32Post = async function () {
    const t = document.getElementById('h32FText').value.trim();
    const f = window._h32Media.fp;
    if (!t && !f) return alert('Write something or add media.');
    let url = null; if (f) url = await upload(f, 'forum');
    const r = await sb().from('community_posts').insert([{ group_type: 'forum', group_id: FORUM_GID, user_id: me().id, text: t, media_url: url }]);
    if (r.error) return alert(r.error.message);
    window._h32Media.fp = null; document.getElementById('h32FText').value = '';
    h32LoadForum();
  };
  window.h32DelPost = async function (id) { if (!confirm('Delete this post?')) return; await sb().from('community_posts').delete().eq('id', id); h32LoadForum(); };
  window.h32DelComment = async function (id) { if (!confirm('Delete this comment/reply?')) return; await sb().from('community_comments').delete().eq('id', id); h32LoadForum(); };
  window.h32Toggle = function (id) { const e = document.getElementById(id); if (e) e.style.display = e.style.display === 'none' ? 'block' : 'none'; };

  async function h32LoadForum() {
    const box = document.getElementById('h32FList'); if (!box) return;
    const p = await sb().from('community_posts').select('*').eq('group_type','forum').eq('group_id',FORUM_GID).order('created_at',{ascending:false}).limit(50);
    if (p.error) { box.innerHTML = esc(p.error.message); return; }
    const ids = (p.data||[]).map(x=>x.id);
    let c = { data: [] };
    if (ids.length) c = await sb().from('community_comments').select('*').in('post_id', ids).order('created_at');
    const us = await users(); window._h32U = us;
    const by = {}; (c.data||[]).forEach(x=>{ (by[x.post_id]=by[x.post_id]||[]).push(x); });
    box.innerHTML = (p.data||[]).map(function (post) {
      const u = us.find(x=>x.id===post.user_id);
      const canDel = isAdmin() || (me() && post.user_id===me().id);
      return '<div class="card" style="border-radius:16px;margin-bottom:10px">'
        + '<div style="display:flex;gap:8px;align-items:center">' + avatarHtml(u,38)
        + '<div style="flex:1"><b style="font-size:.9rem">' + esc((u&&u.name)||'Member') + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(post.created_at) + '</div></div>'
        + (u && (!me() || u.id!==me().id) ? '<button class="btn btn-secondary btn-sm" onclick="h27ChatWith && h27ChatWith(\''+u.id+'\')"><i class="fas fa-comment-dots"></i></button>' : '')
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h32DelPost(\''+post.id+'\')"><i class="fas fa-trash"></i></button>' : '') + '</div>'
        + '<div style="white-space:pre-wrap;margin:8px 0">' + esc(post.text||'') + '</div>' + mediaHtml(post.media_url)
        + h32Comments(buildTree(by[post.id]||[]), 0, post.id)
        + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center"><input class="form-input" id="h32c-'+post.id+'" placeholder="Comment..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h32Attach(\'c_'+post.id+'\',\'h32cu-'+post.id+'\')"><i class="fas fa-paperclip"></i></button><span id="h32cu-'+post.id+'" style="font-size:.65rem"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h32Comment(\''+post.id+'\',null)"><i class="fas fa-paper-plane"></i></button></div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No posts yet.</div>';
  }
  function buildTree(list) { const m={},r=[]; list.forEach(x=>{x._k=[];m[x.id=x.id||x.id;x.id];m[x.id]=x;}); list.forEach(x=>{ if(x.parent_comment_id&&m[x.parent_comment_id])m[x.parent_comment_id]._k.push(x); else r.push(x); }); return r; }
  function h32Comments(list, depth, postId) {
    const us = window._h32U||[];
    return list.map(function (c) {
      const u = us.find(x=>x.id===c.user_id);
      const canDel = isAdmin() || (me() && c.user_id===me().id);
      return '<div style="margin-left:'+Math.min(depth,4)*16+'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px">'
        + '<div style="display:flex;gap:6px;align-items:center">' + avatarHtml(u,26) + '<b style="font-size:.78rem;flex:1">' + esc((u&&u.name)||'Member') + '</b>'
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h32DelComment(\''+c.id+'\')"><i class="fas fa-trash"></i></button>' : '') + '</div>'
        + '<div style="font-size:.88rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text||'') + '</div>' + mediaHtml(c.media_url)
        + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:4px" onclick="h32Toggle(\'h32r-'+c.id+'\')"><i class="fas fa-reply"></i> Reply</button>'
        + '<div id="h32r-'+c.id+'" style="display:none;margin-top:6px"><div style="display:flex;gap:6px;align-items:center"><input class="form-input" id="h32rt-'+c.id+'" placeholder="Reply..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h32Attach(\'r_'+c.id+'\',\'h32ru-'+c.id+'\')"><i class="fas fa-paperclip"></i></button><span id="h32ru-'+c.id+'" style="font-size:.65rem"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h32Comment(\''+postId+'\',\''+c.id+'\')"><i class="fas fa-paper-plane"></i></button></div></div>'
        + h32Comments(c._k||[], depth+1, postId) + '</div>';
    }).join('');
  }
  window.h32Comment = async function (postId, parentId) {
    const iid = parentId ? 'h32rt-'+parentId : 'h32c-'+postId;
    const key = parentId ? 'r_'+parentId : 'c_'+postId;
    const t = document.getElementById(iid).value.trim();
    const f = window._h32Media[key];
    if (!t && !f) return;
    let url = null; if (f) url = await upload(f, 'forum-comments');
    const r = await sb().from('community_comments').insert([{ post_id: postId, user_id: me().id, text: t, media_url: url, parent_comment_id: parentId||null }]);
    if (r.error) return alert(r.error.message);
    window._h32Media[key] = null; h32LoadForum();
  };

  // ============ PLANS (delete) ============
  window.h32OpenPlans = function () {
    showRoot(shell('Plans', 'fa-calendar-check', 'linear-gradient(135deg,#F59E0B,#EF4444)',
      '<div class="card" style="border-radius:20px"><button class="btn btn-warm btn-block" onclick="h27PlanModal()"><i class="fas fa-plus"></i> Create Plan</button><div id="h32PList" style="margin-top:12px"></div></div>'));
    h32LoadPlans();
  };
  window.h32DelPlan = async function (id) { if (!confirm('Delete this plan?')) return; await sb().from('community_plans').delete().eq('id', id); h32LoadPlans(); };
  async function h32LoadPlans() {
    const box = document.getElementById('h32PList'); if (!box) return;
    const r = await sb().from('community_plans').select('*').order('created_at',{ascending:false}).limit(40);
    if (r.error) { box.innerHTML = esc(r.error.message); return; }
    const us = await users();
    const ids = (r.data||[]).map(p=>p.id);
    let pm = { data: [] }; if (ids.length) pm = await sb().from('community_plan_members').select('*').in('plan_id', ids);
    const j = {}; (pm.data||[]).forEach(m=>{ (j[m.plan_id]=j[m.plan_id]||[]).push(m.user_id); });
    box.innerHTML = (r.data||[]).map(function (p) {
      const u = us.find(x=>x.id===p.user_id);
      const mem = j[p.id]||[]; const iAm = me() && mem.includes(me().id);
      const canDel = isAdmin() || (me() && p.user_id===me().id);
      return '<div style="background:var(--bg);border-radius:14px;padding:10px;margin-bottom:8px">'
        + '<div style="display:flex;justify-content:space-between"><b style="font-size:.9rem">' + esc(p.title) + '</b><span style="font-size:.65rem;background:var(--gradient-warm);color:#fff;padding:2px 8px;border-radius:20px">' + esc(p.type) + '</span></div>'
        + (p.description ? '<div style="font-size:.8rem;color:var(--text-light)">' + esc(p.description) + '</div>' : '')
        + '<div style="font-size:.7rem;color:var(--text-lighter);margin-top:4px">' + (u&&u.name?esc(u.name)+' • ':'') + mem.length + ' joined</div>'
        + '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn ' + (iAm?'btn-danger':'btn-primary') + ' btn-sm" onclick="h27ToggleJoin(\''+p.id+'\')">' + (iAm?'Leave':'Join') + '</button>'
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h32DelPlan(\''+p.id+'\')"><i class="fas fa-trash"></i> Delete</button>' : '') + '</div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No plans yet.</div>';
  }

  // ============ PRAYER WALL (delete) ============
  window.h32OpenPrayer = function () {
    showRoot(shell('Prayer Wall', 'fa-hands-praying', 'linear-gradient(135deg,#8B5CF6,#EC4899)',
      '<div class="card" style="border-radius:20px"><textarea class="form-textarea" id="h32PrText" rows="2" placeholder="Share a prayer request..."></textarea>'
      + '<div style="display:flex;gap:10px;align-items:center;margin:8px 0"><span style="font-size:.8rem;color:var(--text-light)">Anonymous</span><input type="checkbox" id="h32PrAnon"></div>'
      + '<button class="btn btn-primary btn-block" onclick="h32Prayer()"><i class="fas fa-paper-plane"></i> Pray</button><div id="h32PrList" style="margin-top:12px"></div></div>'));
    h32LoadPrayers();
  };
  window.h32Prayer = async function () {
    const t = document.getElementById('h32PrText').value.trim();
    if (!t) return alert('Write a prayer.');
    const r = await sb().from('community_prayers').insert([{ user_id: me().id, text: t, anonymous: document.getElementById('h32PrAnon').checked }]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h32PrText').value = ''; h32LoadPrayers();
  };
  window.h32DelPrayer = async function (id) { if (!confirm('Delete this prayer?')) return; await sb().from('community_prayers').delete().eq('id', id); h32LoadPrayers(); };
  window.h32DelPrComment = async function (id) { if (!confirm('Delete this comment?')) return; await sb().from('community_prayer_comments').delete().eq('id', id); h32LoadPrayers(); };
  window.h32PrComment = async function (pid) {
    const t = document.getElementById('h32pc-'+pid).value.trim();
    const f = window._h32Media['pc_'+pid];
    if (!t && !f) return;
    let url = null; if (f) url = await upload(f, 'prayer-comments');
    const r = await sb().from('community_prayer_comments').insert([{ prayer_id: pid, user_id: me().id, text: t, media_url: url }]);
    if (r.error) return alert(r.error.message);
    window._h32Media['pc_'+pid] = null; h32LoadPrayers();
  };
  async function h32LoadPrayers() {
    const box = document.getElementById('h32PrList'); if (!box) return;
    const p = await sb().from('community_prayers').select('*').order('created_at',{ascending:false}).limit(40);
    if (p.error) { box.innerHTML = esc(p.error.message); return; }
    const ids = (p.data||[]).map(x=>x.id);
    let c = { data: [] }; if (ids.length) c = await sb().from('community_prayer_comments').select('*').in('prayer_id', ids).order('created_at');
    const us = await users();
    const by = {}; (c.data||[]).forEach(x=>{ (by[x.prayer_id]=by[x.prayer_id]||[]).push(x); });
    box.innerHTML = (p.data||[]).map(function (pr) {
      const u = us.find(x=>x.id===pr.user_id);
      const name = pr.anonymous ? '🕊️ Anonymous' : ((u&&u.name)||'Member');
      const canDel = isAdmin() || (me() && pr.user_id===me().id);
      return '<div class="card" style="border-radius:16px;margin-bottom:10px">'
        + '<div style="display:flex;gap:8px;align-items:center">' + (pr.anonymous ? '<div class="post-avatar">🙏</div>' : avatarHtml(u,38))
        + '<div style="flex:1"><b style="font-size:.9rem">' + esc(name) + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(pr.created_at) + '</div></div>'
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h32DelPrayer(\''+pr.id+'\')"><i class="fas fa-trash"></i></button>' : '') + '</div>'
        + '<div style="white-space:pre-wrap;margin:8px 0">' + esc(pr.text||'') + '</div>'
        + (by[pr.id]||[]).map(function (cm) {
            const cu = us.find(x=>x.id===cm.user_id);
            const cd = isAdmin() || (me() && cm.user_id===me().id);
            return '<div style="margin-left:16px;margin-top:6px;background:var(--bg);border-radius:12px;padding:8px"><div style="display:flex;gap:6px;align-items:center">' + avatarHtml(cu,26) + '<b style="font-size:.78rem;flex:1">' + esc((cu&&cu.name)||'Member') + '</b>'
              + (cd ? '<button class="btn btn-danger btn-sm" onclick="h32DelPrComment(\''+cm.id+'\')"><i class="fas fa-trash"></i></button>' : '') + '</div>'
              + '<div style="font-size:.85rem;white-space:pre-wrap;margin-top:4px">' + esc(cm.text||'') + '</div>' + mediaHtml(cm.media_url) + '</div>';
          }).join('')
        + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center"><input class="form-input" id="h32pc-'+pr.id+'" placeholder="Comment..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h32Attach(\'pc_'+pr.id+'\',\'h32pcu-'+pr.id+'\')"><i class="fas fa-paperclip"></i></button><span id="h32pcu-'+pr.id+'" style="font-size:.65rem"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h32PrComment(\''+pr.id+'\')"><i class="fas fa-paper-plane"></i></button></div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No prayers yet.</div>';
  }

  // ============ INBOX ============
  window.h32OpenInbox = function () {
    showRoot(shell('My Inbox', 'fa-inbox', 'linear-gradient(135deg,#4F46E5,#7C3AED)', '<div id="h32Inbox"></div>'));
    h32LoadInbox();
  };
  async function h32LoadInbox() {
    const box = document.getElementById('h32Inbox'); if (!box) return;
    const r = await sb().from('community_chat').select('*').or('sender_id.eq.'+me().id+',receiver_id.eq.'+me().id).order('created_at',{ascending:false}).limit(500);
    if (r.error) { box.innerHTML = esc(r.error.message); return; }
    const us = await users(); const map = {};
    (r.data||[]).forEach(function (m) { const o = m.sender_id===me().id?m.receiver_id:m.sender_id; if(!map[o]) map[o]={uid:o,last:m}; });
    box.innerHTML = Object.values(map).map(function (c) {
      const u = us.find(x=>x.id===c.uid);
      return '<div class="card" style="border-radius:16px;margin-bottom:8px;display:flex;gap:10px;align-items:center;cursor:pointer" onclick="h27ChatWith(\''+c.uid+'\')">'
        + avatarHtml(u,44) + '<div style="flex:1;min-width:0"><b style="font-size:.9rem">' + esc((u&&u.name)||'Member') + '</b>'
        + '<div style="font-size:.78rem;color:var(--text-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(c.last.text||'📎 Media') + '</div></div>'
        + '<div style="font-size:.65rem;color:var(--text-lighter)">' + ftime(c.last.created_at) + '</div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No messages yet.</div>';
  }
  function h32InboxEntries() {
    const grid = document.querySelector('#quickActionModal .grid-2');
    if (grid) {
      const card = Array.from(grid.children).find(c => /prayer/i.test(c.textContent||'') && !c.dataset.h32inbox);
      if (card) { card.dataset.h32inbox='1'; card.setAttribute('onclick','closeModalDirect();h32OpenInbox()'); card.innerHTML='<i class="fas fa-inbox"></i><div class="mc-title">Inbox</div>'; }
    }
    if (!document.getElementById('h32InboxBtn')) {
      const bell = document.querySelector('.fa-bell');
      if (bell) {
        const host = bell.closest('button') || bell.parentElement;
        const b = document.createElement('button');
        b.id='h32InboxBtn'; b.style.cssText='border:none;background:none;font-size:1.05rem;color:var(--primary);margin-right:10px';
        b.innerHTML='<i class="fas fa-inbox"></i>'; b.onclick=function(){ window.h32OpenInbox(); };
        host.parentNode.insertBefore(b, host);
      }
    }
  }

  // ============ MY LIST CARD ============
  function tile(icon, grad, name, role, onclick) {
    return '<div onclick="'+onclick+'" style="min-width:150px;border-radius:16px;padding:14px;background:'+grad+';color:#fff;cursor:pointer;flex-shrink:0"><i class="fas '+icon+'"></i><div style="font-weight:800;margin-top:6px">'+esc(name||'')+'</div><span style="font-size:.65rem;background:rgba(255,255,255,.25);padding:2px 8px;border-radius:20px">'+esc(role||'Member')+'</span></div>';
  }
  async function h32MyList() {
    const home = homeEl(); if (!home) return;
    const hm = document.getElementById('home-main') || home;
    const leaf = Array.from(hm.querySelectorAll('*')).find(el => el.children.length===0 && /^My Departments$/.test((el.textContent||'').trim()));
    if (leaf) { const c = leaf.closest('.card'); if (c) c.style.display='none'; }
    const tilesEl = document.getElementById('h27-quicktiles');
    if (tilesEl && tilesEl.parentElement !== hm) hm.appendChild(tilesEl);
    if (document.getElementById('h32MyList')) return;
    if (!me()) return;
    const card = document.createElement('div');
    card.id='h32MyList'; card.className='card'; card.style.cssText='border-radius:20px;margin-top:16px';
    card.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><i class="fas fa-list-ul" style="color:var(--primary)"></i><b style="font-size:1.05rem">My List</b><button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="h27MyListModal()">View All</button></div><div id="h32Tiles" style="display:flex;gap:10px;overflow-x:auto"></div>'
      + '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn btn-secondary btn-sm" onclick="ggOpenHome && ggOpenHome()">Browse Groups</button><button class="btn btn-secondary btn-sm" onclick="c26OpenHome(\'department\')">Browse Departments</button><button class="btn btn-secondary btn-sm" onclick="c26OpenHome(\'ushirika\')">Browse Ushirika</button></div>';
    const feel = Array.from(hm.querySelectorAll('*')).find(el => el.children.length===0 && /How are you feeling/i.test(el.textContent||''));
    if (feel) hm.insertBefore(card, feel.closest('.card') || feel.parentElement); else hm.appendChild(card);
    const res = await Promise.all([
      sb().from('church_group_members').select('role,church_groups(id,name)').eq('user_id', me().id),
      sb().from('ushirika_members').select('role,ushirikas(id,name)').eq('user_id', me().id),
      sb().from('department_members').select('role,departments(id,name)').eq('user_id', me().id)
    ]);
    let html='';
    (res[0].data||[]).forEach(m=>{const g=m.church_groups||{}; html+=tile('fa-users','linear-gradient(135deg,#F59E0B,#EF4444)',g.name,m.role,"ggOpenGroup && ggOpenGroup('"+g.id+"')");});
    (res[1].data||[]).forEach(m=>{const u=m.ushirikas||{}; html+=tile('fa-people-group','linear-gradient(135deg,#10B981,#06B6D4)',u.name,m.role,"c26OpenGroup('ushirika','"+u.id+"')");});
    (res[2].data||[]).forEach(m=>{const d=m.departments||{}; html+=tile('fa-building','linear-gradient(135deg,#8B5CF6,#EC4899)',d.name,m.role,"c26OpenGroup('department','"+d.id+"')");});
    document.getElementById('h32Tiles').innerHTML = html || '<div style="color:var(--text-light);font-size:.85rem">Not a member yet — use Browse to join.</div>';
  }
  function h32RenameList() {
    const m = document.getElementById('h27MyList'); if (!m) return;
    m.querySelectorAll('*').forEach(function (el) {
      if (el.children.length!==0) return;
      const t=(el.textContent||'').trim();
      if(t==='Groups')el.textContent='My Groups';
      if(t==='Departments')el.textContent='My Departments';
      if(t==='Ushirikas')el.textContent='My Ushirikas';
      if(t==='My Departments, Groups & Ushirika')el.textContent='My List';
    });
  }

  // ============ MINISTRIES SYNC + GATE ============
  async function h32Ministries() {
    if (!me() || !sb()) return;
    const g = await sb().from('church_groups').select('id,name,description,additional_info');
    const m = await sb().from('ministries').select('id,name');
    if (g.error || m.error) return;
    const have = (m.data||[]).map(x=>String(x.name||'').toLowerCase());
    for (const x of (g.data||[]).filter(y=>!have.includes(String(y.name||'').toLowerCase()))) {
      const story = (x.description||'') + (x.additional_info ? '\n'+x.additional_info : '');
      const r = await sb().from('ministries').insert([{ name:x.name, story:story }]);
      if (r.error) await sb().from('ministries').insert([{ name:x.name }]).then(function(){});
    }
  }
  document.addEventListener('click', function (e) {
    const landing = document.querySelector('.public-landing');
    if (!landing || landing.classList.contains('hidden')) return;
    const sec = Array.from(landing.querySelectorAll('section')).find(s=>/ministries/i.test(s.textContent||''));
    if (!sec || !sec.contains(e.target)) return;
    if (!me()) { e.preventDefault(); e.stopPropagation(); alert('Please log in first, or register if you do not have an account.'); return; }
    const card = e.target.closest('div,a,button'); if (!card) return;
    const name = (card.textContent||'').split('\n')[0].trim();
    sb().from('church_groups').select('id').ilike('name', name).limit(1).then(function (r) { if (r.data&&r.data[0]&&window.ggOpenGroup) window.ggOpenGroup(r.data[0].id); });
  }, true);
  function h32NeutralizeDupGrid() { document.querySelectorAll('.public-landing section').forEach(s=>{ s.dataset.h29min='1'; }); }

  // ============ FEATURED REPAIR ============
  window.loadFeatured = function () {
    return sb().from('featured_people').select('*').order('sort',{ascending:true})
      .then(r=>{window._featured=r.data||[];return window._featured;})
      .catch(()=>sb().from('featured_people').select('*').then(r=>{window._featured=r.data||[];return window._featured;}).catch(()=>{window._featured=[];return [];}));
  };
  window.feAdd21 = function (uid) {
    if (!uid) return alert('No member id received.');
    sb().from('profiles').select('id,name,role,profile_pic').eq('id',uid).single().then(function (pr) {
      if (pr.error) return alert('Could not load member: '+pr.error.message);
      const u = pr.data;
      const base = { user_id:uid, name:u.name||'Member', role:u.role||'member', image_url:u.profile_pic||null };
      function done(){ window.loadFeatured().then(function(){ if(typeof feRender21==='function')feRender21(); if(typeof feShowPicker21==='function')feShowPicker21(true); if(typeof renderFeaturedLanding==='function')renderFeaturedLanding(); alert('✅ '+base.name+' added to front page.'); }); }
      function fail(msg){ alert('⚠️ Could not add featured member:\n'+msg+'\n\nRun the featured_people SQL in Supabase.'); }
      sb().from('featured_people').insert([Object.assign({},base,{sort:(window._featured||[]).length})]).then(function(r1){
        if(!r1.error)return done();
        sb().from('featured_people').insert([base]).then(function(r2){
          if(!r2.error)return done();
          sb().from('featured_people').insert([{user_id:uid,name:base.name}]).then(function(r3){ if(!r3.error)return done(); fail(r3.error.message); });
        });
      });
    });
  };

  // ============ VERSE SHARE ============
  function verseText() {
    let ref=''; const refEl=document.querySelector('[style*="92400E"]'); if(refEl) ref=(refEl.textContent||'').trim();
    const sel=window._selectedVerses||[];
    let body = sel.length ? sel.map(v=>typeof v==='string'?v:((v.verse?v.verse+' ':'')+(v.text||''))).join('\n')
      : (window._bibleVerses||[]).map(v=>(v.verse?v.verse+' ':'')+(v.text||'')).join('\n');
    return { ref:ref, body:body };
  }
  window.openShareVerses = function () {
    const v = verseText();
    if (!v.body) return alert('Select verse(s) first by tapping them.');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="h32Share" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-share"></i> Share Verse</div>'
      + '<div style="background:var(--bg);border-radius:12px;padding:10px;margin-bottom:10px;white-space:pre-wrap;font-size:.85rem">'+esc(v.ref+'\n'+v.body).slice(0,400)+'</div>'
      + '<button class="btn btn-primary btn-block" onclick="h32ShareForum()"><i class="fas fa-comments"></i> Share to Public Forum</button>'
      + '<button class="btn btn-secondary btn-block" style="margin-top:8px" onclick="h32SharePick()"><i class="fas fa-user"></i> Share Privately (inbox)</button>'
      + '<button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button></div></div>');
  };
  window.h32ShareForum = async function () {
    const v = verseText();
    const r = await sb().from('community_posts').insert([{ group_type:'forum', group_id:FORUM_GID, user_id:me().id, text:'📖 '+(v.ref?v.ref+'\n':'')+v.body, media_url:null }]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h32Share').remove(); alert('✅ Shared to Public Forum.'); window.h32OpenForum();
  };
  window.h32SharePick = async function () {
    const us = await users();
    document.getElementById('h32Share').remove();
    document.body.insertAdjacentHTML('beforeend','<div class="modal-overlay show" id="h32Priv" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-user"></i> Send to member</div><div style="max-height:320px;overflow-y:auto">'+us.filter(u=>!me()||u.id!==me().id).map(u=>'<div onclick="h32ShareSend(\''+u.id+'\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">'+avatarHtml(u,32)+'<div style="flex:1"><b style="font-size:.85rem">'+esc(u.name)+'</b></div><i class="fas fa-paper-plane" style="color:var(--primary)"></i></div>').join('')+'</div></div></div>');
  };
  window.h32ShareSend = async function (uid) {
    const v = verseText();
    const r = await sb().from('community_chat').insert([{ sender_id:me().id, receiver_id:uid, text:'📖 '+(v.ref?v.ref+'\n':'')+v.body, media_url:null }]);
    if (r.error) return alert(r.error.message);
    sb().from('notifications').insert([{ user_id:uid, title:'📖 Verse shared with you', message:v.ref||'A bible verse', body:v.ref||'' }]).then(function(){});
    document.getElementById('h32Priv').remove(); alert('✅ Sent to member inbox.');
  };

  // ============ MULTIPLAYER HIDE + TRIVIA NEXT ============
  function h32HideMultiplayer() {
    document.querySelectorAll('button, .btn, [onclick]').forEach(function (el) {
      const oc=(el.getAttribute&&el.getAttribute('onclick'))||''; const tx=(el.textContent||'').trim();
      if (/multiplayerModal/i.test(oc) || /^multiplayer$/i.test(tx)) el.style.display='none';
    });
  }
  function h32NextResolver() {
    const cands=['nextTrivia','nextTriviaQuestion','triviaNext','newTrivia','loadTrivia','loadTriviaQuestion','nextQuestion','showNextQuestion','nextQ'];
    for (const n of cands) if (typeof window[n]==='function') return function(){ window[n](); };
    const b = Array.from(document.querySelectorAll('button')).find(function (x) {
      const card = x.closest('.card')||x.parentElement;
      return /next/i.test(x.textContent||'') && /trivia|question/i.test((card&&card.textContent)||'');
    });
    if (b) return function(){ b.click(); };
    return null;
  }
  function h32InjectTriviaNext() {
    document.querySelectorAll('.sub-page.active, .modal-overlay.show').forEach(function (scope) {
      if (!/trivia/i.test(scope.textContent||'')) return;
      const heads = Array.from(scope.querySelectorAll('*')).filter(el=>el.children.length===0 && /trivia/i.test(el.textContent||''));
      heads.forEach(function (hd) {
        const cont = hd.closest('.card')||hd.closest('.sub-page')||hd.parentElement;
        if (!cont || cont.querySelector('[data-h32next]')) return;
        if (Array.from(cont.querySelectorAll('button')).some(b=>/next/i.test(b.textContent||''))) return;
        const b = document.createElement('button');
        b.className='btn btn-primary btn-block'; b.style.marginTop='10px'; b.setAttribute('data-h32next','1');
        b.innerHTML='<i class="fas fa-forward"></i> Next Question';
        b.onclick=function(){ const r=h32NextResolver(); if(r) r(); else alert('Next question not available here.'); };
        cont.appendChild(b);
      });
    });
  }

  // ============ PROFILE PIC FRESHNESS ============
  if (window.saveProfileEdit && !window.saveProfileEdit._h32) {
    const _sp = window.saveProfileEdit;
    window.saveProfileEdit = function(){ const r=_sp.apply(this,arguments); setTimeout(function(){ users(true); },800); return r; };
    window.saveProfileEdit._h32 = true;
  }
  setInterval(function(){ users(true); }, 45000);

  // ============ SYNC ============
  function sync() {
    h32MyList(); h32RenameList(); h32InboxEntries(); h32HideMultiplayer(); h32InjectTriviaNext(); h32NeutralizeDupGrid();
  }
  sync();
  setInterval(sync, 1500);
  setInterval(h32Ministries, 20000);
  h32Ministries();
})();
