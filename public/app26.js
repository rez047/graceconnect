// public/app27.js v3 — tiles-only home, full-page modules, fixed forum UUID,
// chat buttons injected across departments/ushirika/groups.

(function () {
  console.log('✝️ app27.js v3');

  const FORUM_GID = '11111111-1111-1111-1111-111111111111';

  window._h27 = window._h27 || { chatUid: null, chatOpen: false, chatUser: null, chatFile: null };
  const H = window._h27;

  function sb() { return window.sb; }
  function me() { return window.user; }
  function esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function ini(n) { return window.ini ? window.ini(n) : (n ? String(n).split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase() : '?'); }
  function fdate(t) { return t ? new Date(t).toLocaleDateString() : ''; }
  function ftime(t) { return t ? new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''; }
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
    if (r.error) { alert('Upload failed: ' + r.error.message); return null; }
    return sb().storage.from('media').getPublicUrl(n).data.publicUrl;
  }
  function mediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return '<img src="'+url+'" style="width:100%;max-height:260px;object-fit:cover;border-radius:14px;margin-top:6px">';
    if (/\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi|3gp)$/i.test(url)) return '<video src="'+url+'" controls playsinline style="width:100%;max-height:300px;border-radius:14px;margin-top:6px"></video>';
    if (/\.(mp3|wav|m4a|aac|ogg)$/i.test(url)) return '<audio src="'+url+'" controls style="width:100%;margin-top:6px"></audio>';
    return '<a href="'+url+'" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:6px"><i class="fas fa-paperclip"></i> File</a>';
  }
  function homeEl() { return document.querySelector('#section-home') || document.querySelector('#home-main'); }
  function homeActive() { const h = document.querySelector('#section-home'); return h && h.classList.contains('active'); }

  // =====================================================
  // CHAT PANEL (send messages, all video formats, delete own)
  // =====================================================
  window.c26OpenChat = function (uid) { return window.h27ChatWith(uid); };

  window.h27ChatWith = async function (uid) {
    if (!me()) return alert('Log in first.');
    if (!uid || uid === me().id) return;
    H.chatUid = uid; H.chatOpen = true; H.chatFile = null;
    const us = await users();
    H.chatUser = us.find(u => u.id === uid) || { name: 'Chat' };
    chatShell();
    chatLoad();
  };

  function chatShell() {
    if (document.getElementById('h27Chat')) return;
    const d = document.createElement('div');
    d.id = 'h27Chat';
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;flex-direction:column';
    d.innerHTML =
      '<div style="display:flex;gap:10px;align-items:center;padding:12px 14px;background:var(--gradient);color:#fff">'
      + '<button onclick="h27ChatClose()" style="border:none;background:none;color:#fff;font-size:1.1rem"><i class="fas fa-arrow-left"></i></button>'
      + '<span id="h27ChatAvatar"></span>'
      + '<div style="flex:1"><div id="h27ChatName" style="font-weight:800"></div><div style="font-size:.7rem;opacity:.85">Chat</div></div>'
      + '</div>'
      + '<div id="h27ChatMsgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px"></div>'
      + '<div style="display:flex;gap:6px;align-items:center;padding:10px;border-top:1px solid var(--border);background:#fff">'
      + '<button class="btn btn-secondary btn-sm" onclick="h27ChatAttach()"><i class="fas fa-paperclip"></i></button>'
      + '<span id="h27ChatFileLbl" style="font-size:.7rem;color:var(--text-light);max-width:70px;overflow:hidden"></span>'
      + '<input class="form-input" id="h27ChatInput" placeholder="Message..." style="flex:1" onkeypress="if(event.key===\'Enter\')h27ChatSend()">'
      + '<button class="btn btn-primary btn-sm" onclick="h27ChatSend()"><i class="fas fa-paper-plane"></i></button>'
      + '</div>';
    document.body.appendChild(d);
    document.getElementById('h27ChatName').textContent = (H.chatUser && H.chatUser.name) || 'Chat';
    document.getElementById('h27ChatAvatar').innerHTML = avatarHtml(H.chatUser, 36);
  }

  window.h27ChatClose = function () {
    H.chatOpen = false;
    const el = document.getElementById('h27Chat');
    if (el) el.remove();
  };

  window.h27ChatAttach = function () {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '*/*';
    i.onchange = function () {
      const f = i.files && i.files[0]; if (!f) return;
      H.chatFile = f;
      document.getElementById('h27ChatFileLbl').textContent = f.name;
    };
    i.click();
  };

  window.h27ChatSend = async function () {
    const input = document.getElementById('h27ChatInput');
    const text = input.value.trim();
    if (!text && !H.chatFile) return;
    let url = null;
    if (H.chatFile) url = await up(H.chatFile, 'chat');
    const r = await sb().from('community_chat').insert([{
      sender_id: me().id, receiver_id: H.chatUid, text: text, media_url: url
    }]);
    if (r.error) return alert(r.error.message);
    input.value = ''; H.chatFile = null;
    document.getElementById('h27ChatFileLbl').textContent = '';
    chatLoad();
  };

  window.h27ChatDel = async function (id) {
    if (!confirm('Delete this message?')) return;
    await sb().from('community_chat').delete().eq('id', id).eq('sender_id', me().id);
    chatLoad();
  };

  async function chatLoad() {
    const box = document.getElementById('h27ChatMsgs');
    if (!box || !H.chatOpen) return;
    const a = me().id, b = H.chatUid;
    const r = await sb().from('community_chat').select('*')
      .or('and(sender_id.eq.' + a + ',receiver_id.eq.' + b + '),and(sender_id.eq.' + b + ',receiver_id.eq.' + a + ')')
      .order('created_at', { ascending: true }).limit(300);
    if (r.error) { box.innerHTML = '<div style="color:#EF4444">' + esc(r.error.message) + '</div>'; return; }
    box.innerHTML = (r.data || []).map(function (m) {
      const mine = m.sender_id === a;
      return '<div style="align-self:' + (mine ? 'flex-end' : 'flex-start') + ';max-width:78%;border-radius:16px;padding:8px 12px;'
        + (mine ? 'background:var(--gradient);color:#fff' : 'background:#fff;border:1px solid var(--border)') + '">'
        + (m.text ? '<div style="white-space:pre-wrap;font-size:.9rem">' + esc(m.text) + '</div>' : '')
        + mediaHtml(m.media_url)
        + '<div style="display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:4px">'
        + '<span style="font-size:.6rem;opacity:.7">' + ftime(m.created_at) + '</span>'
        + (mine ? '<button onclick="h27ChatDel(\'' + m.id + '\')" style="border:none;background:none;color:#fff;font-size:.7rem"><i class="fas fa-trash"></i></button>' : '')
        + '</div></div>';
    }).join('') || '<div style="text-align:center;color:var(--text-light);font-size:.85rem;margin:auto">No messages yet. Say hi! 👋</div>';
    box.scrollTop = box.scrollHeight;
  }

  setInterval(function () { if (H.chatOpen) chatLoad(); }, 3000);

  // =====================================================
  // CHAT BUTTON INJECTION — departments, ushirika, groups, feeds
  // =====================================================
  async function h27InjectChat() {
    const us = await users();
    if (!us || !us.length) return;

    const scopes = ['#c26-members', '#c26-leadership', '#c26-feed', '#gg-tab-members', '#gg-tab-feed', '#h27PostList'];

    scopes.forEach(function (sel) {
      const scope = document.querySelector(sel);
      if (!scope) return;
      const cards = sel === '#h27PostList' ? Array.from(scope.children) : Array.from(scope.querySelectorAll('.card'));

      cards.forEach(function (card) {
        if (!card || !card.querySelectorAll) return;
        if (card.querySelector('[data-h27chat]')) return;

        const leaves = Array.from(card.querySelectorAll('div,span,b,strong')).filter(function (d) {
          return d.children.length === 0;
        });

        for (let i = 0; i < leaves.length; i++) {
          const nm = (leaves[i].textContent || '').trim();
          if (nm.length < 2 || nm.length > 40) continue;
          const u = us.find(function (x) { return x.name && x.name.trim().toLowerCase() === nm.toLowerCase(); });
          if (!u) continue;
          if (me() && u.id === me().id) { card.setAttribute('data-h27chat', 'self'); return; }
          const btn = document.createElement('button');
          btn.setAttribute('data-h27chat', '1');
          btn.className = 'btn btn-secondary btn-sm';
          btn.style.marginLeft = '6px';
          btn.title = 'Chat';
          btn.innerHTML = '<i class="fas fa-comment-dots"></i>';
          btn.onclick = (function (id) { return function () { window.h27ChatWith(id); }; })(u.id);
          leaves[i].parentNode.insertBefore(btn, leaves[i].nextSibling);
          return;
        }
        card.setAttribute('data-h27chat', 'scan');
      });
    });
  }
  setInterval(h27InjectChat, 2000);

  // =====================================================
  // EXACT MEMBERSHIPS LIST → FORUM
  // =====================================================
  window.h27MyListModal = async function () {
    if (!me()) return alert('Log in first.');
    const d = await sb().from('department_members').select('role,departments(id,name)').eq('user_id', me().id);
    const u = await sb().from('ushirika_members').select('role,ushirikas(id,name)').eq('user_id', me().id);
    const g = await sb().from('church_group_members').select('role,church_groups(id,name)').eq('user_id', me().id);

    function row(icon, grad, name, role, onclick) {
      return '<div onclick="' + onclick + '" style="display:flex;gap:10px;align-items:center;padding:10px;border-radius:14px;background:var(--bg);margin-bottom:8px;cursor:pointer">'
        + '<div style="width:40px;height:40px;border-radius:12px;background:' + grad + ';color:#fff;display:flex;align-items:center;justify-content:center"><i class="fas ' + icon + '"></i></div>'
        + '<div style="flex:1"><div style="font-weight:700">' + esc(name) + '</div><div style="font-size:.7rem;color:var(--text-light)">' + esc(role) + '</div></div>'
        + '<i class="fas fa-chevron-right" style="color:var(--text-lighter)"></i></div>';
    }

    let html = '<div class="modal-overlay show" id="h27MyList" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-id-badge"></i> My Departments, Groups & Ushirika</div>';

    html += '<div style="font-weight:800;margin:8px 0 6px;color:var(--primary)">Departments</div>';
    html += (d.data || []).map(function (m) {
      return row('fa-building', 'var(--gradient-dept)', (m.departments || {}).name || 'Department', m.role || 'Member',
        "this.closest('.modal-overlay').remove();c26OpenGroup('department','" + (m.departments || {}).id + "')");
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;margin-bottom:8px">None</div>';

    html += '<div style="font-weight:800;margin:8px 0 6px;color:var(--accent)">Ushirikas</div>';
    html += (u.data || []).map(function (m) {
      return row('fa-people-group', 'var(--gradient-chat)', (m.ushirikas || {}).name || 'Ushirika', m.role || 'Member',
        "this.closest('.modal-overlay').remove();c26OpenGroup('ushirika','" + (m.ushirikas || {}).id + "')");
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;margin-bottom:8px">None</div>';

    html += '<div style="font-weight:800;margin:8px 0 6px;color:var(--secondary)">Groups</div>';
    html += (g.data || []).map(function (m) {
      return row('fa-users', 'var(--gradient-warm)', (m.church_groups || {}).name || 'Group', m.role || 'Member',
        "this.closest('.modal-overlay').remove();ggOpenGroup && ggOpenGroup('" + (m.church_groups || {}).id + "')");
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;margin-bottom:8px">None</div>';

    html += '<button class="btn btn-secondary-alt btn-block" onclick="this.closest(\'.modal-overlay\').remove()">Close</button></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  };

  // =====================================================
  // HOME: rename + tap + TILES ONLY
  // =====================================================
  function h27RenameAndTiles() {
    const home = homeEl(); if (!home) return;

    home.querySelectorAll('*').forEach(function (el) {
      if (el.children.length === 0 && String(el.textContent || '').trim() === 'My Departments') {
        el.textContent = 'My Departments, Groups & Ushirika';
      }
    });

    const head = Array.from(home.querySelectorAll('*')).find(function (el) {
      return el.children.length === 0 && /My Departments, Groups & Ushirika/.test(el.textContent || '');
    });
    if (head && !head.dataset.h27tap) {
      head.dataset.h27tap = '1';
      head.style.cursor = 'pointer';
      head.onclick = function () { window.h27MyListModal(); };
    }

    const card = head ? (head.closest('.card') || head.parentElement.parentElement) : null;
    if (card && !card.dataset.h27tiles) {
      card.dataset.h27tiles = '1';
      (async function () {
        if (!me() || !sb()) return;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:10px;overflow-x:auto;margin-top:10px;padding-bottom:4px';
        let html = '';
        const gm = await sb().from('church_group_members').select('role,church_groups(id,name)').eq('user_id', me().id);
        (gm.data || []).forEach(function (m) {
          const g = m.church_groups || {};
          html += '<div onclick="ggOpenGroup && ggOpenGroup(\'' + g.id + '\')" style="min-width:150px;border-radius:16px;padding:14px;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;cursor:pointer;flex-shrink:0">'
            + '<i class="fas fa-users"></i><div style="font-weight:800;margin-top:6px">' + esc(g.name || 'Group') + '</div>'
            + '<span style="font-size:.65rem;background:rgba(255,255,255,.25);padding:2px 8px;border-radius:20px">' + esc(m.role || 'Member') + '</span></div>';
        });
        const um = await sb().from('ushirika_members').select('role,ushirikas(id,name)').eq('user_id', me().id);
        (um.data || []).forEach(function (m) {
          const u = m.ushirikas || {};
          html += '<div onclick="c26OpenGroup(\'ushirika\',\'' + u.id + '\')" style="min-width:150px;border-radius:16px;padding:14px;background:linear-gradient(135deg,#10B981,#06B6D4);color:#fff;cursor:pointer;flex-shrink:0">'
            + '<i class="fas fa-people-group"></i><div style="font-weight:800;margin-top:6px">' + esc(u.name || 'Ushirika') + '</div>'
            + '<span style="font-size:.65rem;background:rgba(255,255,255,.25);padding:2px 8px;border-radius:20px">' + esc(m.role || 'Member') + '</span></div>';
        });
        if (html) { row.innerHTML = html; card.appendChild(row); }
      })();
    }

  }

  function h27QuickActionsFab() {
    const grid = document.querySelector('#quickActionModal .grid-2');
    if (!grid || grid.dataset.h27) return;
    grid.dataset.h27 = '1';
    grid.insertAdjacentHTML('beforeend',
      '<div class="mini-card mc-purple" onclick="closeModalDirect();h27OpenPage(\'forum\')"><i class="fas fa-comments"></i><div class="mc-title">Forum</div></div>'
      + '<div class="mini-card mc-gold" onclick="closeModalDirect();h27OpenPage(\'plans\')"><i class="fas fa-calendar-check"></i><div class="mc-title">Plans</div></div>'
      + '<div class="mini-card mc-green" onclick="closeModalDirect();h27OpenPage(\'prayer\')"><i class="fas fa-hands-praying"></i><div class="mc-title">Prayer Wall</div></div>');
  }

  // =====================================================
  // FULL-PAGE MODULES
  // =====================================================
  function ensureH27Section() {
    let s = document.getElementById('section-h27');
    if (s) return s;
    s = document.createElement('div');
    s.id = 'section-h27'; s.className = 'section';
    s.innerHTML = '<div id="h27-root" class="sub-page active"></div>';
    (document.querySelector('main') || document.body).appendChild(s);
    return s;
  }

  function shell(title, icon, grad, body) {
    return '<button class="back-btn" onclick="h27BackHome()"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div style="border-radius:20px;padding:16px;color:#fff;background:' + grad + ';font-weight:800;font-size:1.15rem;margin-bottom:14px"><i class="fas ' + icon + '"></i> ' + title + '</div>'
      + body;
  }

  window.h27BackHome = function () {
    if (window.c26OrigSwitch) window.c26OrigSwitch('home');
    else if (window.switchSection) window.switchSection('home');
  };

  window.h27OpenPage = function (page) {
    const sec = ensureH27Section();
    document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
    sec.classList.add('active');
    document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) { b.classList.remove('active'); });
    const root = document.getElementById('h27-root');

    if (page === 'prayer') {
      root.innerHTML = shell('Prayer Wall', 'fa-hands-praying', 'linear-gradient(135deg,#8B5CF6,#EC4899)',
        '<div class="card" style="border-radius:20px"><textarea class="form-textarea" id="h27PrayerText" rows="2" placeholder="Share a prayer request..."></textarea>'
        + '<div style="display:flex;gap:10px;align-items:center;margin:8px 0"><span style="font-size:.8rem;color:var(--text-light)">Anonymous</span><input type="checkbox" id="h27PrayerAnon"></div>'
        + '<button class="btn btn-primary btn-block" onclick="h27SubmitPrayer()"><i class="fas fa-paper-plane"></i> Pray</button>'
        + '<div id="h27PrayerList" style="margin-top:12px"></div></div>');
      h27LoadPrayers();
    }

    if (page === 'forum') {
      root.innerHTML = shell('Public Forum', 'fa-comments', 'linear-gradient(135deg,#4F46E5,#06B6D4)',
        '<div class="card" style="border-radius:20px"><textarea class="form-textarea" id="h27PostText" rows="2" placeholder="Post to the public forum..."></textarea>'
        + '<div class="media-upload" id="h27PostUpload" onclick="c26Attach(\'h27post\',\'h27PostUpload\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media (any format)</span></div>'
        + '<button class="btn btn-primary btn-block" style="margin-top:8px" onclick="h27SubmitPost()"><i class="fas fa-paper-plane"></i> Post</button>'
        + '<div id="h27PostList" style="margin-top:12px"></div></div>');
      h27LoadForum();
    }

    if (page === 'plans') {
      root.innerHTML = shell('Plans', 'fa-calendar-check', 'linear-gradient(135deg,#F59E0B,#EF4444)',
        '<div class="card" style="border-radius:20px"><button class="btn btn-warm btn-block" onclick="h27PlanModal()"><i class="fas fa-plus"></i> Create Plan</button>'
        + '<div id="h27PlanList" style="margin-top:12px"></div></div>');
      h27LoadPlans();
    }

    window.scrollTo({ top: 0 });
  };

  window.h27Go = function (id) {
    const map = { 'h27-prayer': 'prayer', 'h27-forum': 'forum', 'h27-plans': 'plans' };
    window.h27OpenPage(map[id] || 'forum');
  };

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
    const r = await sb().from('community_prayers').select('*').order('created_at', { ascending: false }).limit(30);
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

  // ============ PUBLIC FORUM (fixed UUID + nested comments) ============
  window.h27SubmitPost = async function () {
    const t = document.getElementById('h27PostText').value.trim();
    const f = window._c26Media && window._c26Media.h27post;
    if (!t && !f) return alert('Write something or add media.');
    let url = null; if (f) url = await up(f, 'forum');
    const r = await sb().from('community_posts').insert([{ group_type: 'forum', group_id: FORUM_GID, user_id: me().id, text: t, media_url: url }]);
    if (r.error) return alert(r.error.message);
    if (window._c26Media) window._c26Media.h27post = null;
    const u = document.getElementById('h27PostUpload'); if (u) u.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Add media (any format)</span>';
    document.getElementById('h27PostText').value = '';
    h27LoadForum();
  };

  async function h27LoadForum() {
    const box = document.getElementById('h27PostList'); if (!box) return;
    const posts = await sb().from('community_posts').select('*')
      .eq('group_type', 'forum').eq('group_id', FORUM_GID)
      .order('created_at', { ascending: false }).limit(30);
    if (posts.error) { box.innerHTML = '<div style="color:#EF4444">' + esc(posts.error.message) + '</div>'; return; }
    const ids = (posts.data || []).map(p => p.id);
    let cs = { data: [] };
    if (ids.length) cs = await sb().from('community_comments').select('*').in('post_id', ids).order('created_at');
    const us = await users();
    window._h27users = us;
    const byPost = {};
    (cs.data || []).forEach(function (c) { (byPost[c.post_id] = byPost[c.post_id] || []).push(c); });

    box.innerHTML = (posts.data || []).map(function (p) {
      const u = us.find(x => x.id === p.user_id);
      return '<div class="card" style="border-radius:16px;margin-bottom:10px">'
        + '<div style="display:flex;gap:8px;align-items:center">' + avatarHtml(u, 36)
        + '<div style="flex:1"><b style="font-size:.85rem">' + esc((u && u.name) || 'Member') + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>'
        + '</div>'
        + '<div style="white-space:pre-wrap;margin:6px 0">' + esc(p.text || '') + '</div>' + mediaHtml(p.media_url)
        + renderComments(buildTree(byPost[p.id] || []), 0, p.id)
        + '<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" id="h27c-' + p.id + '" placeholder="Comment..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="c26Attach(\'h27c_' + p.id + '\',\'h27cu-' + p.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h27cu-' + p.id + '"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h27SubmitComment(\'' + p.id + '\',null)"><i class="fas fa-paper-plane"></i></button></div>'
        + '</div>';
    }).join('') || '<div style="color:var(--text-light);font-size:.85rem;text-align:center">No posts yet. Be the first!</div>';

    h27InjectChat();
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
        + '<b style="font-size:.75rem;flex:1">' + esc((u && u.name) || 'Member') + '</b>'
        + '</div>'
        + '<div style="font-size:.85rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text || '') + '</div>' + mediaHtml(c.media_url)
        + '<button style="border:none;background:none;color:var(--primary);font-size:.7rem;font-weight:700;margin-top:4px" onclick="h27ToggleReply(\'' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button>'
        + '<div id="h27r-' + c.id + '" style="display:none;margin-top:6px">'
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
      const iAm = me() && members.includes(me().id);
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
    h27QuickActionsFab();
  }
  h27Sync();
  setInterval(h27Sync, 1500);
})();
