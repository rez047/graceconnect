// public/app27.js — Home modules: My Departments/Groups/Ushirika tile,
// Prayer Wall, Public Forum (nested comments + media), Plans, Quick Actions.

(function () {
  console.log('✝️ app27.js — Home modules');

  function sb() { return window.sb; }
  function me() { return window.user; }
  function esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function ini(n) { return window.ini ? window.ini(n) : (n ? String(n).split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase() : '?'); }
  function fdate(t) { return t ? new Date(t).toLocaleDateString() : ''; }
  function avatarHtml(u, s) {
    s = s || 40;
    if (u && u.profile_pic) return '<img src="' + u.profile_pic + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;object-fit:cover;flex-shrink:0">';
    return '<div class="post-avatar" style="width:' + s + 'px;height:' + s + 'px">' + ini(u && u.name) + '</div>';
  }
  async function users() {
    if (window.usersData && window.usersData.length) return window.usersData;
    let r = await sb().from('profiles').select('id,name,profile_pic,email').order('name');
    if (r.error) r = await sb().from('profiles').select('id,name,profile_pic').order('name');
    window.usersData = r.data || [];
    return window.usersData;
  }
  async function up(file, path) {
    if (!file) return null;
    if (window.uploadMediaFile) { try { return await window.uploadMediaFile(file); } catch (e) {} }
    const n = (path||'media') + '/' + Date.now() + '_' + file.name;
    const r = await sb().storage.from('media').upload(n, file);
    if (r.error) { alert('Upload failed'); return null; }
    return sb().storage.from('media').getPublicUrl(n).data.publicUrl;
  }
  function mediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return '<img src="'+url+'" style="width:100%;max-height:260px;object-fit:cover;border-radius:14px;margin-top:8px">';
    if (/\.(mp4|webm)$/i.test(url)) return '<video src="'+url+'" controls style="width:100%;border-radius:14px;margin-top:8px"></video>';
    if (/\.(mp3|wav|m4a)$/i.test(url)) return '<audio src="'+url+'" controls style="width:100%;margin-top:8px"></audio>';
    return '<a href="'+url+'" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:8px"><i class="fas fa-paperclip"></i> File</a>';
  }
  function homeEl() { return document.querySelector('#section-home') || document.querySelector('#home-main'); }
  function homeActive() { const h = document.querySelector('#section-home'); return h && h.classList.contains('active'); }

  // ============ RENAME "My Departments" + MEMBERSHIP TILES ============
  function h27RenameAndTiles() {
    const home = homeEl(); if (!home) return;

    // rename heading
    home.querySelectorAll('*').forEach(function (el) {
      if (el.children.length === 0 && String(el.textContent || '').trim() === 'My Departments') {
        el.textContent = 'My Departments, Groups & Ushirika';
      }
    });

    // add group + ushirika tiles once per render
    const head = Array.from(home.querySelectorAll('*')).find(function (el) {
      return el.children.length === 0 && /My Departments, Groups & Ushirika/.test(el.textContent || '');
    });
    if (!head) return;
    const card = head.closest('.card') || head.parentElement.parentElement;
    if (!card || card.dataset.h27tiles) return;
    card.dataset.h27tiles = '1';

    (async function () {
      if (!me() || !sb()) return;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;overflow-x:auto;margin-top:10px;padding-bottom:4px';
      let html = '';

      const gm = await sb().from('church_group_members').select('role,church_groups(id,name)').eq('user_id', me().id);
      (gm.data || []).forEach(function (m) {
        const g = m.church_groups || {};
        html += '<div onclick="ggOpenGroup && ggOpenGroup(\'' + g.id + '\')" style="min-width:150px;border-radius:16px;padding:14px;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;cursor:pointer">'
          + '<i class="fas fa-users"></i><div style="font-weight:800;margin-top:6px">' + esc(g.name || 'Group') + '</div>'
          + '<span style="font-size:.65rem;background:rgba(255,255,255,.25);padding:2px 8px;border-radius:20px">' + esc(m.role || 'Member') + '</span></div>';
      });

      const um = await sb().from('ushirika_members').select('role,ushirikas(id,name)').eq('user_id', me().id);
      (um.data || []).forEach(function (m) {
        const u = m.ushirikas || {};
        html += '<div onclick="c26OpenGroup(\'ushirika\',\'' + u.id + '\')" style="min-width:150px;border-radius:16px;padding:14px;background:linear-gradient(135deg,#10B981,#06B6D4);color:#fff;cursor:pointer">'
          + '<i class="fas fa-people-group"></i><div style="font-weight:800;margin-top:6px">' + esc(u.name || 'Ushirika') + '</div>'
          + '<span style="font-size:.65rem;background:rgba(255,255,255,.25);padding:2px 8px;border-radius:20px">' + esc(m.role || 'Member') + '</span></div>';
      });

      if (html) { row.innerHTML = html; card.appendChild(row); }
    })();
  }

  // ============ QUICK ACTIONS ============
  function h27QuickActions() {
    const grid = document.querySelector('#quickActionModal .grid-2');
    if (!grid || grid.dataset.h27) return;
    grid.dataset.h27 = '1';
    grid.insertAdjacentHTML('beforeend',
      '<div class="mini-card mc-purple" onclick="closeModalDirect();h27Go(\'h27-forum\')"><i class="fas fa-comments"></i><div class="mc-title">Forum</div></div>'
      + '<div class="mini-card mc-gold" onclick="closeModalDirect();h27Go(\'h27-plans\')"><i class="fas fa-calendar-check"></i><div class="mc-title">Plans</div></div>'
      + '<div class="mini-card mc-green" onclick="closeModalDirect();h27Go(\'h27-prayer\')"><i class="fas fa-hands-praying"></i><div class="mc-title">Prayer Wall</div></div>');
  }

  window.h27Go = function (id) {
    if (window.c26OrigSwitch) window.c26OrigSwitch('home');
    else if (window.switchSection) window.switchSection('home');
    setTimeout(function () {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  // ============ MODULES SHELL ============
  function h27Ensure() {
    const home = homeEl(); if (!home || !homeActive()) return;
    if (document.getElementById('h27-modules')) return;

    const wrap = document.createElement('div');
    wrap.id = 'h27-modules';
    wrap.innerHTML =
      // PRAYER WALL
      '<div class="card" id="h27-prayer" style="border-radius:20px;margin-top:16px;overflow:hidden">'
      + '<div style="background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#fff;padding:14px 16px;font-weight:800"><i class="fas fa-hands-praying"></i> Prayer Wall</div>'
      + '<div style="padding:14px"><textarea class="form-textarea" id="h27PrayerText" rows="2" placeholder="Share a prayer request..."></textarea>'
      + '<div style="display:flex;gap:10px;align-items:center;margin:8px 0"><span style="font-size:.8rem;color:var(--text-light)">Anonymous</span><input type="checkbox" id="h27PrayerAnon"></div>'
      + '<button class="btn btn-primary btn-block" onclick="h27SubmitPrayer()"><i class="fas fa-paper-plane"></i> Pray</button>'
      + '<div id="h27PrayerList" style="margin-top:12px"></div></div></div>'

      // PUBLIC FORUM
      + '<div class="card" id="h27-forum" style="border-radius:20px;margin-top:16px;overflow:hidden">'
      + '<div style="background:linear-gradient(135deg,#4F46E5,#06B6D4);color:#fff;padding:14px 16px;font-weight:800"><i class="fas fa-comments"></i> Public Forum</div>'
      + '<div style="padding:14px"><textarea class="form-textarea" id="h27PostText" rows="2" placeholder="Post to the public forum..."></textarea>'
      + '<div class="media-upload" id="h27PostUpload" onclick="c26Attach(\'h27post\',\'h27PostUpload\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media (any format)</span></div>'
      + '<button class="btn btn-primary btn-block" style="margin-top:8px" onclick="h27SubmitPost()"><i class="fas fa-paper-plane"></i> Post</button>'
      + '<div id="h27PostList" style="margin-top:12px"></div></div></div>'

      // PLANS
      + '<div class="card" id="h27-plans" style="border-radius:20px;margin-top:16px;overflow:hidden">'
      + '<div style="background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;padding:14px 16px;font-weight:800"><i class="fas fa-calendar-check"></i> Plans</div>'
      + '<div style="padding:14px"><button class="btn btn-warm btn-block" onclick="h27PlanModal()"><i class="fas fa-plus"></i> Create Plan</button>'
      + '<div id="h27PlanList" style="margin-top:12px"></div></div></div>';

    home.appendChild(wrap);
    h27LoadPrayers(); h27LoadForum(); h27LoadPlans();
  }

  // ============ PRAYER WALL ============
  window.h27SubmitPrayer = async function () {
    const t = document.getElementById('h27PrayerText').value.trim();
    if (!t) return alert('Write a prayer.');
    const anon = document.getElementById('h27PrayerAnon').checked;
    const r = await sb().from('community_prayers').insert([{ user_id: me().id, text: t, anonymous: anon }]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h27PrayerText').value = '';
    h27LoadPrayers();
  };

  async function h27LoadPrayers() {
    const box = document.getElementById('h27PrayerList'); if (!box) return;
    const r = await sb().from('community_prayers').select('*').order('created_at', { ascending: false }).limit(20);
    if (r.error) { box.innerHTML = ''; return; }
    const us = await users();
    box.innerHTML = (r.data || []).map(function (p) {
      const u = us.find(x => x.id === p.user_id);
      const name = p.anonymous ? '🕊️ Anonymous' : ((u && u.name) || 'Member');
      return '<div style="background:var(--bg);border-radius:14px;padding:10px;margin-bottom:8px"><b style="font-size:.8rem">' + esc(name) + '</b>'
        + '<div style="font-size:.9rem;white-space:pre-wrap">' + esc(p.text) + '</div>'
        + '<div style="font-size:.68rem;color:var(--text-lighter)">' + fdate(p.created_at) + '</div></div>';
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;text-align:center">No prayers yet.</div>';
  }

  // ============ PUBLIC FORUM (nested comments) ============
  window.h27SubmitPost = async function () {
    const t = document.getElementById('h27PostText').value.trim();
    const f = window._c26Media && window._c26Media.h27post;
    if (!t && !f) return alert('Write something or add media.');
    let url = null; if (f) url = await up(f, 'forum');
    const r = await sb().from('community_posts').insert([{ group_type: 'forum', group_id: 'public-forum', user_id: me().id, text: t, media_url: url }]);
    if (r.error) return alert(r.error.message);
    if (window._c26Media) window._c26Media.h27post = null;
    const u = document.getElementById('h27PostUpload'); if (u) u.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Add media (any format)</span>';
    document.getElementById('h27PostText').value = '';
    h27LoadForum();
  };

  async function h27LoadForum() {
    const box = document.getElementById('h27PostList'); if (!box) return;
    const posts = await sb().from('community_posts').select('*')
      .eq('group_type', 'forum').eq('group_id', 'public-forum')
      .order('created_at', { ascending: false }).limit(30);
    if (posts.error) { box.innerHTML = ''; return; }
    const ids = (posts.data || []).map(p => p.id);
    let cs = { data: [] };
    if (ids.length) cs = await sb().from('community_comments').select('*').in('post_id', ids).order('created_at');
    const us = await users();
    window._h27users = us;
    const byPost = {};
    (cs.data || []).forEach(function (c) { (byPost[c.post_id] = byPost[c.post_id] || []).push(c); });

    box.innerHTML = (posts.data || []).map(function (p) {
      const u = us.find(x => x.id === p.user_id);
      return '<div style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">'
        + '<div style="display:flex;gap:8px;align-items:center">' + avatarHtml(u, 36)
        + '<div><b style="font-size:.85rem">' + esc((u && u.name) || 'Member') + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div></div>'
        + '<div style="white-space:pre-wrap;margin:6px 0">' + esc(p.text || '') + '</div>' + mediaHtml(p.media_url)
        + renderComments(buildTree(byPost[p.id] || []), 0, p.id)
        + '<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" id="h27c-' + p.id + '" placeholder="Comment..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="c26Attach(\'h27c_' + p.id + '\',\'h27cu-' + p.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h27cu-' + p.id + '"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h27SubmitComment(\'' + p.id + '\',null)"><i class="fas fa-paper-plane"></i></button></div>'
        + '</div>';
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;text-align:center">No posts yet. Be the first!</div>';
  }

  function buildTree(list) {
    const map = {}; const roots = [];
    list.forEach(function (c) { c._kids = []; map[c.id] = c; });
    list.forEach(function (c) {
      if (c.parent_comment_id && map[c.parent_comment_id]) map[c.parent_comment_id]._kids.push(c);
      else roots.push(c);
    });
    return roots;
  }

  function renderComments(list, depth, postId) {
    const us = window._h27users || [];
    return list.map(function (c) {
      const u = us.find(x => x.id === c.user_id);
      return '<div style="margin-left:' + Math.min(depth, 4) * 16 + 'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px">'
        + '<div style="display:flex;gap:6px;align-items:center">' + avatarHtml(u, 26)
        + '<b style="font-size:.75rem">' + esc((u && u.name) || 'Member') + '</b></div>'
        + '<div style="font-size:.85rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text || '') + '</div>' + mediaHtml(c.media_url)
        + '<button style="border:none;background:none;color:var(--primary);font-size:.7rem;font-weight:700;margin-top:4px" onclick="h27ToggleReply(\'' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button>'
        + '<div id="h27r-' + c.id + '" style="display:none;margin-top:6px;display:none">'
        + '<div style="display:flex;gap:6px"><input class="form-input" id="h27rt-' + c.id + '" placeholder="Reply..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="c26Attach(\'h27r_' + c.id + '\',\'h27ru-' + c.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h27ru-' + c.id + '"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h27SubmitComment(\'' + postId + '\',\'' + c.id + '\')"><i class="fas fa-paper-plane"></i></button></div></div>'
        + renderComments(c._kids || [], depth + 1, postId)
        + '</div>';
    }).join('');
  }

  window.h27ToggleReply = function (id) {
    const el = document.getElementById('h27r-' + id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };

  window.h27SubmitComment = async function (postId, parentId) {
    const inputId = parentId ? 'h27rt-' + parentId : 'h27c-' + postId;
    const t = document.getElementById(inputId).value.trim();
    const key = parentId ? 'h27r_' + parentId : 'h27c_' + postId;
    const f = window._c26Media && window._c26Media[key];
    if (!t && !f) return;
    let url = null; if (f) url = await up(f, 'forum-comments');
    const r = await sb().from('community_comments').insert([{
      post_id: postId, user_id: me().id, text: t, media_url: url,
      parent_comment_id: parentId || null
    }]);
    if (r.error) return alert(r.error.message);
    if (window._c26Media) window._c26Media[key] = null;
    h27LoadForum();
  };

  // ============ PLANS ============
  window.h27PlanModal = function () {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="h27PlanModal" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-calendar-check"></i> Create Plan</div>'
      + '<div class="form-group"><label class="form-label">Type</label><select class="form-select" id="h27PlanType"><option>Personal (Private)</option><option>Personal (Public)</option><option>Community</option></select></div>'
      + '<div class="form-group"><label class="form-label">Title</label><input class="form-input" id="h27PlanTitle"></div>'
      + '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="h27PlanDesc" rows="2"></textarea></div>'
      + '<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="h27PlanDate" type="datetime-local"></div>'
      + '<button class="btn btn-primary btn-block" onclick="h27SavePlan()">Create</button></div></div>');
  };

  window.h27SavePlan = async function () {
    const title = document.getElementById('h27PlanTitle').value.trim();
    if (!title) return alert('Title required.');
    const r = await sb().from('community_plans').insert([{
      user_id: me().id,
      type: document.getElementById('h27PlanType').value,
      title: title,
      description: document.getElementById('h27PlanDesc').value.trim(),
      plan_date: document.getElementById('h27PlanDate').value || null
    }]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h27PlanModal').remove();
    h27LoadPlans();
  };

  async function h27LoadPlans() {
    const box = document.getElementById('h27PlanList'); if (!box) return;
    const r = await sb().from('community_plans').select('*').order('created_at', { ascending: false }).limit(30);
    if (r.error) { box.innerHTML = ''; return; }
    const us = await users();
    const ids = (r.data || []).map(p => p.id);
    let pm = { data: [] };
    if (ids.length) pm = await sb().from('community_plan_members').select('*').in('plan_id', ids);
    const joined = {};
    (pm.data || []).forEach(function (m) { (joined[m.plan_id] = joined[m.plan_id] || []).push(m.user_id); });

    box.innerHTML = (r.data || []).map(function (p) {
      const u = us.find(x => x.id === p.user_id);
      const members = joined[p.id] || [];
      const iAm = members.includes(me() && me().id);
      return '<div style="background:var(--bg);border-radius:14px;padding:10px;margin-bottom:8px">'
        + '<div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:.9rem">' + esc(p.title) + '</b>'
        + '<span style="font-size:.65rem;background:var(--gradient-warm);color:#fff;padding:2px 8px;border-radius:20px">' + esc(p.type) + '</span></div>'
        + (p.description ? '<div style="font-size:.8rem;color:var(--text-light)">' + esc(p.description) + '</div>' : '')
        + '<div style="font-size:.7rem;color:var(--text-lighter);margin-top:4px">' + (u && u.name ? esc(u.name) + ' • ' : '') + (p.plan_date ? new Date(p.plan_date).toLocaleString() : '') + ' • ' + members.length + ' joined</div>'
        + '<button class="btn ' + (iAm ? 'btn-danger' : 'btn-primary') + ' btn-sm" style="margin-top:6px" onclick="h27ToggleJoin(\'' + p.id + '\')">' + (iAm ? 'Leave' : 'Join') + '</button>'
        + '</div>';
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;text-align:center">No plans yet.</div>';
  }

  window.h27ToggleJoin = async function (planId) {
    const existing = await sb().from('community_plan_members').select('*').eq('plan_id', planId).eq('user_id', me().id);
    if ((existing.data || []).length) {
      await sb().from('community_plan_members').delete().eq('plan_id', planId).eq('user_id', me().id);
    } else {
      const r = await sb().from('community_plan_members').insert([{ plan_id: planId, user_id: me().id }]);
      if (r.error) return alert(r.error.message);
    }
    h27LoadPlans();
  };

  // ============ SYNC ============
  function h27Sync() {
    if (!homeActive()) return;
    h27RenameAndTiles();
    h27QuickActions();
    h27Ensure();
  }
  h27Sync();
  setInterval(h27Sync, 1500);
})();
