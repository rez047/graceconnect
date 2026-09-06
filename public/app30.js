// public/app31.js — My List card, prayer delete, Inbox (replaces old prayer),
// featured-members repair, multiplayer hide, trivia Next Question.

(function () {
  console.log('✝️ app31.js');

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
  function homeActive() { const h = document.querySelector('#section-home'); return h && h.classList.contains('active'); }

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
  function shellOf(rootId, title, icon, grad, body) {
    return '<button class="back-btn" onclick="h31Back()"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div style="border-radius:20px;padding:16px;color:#fff;background:' + grad + ';font-weight:800;font-size:1.15rem;margin-bottom:14px"><i class="fas ' + icon + '"></i> ' + title + '</div>'
      + body;
  }
  function showH28(html) {
    let sec = document.getElementById('section-h28');
    if (!sec) {
      sec = document.createElement('div'); sec.id = 'section-h28'; sec.className = 'section';
      sec.innerHTML = '<div id="h28-root" class="sub-page active"></div>';
      (document.querySelector('main') || document.body).appendChild(sec);
    }
    document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
    sec.classList.add('active');
    document.getElementById('h28-root').innerHTML = html;
    window.scrollTo({ top: 0 });
  }
  window.h31Back = function () {
    if (window.c26OrigSwitch) window.c26OrigSwitch('home');
    else if (window.switchSection) window.switchSection('home');
  };

  // =====================================================
  // 1) HOME: replace "My Departments" card with "My List"
  // =====================================================
  function tile(icon, grad, name, role, onclick) {
    return '<div onclick="' + onclick + '" style="min-width:150px;border-radius:16px;padding:14px;background:' + grad + ';color:#fff;cursor:pointer;flex-shrink:0">'
      + '<i class="fas ' + icon + '"></i><div style="font-weight:800;margin-top:6px">' + esc(name || '') + '</div>'
      + '<span style="font-size:.65rem;background:rgba(255,255,255,.25);padding:2px 8px;border-radius:20px">' + esc(role || 'Member') + '</span></div>';
  }

  async function h31MyListCard() {
    const home = homeEl(); if (!home || !homeActive()) return;

    // hide the OLD "My Departments" carousel card
    const leaf = Array.from(home.querySelectorAll('*')).find(function (el) {
      return el.children.length === 0 && /^My Departments$/.test((el.textContent || '').trim());
    });
    if (leaf) { const card = leaf.closest('.card'); if (card) card.style.display = 'none'; }

    if (document.getElementById('h31MyListCard')) return;

    const card = document.createElement('div');
    card.id = 'h31MyListCard'; card.className = 'card';
    card.style.cssText = 'border-radius:20px;margin-top:16px';
    card.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><i class="fas fa-list-ul" style="color:var(--primary)"></i><b style="font-size:1.05rem">My List</b>'
      + '<button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="h27MyListModal()">View All</button></div>'
      + '<div id="h31MyListTiles" style="display:flex;gap:10px;overflow-x:auto"></div>'
      + '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'
      + '<button class="btn btn-secondary btn-sm" onclick="ggOpenHome && ggOpenHome()">Browse Groups</button>'
      + '<button class="btn btn-secondary btn-sm" onclick="c26OpenHome(\'department\')">Browse Departments</button>'
      + '<button class="btn btn-secondary btn-sm" onclick="c26OpenHome(\'ushirika\')">Browse Ushirika</button></div>';

    const feel = Array.from(home.querySelectorAll('*')).find(function (el) {
      return el.children.length === 0 && /How are you feeling/i.test(el.textContent || '');
    });
    if (feel) home.insertBefore(card, feel.closest('.card') || feel.parentElement);
    else home.appendChild(card);

    if (!me()) return;
    const res = await Promise.all([
      sb().from('church_group_members').select('role,church_groups(id,name)').eq('user_id', me().id),
      sb().from('ushirika_members').select('role,ushirikas(id,name)').eq('user_id', me().id),
      sb().from('department_members').select('role,departments(id,name)').eq('user_id', me().id)
    ]);
    let html = '';
    (res[0].data || []).forEach(function (m) { const g = m.church_groups || {}; html += tile('fa-users', 'linear-gradient(135deg,#F59E0B,#EF4444)', g.name, m.role, "ggOpenGroup && ggOpenGroup('" + g.id + "')"); });
    (res[1].data || []).forEach(function (m) { const u = m.ushirikas || {}; html += tile('fa-people-group', 'linear-gradient(135deg,#10B981,#06B6D4)', u.name, m.role, "c26OpenGroup('ushirika','" + u.id + "')"); });
    (res[2].data || []).forEach(function (m) { const d = m.departments || {}; html += tile('fa-building', 'linear-gradient(135deg,#8B5CF6,#EC4899)', d.name, m.role, "c26OpenGroup('department','" + d.id + "')"); });
    document.getElementById('h31MyListTiles').innerHTML = html || '<div style="color:var(--text-light);font-size:.85rem">Not a member of any group yet — use the Browse buttons to join.</div>';
  }

  // rename list headers to "My Groups / My Departments / My Ushirikas", title "My List"
  function h31RenameList() {
    const modal = document.getElementById('h27MyList');
    if (modal) {
      modal.querySelectorAll('*').forEach(function (el) {
        if (el.children.length !== 0) return;
        const t = (el.textContent || '').trim();
        if (t === 'Groups') el.textContent = 'My Groups';
        if (t === 'Departments') el.textContent = 'My Departments';
        if (t === 'Ushirikas') el.textContent = 'My Ushirikas';
        if (t === 'My Departments, Groups & Ushirika') el.textContent = 'My List';
      });
    }
  }

  // =====================================================
  // 2) PRAYER WALL with delete (admin all / owner own)
  // =====================================================
  window.h31OpenPrayer = function () {
    showH28(shellOf('x', 'Prayer Wall', 'fa-hands-praying', 'linear-gradient(135deg,#8B5CF6,#EC4899)',
      '<div class="card" style="border-radius:20px"><textarea class="form-textarea" id="h31PrayerText" rows="2" placeholder="Share a prayer request..."></textarea>'
      + '<div style="display:flex;gap:10px;align-items:center;margin:8px 0"><span style="font-size:.8rem;color:var(--text-light)">Anonymous</span><input type="checkbox" id="h31PrayerAnon"></div>'
      + '<button class="btn btn-primary btn-block" onclick="h31SubmitPrayer()"><i class="fas fa-paper-plane"></i> Pray</button>'
      + '<div id="h31PrayerList" style="margin-top:12px"></div></div>'));
    h31LoadPrayers();
  };

  window.h31SubmitPrayer = async function () {
    const t = document.getElementById('h31PrayerText').value.trim();
    if (!t) return alert('Write a prayer.');
    const r = await sb().from('community_prayers').insert([{ user_id: me().id, text: t, anonymous: document.getElementById('h31PrayerAnon').checked }]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h31PrayerText').value = '';
    h31LoadPrayers();
  };

  window.h31DelPrayer = async function (id) {
    if (!confirm('Delete this prayer?')) return;
    const r = await sb().from('community_prayers').delete().eq('id', id);
    if (r.error) return alert(r.error.message);
    h31LoadPrayers();
  };

  window.h31DelPComment = async function (id) {
    if (!confirm('Delete this comment?')) return;
    const r = await sb().from('community_prayer_comments').delete().eq('id', id);
    if (r.error) return alert(r.error.message);
    h31LoadPrayers();
  };

  async function h31LoadPrayers() {
    const box = document.getElementById('h31PrayerList'); if (!box) return;
    const p = await sb().from('community_prayers').select('*').order('created_at', { ascending: false }).limit(40);
    if (p.error) { box.innerHTML = esc(p.error.message); return; }
    const ids = (p.data || []).map(x => x.id);
    let c = { data: [] };
    if (ids.length) c = await sb().from('community_prayer_comments').select('*').in('prayer_id', ids).order('created_at');
    const us = await users();
    const byP = {};
    (c.data || []).forEach(x => { (byP[x.prayer_id] = byP[x.prayer_id] || []).push(x); });

    box.innerHTML = (p.data || []).map(function (pr) {
      const u = us.find(x => x.id === pr.user_id);
      const name = pr.anonymous ? '🕊️ Anonymous' : ((u && u.name) || 'Member');
      const canDel = isAdmin() || (me() && pr.user_id === me().id);
      const cs = byP[pr.id] || [];
      return '<div class="card" style="border-radius:16px;margin-bottom:10px">'
        + '<div style="display:flex;gap:8px;align-items:center">' + (pr.anonymous ? '<div class="post-avatar">🙏</div>' : avatarHtml(u, 38))
        + '<div style="flex:1"><b style="font-size:.9rem">' + esc(name) + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(pr.created_at) + '</div></div>'
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h31DelPrayer(\'' + pr.id + '\')"><i class="fas fa-trash"></i></button>' : '')
        + '</div>'
        + '<div style="white-space:pre-wrap;margin:8px 0">' + esc(pr.text || '') + '</div>'
        + cs.map(function (cm) {
            const cu = us.find(x => x.id === cm.user_id);
            const cDel = isAdmin() || (me() && cm.user_id === me().id);
            return '<div style="margin-left:16px;margin-top:6px;background:var(--bg);border-radius:12px;padding:8px">'
              + '<div style="display:flex;gap:6px;align-items:center">' + avatarHtml(cu, 26) + '<b style="font-size:.78rem;flex:1">' + esc((cu && cu.name) || 'Member') + '</b>'
              + (cDel ? '<button class="btn btn-danger btn-sm" onclick="h31DelPComment(\'' + cm.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>'
              + '<div style="font-size:.85rem;white-space:pre-wrap;margin-top:4px">' + esc(cm.text || '') + '</div>' + mediaHtml(cm.media_url) + '</div>';
          }).join('')
        + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center">'
        + '<input class="form-input" id="h31pc-' + pr.id + '" placeholder="Comment / encouragement..." style="flex:1">'
        + '<button class="btn btn-secondary btn-sm" onclick="h30Attach(\'pc31_' + pr.id + '\',\'h31pcu-' + pr.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h31pcu-' + pr.id + '" style="font-size:.65rem"></span>'
        + '<button class="btn btn-primary btn-sm" onclick="h31PComment(\'' + pr.id + '\')"><i class="fas fa-paper-plane"></i></button></div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No prayers yet.</div>';
  }

  window.h31PComment = async function (prayerId) {
    const t = document.getElementById('h31pc-' + prayerId).value.trim();
    const f = window._h30Media && window._h30Media['pc31_' + prayerId];
    if (!t && !f) return;
    let url = null;
    if (f && window.h30Upload) url = await window.h30Upload(f, 'prayer-comments');
    else if (f && window.uploadMediaFile) url = await window.uploadMediaFile(f);
    const r = await sb().from('community_prayer_comments').insert([{ prayer_id: prayerId, user_id: me().id, text: t, media_url: url }]);
    if (r.error) return alert(r.error.message);
    if (window._h30Media) window._h30Media['pc31_' + prayerId] = null;
    h31LoadPrayers();
  };

  // rewire prayer tile → new prayer page
  const _op = window.h27OpenPage;
  window.h27OpenPage = function (p) {
    if (p === 'prayer') return window.h31OpenPrayer();
    return _op ? _op(p) : undefined;
  };

  // =====================================================
  // 3) INBOX (replaces old Prayer quick action)
  // =====================================================
  window.h31OpenInbox = function () {
    showH28(shellOf('x', 'My Inbox', 'fa-inbox', 'linear-gradient(135deg,#4F46E5,#7C3AED)',
      '<div id="h31InboxList"></div>'));
    h31LoadInbox();
  };

  async function h31LoadInbox() {
    const box = document.getElementById('h31InboxList'); if (!box) return;
    const r = await sb().from('community_chat').select('*')
      .or('sender_id.eq.' + me().id + ',receiver_id.eq.' + me().id)
      .order('created_at', { ascending: false }).limit(500);
    if (r.error) { box.innerHTML = esc(r.error.message); return; }
    const us = await users();
    const map = {};
    (r.data || []).forEach(function (m) {
      const other = m.sender_id === me().id ? m.receiver_id : m.sender_id;
      if (!map[other]) map[other] = { uid: other, last: m };
    });
    const list = Object.values(map);
    box.innerHTML = list.map(function (c) {
      const u = us.find(x => x.id === c.uid);
      return '<div class="card" style="border-radius:16px;margin-bottom:8px;display:flex;gap:10px;align-items:center;cursor:pointer" onclick="h27ChatWith(\'' + c.uid + '\')">'
        + avatarHtml(u, 44)
        + '<div style="flex:1;min-width:0"><b style="font-size:.9rem">' + esc((u && u.name) || 'Member') + '</b>'
        + '<div style="font-size:.78rem;color:var(--text-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(c.last.text || '📎 Media') + '</div></div>'
        + '<div style="font-size:.65rem;color:var(--text-lighter)">' + ftime(c.last.created_at) + '</div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No messages yet.</div>';
  }

  function h31SwapPrayerQuick() {
    const grid = document.querySelector('#quickActionModal .grid-2'); if (!grid) return;
    const card = Array.from(grid.children).find(function (c) { return /prayer/i.test(c.textContent || '') && !c.dataset.h31inbox; });
    if (!card) return;
    card.dataset.h31inbox = '1';
    card.setAttribute('onclick', 'closeModalDirect();h31OpenInbox()');
    card.innerHTML = '<i class="fas fa-inbox"></i><div class="mc-title">Inbox</div>';
  }

  function h31HeaderInbox() {
    if (document.getElementById('h31InboxBtn')) return;
    const bell = document.querySelector('.fa-bell'); if (!bell) return;
    const host = bell.closest('button') || bell.parentElement;
    const b = document.createElement('button');
    b.id = 'h31InboxBtn';
    b.style.cssText = 'border:none;background:none;font-size:1.05rem;color:var(--primary);margin-right:10px';
    b.innerHTML = '<i class="fas fa-inbox"></i>';
    b.onclick = function () { window.h31OpenInbox(); };
    host.parentNode.insertBefore(b, host);
  }

  // =====================================================
  // 4) FEATURED MEMBERS repair
  // =====================================================
  window.loadFeatured = function () {
    return sb().from('featured_people').select('*').order('sort', { ascending: true })
      .then(function (r) { window._featured = r.data || []; return window._featured; })
      .catch(function () {
        return sb().from('featured_people').select('*')
          .then(function (r) { window._featured = r.data || []; return window._featured; })
          .catch(function () { window._featured = []; return []; });
      });
  };

  window.feAdd21 = function (uid) {
    if (!uid) return alert('No member id received.');
    sb().from('profiles').select('id,name,role,profile_pic').eq('id', uid).single().then(function (pr) {
      if (pr.error) return alert('Could not load member: ' + pr.error.message);
      const u = pr.data;
      const base = { user_id: uid, name: u.name || 'Member', role: u.role || 'member', image_url: u.profile_pic || null };

      function done() {
        window.loadFeatured().then(function () {
          if (typeof feRender21 === 'function') feRender21();
          if (typeof feShowPicker21 === 'function') feShowPicker21(true);
          if (typeof renderFeaturedLanding === 'function') renderFeaturedLanding();
          alert('✅ ' + base.name + ' added to front page.');
        });
      }
      function fail(msg) {
        alert('⚠️ Could not add featured member:\n' + msg + '\n\nMake sure the featured_people SQL has been run in Supabase.');
      }
      const withSort = Object.assign({}, base, { sort: (window._featured || []).length });
      sb().from('featured_people').insert([withSort]).then(function (r1) {
        if (!r1.error) return done();
        sb().from('featured_people').insert([base]).then(function (r2) {
          if (!r2.error) return done();
          sb().from('featured_people').insert([{ user_id: uid, name: base.name }]).then(function (r3) {
            if (!r3.error) return done();
            fail(r3.error.message);
          });
        });
      });
    });
  };

  // =====================================================
  // 5) hide Multiplayer button
  // =====================================================
  function h31HideMultiplayer() {
    document.querySelectorAll('button, .btn, [onclick]').forEach(function (el) {
      const oc = (el.getAttribute && el.getAttribute('onclick')) || '';
      const tx = (el.textContent || '').trim();
      if (/multiplayerModal/i.test(oc) || /^multiplayer$/i.test(tx)) el.style.display = 'none';
    });
  }

  // =====================================================
  // 6) Trivia: add Next Question outside home
  // =====================================================
  function h31CaptureHomeNext() {
    if (window._h31NextFn) return;
    const b = Array.from(document.querySelectorAll('button')).find(function (x) {
      const card = x.closest('.card') || x.parentElement;
      return /next/i.test(x.textContent || '') && /trivia|question/i.test((card && card.textContent) || '');
    });
    if (b) window._h31NextFn = (b.getAttribute('onclick') || '').trim();
  }
  window.h31NextQ = function () {
    const s = window._h31NextFn;
    if (!s) return alert('Next question not available here.');
    try { (new Function(s))(); } catch (e) { alert(e.message); }
  };
  function h31InjectTriviaNext() {
    h31CaptureHomeNext();
    if (!window._h31NextFn) return;
    document.querySelectorAll('.section.active, .modal-overlay.show').forEach(function (scope) {
      if (scope.id && /home/.test(scope.id)) return;
      const heads = Array.from(scope.querySelectorAll('*')).filter(function (el) {
        return el.children.length === 0 && /trivia/i.test(el.textContent || '');
      });
      heads.forEach(function (hd) {
        const cont = hd.closest('.card') || hd.closest('.sub-page') || hd.parentElement;
        if (!cont || cont.querySelector('[data-h31next]')) return;
        if (cont.closest('#section-home')) return;
        const b = document.createElement('button');
        b.className = 'btn btn-primary btn-block';
        b.style.marginTop = '10px';
        b.setAttribute('data-h31next', '1');
        b.innerHTML = '<i class="fas fa-forward"></i> Next Question';
        b.onclick = function () { window.h31NextQ(); };
        cont.appendChild(b);
      });
    });
  }

  // =====================================================
  // SYNC
  // =====================================================
  function sync() {
    h31MyListCard();
    h31RenameList();
    h31SwapPrayerQuick();
    h31HeaderInbox();
    h31HideMultiplayer();
    h31InjectTriviaNext();
  }
  sync();
  setInterval(sync, 1500);
})();
