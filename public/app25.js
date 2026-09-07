// public/app26.js v4 — Unified Community Engine
// CHANGED vs v3: c26ChangeRole (dept-method + /api/set-role fallback),
// c26SendRequest/c26RequestsModal/approve/reject (table + notification fallback),
// c26OpenChat (uses ORIGINAL chat so delete-message works as before).
// Everything else identical to v3.

(function () {
  console.log('✝️ app26.js v4');

  window._c26 = Object.assign({
    myDept: [], myUsh: [], myReqs: [],
    currentType: null, currentId: null,
    group: null, members: []
  }, window._c26 || {});
  window._c26Media = window._c26Media || {};
  const C = window._c26;

  function sb() { return window.sb; }
  function me() { return window.user; }
  function isAdmin() { return window.isAdmin ? window.isAdmin() : false; }
  function esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function ini(n) { return window.ini ? window.ini(n) : (n ? String(n).split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase() : '?'); }
  function fdate(t) { return window.fdate ? window.fdate(t) : (t ? new Date(t).toLocaleDateString() : ''); }
  function today() { return new Date().toISOString().slice(0,10); }

  function cfg(type) {
    if (type === 'department') return {
      groupTable:'departments', memberTable:'department_members', meetingTable:'department_meetings',
      fk:'department_id', label:'Department', gradient:'var(--gradient-dept)'
    };
    return {
      groupTable:'ushirikas', memberTable:'ushirika_members', meetingTable:'ushirika_meetings',
      fk:'ushirika_id', label:'Ushirika', gradient:'var(--gradient-chat)'
    };
  }

  function iconFor(name, custom) {
    if (custom) return custom;
    const n = String(name || '').toLowerCase();
    const map = [
      [/ict|media|tech|computer|sound|audio|video|multimedia|it\b/, 'fa-laptop-code'],
      [/choir|music|worship|sing|praise/, 'fa-music'],
      [/youth|young/, 'fa-user-graduate'],
      [/women|ladies|mama/, 'fa-venus'],
      [/men|baba|father/, 'fa-mars'],
      [/child|kid|sunday school|baby/, 'fa-child'],
      [/prayer|intercess/, 'fa-hands-praying'],
      [/usher|welcom/, 'fa-door-open'],
      [/finance|treasur|steward/, 'fa-coins'],
      [/evangelis|outreach|mission/, 'fa-globe-africa'],
      [/deacon/, 'fa-handshake-angle'],
      [/dance|drama/, 'fa-masks-theater'],
      [/hospitality|cater/, 'fa-utensils'],
      [/security|guard/, 'fa-shield-halved'],
      [/teach|school|education/, 'fa-book-open'],
      [/health|medical|nurse/, 'fa-heart-pulse'],
      [/transport|driver/, 'fa-car']
    ];
    for (const m of map) if (m[0].test(n)) return m[1];
    return 'fa-users';
  }

  async function getUsers() {
    if (window.usersData && window.usersData.length) return window.usersData;
    let { data, error } = await sb().from('profiles').select('id,name,profile_pic,email,role').order('name');
    if (error) ({ data } = await sb().from('profiles').select('id,name,profile_pic,role').order('name'));
    window.usersData = data || [];
    return window.usersData;
  }

  function avatarHtml(u, size) {
    const s = size || 44;
    if (u && u.profile_pic) return '<img src="' + u.profile_pic + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;object-fit:cover;flex-shrink:0">';
    return '<div class="post-avatar" style="width:' + s + 'px;height:' + s + 'px">' + ini(u && u.name) + '</div>';
  }

  async function upload(file, path) {
    if (!file) return null;
    if (window.uploadMediaFile) { try { return await window.uploadMediaFile(file); } catch (e) {} }
    if (!sb()) return null;
    const name = (path||'media') + '/' + Date.now() + '_' + file.name;
    const { error } = await sb().storage.from('media').upload(name, file);
    if (error) { alert('Upload failed: ' + error.message); return null; }
    return sb().storage.from('media').getPublicUrl(name).data.publicUrl;
  }

  function notify(uid, title, msg) {
    if (!uid || !me() || uid === me().id) return;
    sb().from('notifications').insert([{ user_id: uid, title: title, message: msg, body: msg }])
      .then(function (r) {
        if (r && r.error) sb().from('notifications').insert([{ user_id: uid, title: title, message: msg }]).then(function(){});
      });
  }

  window.c26Attach = function (key, labelId) {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = '*/*';
    i.onchange = function () {
      const f = i.files && i.files[0]; if (!f) return;
      window._c26Media[key] = f;
      const l = document.getElementById(labelId);
      if (l) l.innerHTML = '<i class="fas fa-check-circle"></i> ' + esc(f.name);
    };
    i.click();
  };

  window.c26Close = function (id) { const el = document.getElementById(id); if (el) el.remove(); };

  function mediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return '<img src="'+url+'" style="width:100%;max-height:280px;object-fit:cover;border-radius:14px;margin-top:8px">';
    if (/\.(mp4|webm|ogg)$/i.test(url)) return '<video src="'+url+'" controls style="width:100%;max-height:280px;border-radius:14px;margin-top:8px"></video>';
    if (/\.(mp3|wav|m4a|aac)$/i.test(url)) return '<audio src="'+url+'" controls style="width:100%;margin-top:8px"></audio>';
    return '<a href="'+url+'" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:8px"><i class="fas fa-paperclip"></i> Attachment</a>';
  }

  // ============ NAV ============
  function c26NavCss() {
    if (document.getElementById('c26NavCss')) return;
    const s = document.createElement('style');
    s.id = 'c26NavCss';
    s.textContent =
      '.bottom-nav{overflow-x:auto;overflow-y:hidden;justify-content:flex-start;gap:2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
      '.bottom-nav::-webkit-scrollbar{display:none}' +
      '.bottom-nav .nav-item{flex:0 0 auto;min-width:62px;font-size:.6rem}';
    document.head.appendChild(s);
  }

  function c26CleanNav() {
    ['d43NavBtn', 'dp23NavBtn'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) {
      if (b.id !== 'c26NavBtn' && /department/i.test(b.textContent || '')) b.remove();
    });
  }

  function c26InjectNav() {
    c26CleanNav();
    const nav = document.querySelector('.bottom-nav');
    if (!nav || document.getElementById('c26NavBtn')) return;
    const b = document.createElement('button');
    b.id = 'c26NavBtn'; b.className = 'nav-item';
    b.innerHTML = '<i class="fas fa-building"></i>Dept';
    b.onclick = function () { c26OpenHome('department'); };
    const items = Array.from(nav.querySelectorAll('.nav-item'));
    const g = document.getElementById('ggNavBtn') || items.find(x=>/groups/i.test(x.textContent||''));
    const u = items.find(x=>/ushirika/i.test(x.textContent||''));
    const d = items.find(x=>/discover/i.test(x.textContent||''));
    if (g) nav.insertBefore(b, g); else if (u) u.after(b); else if (d) nav.insertBefore(b, d); else nav.appendChild(b);
  }

  const _origSwitch = window.switchSection;
  window.c26OrigSwitch = _origSwitch;
  window.switchSection = function (name) {
    if (name === 'ushirika') { c26OpenHome('ushirika'); return; }
    if (name === 'department') { c26OpenHome('department'); return; }
    if (_origSwitch) return _origSwitch.apply(this, arguments);
  };

  window.c26Back = function () { if (_origSwitch) _origSwitch('home'); };

  // ============ CHAT (uses ORIGINAL chat UI → delete messages works as before) ============
  window.c26OpenChat = function (uid) {
    if (!me()) return alert('Log in first.');
    const u = (window.usersData || []).find(x => x.id === uid);
    const name = (u && u.name) || 'Chat';

    // 1) known names
    const names = ['openChat','openChatWith','openUserChat','openDirectChat','startChat','startChatWith','chatWith','openConvo','openConversation'];
    for (let i = 0; i < names.length; i++) {
      if (typeof window[names[i]] === 'function') { try { window[names[i]](uid); return; } catch (e) {} }
    }
    // 2) auto-discover any window function that looks like a chat opener
    for (const k in window) {
      if (k === 'c26OpenChat') continue;
      if (/^(open|start)?chat(with|user|modal|box)?$/i.test(k) && typeof window[k] === 'function') {
        try { window[k](uid); return; } catch (e) {}
      }
    }
    // 3) fallback: wire built-in discover chat
    window.currentChatUserId = uid;
    const cn = document.getElementById('chatName'); if (cn) cn.textContent = name;
    const ca = document.getElementById('chatAvatar'); if (ca) ca.textContent = ini(name);
    if (window.c26OrigSwitch) window.c26OrigSwitch('discover');
    if (window.showSubPage) window.showSubPage('discover-chat');
    ['loadChatMessages','loadChat','renderChat','refreshChat','loadMessages'].forEach(function (fn) {
      if (typeof window[fn] === 'function') { try { window[fn](uid); } catch (e) {} }
    });
  };

  // ============ SECTION ============
  function ensureSection() {
    let s = document.getElementById('section-c26');
    if (s) return s;
    s = document.createElement('div');
    s.id = 'section-c26'; s.className = 'section';
    s.innerHTML = '<div id="c26-root" class="sub-page active"></div>';
    (document.querySelector('main') || document.body).appendChild(s);
    return s;
  }

  function show(html) {
    const s = ensureSection();
    document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
    s.classList.add('active');
    document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    const r = document.getElementById('c26-root');
    if (r) r.innerHTML = html;
    window.scrollTo({ top: 0 });
  }

  // ============ PERMISSIONS ============
  async function loadMy() {
    if (!me() || !sb()) return;
    const a = await sb().from('department_members').select('*').eq('user_id', me().id);
    const b = await sb().from('ushirika_members').select('*').eq('user_id', me().id);
    C.myDept = a.data || []; C.myUsh = b.data || [];
    const r = await sb().from('department_join_requests').select('*').eq('user_id', me().id).eq('status', 'pending');
    C.myReqs = r.data || [];
  }
  function myRole(type, id) {
    const list = type === 'department' ? C.myDept : C.myUsh;
    const key = type === 'department' ? 'department_id' : 'ushirika_id';
    const m = list.find(x => x[key] === id);
    return m ? String(m.role || 'Member').toLowerCase() : '';
  }
  function isMember(type, id) { return !!myRole(type, id); }
  function canManageGroup(t, id) { if (isAdmin()) return true; return ['leader','chairman'].includes(myRole(t,id)); }
  function canManageMinutes(t, id) { if (isAdmin()) return true; return ['leader','chairman','secretary'].includes(myRole(t,id)); }

  // ============ HOME LIST ============
  window.c26OpenHome = async function (type) {
    if (!me()) return alert('Please log in first.');
    C.currentType = type;
    const cf = cfg(type);
    show('<div class="card">Loading...</div>');
    await loadMy();
    const { data, error } = await sb().from(cf.groupTable).select('*').order('name');
    if (error) return show('<div class="card" style="color:#EF4444">' + esc(error.message) + '</div>');

    let html = '<button class="back-btn" onclick="c26Back()"><i class="fas fa-arrow-left"></i> Back</button>';
    html += '<div class="section-title-app"><i class="fas ' + (type==='department'?'fa-building':'fa-people-group') + '"></i> ' + cf.label + 's</div>';
    if (isAdmin()) html += '<button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="c26EditGroup(\''+type+'\',null)"><i class="fas fa-plus"></i> Add ' + cf.label + '</button>';

    (data || []).forEach(g => {
      const mine = isMember(type, g.id);
      const pending = type === 'department' && (C.myReqs || []).some(r => r.department_id === g.id);
      let action;
      if (mine || isAdmin()) action = '<button class="btn btn-primary btn-sm" onclick="c26OpenGroup(\''+type+'\',\''+g.id+'\')">Open</button>';
      else if (type === 'department') {
        action = pending
          ? '<button class="btn btn-secondary btn-sm" disabled><i class="fas fa-clock"></i> Pending</button>'
          : '<button class="btn btn-secondary btn-sm" onclick="c26RequestModal(\''+g.id+'\')"><i class="fas fa-paper-plane"></i> Request</button>';
      } else {
        action = '<button class="btn btn-secondary btn-sm" onclick="c26Join(\''+type+'\',\''+g.id+'\')">Join</button>';
      }
      html += '<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:12px;align-items:center">'
        + '<div style="width:52px;height:52px;border-radius:16px;background:' + cf.gradient + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;flex-shrink:0"><i class="fas ' + iconFor(g.name, g.icon) + '"></i></div>'
        + '<div style="flex:1;min-width:0"><div style="font-weight:800">' + esc(g.name) + '</div><div style="font-size:.83rem;color:var(--text-light)">' + esc(g.description || g.location || cf.label) + '</div>'
        + (mine ? '<div style="font-size:.72rem;color:var(--accent);margin-top:2px"><i class="fas fa-check"></i> Member</div>' : '') + '</div>'
        + '<div style="display:flex;flex-direction:column;gap:6px">' + action + '</div></div></div>';
    });
    show(html);
  };

  // ============ JOIN (direct for ushirika/groups) ============
  window.c26Join = async function (type, id) {
    if (!me()) return alert('Log in first.');
    const cf = cfg(type);
    const payload = {}; payload[cf.fk] = id; payload.user_id = me().id; payload.role = 'Member';
    let { error } = await sb().from(cf.memberTable).upsert(payload, { onConflict: cf.fk + ',user_id' });
    if (error) { const r = await sb().from(cf.memberTable).insert([payload]); if (r.error) return alert(r.error.message); }
    await loadMy(); c26OpenGroup(type, id);
  };

  // ============ DEPARTMENT REQUEST TO JOIN ============
  window.c26RequestModal = function (deptId) {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="c26ReqModal" style="display:flex" onclick="if(event.target===this)c26Close(\'c26ReqModal\')"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-paper-plane"></i> Request to Join</div>'
      + '<div class="form-group"><label class="form-label">Message (optional)</label><textarea class="form-textarea" id="c26ReqMsg" rows="3" placeholder="Why do you want to join?"></textarea></div>'
      + '<button class="btn btn-primary btn-block" onclick="c26SendRequest(\''+deptId+'\')">Send Request</button></div></div>');
  };

  async function requestTargets(deptId) {
    const ids = {};
    const mem = await sb().from('department_members').select('user_id,role').eq('department_id', deptId);
    (mem.data || []).forEach(function (m) {
      const r = String(m.role || '').toLowerCase();
      if (['leader','chairman','secretary'].includes(r)) ids[m.user_id] = 1;
    });
    const adm = await sb().from('profiles').select('id,role');
    (adm.data || []).forEach(function (p) {
      if (['admin','superadmin'].includes(String(p.role || '').toLowerCase())) ids[p.id] = 1;
    });
    return Object.keys(ids);
  }

  window.c26SendRequest = async function (deptId) {
    const msg = document.getElementById('c26ReqMsg').value.trim();
    const row = { department_id: deptId, user_id: me().id, message: msg, status: 'pending' };

    let r = await sb().from('department_join_requests').upsert([row], { onConflict: 'department_id,user_id' });
    if (r.error) r = await sb().from('department_join_requests').insert([row]);

    if (r.error) {
      // FALLBACK (table missing): send structured notifications to leaders/admins
      const name = (window.profile && window.profile.name) || 'A member';
      const targets = await requestTargets(deptId);
      if (!targets.length) return alert('Request failed: ' + r.error.message);
      for (let i = 0; i < targets.length; i++) {
        notify(targets[i], '📨 Join Request', 'dept:' + deptId + '|user:' + me().id + '|name:' + name + (msg ? '|msg:' + msg : ''));
      }
      c26Close('c26ReqModal');
      alert('Request sent to the department leaders.');
      c26OpenHome('department');
      return;
    }

    const targets = await requestTargets(deptId);
    const name = (window.profile && window.profile.name) || 'A member';
    targets.forEach(function (t) { notify(t, '📨 Join Request', name + ' requested to join ' + ((C.group && C.group.name) || 'a department')); });

    c26Close('c26ReqModal');
    alert('Request sent. Waiting for approval.');
    c26OpenHome('department');
  };

  window.c26RequestsModal = async function () {
    const users = await getUsers();
    let rows = [];

    const q = await sb().from('department_join_requests').select('*')
      .eq('department_id', C.currentId).eq('status', 'pending').order('created_at', { ascending: false });

    if (!q.error) {
      rows = (q.data || []).map(function (r) {
        const u = users.find(x => x.id === r.user_id);
        return { id: r.id, user_id: r.user_id, u: u, note: r.message || '', fallback: false, created: r.created_at };
      });
    } else {
      // FALLBACK: read structured notifications addressed to me
      const n = await sb().from('notifications').select('*').eq('user_id', me().id).like('message', 'dept:' + C.currentId + '|%');
      rows = (n.data || []).map(function (x) {
        const m = String(x.message || '').match(/dept:([^|]+)\|user:([^|]+)\|name:([^|]*)(\|msg:(.*))?/);
        if (!m) return null;
        const u = users.find(xx => xx.id === m[2]);
        return { id: x.id, user_id: m[2], u: u || { name: m[3] }, note: m[5] || '', fallback: true, created: x.created_at };
      }).filter(Boolean);
    }

    let list = rows.map(function (r) {
      return '<div class="card" style="margin-bottom:10px"><div style="display:flex;gap:10px;align-items:center">'
        + avatarHtml(r.u) + '<div style="flex:1"><div style="font-weight:700">' + esc((r.u && r.u.name) || 'User') + '</div>'
        + (r.u && r.u.email ? '<div style="font-size:.75rem;color:var(--text-light)">' + esc(r.u.email) + '</div>' : '')
        + (r.note ? '<div style="font-size:.8rem;margin-top:4px;color:var(--text-light)">"' + esc(r.note) + '"</div>' : '')
        + '<div style="font-size:.7rem;color:var(--text-lighter)">' + fdate(r.created) + '</div></div></div>'
        + '<div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" onclick="c26ApproveReq(\''+r.id+'\',\''+r.user_id+'\','+(r.fallback?'true':'false')+')"><i class="fas fa-check"></i> Approve</button>'
        + '<button class="btn btn-danger btn-sm" onclick="c26RejectReq(\''+r.id+'\',\''+r.user_id+'\','+(r.fallback?'true':'false')+')"><i class="fas fa-times"></i> Reject</button></div></div>';
    }).join('');

    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="c26Requests" style="display:flex" onclick="if(event.target===this)c26Close(\'c26Requests\')"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-inbox"></i> Join Requests</div>'
      + '<div id="c26ReqList">' + (list || '<div style="color:var(--text-light)">No pending requests.</div>') + '</div>'
      + '<button class="btn btn-secondary-alt btn-block" style="margin-top:10px" onclick="c26Close(\'c26Requests\')">Close</button></div></div>');
  };

  window.c26ApproveReq = async function (reqId, userId, fallback) {
    const cf = cfg('department');
    const p = {}; p[cf.fk] = C.currentId; p.user_id = userId; p.role = 'Member';
    let { error } = await sb().from(cf.memberTable).upsert(p, { onConflict: cf.fk + ',user_id' });
    if (error) { const r = await sb().from(cf.memberTable).insert([p]); if (r.error) return alert(r.error.message); }

    if (fallback) await sb().from('notifications').delete().eq('id', reqId);
    else await sb().from('department_join_requests').update({ status: 'approved' }).eq('id', reqId);

    notify(userId, '✅ Request approved', 'You are now a member of ' + ((C.group && C.group.name) || 'the department'));
    c26Close('c26Requests'); c26RequestsModal();
    const m = await sb().from(cf.memberTable).select('*').eq(cf.fk, C.currentId);
    C.members = m.data || [];
  };

  window.c26RejectReq = async function (reqId, userId, fallback) {
    if (fallback) await sb().from('notifications').delete().eq('id', reqId);
    else await sb().from('department_join_requests').update({ status: 'rejected' }).eq('id', reqId);
    notify(userId, '❌ Request not approved', 'Your request to join ' + ((C.group && C.group.name) || 'the department') + ' was not approved.');
    c26Close('c26Requests'); c26RequestsModal();
  };

  // ============ GROUP PAGE ============
  window.c26OpenGroup = async function (type, id) {
    if (!me()) return alert('Log in first.');
    C.currentType = type; C.currentId = id;
    const cf = cfg(type);
    show('<div class="card">Loading...</div>');
    await loadMy();

    const g = await sb().from(cf.groupTable).select('*').eq('id', id).single();
    if (g.error || !g.data) return c26OpenHome(type);
    C.group = g.data;

    if (!isMember(type, id) && !isAdmin()) {
      show('<button class="back-btn" onclick="c26OpenHome(\''+type+'\')"><i class="fas fa-arrow-left"></i> Back</button>'
        + '<div class="card"><b>' + esc(g.data.name) + '</b><br><button class="btn btn-primary btn-block" style="margin-top:10px" onclick="c26Join(\''+type+'\',\''+id+'\')">Join ' + cf.label + '</button></div>');
      return;
    }

    const m = await sb().from(cf.memberTable).select('*').eq(cf.fk, id);
    C.members = m.data || [];

    const manage = canManageGroup(type, id);
    let html = '<button class="back-btn" onclick="c26OpenHome(\''+type+'\')"><i class="fas fa-arrow-left"></i> Back</button>';
    html += '<div class="dept-banner" style="border-radius:20px;margin-bottom:14px"><div class="dept-icon" style="background:' + cf.gradient + '"><i class="fas ' + iconFor(g.data.name, g.data.icon) + '"></i></div><div><div style="font-weight:800;font-size:1.25rem">' + esc(g.data.name) + '</div><div style="font-size:.83rem;opacity:.9">' + esc(g.data.description || g.data.location || cf.label) + '</div></div></div>';

    if (manage) {
      html += '<div class="card" style="background:#FEF3C7;border:1px solid #F59E0B;margin-bottom:14px"><div style="font-weight:800;color:#92400E;margin-bottom:8px">Admin Controls</div>'
        + '<div class="grid-2" style="gap:8px">'
        + '<button class="btn btn-warm btn-sm" onclick="c26EditGroup(\''+type+'\',\''+id+'\')"><i class="fas fa-edit"></i> Edit</button>'
        + '<button class="btn btn-danger btn-sm" onclick="c26DeleteGroup(\''+type+'\',\''+id+'\')"><i class="fas fa-trash"></i> Delete</button>'
        + '<button class="btn btn-warm btn-sm" onclick="c26AddMemberModal()"><i class="fas fa-user-plus"></i> Add Member</button>'
        + '<button class="btn btn-warm btn-sm" onclick="c26RoleCatalogModal()"><i class="fas fa-tags"></i> Role Catalog</button>'
        + (type === 'department' ? '<button class="btn btn-warm btn-sm" onclick="c26RequestsModal()"><i class="fas fa-inbox"></i> Join Requests</button>' : '')
        + '</div></div>';
    }

    html += '<div class="tabs">'
      + '<div class="tab active" id="c26t-feed" onclick="c26Tab(\'feed\')">Feed</div>'
      + '<div class="tab" id="c26t-members" onclick="c26Tab(\'members\')">Members</div>'
      + '<div class="tab" id="c26t-leadership" onclick="c26Tab(\'leadership\')">Leadership</div>'
      + '<div class="tab" id="c26t-meetings" onclick="c26Tab(\'meetings\')">Meetings</div>'
      + '</div>'
      + '<div id="c26-feed"></div><div id="c26-members" style="display:none"></div><div id="c26-leadership" style="display:none"></div><div id="c26-meetings" style="display:none"></div>';

    show(html);
    c26Tab('feed');
  };

  window.c26Tab = function (t) {
    ['feed','members','leadership','meetings'].forEach(x => {
      const b = document.getElementById('c26t-' + x); if (b) b.classList.toggle('active', x === t);
      const p = document.getElementById('c26-' + x); if (p) p.style.display = x === t ? 'block' : 'none';
    });
    if (t === 'feed') loadFeed();
    if (t === 'members') loadMembers();
    if (t === 'leadership') loadLeadership();
    if (t === 'meetings') loadMeetings();
  };

  // ============ FEED ============
  async function loadFeed() {
    const box = document.getElementById('c26-feed'); if (!box) return;
    box.innerHTML = '<div class="card">Loading...</div>';
    const canPost = isAdmin() || isMember(C.currentType, C.currentId);

    const posts = await sb().from('community_posts').select('*')
      .eq('group_type', C.currentType).eq('group_id', C.currentId)
      .order('created_at', { ascending: false }).limit(50);
    if (posts.error) { box.innerHTML = '<div class="card" style="color:#EF4444">' + esc(posts.error.message) + '</div>'; return; }

    const ids = (posts.data || []).map(p => p.id);
    let comments = { data: [] };
    if (ids.length) comments = await sb().from('community_comments').select('*').in('post_id', ids).order('created_at');
    const users = await getUsers();
    const cMap = {};
    (comments.data || []).forEach(c => { (cMap[c.post_id] = cMap[c.post_id] || []).push(c); });

    let html = '';
    if (canPost) {
      html += '<div class="card" style="border-radius:18px"><textarea class="form-textarea" id="c26PostText" placeholder="Share an update..."></textarea>'
        + '<div class="media-upload" id="c26PostUpload" onclick="c26Attach(\'post\',\'c26PostUpload\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media (any format)</span></div>'
        + '<button class="btn btn-primary btn-block" style="margin-top:10px;border-radius:12px" onclick="c26SubmitPost()"><i class="fas fa-paper-plane"></i> Post</button></div>';
    }

    if (!posts.data || !posts.data.length) html += '<div class="card" style="text-align:center;color:var(--text-light)">No posts available</div>';

    (posts.data || []).forEach(p => {
      const u = users.find(x => x.id === p.user_id);
      const canDel = isAdmin() || canManageGroup(C.currentType, C.currentId) || (me() && p.user_id === me().id);
      const cs = cMap[p.id] || [];
      html += '<div class="card" style="border-radius:18px;margin-bottom:12px">'
        + '<div style="display:flex;gap:10px;align-items:center">' + avatarHtml(u) + '<div style="flex:1"><div style="font-weight:700">' + esc((u && u.name) || 'Member') + '</div><div style="font-size:.72rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>'
        + (canDel ? '<button class="post-delete" onclick="c26DeletePost(\''+p.id+'\')"><i class="fas fa-trash"></i></button>' : '') + '</div>'
        + '<div style="white-space:pre-wrap;margin-top:8px">' + esc(p.text || '') + '</div>' + mediaHtml(p.media_url)
        + '<div style="margin-top:10px;border-top:1px solid var(--border);padding-top:8px">'
        + '<div id="c26cl-' + p.id + '">' + cs.map(c => {
            const cu = users.find(x => x.id === c.user_id);
            return '<div style="display:flex;gap:8px;margin-bottom:8px">' + avatarHtml(cu, 32) + '<div style="flex:1;background:var(--bg);border-radius:12px;padding:8px"><b style="font-size:.8rem">' + esc((cu && cu.name) || 'Member') + '</b><div style="font-size:.85rem;white-space:pre-wrap">' + esc(c.text || '') + '</div>' + mediaHtml(c.media_url) + '</div></div>';
          }).join('') + '</div>'
        + '<div style="display:flex;gap:6px;align-items:center"><input class="form-input" id="c26ct-' + p.id + '" placeholder="Comment..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="c26Attach(\'c_'+p.id+'\',\'c26cu_'+p.id+'\')"><i class="fas fa-paperclip"></i></button><span id="c26cu-' + p.id + '"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="c26SubmitComment(\''+p.id+'\')"><i class="fas fa-paper-plane"></i></button></div>'
        + '</div></div>';
    });

    box.innerHTML = html;
  }

  window.c26SubmitPost = async function () {
    const t = document.getElementById('c26PostText').value.trim();
    const f = window._c26Media.post;
    if (!t && !f) return alert('Write something or add media.');
    let url = null; if (f) url = await upload(f, 'posts');
    const { error } = await sb().from('community_posts').insert([{ group_type: C.currentType, group_id: C.currentId, user_id: me().id, text: t, media_url: url }]);
    if (error) return alert(error.message);
    window._c26Media.post = null; loadFeed();
  };

  window.c26SubmitComment = async function (postId) {
    const t = document.getElementById('c26ct-' + postId).value.trim();
    const f = window._c26Media['c_' + postId];
    if (!t && !f) return;
    let url = null; if (f) url = await upload(f, 'comments');
    const { error } = await sb().from('community_comments').insert([{ post_id: postId, user_id: me().id, text: t, media_url: url }]);
    if (error) return alert(error.message);
    window._c26Media['c_' + postId] = null; loadFeed();
  };

  window.c26DeletePost = async function (id) {
    if (!confirm('Delete this post?')) return;
    await sb().from('community_posts').delete().eq('id', id);
    loadFeed();
  };

  // ============ MEMBERS (chat icon + pics + emails + roles) ============
  async function roleOptions(selected) {
    const std = ['Member','Leader','Chairman','Secretary','Treasurer','Teacher'];
    const cat = await sb().from('community_role_catalog').select('*')
      .or('scope_type.eq.global,scope_id.eq.' + C.currentId);
    const custom = (cat.data || []).map(x => x.role_name);
    const all = std.concat(custom.filter(x => !std.includes(x)));
    return all.map(r => '<option value="' + esc(r) + '" ' + (String(selected||'').toLowerCase() === r.toLowerCase() ? 'selected' : '') + '>' + esc(r) + '</option>').join('');
  }

  async function loadMembers() {
    const box = document.getElementById('c26-members'); if (!box) return;
    box.innerHTML = '<div class="card">Loading...</div>';
    const users = await getUsers();
    const manage = canManageGroup(C.currentType, C.currentId);
    let html = '';
    if (!C.members.length) html += '<div class="card">No members yet.</div>';
    for (const m of C.members) {
      const u = users.find(x => x.id === m.user_id);
      const self = me() && m.user_id === me().id;
      html += '<div class="card" style="margin-bottom:10px">'
        + '<div style="display:flex;gap:10px;align-items:center">' + avatarHtml(u)
        + '<div style="flex:1;min-width:0"><div style="font-weight:700">' + esc((u && u.name) || 'Member') + '</div>'
        + (u && u.email ? '<div style="font-size:.72rem;color:var(--text-light);overflow:hidden;text-overflow:ellipsis">' + esc(u.email) + '</div>' : '')
        + '<div style="font-size:.75rem;color:var(--primary);font-weight:700">' + esc(m.role || 'Member') + '</div></div>'
        + '<button class="btn btn-secondary btn-sm" title="Chat" onclick="c26OpenChat(\''+m.user_id+'\')"><i class="fas fa-comment-dots"></i></button>'
        + '</div>'
        + (manage && !self ? '<div style="display:flex;gap:8px;margin-top:8px"><select class="form-select" onchange="c26ChangeRole(\''+m.user_id+'\',this.value)">' + (await roleOptions(m.role)) + '</select><button class="btn btn-danger btn-sm" onclick="c26RemoveMember(\''+m.user_id+'\')"><i class="fas fa-trash"></i></button></div>' : '')
        + '</div>';
    }
    box.innerHTML = html;
  }

  // ROLE CHANGE: same method as Department + automatic /api/set-role fallback for Ushirika
  window.c26ChangeRole = async function (userId, role) {
    const cf = cfg(C.currentType);

    // 1) normal client update (this is what works in Department)
    let r = await sb().from(cf.memberTable).update({ role: role }).eq(cf.fk, C.currentId).eq('user_id', userId);

    // 2) if a column name problem, retry by user only
    if (r.error && /column|does not exist/i.test(r.error.message)) {
      r = await sb().from(cf.memberTable).update({ role: role }).eq('user_id', userId).eq(cf.fk, C.currentId);
    }

    // 3) if blocked by RLS (Ushirika), use the existing serverless endpoint
    if (r.error) {
      try {
        const res = await fetch('/api/set-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            user_id: userId,
            role: role,
            table: cf.memberTable,
            groupId: C.currentId,
            group_id: C.currentId,
            department_id: C.currentType === 'department' ? C.currentId : undefined,
            ushirika_id: C.currentType === 'ushirika' ? C.currentId : undefined
          })
        });
        if (!res.ok) {
          const j = await res.json().catch(function () { return null; });
          return alert('Role change failed: ' + r.error.message + (j && j.error ? ' | API: ' + j.error : ''));
        }
      } catch (e) {
        return alert('Role change failed: ' + r.error.message);
      }
    }

    const m = await sb().from(cf.memberTable).select('*').eq(cf.fk, C.currentId);
    C.members = m.data || [];
    await loadMy();
    loadMembers(); loadLeadership();
  };

  window.c26RemoveMember = async function (userId) {
    if (!confirm('Remove this member?')) return;
    const cf = cfg(C.currentType);
    const { error } = await sb().from(cf.memberTable).delete().eq(cf.fk, C.currentId).eq('user_id', userId);
    if (error) return alert(error.message);
    const m = await sb().from(cf.memberTable).select('*').eq(cf.fk, C.currentId);
    C.members = m.data || [];
    loadMembers(); loadLeadership();
  };

  window.c26AddMemberModal = async function () {
    const users = await getUsers();
    const existing = C.members.map(x => x.user_id);
    const opts = users.filter(u => !existing.includes(u.id)).map(u => '<option value="' + u.id + '">' + esc(u.name || 'User') + '</option>').join('');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="c26AddMember" style="display:flex" onclick="if(event.target===this)c26Close(\'c26AddMember\')"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-user-plus"></i> Add Member</div>'
      + '<div class="form-group"><label class="form-label">Member</label><select class="form-select" id="c26amUser"><option value="">Select</option>' + opts + '</select></div>'
      + '<div class="form-group"><label class="form-label">Role / Title</label><select class="form-select" id="c26amRole">' + (await roleOptions('Member')) + '</select></div>'
      + '<button class="btn btn-primary btn-block" onclick="c26SaveMember()">Add</button></div></div>');
  };

  window.c26SaveMember = async function () {
    const uid = document.getElementById('c26amUser').value;
    const role = document.getElementById('c26amRole').value;
    if (!uid) return alert('Select a member.');
    const cf = cfg(C.currentType);
    const p = {}; p[cf.fk] = C.currentId; p.user_id = uid; p.role = role;
    let { error } = await sb().from(cf.memberTable).upsert(p, { onConflict: cf.fk + ',user_id' });
    if (error) { const r = await sb().from(cf.memberTable).insert([p]); if (r.error) return alert(r.error.message); }
    c26Close('c26AddMember');
    const m = await sb().from(cf.memberTable).select('*').eq(cf.fk, C.currentId);
    C.members = m.data || [];
    loadMembers(); loadLeadership();
  };

  window.c26RoleCatalogModal = async function () {
    const cat = await sb().from('community_role_catalog').select('*').eq('scope_id', C.currentId);
    let list = (cat.data || []).map(r => '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span>' + esc(r.role_name) + '</span><button class="post-delete" onclick="c26DeleteRole(\''+r.id+'\')"><i class="fas fa-trash"></i></button></div>').join('');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="c26RoleCat" style="display:flex" onclick="if(event.target===this)c26Close(\'c26RoleCat\')"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-tags"></i> Custom Role Catalog</div>'
      + '<div id="c26rcList">' + (list || '<div style="color:var(--text-light)">No custom roles yet.</div>') + '</div>'
      + '<div class="form-group"><label class="form-label">New role (e.g. Sound Engineer)</label><input class="form-input" id="c26rcName"></div>'
      + '<button class="btn btn-primary btn-block" onclick="c26AddRole()">Add Role</button></div></div>');
  };

  window.c26AddRole = async function () {
    const n = document.getElementById('c26rcName').value.trim();
    if (!n) return alert('Enter a role name.');
    await sb().from('community_role_catalog').insert([{ scope_type: C.currentType, scope_id: C.currentId, role_name: n }]);
    c26Close('c26RoleCat'); c26RoleCatalogModal();
  };

  window.c26DeleteRole = async function (id) {
    await sb().from('community_role_catalog').delete().eq('id', id);
    c26Close('c26RoleCat'); c26RoleCatalogModal();
  };

  async function loadLeadership() {
    const box = document.getElementById('c26-leadership'); if (!box) return;
    const users = await getUsers();
    const leads = C.members.filter(m => String(m.role || '').toLowerCase() !== 'member');
    let html = '';
    if (!leads.length) html += '<div class="card">No leadership listed yet.</div>';
    leads.forEach(m => {
      const u = users.find(x => x.id === m.user_id);
      html += '<div class="card" style="margin-bottom:10px"><div style="display:flex;gap:10px;align-items:center">' + avatarHtml(u)
        + '<div style="flex:1"><div style="font-weight:800">' + esc((u && u.name) || 'Member') + '</div>'
        + (u && u.email ? '<div style="font-size:.72rem;color:var(--text-light)">' + esc(u.email) + '</div>' : '')
        + '<div style="font-size:.8rem;color:var(--primary);font-weight:700">' + esc(m.role) + '</div></div>'
        + '<button class="btn btn-secondary btn-sm" onclick="c26OpenChat(\''+m.user_id+'\')"><i class="fas fa-comment-dots"></i></button></div></div>';
    });
    box.innerHTML = html;
  }

  // ============ EDIT / DELETE GROUP ============
  window.c26EditGroup = function (type, id) {
    const cf = cfg(type);
    const g = (id && C.group && C.group.id === id) ? C.group : {};
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="c26EditGroup" style="display:flex" onclick="if(event.target===this)c26Close(\'c26EditGroup\')"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">' + (id ? 'Edit' : 'Add') + ' ' + cf.label + '</div>'
      + '<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="c26gName" value="' + esc(g.name || '') + '"></div>'
      + '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="c26gDesc">' + esc(g.description || g.location || '') + '</textarea></div>'
      + '<div class="form-group"><label class="form-label">Custom icon (optional, Font Awesome class)</label><input class="form-input" id="c26gIcon" value="' + esc(g.icon || '') + '" placeholder="fa-music"></div>'
      + '<button class="btn btn-primary btn-block" onclick="c26SaveGroup(\''+type+'\',\''+(id||'')+'\')">Save</button></div></div>');
  };

  window.c26SaveGroup = async function (type, id) {
    const cf = cfg(type);
    const p = {
      name: document.getElementById('c26gName').value.trim(),
      description: document.getElementById('c26gDesc').value.trim(),
      icon: document.getElementById('c26gIcon').value.trim() || null
    };
    if (!p.name) return alert('Name required.');
    if (type === 'ushirika') p.location = p.description;
    let r;
    if (id) r = await sb().from(cf.groupTable).update(p).eq('id', id);
    else r = await sb().from(cf.groupTable).insert([p]);
    if (r.error) return alert(r.error.message);
    c26Close('c26EditGroup'); c26OpenHome(type);
  };

  window.c26DeleteGroup = async function (type, id) {
    if (!confirm('Delete this ' + cfg(type).label + '? This removes members, posts and meetings.')) return;
    const cf = cfg(type);
    await sb().from('community_posts').delete().eq('group_type', type).eq('group_id', id);
    await sb().from(cf.groupTable).delete().eq('id', id);
    c26OpenHome(type);
  };

  // ============ MEETINGS ============
  async function loadMeetings() {
    const box = document.getElementById('c26-meetings'); if (!box) return;
    box.innerHTML = '<div class="card">Loading...</div>';
    const cf = cfg(C.currentType);
    const can = canManageMinutes(C.currentType, C.currentId);
    const mem = isAdmin() || isMember(C.currentType, C.currentId);
    const { data, error } = await sb().from(cf.meetingTable).select('*').eq(cf.fk, C.currentId).order('meeting_date', { ascending: false }).limit(50);
    if (error) { box.innerHTML = '<div class="card" style="color:#EF4444">' + esc(error.message) + '</div>'; return; }

    let html = '';
    if (can) html += '<button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="c26MeetingModal()"><i class="fas fa-plus"></i> Add Weekly Meeting / Minutes</button>';
    if (!data || !data.length) html += '<div class="card">No meetings yet.</div>';

    (data || []).forEach(m => {
      html += '<div class="card" style="border-radius:18px;margin-bottom:12px"><div style="font-weight:800">' + esc(m.theme || 'Weekly Meeting') + '</div>'
        + '<div style="font-size:.83rem;color:var(--text-light);margin-top:4px">' + esc(m.meeting_date || '') + (m.start_time ? ' • ' + esc(m.start_time) : '') + (m.end_time ? ' - ' + esc(m.end_time) : '') + '</div>'
        + (m.venue ? '<div style="font-size:.83rem;color:var(--text-light)"><i class="fas fa-map-marker-alt"></i> ' + esc(m.venue) + '</div>' : '')
        + '<div style="margin-top:6px"><i class="fas fa-users"></i> Total present: ' + esc(m.total_members_present || 0) + '</div>'
        + '<details style="margin-top:8px"><summary style="cursor:pointer;color:var(--primary);font-weight:600">View Minutes</summary>'
        + (m.agenda ? '<div style="margin-top:6px"><b>Agenda</b><div style="white-space:pre-wrap">' + esc(m.agenda) + '</div></div>' : '')
        + (m.members_present ? '<div style="margin-top:6px"><b>Present</b><div style="white-space:pre-wrap">' + esc(m.members_present) + '</div></div>' : '')
        + (m.absent_with_apology ? '<div style="margin-top:6px"><b>Absent w/ Apology</b><div style="white-space:pre-wrap">' + esc(m.absent_with_apology) + '</div></div>' : '')
        + (m.absent_without_apology ? '<div style="margin-top:6px"><b>Absent w/o Apology</b><div style="white-space:pre-wrap">' + esc(m.absent_without_apology) + '</div></div>' : '')
        + (m.minutes ? '<div style="margin-top:6px"><b>Minutes</b><div style="white-space:pre-wrap">' + esc(m.minutes) + '</div></div>' : '')
        + mediaHtml(m.media_url) + '</details>'
        + '<div style="display:flex;gap:8px;margin-top:10px">'
        + '<button class="btn btn-secondary btn-sm" onclick="c26ApologyModal(\''+m.id+'\')"><i class="fas fa-hand-paper"></i> Apology</button>'
        + (can ? '<button class="btn btn-primary btn-sm" onclick="c26MeetingModal(\''+m.id+'\')"><i class="fas fa-edit"></i> Edit</button>' : '')
        + '</div></div>';
    });
    box.innerHTML = html;
  }

  window.c26MeetingModal = async function (meetingId) {
    const cf = cfg(C.currentType);
    let m = {};
    if (meetingId) { const r = await sb().from(cf.meetingTable).select('*').eq('id', meetingId).single(); if (r.data) m = r.data; }
    const agenda = m.agenda || '1. Call to Order & Opening Prayer\n2. Reading & Approval of Previous Minutes\n3. Matters Arising\n4. New Business\n5. AOB\n6. Adjournment & Closing Prayer';
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="c26Meeting" style="display:flex" onclick="if(event.target===this)c26Close(\'c26Meeting\')"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">' + (meetingId ? 'Edit' : 'Add') + ' Meeting</div>'
      + '<div class="grid-2"><div class="form-group"><label>Date</label><input class="form-input" id="c26mDate" type="date" value="' + esc(String(m.meeting_date || today()).slice(0,10)) + '"></div><div class="form-group"><label>Day</label><select class="form-select" id="c26mDay">' + ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => '<option ' + (m.day===d?'selected':'') + '>' + d + '</option>').join('') + '</select></div></div>'
      + '<div class="grid-2"><div class="form-group"><label>Start</label><input class="form-input" id="c26mStart" type="time" value="' + esc(m.start_time||'') + '"></div><div class="form-group"><label>End</label><input class="form-input" id="c26mEnd" type="time" value="' + esc(m.end_time||'') + '"></div></div>'
      + '<div class="form-group"><label>Venue</label><input class="form-input" id="c26mVenue" value="' + esc(m.venue||'') + '"></div>'
      + '<div class="form-group"><label>Theme</label><input class="form-input" id="c26mTheme" value="' + esc(m.theme||'') + '"></div>'
      + '<div class="form-group"><label>Agenda</label><textarea class="form-textarea" id="c26mAgenda" rows="4">' + esc(agenda) + '</textarea></div>'
      + '<div class="form-group"><label>Members Present</label><textarea class="form-textarea" id="c26mPresent" rows="3">' + esc(m.members_present||'') + '</textarea></div>'
      + '<div class="form-group"><label>Absent with Apology</label><textarea class="form-textarea" id="c26mApology" rows="2">' + esc(m.absent_with_apology||'') + '</textarea></div>'
      + '<div class="form-group"><label>Absent without Apology</label><textarea class="form-textarea" id="c26mAbsent" rows="2">' + esc(m.absent_without_apology||'') + '</textarea></div>'
      + '<div class="form-group"><label>Guests</label><input class="form-input" id="c26mGuests" value="' + esc(m.guests||'') + '"></div>'
      + '<div class="form-group"><label>Minutes</label><textarea class="form-textarea" id="c26mMinutes" rows="5">' + esc(m.minutes||'') + '</textarea></div>'
      + '<div class="grid-2"><div class="form-group"><label>Time Taken (min)</label><input class="form-input" id="c26mTime" type="number" value="' + esc(m.time_taken_minutes||0) + '"></div><div class="form-group"><label>Total Present</label><input class="form-input" id="c26mTotal" type="number" value="' + esc(m.total_members_present||0) + '"></div></div>'
      + '<div class="media-upload" id="c26mUpload" onclick="c26Attach(\'meeting\',\'c26mUpload\')"><i class="fas fa-cloud-upload-alt"></i><span>Upload media</span></div>'
      + '<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="c26SaveMeeting(\'' + (meetingId||'') + '\')">Save</button></div></div>');
  };

  window.c26SaveMeeting = async function (meetingId) {
    const cf = cfg(C.currentType);
    const present = document.getElementById('c26mPresent').value.trim();
    let total = parseInt(document.getElementById('c26mTotal').value, 10);
    if (isNaN(total)) total = present ? present.split(/\n+/).filter(x=>x.trim()).length : 0;
    const f = window._c26Media.meeting;
    let url = null; if (f) url = await upload(f, 'meetings');
    const p = {
      meeting_date: document.getElementById('c26mDate').value || today(),
      day: document.getElementById('c26mDay').value,
      start_time: document.getElementById('c26mStart').value,
      end_time: document.getElementById('c26mEnd').value,
      venue: document.getElementById('c26mVenue').value.trim(),
      theme: document.getElementById('c26mTheme').value.trim(),
      agenda: document.getElementById('c26mAgenda').value.trim(),
      members_present: present,
      absent_with_apology: document.getElementById('c26mApology').value.trim(),
      absent_without_apology: document.getElementById('c26mAbsent').value.trim(),
      guests: document.getElementById('c26mGuests').value.trim(),
      minutes: document.getElementById('c26mMinutes').value.trim(),
      time_taken_minutes: parseInt(document.getElementById('c26mTime').value||'0',10),
      total_members_present: total
    };
    if (url) p.media_url = url;
    p[cf.fk] = C.currentId;
    let r;
    if (meetingId) r = await sb().from(cf.meetingTable).update(p).eq('id', meetingId);
    else { p.created_by = me().id; r = await sb().from(cf.meetingTable).insert([p]); }
    if (r.error) return alert(r.error.message);
    window._c26Media.meeting = null;
    c26Close('c26Meeting'); loadMeetings();
  };

  window.c26ApologyModal = function (meetingId) {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="c26Apology" style="display:flex" onclick="if(event.target===this)c26Close(\'c26Apology\')"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">🙏 Absent with Apology</div>'
      + '<div class="form-group"><label>Reason</label><textarea class="form-textarea" id="c26aReason" rows="4"></textarea></div>'
      + '<button class="btn btn-primary btn-block" onclick="c26SaveApology(\''+meetingId+'\')">Submit</button></div></div>');
  };

  window.c26SaveApology = async function (meetingId) {
    const reason = document.getElementById('c26aReason').value.trim();
    if (!reason) return alert('Enter a reason.');
    const cf = cfg(C.currentType);
    const name = (window.profile && window.profile.name) || 'Member';
    const r = await sb().from(cf.meetingTable).select('absent_with_apology').eq('id', meetingId).single();
    const cur = (r.data && r.data.absent_with_apology) || '';
    await sb().from(cf.meetingTable).update({ absent_with_apology: cur ? cur + '\n' + name + ': ' + reason : name + ': ' + reason }).eq('id', meetingId);
    c26Close('c26Apology'); alert('Apology submitted.'); loadMeetings();
  };

  // ============ SERVICE TIMER ============
  function injectTimers() {
    document.querySelectorAll('.service-card').forEach(card => {
      if (card.querySelector('.c26-timer')) return;
      const t = document.createElement('div');
      t.className = 'c26-timer';
      t.style.cssText = 'margin-top:10px;padding:8px;border-radius:12px;background:rgba(79,70,229,.08);color:var(--primary);font-weight:800;text-align:center;font-size:.95rem;';
      t.innerHTML = 'Calculating...';
      card.appendChild(t);
    });
  }
  function parseMin(s) {
    const m = String(s||'').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return null;
    let h = parseInt(m[1],10); const min = parseInt(m[2],10);
    const ap = m[3] ? m[3].toUpperCase() : null;
    if (ap==='PM' && h<12) h+=12; if (ap==='AM' && h===12) h=0;
    return h*60+min;
  }
  function nextStart(day, start, now) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const t = days.indexOf(String(day).trim()); if (t<0) return null;
    const s = parseMin(start); if (s===null) return null;
    const nowM = now.getHours()*60+now.getMinutes();
    let d = t - now.getDay();
    if (d<0 || (d===0 && nowM>s)) d+=7;
    const n = new Date(now); n.setDate(now.getDate()+d); n.setHours(Math.floor(s/60), s%60, 0, 0);
    return n;
  }
  function isLive(day, start, end, now) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const t = days.indexOf(String(day).trim()); if (t<0) return false;
    const s = parseMin(start), e = parseMin(end||start); if (s===null||e===null) return false;
    const td = now.getDay(), yest = (td+6)%7, nowM = now.getHours()*60+now.getMinutes();
    if (e>s) return td===t && nowM>=s && nowM<=e;
    return (td===t && nowM>=s) || (yest===t && nowM<=e);
  }
  function fmt(ms) {
    if (ms<=0) return '0d 0h 0m 0s';
    const s = Math.floor(ms/1000);
    return Math.floor(s/86400)+'d '+Math.floor((s%86400)/3600)+'h '+Math.floor((s%3600)/60)+'m '+(s%60)+'s';
  }
  function updateTimers() {
    const now = new Date();
    document.querySelectorAll('.service-card').forEach(card => {
      const t = card.querySelector('.c26-timer'); if (!t) return;
      const d = card.querySelector('.service-day'), tm = card.querySelector('.service-time');
      if (!d || !tm) return;
      const parts = tm.textContent.split('-').map(x=>x.trim());
      if (isLive(d.textContent, parts[0], parts[1]||parts[0], now)) { t.innerHTML = '<span style="color:#EF4444"><i class="fas fa-circle"></i> LIVE NOW</span>'; return; }
      const n = nextStart(d.textContent, parts[0], now);
      t.innerHTML = n ? '<i class="fas fa-clock"></i> Starts in: ' + fmt(n - now) : '—';
    });
  }

  // ============ FORUM + PLANS TO HOME ============
  function moveForumPlans() {
    const home = document.querySelector('#section-home') || document.querySelector('#home-main');
    if (!home) return;
    ['#section-forum','#forumSection','#publicForum','#section-plans','#plansSection','#communityPlans'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el && !home.contains(el)) { home.appendChild(el); el.style.display = 'block'; }
    });
  }

  // ============ INIT ============
  c26NavCss(); c26InjectNav(); injectTimers(); updateTimers(); moveForumPlans();
  setInterval(c26NavCss, 2000);
  setInterval(c26InjectNav, 1000);
  setInterval(c26CleanNav, 1200);
  setInterval(injectTimers, 2000);
  setInterval(updateTimers, 1000);
  setInterval(moveForumPlans, 3000);
})();
