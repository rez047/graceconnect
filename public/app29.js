// public/app30.js — verse share fix, plans/reply delete, ministries sync,
// featured fix support, profile-pic refresh, group additional info.

(function () {
  console.log('✝️ app30.js');

  const FORUM_GID = '11111111-1111-1111-1111-111111111111';
  window._h30Media = window._h30Media || {};

  function sb() { return window.sb; }
  function me() { return window.user; }
  function isAdmin() { return window.isAdmin ? window.isAdmin() : false; }
  function esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function ini(n) { return window.ini ? window.ini(n) : (n ? String(n).split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase() : '?'); }
  function fdate(t) { return t ? new Date(t).toLocaleDateString() : ''; }

  async function users(force) {
    if (force) window.usersData = null;
    if (window.usersData && window.usersData.length) return window.usersData;
    let r = await sb().from('profiles').select('id,name,profile_pic,email,role').order('name');
    if (r.error) r = await sb().from('profiles').select('id,name,profile_pic,role').order('name');
    window.usersData = r.data || [];
    return window.usersData;
  }

  async function upload(file, path) {
    if (!file) return null;
    if (window.uploadMediaFile) { try { return await window.uploadMediaFile(file); } catch (e) {} }
    const n = (path||'media') + '/' + Date.now() + '_' + file.name;
    const r = await sb().storage.from('media').upload(n, file);
    if (r.error) { alert('Upload failed: ' + r.error.message); return null; }
    return sb().storage.from('media').getPublicUrl(n).data.publicUrl;
  }

  function mediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return '<img src="'+url+'" style="width:100%;max-height:280px;object-fit:cover;border-radius:14px;margin-top:6px;display:block">';
    if (/\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi|3gp)$/i.test(url)) return '<video src="'+url+'" controls playsinline style="width:100%;max-height:320px;border-radius:14px;margin-top:6px;display:block"></video>';
    if (/\.(mp3|wav|m4a|aac)$/i.test(url)) return '<audio src="'+url+'" controls style="width:100%;margin-top:6px;display:block"></audio>';
    return '<a href="'+url+'" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:6px"><i class="fas fa-paperclip"></i> File</a>';
  }

  function avatarHtml(u, s) {
    s = s || 38;
    if (u && u.profile_pic) return '<img src="' + u.profile_pic + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block">';
    return '<div class="post-avatar" style="width:' + s + 'px;height:' + s + 'px">' + ini(u && u.name) + '</div>';
  }

  window.h30Attach = function (key, labelId) {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = '*/*';
    i.onchange = function () {
      const f = i.files && i.files[0]; if (!f) return;
      window._h30Media[key] = f;
      const l = document.getElementById(labelId);
      if (l) l.innerHTML = '<i class="fas fa-check-circle"></i> ' + esc(f.name);
    };
    i.click();
  };

  // kill inline-image baseline gap ("weird space")
  (function () {
    const s = document.createElement('style');
    s.textContent = '.post-avatar img{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}#pf_preview img{display:block;margin:0 auto;border-radius:50%}';
    document.head.appendChild(s);
  })();

  // =====================================================
  // 1) BIBLE VERSE SHARE → FORUM + PRIVATE INBOX (fixed)
  // =====================================================
function verseText() {
    let ref = '';
    const refEl = document.querySelector('[style*="92400E"]');
    if (refEl) ref = (refEl.textContent || '').trim();
    const sel = window._selectedVerses || [];
    let body = '';
    if (sel.length) {
      body = sel.map(v => {
        const num = (typeof v === 'string') ? '' : (v.verse ? 'Verse ' + v.verse + ': ' : '');
        const txt = (typeof v === 'string') ? v : (v.text || '');
        return ref + ' ' + num + '"' + txt + '"';
      }).join('\n');
    } else if (window._bibleVerses && window._bibleVerses.length) {
      body = window._bibleVerses.map(v => ref + ' Verse ' + v.verse + ': "' + (v.text || '') + '"').join('\n');
    }
    return { ref: ref, body: body };
  }

  window.openShareVerses = function () {
    const v = verseText();
    if (!v.body) return alert('Select verse(s) first by tapping them.');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="h30Share" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div>'
      + '<div class="modal-title"><i class="fas fa-share"></i> Share Verse</div>'
      + '<div style="background:var(--bg);border-radius:12px;padding:10px;margin-bottom:10px;white-space:pre-wrap;font-size:.85rem">' + esc(v.ref + '\n' + v.body).slice(0, 400) + '</div>'
      + '<button class="btn btn-primary btn-block" onclick="h30ShareForum()"><i class="fas fa-comments"></i> Share to Public Forum</button>'
      + '<button class="btn btn-secondary btn-block" style="margin-top:8px" onclick="h30SharePrivatePick()"><i class="fas fa-user"></i> Share Privately (member inbox)</button>'
      + '<button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button>'
      + '</div></div>');
  };

  window.h30ShareForum = async function () {
    const v = verseText();
    const text = '📖 ' + (v.ref ? v.ref + '\n' : '') + v.body;
    const r = await sb().from('community_posts').insert([{ group_type: 'forum', group_id: FORUM_GID, user_id: me().id, text: text, media_url: null }]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h30Share').remove();
    alert('✅ Shared to Public Forum.');
    if (window.h27OpenPage) window.h27OpenPage('forum');
  };

  window.h30SharePrivatePick = async function () {
    const us = await users();
    document.getElementById('h30Share').remove();
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="h30Priv" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-user"></i> Send to member</div>'
      + '<div style="max-height:320px;overflow-y:auto">' + us.filter(u => !me() || u.id !== me().id).map(u =>
          '<div onclick="h30SharePrivate(\'' + u.id + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">'
          + avatarHtml(u, 32) + '<div style="flex:1"><b style="font-size:.85rem">' + esc(u.name) + '</b></div><i class="fas fa-paper-plane" style="color:var(--primary)"></i></div>'
        ).join('') + '</div></div></div>');
  };

  window.h30SharePrivate = async function (uid) {
    const v = verseText();
    const text = '📖 ' + (v.ref ? v.ref + '\n' : '') + v.body;
    const r = await sb().from('community_chat').insert([{ sender_id: me().id, receiver_id: uid, text: text, media_url: null }]);
    if (r.error) return alert(r.error.message);
    sb().from('notifications').insert([{ user_id: uid, title: '📖 Verse shared with you', message: v.ref || 'A bible verse', body: v.ref || '' }]).then(function () {});
    document.getElementById('h30Priv').remove();
    alert('✅ Sent to member inbox.');
  };

  // =====================================================
  // 2) FORUM with post/comment/reply delete (admin all, owner own)
  // =====================================================
  window.h30OpenForum = function () {
    const sec = document.getElementById('section-h28') || (function () {
      const s = document.createElement('div'); s.id = 'section-h28'; s.className = 'section';
      s.innerHTML = '<div id="h28-root" class="sub-page active"></div>';
      (document.querySelector('main') || document.body).appendChild(s); return s;
    })();
    document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
    sec.classList.add('active');
    document.getElementById('h28-root').innerHTML =
      '<button class="back-btn" onclick="h28BackHome()"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div style="border-radius:20px;padding:16px;color:#fff;background:linear-gradient(135deg,#4F46E5,#06B6D4);font-weight:800;font-size:1.15rem;margin-bottom:14px"><i class="fas fa-comments"></i> Public Forum</div>'
      + '<div class="card" style="border-radius:20px"><textarea class="form-textarea" id="h30ForumText" rows="2" placeholder="Post to the public forum..."></textarea>'
      + '<div class="media-upload" id="h30ForumUpload" onclick="h30Attach(\'fpost\',\'h30ForumUpload\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media/video/file</span></div>'
      + '<button class="btn btn-primary btn-block" style="margin-top:8px" onclick="h30SubmitPost()"><i class="fas fa-paper-plane"></i> Post</button>'
      + '<div id="h30ForumList" style="margin-top:12px"></div></div>';
    window.scrollTo({ top: 0 });
    h30LoadForum();
  };
  window.h28OpenForum = window.h30OpenForum;

  window.h30SubmitPost = async function () {
    const t = document.getElementById('h30ForumText').value.trim();
    const f = window._h30Media.fpost;
    if (!t && !f) return alert('Write something or add media.');
    let url = null; if (f) url = await upload(f, 'forum');
    const r = await sb().from('community_posts').insert([{ group_type: 'forum', group_id: FORUM_GID, user_id: me().id, text: t, media_url: url }]);
    if (r.error) return alert(r.error.message);
    window._h30Media.fpost = null;
    document.getElementById('h30ForumText').value = '';
    h30LoadForum();
  };

  window.h30DelPost = async function (id) {
    if (!confirm('Delete this post?')) return;
    const r = await sb().from('community_posts').delete().eq('id', id);
    if (r.error) return alert(r.error.message);
    h30LoadForum();
  };

  window.h30DelComment = async function (id) {
    if (!confirm('Delete this comment/reply?')) return;
    const r = await sb().from('community_comments').delete().eq('id', id);
    if (r.error) return alert(r.error.message);
    h30LoadForum();
  };

  async function h30LoadForum() {
    const box = document.getElementById('h30ForumList'); if (!box) return;
    const posts = await sb().from('community_posts').select('*').eq('group_type','forum').eq('group_id',FORUM_GID).order('created_at',{ascending:false}).limit(50);
    if (posts.error) { box.innerHTML = esc(posts.error.message); return; }
    const ids = (posts.data||[]).map(p=>p.id);
    let cs = { data: [] };
    if (ids.length) cs = await sb().from('community_comments').select('*').in('post_id', ids).order('created_at');
    const us = await users();
    window._h30Users = us;
    const byPost = {};
    (cs.data||[]).forEach(c => { (byPost[c.post_id]=byPost[c.post_id]||[]).push(c); });

    box.innerHTML = (posts.data||[]).map(p => {
      const u = us.find(x=>x.id===p.user_id);
      const canDel = isAdmin() || (me() && p.user_id===me().id);
      return '<div class="card" style="border-radius:16px;margin-bottom:10px">'
        + '<div style="display:flex;gap:8px;align-items:center">' + avatarHtml(u,38)
        + '<div style="flex:1"><b style="font-size:.9rem">' + esc((u&&u.name)||'Member') + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>'
        + (u && (!me() || u.id!==me().id) ? '<button class="btn btn-secondary btn-sm" onclick="h27ChatWith && h27ChatWith(\''+u.id+'\')"><i class="fas fa-comment-dots"></i></button>' : '')
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h30DelPost(\''+p.id+'\')"><i class="fas fa-trash"></i></button>' : '')
        + '</div>'
        + '<div style="white-space:pre-wrap;margin:8px 0">' + esc(p.text||'') + '</div>' + mediaHtml(p.media_url)
        + h30Comments(buildTree(byPost[p.id]||[]), 0, p.id)
        + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center">'
        + '<input class="form-input" id="h30c-'+p.id+'" placeholder="Comment..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h30Attach(\'c_'+p.id+'\',\'h30cu-'+p.id+'\')"><i class="fas fa-paperclip"></i></button><span id="h30cu-'+p.id+'" style="font-size:.65rem"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h30Comment(\''+p.id+'\',null)"><i class="fas fa-paper-plane"></i></button></div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No posts yet.</div>';
  }

  function buildTree(list) {
    const map={}; const roots=[];
    list.forEach(c=>{c._k=[];map[c.id]=c;});
    list.forEach(c=>{ if(c.parent_comment_id&&map[c.parent_comment_id])map[c.parent_comment_id]._k.push(c); else roots.push(c); });
    return roots;
  }

  function h30Comments(list, depth, postId) {
    const us = window._h30Users||[];
    return list.map(c => {
      const u = us.find(x=>x.id===c.user_id);
      const canDel = isAdmin() || (me() && c.user_id===me().id);
      return '<div style="margin-left:'+Math.min(depth,4)*16+'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px">'
        + '<div style="display:flex;gap:6px;align-items:center">' + avatarHtml(u,26)
        + '<b style="font-size:.78rem;flex:1">' + esc((u&&u.name)||'Member') + '</b>'
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h30DelComment(\''+c.id+'\')"><i class="fas fa-trash"></i></button>' : '')
        + '</div>'
        + '<div style="font-size:.88rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text||'') + '</div>' + mediaHtml(c.media_url)
        + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:4px" onclick="h30Toggle(\'h30r-'+c.id+'\')"><i class="fas fa-reply"></i> Reply</button>'
        + '<div id="h30r-'+c.id+'" style="display:none;margin-top:6px"><div style="display:flex;gap:6px;align-items:center">'
        + '<input class="form-input" id="h30rt-'+c.id+'" placeholder="Reply..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h30Attach(\'r_'+c.id+'\',\'h30ru-'+c.id+'\')"><i class="fas fa-paperclip"></i></button><span id="h30ru-'+c.id+'" style="font-size:.65rem"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h30Comment(\''+postId+'\',\''+c.id+'\')"><i class="fas fa-paper-plane"></i></button></div></div>'
        + h30Comments(c._k||[], depth+1, postId) + '</div>';
    }).join('');
  }

  window.h30Toggle = function (id) { const e=document.getElementById(id); if(e) e.style.display = e.style.display==='none'?'block':'none'; };

  window.h30Comment = async function (postId, parentId) {
    const iid = parentId ? 'h30rt-'+parentId : 'h30c-'+postId;
    const key = parentId ? 'r_'+parentId : 'c_'+postId;
    const t = document.getElementById(iid).value.trim();
    const f = window._h30Media[key];
    if (!t && !f) return;
    let url=null; if(f) url=await upload(f,'forum-comments');
    const r = await sb().from('community_comments').insert([{ post_id:postId, user_id:me().id, text:t, media_url:url, parent_comment_id:parentId||null }]);
    if (r.error) return alert(r.error.message);
    window._h30Media[key]=null;
    h30LoadForum();
  };

  // =====================================================
  // 3) PLANS with delete (admin all / owner own)
  // =====================================================
  window.h30OpenPlans = function () {
    const sec = document.getElementById('section-h28') || (function () {
      const s = document.createElement('div'); s.id='section-h28'; s.className='section';
      s.innerHTML='<div id="h28-root" class="sub-page active"></div>';
      (document.querySelector('main')||document.body).appendChild(s); return s;
    })();
    document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
    sec.classList.add('active');
    document.getElementById('h28-root').innerHTML =
      '<button class="back-btn" onclick="h28BackHome()"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div style="border-radius:20px;padding:16px;color:#fff;background:linear-gradient(135deg,#F59E0B,#EF4444);font-weight:800;font-size:1.15rem;margin-bottom:14px"><i class="fas fa-calendar-check"></i> Plans</div>'
      + '<div class="card" style="border-radius:20px"><button class="btn btn-warm btn-block" onclick="h27PlanModal()"><i class="fas fa-plus"></i> Create Plan</button>'
      + '<div id="h30PlanList" style="margin-top:12px"></div></div>';
    window.scrollTo({ top: 0 });
    h30LoadPlans();
  };

  window.h30DelPlan = async function (id) {
    if (!confirm('Delete this plan?')) return;
    const r = await sb().from('community_plans').delete().eq('id', id);
    if (r.error) return alert(r.error.message);
    h30LoadPlans();
  };

  async function h30LoadPlans() {
    const box = document.getElementById('h30PlanList'); if (!box) return;
    const r = await sb().from('community_plans').select('*').order('created_at',{ascending:false}).limit(40);
    if (r.error) { box.innerHTML = esc(r.error.message); return; }
    const us = await users();
    const ids = (r.data||[]).map(p=>p.id);
    let pm = { data: [] };
    if (ids.length) pm = await sb().from('community_plan_members').select('*').in('plan_id', ids);
    const joined = {};
    (pm.data||[]).forEach(m=>{ (joined[m.plan_id]=joined[m.plan_id]||[]).push(m.user_id); });

    box.innerHTML = (r.data||[]).map(p => {
      const u = us.find(x=>x.id===p.user_id);
      const mem = joined[p.id]||[];
      const iAm = me() && mem.includes(me().id);
      const canDel = isAdmin() || (me() && p.user_id===me().id);
      return '<div style="background:var(--bg);border-radius:14px;padding:10px;margin-bottom:8px">'
        + '<div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:.9rem">' + esc(p.title) + '</b>'
        + '<span style="font-size:.65rem;background:var(--gradient-warm);color:#fff;padding:2px 8px;border-radius:20px">' + esc(p.type) + '</span></div>'
        + (p.description ? '<div style="font-size:.8rem;color:var(--text-light)">' + esc(p.description) + '</div>' : '')
        + '<div style="font-size:.7rem;color:var(--text-lighter);margin-top:4px">' + (u&&u.name?esc(u.name)+' • ':'') + (p.plan_date?new Date(p.plan_date).toLocaleString():'') + ' • ' + mem.length + ' joined</div>'
        + '<div style="display:flex;gap:8px;margin-top:6px">'
        + '<button class="btn ' + (iAm?'btn-danger':'btn-primary') + ' btn-sm" onclick="h27ToggleJoin(\''+p.id+'\')">' + (iAm?'Leave':'Join') + '</button>'
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h30DelPlan(\''+p.id+'\')"><i class="fas fa-trash"></i> Delete</button>' : '')
        + '</div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No plans yet.</div>';
  }

  // rewire tiles / quick actions to the fixed pages
  const _h27op = window.h27OpenPage;
  window.h27OpenPage = function (p) {
    if (p === 'forum') return window.h30OpenForum();
    if (p === 'plans') return window.h30OpenPlans();
    return _h27op ? _h27op(p) : undefined;
  };

  // =====================================================
  // 4) MINISTRIES = sync from Groups + login gate + rename
  // =====================================================
  async function h30SyncMinistries() {
    if (!me() || !sb()) return;
    const g = await sb().from('church_groups').select('id,name,description,additional_info');
    const m = await sb().from('ministries').select('id,name');
    if (g.error || m.error) return;
    const have = (m.data||[]).map(x=>String(x.name||'').toLowerCase());
    const missing = (g.data||[]).filter(x=>!have.includes(String(x.name||'').toLowerCase()));
    for (const x of missing) {
      const story = (x.description||'') + (x.additional_info ? '\n' + x.additional_info : '');
      const r = await sb().from('ministries').insert([{ name: x.name, story: story }]);
      if (r.error) await sb().from('ministries').insert([{ name: x.name }]).then(function(){});
    }
  }

  // logged-out tap on a ministry → login / register prompt
  document.addEventListener('click', function (e) {
    const landing = document.querySelector('.public-landing');
    if (!landing || landing.classList.contains('hidden')) return;
    const sec = Array.from(landing.querySelectorAll('section')).find(s => /ministries/i.test(s.textContent||''));
    if (!sec || !sec.contains(e.target)) return;
    const card = e.target.closest('div,a,button');
    if (!card) return;
    if (!me()) {
      e.preventDefault(); e.stopPropagation();
      alert('Please log in first, or register if you do not have an account.');
      return;
    }
    const name = (card.textContent||'').split('\n')[0].trim();
    sb().from('church_groups').select('id').ilike('name', name).limit(1).then(function (r) {
      if (r.data && r.data[0] && window.ggOpenGroup) window.ggOpenGroup(r.data[0].id);
    });
  }, true);

  // stop app29 duplicate grid; rename home list to "My Groups"
  function h30LandingAndRename() {
    document.querySelectorAll('.public-landing section').forEach(s => { s.dataset.h29min = '1'; });
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && String(el.textContent||'').trim() === 'My Departments, Groups & Ushirika') {
        el.textContent = 'My Groups';
      }
    });
  }

  // =====================================================
  // 5) GROUP additional info (edit + show)
  // =====================================================
  async function h30GroupInfo() {
    const root = document.getElementById('gg-root'); if (!root) return;
    const banner = root.querySelector('.dept-banner'); if (!banner) return;
    const gid = window._h29GroupId; if (!gid) return;
    const r = await sb().from('church_groups').select('*').eq('id', gid).single();
    if (r.error || !r.data) return;
    const g = r.data;

    if (g.additional_info && !banner.querySelector('[data-h30info]')) {
      const d = document.createElement('div');
      d.setAttribute('data-h30info','1');
      d.style.cssText = 'font-size:.78rem;opacity:.95;margin-top:4px;white-space:pre-wrap';
      d.textContent = g.additional_info;
      banner.querySelector('div:last-child').appendChild(d);
    }

    const role = await sb().from('church_group_members').select('role').eq('group_id', gid).eq('user_id', me().id).limit(1);
    const rl = String(((role.data||[])[0]||{}).role||'').toLowerCase();
    if (!isAdmin() && !['leader','chairman'].includes(rl)) return;
    if (banner.querySelector('[data-h30edit]') || (banner.parentNode && banner.parentNode.querySelector('[data-h30edit]'))) return;

    const b = document.createElement('button');
    b.setAttribute('data-h30edit','1');
    b.className = 'btn btn-secondary btn-sm';
    b.style.marginTop = '8px';
    b.innerHTML = '<i class="fas fa-info-circle"></i> Edit Ministry Info';
    b.onclick = function () { h30GroupInfoModal(g); };
    banner.parentNode.insertBefore(b, banner.nextSibling);
  }

  window.h30GroupInfoModal = function (g) {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="h30GInfo" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-info-circle"></i> Ministry Info</div>'
      + '<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="h30gName" value="' + esc(g.name||'') + '"></div>'
      + '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="h30gDesc" rows="2">' + esc(g.description||'') + '</textarea></div>'
      + '<div class="form-group"><label class="form-label">Additional Info (story, vision, meeting notes...)</label><textarea class="form-textarea" id="h30gInfo" rows="4">' + esc(g.additional_info||'') + '</textarea></div>'
      + '<button class="btn btn-primary btn-block" onclick="h30SaveGroupInfo(\'' + g.id + '\')">Save</button></div></div>');
  };

  window.h30SaveGroupInfo = async function (id) {
    const r = await sb().from('church_groups').update({
      name: document.getElementById('h30gName').value.trim(),
      description: document.getElementById('h30gDesc').value.trim(),
      additional_info: document.getElementById('h30gInfo').value.trim()
    }).eq('id', id);
    if (r.error) return alert(r.error.message);
    document.getElementById('h30GInfo').remove();
    alert('✅ Saved.');
    if (window.ggOpenGroup) window.ggOpenGroup(id);
    h30SyncMinistries();
  };


  // === CATEGORIES, OFFERINGS & SYSTEM-WIDE MEDIA UPLOADS ===
window._gcInitCategories = function(groupId) {
    const tabs = document.querySelector('.group-tabs');
    if(tabs && !tabs.querySelector('.tab-categories')) {
        tabs.insertAdjacentHTML('beforeend', '<div class="tab tab-categories" onclick="window._gcShowCategories(\''+groupId+'\')">Categories</div>');
    }
};

window._gcShowCategories = function(groupId) {
    alert('Categories interface loading for group: ' + groupId + '. (Ensure categories table exists in DB)');
    // Logic to render categories, forums, and assign roles (teacher, leader, chairman) goes here
};

// Hide offering from normal members
setInterval(() => {
    if (!window.isAdmin || !window.isAdmin()) {
        document.querySelectorAll('.offering-section, [id*="offering"]').forEach(el => {
            if(el && !el.closest('.admin-only')) el.style.display = 'none';
        });
    }
    // Total offering placeholder injection
    const catList = document.getElementById('categoriesList');
    if(catList && !document.getElementById('totalOfferingPlaceholder')) {
        catList.insertAdjacentHTML('afterend', '<div id="totalOfferingPlaceholder" class="card" style="margin-top:10px; background:var(--gradient-green); color:white; text-align:center;"><b>Total Group Offering:</b> Calculating...</div>');
    }
}, 2000);

// Delete Prayers
window._gcDeletePrayer = function(id) {
    if(!confirm('Delete this prayer?')) return;
    if(window.sb) {
        window.sb.from('prayers').delete().eq('id', id).then(() => {
            if(window.loadPrayerWall) window.loadPrayerWall();
        });
    }
};

// Inject delete buttons into prayer wall dynamically
setInterval(() => {
    const prayers = document.querySelectorAll('.prayer-item, .sermon-card');
    prayers.forEach(p => {
        if(!p.querySelector('.prayer-del-btn') && window.isAdmin && window.isAdmin()) {
            const id = p.getAttribute('data-id') || p.id;
            if(id) p.insertAdjacentHTML('beforeend', '<button class="prayer-del-btn btn btn-danger btn-sm" style="position:absolute;top:5px;right:5px;" onclick="window._gcDeletePrayer(\''+id+'\')"><i class="fas fa-trash"></i></button>');
        }
    });
}, 1500);
  
  // =====================================================
  // 6) profile-pic freshness
  // =====================================================
  if (window.saveProfileEdit && !window.saveProfileEdit._h30) {
    const _sp = window.saveProfileEdit;
    window.saveProfileEdit = function () {
      const r = _sp.apply(this, arguments);
      setTimeout(function () { users(true); }, 800);
      return r;
    };
    window.saveProfileEdit._h30 = true;
  }
  setInterval(function () { users(true); }, 45000);

  async function h30Pics() {
    const us = window.usersData && window.usersData.length ? window.usersData : await users();
    if (!us || !us.length) return;
    document.querySelectorAll('div.post-avatar').forEach(function (el) {
      if (el.querySelector('img')) return;
      const scope = el.parentElement || el;
      const leaves = Array.from(scope.querySelectorAll('div,b,strong,span')).filter(d => d.children.length === 0);
      for (let i = 0; i < leaves.length; i++) {
        const nm = (leaves[i].textContent||'').trim();
        if (nm.length < 2 || nm.length > 40) continue;
        const u = us.find(x => x.name && x.profile_pic && x.name.trim().toLowerCase() === nm.toLowerCase());
        if (u) {
          el.innerHTML = '<img src="' + u.profile_pic + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block">';
          return;
        }
      }
    });
  }

  // =====================================================
  // SYNC
  // =====================================================
  function sync() {
    h30LandingAndRename();
    h30Pics();
    h30GroupInfo();
  }
  sync();
  setInterval(sync, 2000);
  setInterval(h30SyncMinistries, 20000);
  h30SyncMinistries();
})();
