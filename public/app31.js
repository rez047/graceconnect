// public/app31.js — FINAL module: nav/sub-pages, my list, featured (manual code path), category full page, stabilizer
(function () {
  console.log('✝️ app31.js — final module');
  function sb() { return window.sb; }
  function me() { return window.user; }
  function isAdmin() { return window.isAdmin ? window.isAdmin() : false; }
  function esc(s) { if (window.esc) return window.esc(s); return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ini(n) { return n ? String(n).split(' ').map(function (w) { return w[0] || ''; }).join('').substring(0, 2).toUpperCase() : '?'; }
  function fdate(t) { return t ? new Date(t).toLocaleDateString() : ''; }
  async function users(force) { if (force) window.usersData = null; if (window.usersData && window.usersData.length) return window.usersData; var r = await sb().from('profiles').select('id,name,profile_pic,email,role').order('name'); if (r.error) r = await sb().from('profiles').select('id,name,profile_pic,role').order('name'); window.usersData = r.data || []; return window.usersData; }
  async function upload(file, path) { if (!file) return null; if (window.uploadMediaFile) { try { return await window.uploadMediaFile(file); } catch (e) {} } var n = (path || 'media') + '/' + Date.now() + '_' + file.name; var r = await sb().storage.from('media').upload(n, file); if (r.error) { alert('Upload failed: ' + r.error.message); return null; } return sb().storage.from('media').getPublicUrl(n).data.publicUrl; }
  function mediaHtml(url) { if (!url) return ''; if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return '<img src="' + url + '" style="width:100%;max-height:280px;object-fit:cover;border-radius:14px;margin-top:6px;display:block">'; if (/\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi|3gp)$/i.test(url)) return '<video src="' + url + '" controls playsinline style="width:100%;max-height:320px;border-radius:14px;margin-top:6px;display:block"></video>'; if (/\.(mp3|wav|m4a|aac)$/i.test(url)) return '<audio src="' + url + '" controls style="width:100%;margin-top:6px;display:block"></audio>'; return '<a href="' + url + '" target="_blank" class="btn btn-secondary-alt btn-sm" style="margin-top:6px"><i class="fas fa-paperclip"></i> File</a>'; }
  function avatarHtml(u, s) { s = s || 38; if (u && u.profile_pic) return '<img src="' + u.profile_pic + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block">'; return '<div class="post-avatar" style="width:' + s + 'px;height:' + s + 'px">' + ini(u && u.name) + '</div>'; }
  window._gcMedia = window._gcMedia || {};
  window.gcAttach = function (key, labelId) { var i = document.createElement('input'); i.type = 'file'; i.accept = '*/*'; i.onchange = function () { var f = i.files && i.files[0]; if (!f) return; window._gcMedia[key] = f; var l = document.getElementById(labelId); if (l) l.innerHTML = '<i class="fas fa-check-circle"></i> ' + esc(f.name); }; i.click(); };
  // ---- RESTORE core navigation helpers if the deleted app30.js removed them ----
  if (typeof window.showSubPage !== 'function') {
    window.showSubPage = function (id) {
      var el = document.getElementById(id); if (!el) return;
      var sec = el.closest('.section');
      if (sec) { document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); }); sec.classList.add('active'); sec.querySelectorAll('.sub-page').forEach(function (sp) { sp.classList.remove('active'); }); }
      var target = el.classList.contains('sub-page') ? el : el.closest('.sub-page'); if (target) target.classList.add('active');
      window._gcLastSub = id; window.scrollTo({ top: 0 });
      try {
        if (id === 'home-trivia' && window.loadRandomTrivia) window.loadRandomTrivia();
        if (id === 'home-bibleReader' && window.loadBibleChapter && !window._bibleVerses) window.loadBibleChapter();
        if (id === 'home-devotional' && window.loadDevotional) window.loadDevotional();
        if (id === 'home-characters' && window.loadCharacters) window.loadCharacters();
      } catch (e) {}
    };
  }
  if (typeof window.switchSection !== 'function') {
    window.switchSection = function (name) {
      document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
      var sec = document.getElementById('section-' + name); if (sec) sec.classList.add('active');
      var navs = document.querySelectorAll('.bottom-nav .nav-item'); var map = { home: 0, ushirika: 1, dept: 2, groups: 3, discover: 4, event: 5, giving: 6 };
      navs.forEach(function (b) { b.classList.remove('active'); }); if (navs[map[name]]) navs[map[name]].classList.add('active');
      window.scrollTo({ top: 0 });
    };
  }
  (function () { var s = document.createElement('style'); s.textContent = '.btn-secondary{background:#EEF2FF;color:#3730A3;border:2px solid #C7D2FE;backdrop-filter:none}.public-landing .btn-secondary,.hero-section .btn-secondary{background:rgba(255,255,255,.2);color:#fff;border:2px solid rgba(255,255,255,.4);backdrop-filter:blur(10px)}'; document.head.appendChild(s); })();

  // ============ NAV: one page per tap, scroll top ============
  function gcNav(fn) { var before = {}; document.querySelectorAll('.section.active').forEach(function (s) { before[s.id || s.className] = 1; }); fn(); setTimeout(function () { var acts = document.querySelectorAll('.section.active'); var keep = null; acts.forEach(function (s) { if (!keep && !before[s.id || s.className]) keep = s; }); if (!keep && acts.length) keep = acts[acts.length - 1]; acts.forEach(function (s) { if (s !== keep) s.classList.remove('active'); }); window.scrollTo({ top: 0 }); }, 90); }
  function gcWrap(name) { var fn = window[name]; if (typeof fn !== 'function' || fn._gcw) return; window[name] = function () { var a = arguments; gcNav(function () { fn.apply(window, a); }); }; window[name]._gcw = true; }
  setInterval(function () { ['h27OpenPage', 'h28OpenForum', 'h28OpenPrayer', 'h30OpenForum', 'h30OpenPlans', 'c26OpenGroup', 'c26OpenHome', 'ggOpenGroup', 'ggOpenHome'].forEach(gcWrap); }, 1500);
  if (window.showSubPage && !window.showSubPage._gcw) { var _sp = window.showSubPage; window.showSubPage = function (p) { var r = _sp.apply(this, arguments); window._gcLastSub = String(p); setTimeout(function () { var el = document.getElementById(String(p)); var sec = el && el.closest('.section'); if (sec) sec.querySelectorAll('.sub-page.active').forEach(function (x) { if (x.id !== String(p)) x.classList.remove('active'); }); window.scrollTo({ top: 0 }); }, 60); return r; }; window.showSubPage._gcw = true; }
  window.gcOpenPrayer = function () { gcNav(function () { if (window.h28OpenPrayer) window.h28OpenPrayer(); else if (window.h27OpenPage) window.h27OpenPage('prayer'); }); };

  // ============ STABILIZER (flood + duplicate + stacked sub-pages) ============
  setInterval(function () { try {
    var eds = document.querySelectorAll('[data-h30edit]');
    if (eds.length) { for (var i = 1; i < eds.length; i++) { if (eds[i].parentNode) eds[i].parentNode.removeChild(eds[i]); } var b0 = document.querySelector('[data-h30edit]'); var ban = b0 && b0.previousElementSibling; if (b0 && ban && ban.classList && ban.classList.contains('dept-banner') && !ban.querySelector('[data-h30edit]')) ban.appendChild(b0); }
    var seen = {}; document.querySelectorAll('button').forEach(function (bt) { var t = (bt.textContent || '').trim(); if (/^Edit Weekly Meeting/i.test(t)) { var sec = bt.closest('.section'); var k = (sec && sec.id) || 'x'; if (seen[k]) { if (bt.parentNode) bt.parentNode.removeChild(bt); } else seen[k] = 1; } });
    document.querySelectorAll('.section').forEach(function (sec) { var act = sec.querySelectorAll('.sub-page.active'); if (act.length < 2) return; var keep = act[0]; if (window._gcLastSub) for (var j = 0; j < act.length; j++) if (act[j].id === window._gcLastSub) keep = act[j]; for (var k2 = 0; k2 < act.length; k2++) if (act[k2] !== keep) act[k2].classList.remove('active'); });
  } catch (e) {} }, 700);

  // ============ MY LIST (departments, ushirika, groups, categories) ============
  var _gcCache = null, _gcCacheT = 0;
  async function gcMyCache(force) { if (!me()) return { list: [], byId: {} }; if (!force && _gcCache && Date.now() - _gcCacheT < 60000) return _gcCache; var uid = me().id, list = [];
    var d = (await sb().from('department_members').select('*').eq('user_id', uid)).data || [];
    var u = (await sb().from('ushirika_members').select('*').eq('user_id', uid)).data || [];
    var g = (await sb().from('church_group_members').select('*').eq('user_id', uid)).data || [];
    var c = (await sb().from('church_group_category_members').select('*').eq('user_id', uid)).data || [];
    async function fill(table, fk, rows, type) { if (!rows.length) return; var r = (await sb().from(table).select('id,name').in('id', rows.map(function (x) { return x[fk]; }))).data || []; var nm = {}; r.forEach(function (x) { nm[x.id] = x.name; }); rows.forEach(function (x) { list.push({ type: type, id: x[fk], name: nm[x[fk]] || type, role: x.role || 'Member' }); }); }
    await fill('departments', 'department_id', d, 'department'); await fill('ushirikas', 'ushirika_id', u, 'ushirika'); await fill('church_groups', 'group_id', g, 'group');
    if (c.length) { var cr = (await sb().from('church_group_categories').select('id,name').in('id', c.map(function (x) { return x.category_id; }))).data || []; var cn = {}; cr.forEach(function (x) { cn[x.id] = x.name; }); c.forEach(function (x) { list.push({ type: 'category', id: x.category_id, name: cn[x.category_id] || 'Category', role: x.role || 'Member' }); }); }
    var byId = {}; list.forEach(function (m) { byId[m.id] = m; }); _gcCache = { list: list, byId: byId }; _gcCacheT = Date.now(); return _gcCache; }
  var GC_OC = { department: 'gcOpenDept', ushirika: 'gcOpenUsh', group: 'gcOpenGrp', category: 'gcOpenCat' };
  var GC_ICON = { department: 'fa-briefcase', ushirika: 'fa-people-group', group: 'fa-users', category: 'fa-child' };
  var GC_GRAD = { department: 'var(--gradient-dept)', ushirika: 'var(--gradient-chat)', group: 'var(--gradient)', category: 'var(--gradient-warm)' };
  window.gcOpenDept = function (id) { gcNav(function () { if (window.c26OpenGroup) window.c26OpenGroup('department', id); else if (window.c26OpenHome) window.c26OpenHome('department'); }); };
  window.gcOpenUsh = function (id) { gcNav(function () { if (window.c26OpenGroup) window.c26OpenGroup('ushirika', id); else if (window.c26OpenHome) window.c26OpenHome('ushirika'); }); };
  window.gcOpenGrp = function (id) { gcNav(function () { if (window.ggOpenGroup) window.ggOpenGroup(id); }); };
  window.gcOpenCat = function (id) { gcNav(function () { window.gcOpenCategoryFull(id); }); };
  window.gcOpenMyList = async function () { if (!me()) return alert('Please log in first.'); var sec = document.getElementById('section-gclist'); if (!sec) { sec = document.createElement('div'); sec.id = 'section-gclist'; sec.className = 'section'; sec.innerHTML = '<div id="gclist-root" class="sub-page active"></div>'; (document.querySelector('main') || document.body).appendChild(sec); } document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); }); sec.classList.add('active'); document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) { b.classList.remove('active'); }); document.getElementById('gclist-root').innerHTML = '<button class="back-btn" onclick="gcListBack()"><i class="fas fa-arrow-left"></i> Back</button><div style="border-radius:20px;padding:16px;color:#fff;background:linear-gradient(135deg,#8B5CF6,#EC4899);font-weight:800;font-size:1.15rem;margin-bottom:14px"><i class="fas fa-list"></i> My List</div><div id="gclist-body"><div class="card">Loading...</div></div>'; window.scrollTo({ top: 0 }); gcLoadMyList(); };
  window.gcListBack = function () { document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); }); var h = document.getElementById('section-home'); if (h) h.classList.add('active'); var n = document.querySelectorAll('.bottom-nav .nav-item'); if (n[0]) n[0].classList.add('active'); document.querySelectorAll('#section-home .sub-page').forEach(function (p) { p.classList.remove('active'); }); var hm = document.getElementById('home-main'); if (hm) hm.classList.add('active'); window.scrollTo({ top: 0 }); };
  async function gcLoadMyList() { var box = document.getElementById('gclist-body'); if (!box) return; var cache = await gcMyCache(true); var T = { department: '🏛️ My Departments', ushirika: '🏘️ My Ushirika', group: '👥 My Groups', category: '🧒 My Categories' }; var html = '';
    ['department', 'ushirika', 'group', 'category'].forEach(function (tp) { var rows = cache.list.filter(function (m) { return m.type === tp; }); html += '<div class="section-title-app" style="font-size:1rem;margin-top:12px">' + T[tp] + ' (' + rows.length + ')</div>'; html += rows.map(function (m) { return '<div class="card" style="display:flex;gap:10px;align-items:center;cursor:pointer;margin-bottom:8px" onclick="' + GC_OC[tp] + '(\'' + m.id + '\')"><div style="width:42px;height:42px;border-radius:12px;background:' + GC_GRAD[tp] + ';color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas ' + GC_ICON[tp] + '"></i></div><div style="flex:1;min-width:0"><b style="font-size:.9rem">' + esc(m.name) + '</b><div style="font-size:.72rem;color:var(--text-light)">Role: ' + esc(m.role) + '</div></div><i class="fas fa-chevron-right" style="color:var(--text-lighter)"></i></div>'; }).join('') || '<div class="card">None yet.</div>'; });
    box.innerHTML = html; gcUpdateCount(cache.list.length); }
  function gcUpdateCount(n) { var el = document.getElementById('myDeptsCount'); if (el) el.textContent = n + ' joined'; }
  async function gcRebuildStrip() { var sc = document.querySelector('.my-depts-scroll'); if (!sc || !me()) return; var cache = await gcMyCache(); var html = cache.list.map(function (m) { return '<div class="my-dept-mini" style="background:' + GC_GRAD[m.type] + '" onclick="' + GC_OC[m.type] + '(\'' + m.id + '\')"><div class="my-dept-mini-icon"><i class="fas ' + GC_ICON[m.type] + '"></i></div><div class="my-dept-mini-name">' + esc(m.name) + '</div><div style="margin-top:6px"><span class="my-dept-mini-role-badge">' + esc(m.role) + '</span></div><div style="font-size:.58rem;opacity:.9;margin-top:4px;text-transform:uppercase">' + m.type + '</div></div>'; }).join(''); html += '<div class="my-dept-join-more" onclick="gcOpenMyList()"><i class="fas fa-list" style="font-size:1.2rem;margin-bottom:6px"></i><div style="font-size:.75rem;font-weight:700">View Full List</div></div>'; sc.innerHTML = html; sc.setAttribute('data-gc', '1'); gcUpdateCount(cache.list.length); }
  if (window.renderMyDepts && !window.renderMyDepts._gcw) { var _rd = window.renderMyDepts; window.renderMyDepts = function () { var r = _rd.apply(this, arguments); setTimeout(gcRebuildStrip, 60); return r; }; window.renderMyDepts._gcw = true; }
  setInterval(function () { var h = document.getElementById('section-home'); var sc = document.querySelector('.my-depts-scroll'); if (me() && h && h.classList.contains('active') && sc && sc.getAttribute('data-gc') !== '1') gcRebuildStrip(); }, 4000);

  // ============ FEATURED (system members via the working manual-add code) ============
  window._gcFe = { uid: null, pic: null, roles: [] };
  window.gcManageFeatured = async function () { if (!isAdmin()) return alert('Admin only.'); if (window.loadFeatured) { try { await window.loadFeatured(); } catch (e) {} } var list = window._featured || []; document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay show" id="gcFeMgr" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-star"></i> Featured Members</div><div style="max-height:300px;overflow-y:auto">' + (list.map(function (p) { return '<div style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px">' + (p.image_url ? '<img src="' + p.image_url + '" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0">' : '<div class="post-avatar" style="width:34px;height:34px">' + ini(p.name) + '</div>') + '<div style="flex:1;min-width:0"><b style="font-size:.85rem">' + esc(p.name || 'Member') + '</b><div style="font-size:.68rem;color:var(--primary);font-weight:700">' + esc(p.role || 'Member') + '</div>' + (p.additional_info ? '<div style="font-size:.66rem;color:var(--text-light)">' + esc(p.additional_info) + '</div>' : '') + '</div>' + (p.user_id ? '<span class="chip chip-green">system</span>' : '<span class="chip" style="background:#FEF3C7;color:#92400E">manual</span>') + '<button class="btn btn-danger btn-sm" onclick="gcRemoveFeatured(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div class="card">No featured members yet.</div>') + '</div><button class="btn btn-warm btn-block" style="margin-top:10px" onclick="document.getElementById(\'gcFeMgr\').remove();gcFeatureSystemModal()"><i class="fas fa-user-plus"></i> Add System Member</button><button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="document.getElementById(\'gcFeMgr\').remove()">Close</button></div></div>'); };
  window.gcRemoveFeatured = async function (id) { if (!isAdmin() || !confirm('Remove this featured member?')) return; var r = await sb().from('featured_people').delete().eq('id', id); if (r.error) return alert(r.error.message); if (window.loadFeatured) window.loadFeatured(); };
  window.gcFeatureSystemModal = async function () { if (!isAdmin()) return alert('Admin only.'); var us = await users(); window._gcFe = { uid: null, pic: null, roles: [] }; document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay show" id="gcFeM" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-star"></i> Add System Member to Featured</div><div id="gcFePick" style="max-height:260px;overflow-y:auto">' + us.map(function (u) { return '<div onclick="gcFePick(\'' + u.id + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">' + avatarHtml(u, 32) + '<div style="flex:1"><b style="font-size:.85rem">' + esc(u.name) + '</b><div style="font-size:.68rem;color:var(--text-light)">' + esc(u.role || 'Member') + '</div></div><i class="fas fa-plus" style="color:var(--primary)"></i></div>'; }).join('') + '</div><div id="gcFeForm" style="display:none"></div></div></div>'); };
  window.gcFePick = async function (uid) { var us = await users(); var u = us.find(function (x) { return x.id === uid; }); if (!u) return; window._gcFe = { uid: uid, pic: u.profile_pic || null, roles: u.role ? [u.role] : ['Member'] }; var sug = []; var d = (await sb().from('department_members').select('role').eq('user_id', uid)).data || []; var uu = (await sb().from('ushirika_members').select('role').eq('user_id', uid)).data || []; var g = (await sb().from('church_group_members').select('role').eq('user_id', uid)).data || []; var c = (await sb().from('church_group_category_members').select('role').eq('user_id', uid)).data || []; d.concat(uu, g, c).forEach(function (r) { var role = r.role || 'Member'; if (sug.indexOf(role) === -1) sug.push(role); }); document.getElementById('gcFePick').style.display = 'none'; var f = document.getElementById('gcFeForm'); f.style.display = 'block'; f.innerHTML = '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">' + avatarHtml(u, 46) + '<div><b>' + esc(u.name) + '</b></div></div><div class="form-group"><label class="form-label">Name</label><input class="form-input" id="gcFeName" value="' + esc(u.name || '') + '"></div><div class="form-group"><label class="form-label">Position (roles to display — add/remove)</label><div id="gcFeChips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px"></div><div style="display:flex;gap:6px"><input class="form-input" id="gcFeRoleAdd" placeholder="Add role / position..." style="flex:1"><button class="btn btn-primary btn-sm" onclick="gcFeAddRole()"><i class="fas fa-plus"></i></button></div>' + (sug.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">' + sug.map(function (s) { return '<button class="chip chip-green" onclick="gcFeAddRole(\'' + esc(s) + '\')">' + esc(s) + '</button>'; }).join('') + '</div>' : '') + '</div><div class="form-group"><label class="form-label">Photo</label><div id="gcFePrev" style="margin-bottom:6px"></div><button class="btn btn-secondary btn-sm" onclick="gcFeUpload()"><i class="fas fa-camera"></i> ' + (u.profile_pic ? 'Change photo' : 'Upload photo') + '</button>' + (u.profile_pic ? ' <button class="btn btn-secondary-alt btn-sm" onclick="gcFeUsePic()"><i class="fas fa-user"></i> Use profile photo</button>' : '') + '</div><div class="form-group"><label class="form-label">Additional info (same field as outside-system)</label><textarea class="form-textarea" id="gcFeInfo" rows="3" placeholder="Optional extra info..."></textarea></div><button class="btn btn-warm btn-block" onclick="gcSaveFeatured()"><i class="fas fa-star"></i> Add to Featured</button>'; gcFeChips(); gcFePrev(); };
  window.gcFeAddRole = function (r) { var v = (r || (document.getElementById('gcFeRoleAdd') || {}).value || '').trim(); if (!v) return; if (window._gcFe.roles.indexOf(v) === -1) window._gcFe.roles.push(v); var i = document.getElementById('gcFeRoleAdd'); if (i) i.value = ''; gcFeChips(); };
  window.gcFeRemoveRole = function (i) { window._gcFe.roles.splice(i, 1); gcFeChips(); };
  function gcFeChips() { var c = document.getElementById('gcFeChips'); if (!c) return; c.innerHTML = window._gcFe.roles.map(function (r, i) { return '<span class="chip chip-green">' + esc(r) + ' <b onclick="gcFeRemoveRole(' + i + ')" style="cursor:pointer;margin-left:4px;color:#991B1B">✕</b></span>'; }).join('') || '<span style="font-size:.7rem;color:var(--text-lighter)">Add at least one position.</span>'; }
  window.gcFeUpload = function () { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async function () { var f = i.files && i.files[0]; if (!f) return; window._gcFe.pic = await upload(f, 'featured'); gcFePrev(); }; i.click(); };
  window.gcFeUsePic = async function () { var us = await users(); var u = us.find(function (x) { return x.id === window._gcFe.uid; }); window._gcFe.pic = (u && u.profile_pic) || null; gcFePrev(); };
  function gcFePrev() { var p = document.getElementById('gcFePrev'); if (!p) return; p.innerHTML = window._gcFe.pic ? '<img src="' + window._gcFe.pic + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;display:block">' : '<div style="font-size:.7rem;color:var(--text-lighter)">No photo — initials will show.</div>'; }
  window.gcSaveFeatured = async function () { var fe = window._gcFe; var name = (document.getElementById('gcFeName').value || '').trim(); if (!name) return alert('Name required.'); if (!fe.roles.length) return alert('Add at least one position.'); var info = (document.getElementById('gcFeInfo').value || '').trim(); var payload = { user_id: fe.uid, name: name, role: fe.roles.join(' • ') || 'Member', image_url: fe.pic || null, sort: (window._featured || []).length, additional_info: info || null }; var r = await sb().from('featured_people').insert([payload]); if (r.error) return alert(r.error.message); document.getElementById('gcFeM').remove(); alert('✅ Added to featured members.'); if (window.loadFeatured) window.loadFeatured(); };
  setInterval(function () { if (!isAdmin() || !me()) return; var hm = document.getElementById('home-main'); if (!hm || document.getElementById('gcFeEntry')) return; var d = document.createElement('div'); d.id = 'gcFeEntry'; d.style.cssText = 'margin-bottom:12px'; d.innerHTML = '<button class="btn btn-warm btn-block" onclick="gcManageFeatured()"><i class="fas fa-star"></i> Featured Members (Admin)</button>'; hm.insertBefore(d, hm.firstChild); }, 2500);

  // ============ CATEGORY FULL PAGE (forum + roles + meetings + gated reports) ============
  async function gcGroupRole(gid) { if (!me()) return ''; var r = await sb().from('church_group_members').select('role').eq('group_id', gid).eq('user_id', me().id).limit(1); return String(((r.data || [])[0] || {}).role || '').toLowerCase(); }
  async function gcGroupManage(gid) { if (isAdmin()) return true; return ['leader', 'chairman'].includes(await gcGroupRole(gid)); }
  async function gcCatRole(cid) { if (!me()) return ''; var r = await sb().from('church_group_category_members').select('role').eq('category_id', cid).eq('user_id', me().id).limit(1); return String(((r.data || [])[0] || {}).role || '').toLowerCase(); }
  async function gcCatManage(cat) { if (!cat) return false; if (isAdmin()) return true; if (cat.teacher_id && me() && cat.teacher_id === me().id) return true; if (['leader', 'chairman'].includes(await gcGroupRole(cat.group_id))) return true; return ['teacher', 'leader', 'chairman'].includes(await gcCatRole(cat.id)); }
  setInterval(function () { if (window.ggOpenCategory && !window.ggOpenCategory._gcroute && window.gcOpenCategoryFull) { window.ggOpenCategory = function (id) { return window.gcOpenCategoryFull(id); }; window.ggOpenCategory._gcroute = true; } }, 1500);
  window.gcOpenCategoryFull = async function (categoryId) { if (!me()) return alert('Please log in first.'); var sec = document.getElementById('section-gccat'); if (!sec) { sec = document.createElement('div'); sec.id = 'section-gccat'; sec.className = 'section'; sec.innerHTML = '<div id="gccat-root" class="sub-page active"></div>'; (document.querySelector('main') || document.body).appendChild(sec); } document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); }); sec.classList.add('active'); document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) { b.classList.remove('active'); }); var root = document.getElementById('gccat-root'); root.innerHTML = '<div class="card">Loading...</div>'; window.scrollTo({ top: 0 });
    var c = await sb().from('church_group_categories').select('*').eq('id', categoryId).single(); if (c.error || !c.data) return alert('Category not found.'); var cat = c.data; window._gcCat = cat;
    var gm = await gcGroupManage(cat.group_id), cm = await gcCatManage(cat), memRow = me() ? ((await sb().from('church_group_category_members').select('*').eq('category_id', cat.id).eq('user_id', me().id).limit(1)).data || [])[0] : null;
    var us = await users(); var teacher = us.find(function (u) { return u.id === cat.teacher_id; });
    var html = '<button class="back-btn" onclick="gcOpenGrp(\'' + cat.group_id + '\');setTimeout(function(){window.ggSwitchGroupTab&&ggSwitchGroupTab(\'categories\');},500)"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div class="dept-banner" style="border-radius:20px;margin-bottom:12px"><div class="dept-icon" style="background:var(--gradient-warm)"><i class="fas fa-child"></i></div><div><div style="font-weight:800;font-size:1.2rem">' + esc(cat.name) + '</div><div style="font-size:.83rem;opacity:.9">Age: ' + esc(cat.min_age || 0) + ' - ' + esc(cat.max_age || 99) + '</div><div style="font-size:.8rem;opacity:.9"><i class="fas fa-chalkboard-teacher"></i> Teacher: ' + esc((teacher && teacher.name) || 'Not assigned') + '</div></div></div>';
    html += '<button class="btn ' + (memRow ? 'btn-danger' : 'btn-primary') + ' btn-sm" style="margin-bottom:10px" onclick="gcJoinCat(\'' + cat.id + '\')">' + (memRow ? '<i class="fas fa-sign-out-alt"></i> Leave Category' : '<i class="fas fa-sign-in-alt"></i> Join Category') + '</button>' + (memRow ? ' <span class="chip chip-green">Your role: ' + esc(memRow.role || 'Member') + '</span>' : '') + (gm ? ' <button class="btn btn-warm btn-sm" onclick="gcAssignTeacher(\'' + cat.id + '\')"><i class="fas fa-chalkboard-teacher"></i> Assign Teacher</button>' : '');
    html += '<div class="tabs"><div class="tab active" id="gct-forum" onclick="gcCatTab(\'forum\')">Forum</div><div class="tab" id="gct-members" onclick="gcCatTab(\'members\')">Members</div><div class="tab" id="gct-meetings" onclick="gcCatTab(\'meetings\')">Meetings</div><div class="tab" id="gct-reports" onclick="gcCatTab(\'reports\')">Reports</div></div><div id="gcc-forum"></div><div id="gcc-members" style="display:none"></div><div id="gcc-meetings" style="display:none"></div><div id="gcc-reports" style="display:none"></div>';
    root.innerHTML = html; window.gcCatTab('forum'); };
  window.gcCatTab = function (t) { ['forum', 'members', 'meetings', 'reports'].forEach(function (x) { var b = document.getElementById('gct-' + x); if (b) b.classList.toggle('active', x === t); var p = document.getElementById('gcc-' + x); if (p) p.style.display = x === t ? 'block' : 'none'; }); if (!window._gcCat) return; if (t === 'forum') gcCatForum(); if (t === 'members') gcCatMembers(); if (t === 'meetings') gcCatMeetings(); if (t === 'reports') gcCatReports(); };
  window.gcJoinCat = async function (cid) { var ex = (await sb().from('church_group_category_members').select('id').eq('category_id', cid).eq('user_id', me().id).limit(1)).data || []; if (ex.length) await sb().from('church_group_category_members').delete().eq('id', ex[0].id); else { var r = await sb().from('church_group_category_members').insert([{ category_id: cid, user_id: me().id, role: 'Member' }]); if (r.error) return alert(r.error.message); } window.gcOpenCategoryFull(cid); };
  window.gcAssignTeacher = async function (cid) { var us = await users(); document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay show" id="gcT" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">Assign Teacher</div><div style="max-height:320px;overflow-y:auto">' + us.map(function (u) { return '<div onclick="gcSetTeacher(\'' + cid + '\',\'' + u.id + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">' + avatarHtml(u, 32) + '<b style="font-size:.85rem">' + esc(u.name) + '</b></div>'; }).join('') + '</div></div></div>'); };
  window.gcSetTeacher = async function (cid, uid) { var r = await sb().from('church_group_categories').update({ teacher_id: uid }).eq('id', cid); if (r.error) return alert(r.error.message); document.getElementById('gcT').remove(); window.gcOpenCategoryFull(cid); };
  window.gcCatSetRole = async function (uid, role) { var r = await sb().from('church_group_category_members').update({ role: role }).eq('category_id', window._gcCat.id).eq('user_id', uid); if (r.error) return alert(r.error.message); gcCatMembers(); };
  window.gcCatRemove = async function (uid) { if (!confirm('Remove from category?')) return; await sb().from('church_group_category_members').delete().eq('category_id', window._gcCat.id).eq('user_id', uid); gcCatMembers(); };
  async function gcCatForum() { var cat = window._gcCat, box = document.getElementById('gcc-forum'); if (!box) return; var canPost = await gcCatManage(cat); var html = '<div class="card">'; if (canPost) html += '<textarea class="form-textarea" id="gcfText" rows="2" placeholder="Post to ' + esc(cat.name) + ' forum..."></textarea><div class="media-upload" id="gcfUp" onclick="gcAttach(\'cfpost\',\'gcfUp\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media/video/file (optional)</span></div><button class="btn btn-primary btn-block" onclick="gcCatPost()"><i class="fas fa-paper-plane"></i> Post</button>'; else html += '<div style="font-size:.8rem;color:var(--text-light)">Leadership & teachers post; members comment (media allowed on comments).</div>'; html += '<div id="gcfList" style="margin-top:10px"></div></div>'; box.innerHTML = html; gcCatLoadPosts(); }
  window.gcCatPost = async function () { var t = document.getElementById('gcfText').value.trim(), f = window._gcMedia.cfpost; if (!t && !f) return alert('Write something or add media.'); var url = f ? await upload(f, 'category-forum') : null; var r = await sb().from('community_posts').insert([{ group_type: 'category', group_id: window._gcCat.id, user_id: me().id, text: t, media_url: url }]); if (r.error) return alert(r.error.message); window._gcMedia.cfpost = null; gcCatLoadPosts(); };
  window.gcCatDelPost = async function (id) { if (!confirm('Delete post?')) return; await sb().from('community_comments').delete().eq('post_id', id); await sb().from('community_posts').delete().eq('id', id); gcCatLoadPosts(); };
  window.gcCatDelComment = async function (id) { if (!confirm('Delete comment/reply?')) return; await sb().from('community_comments').delete().eq('id', id); gcCatLoadPosts(); };
  window.gcCatComment = async function (postId, parentId) { var iid = parentId ? 'gcrt-' + parentId : 'gci-' + postId; var key = parentId ? 'cr_' + parentId : 'cc_' + postId; var t = document.getElementById(iid).value.trim(), f = window._gcMedia[key]; if (!t && !f) return; var url = f ? await upload(f, 'category-comments') : null; var r = await sb().from('community_comments').insert([{ post_id: postId, user_id: me().id, text: t, media_url: url, parent_comment_id: parentId || null }]); if (r.error) return alert(r.error.message); window._gcMedia[key] = null; gcCatLoadPosts(); };
  window.gcToggle = function (id) { var e = document.getElementById(id); if (e) e.style.display = e.style.display === 'none' ? 'block' : 'none'; };
  async function gcCatLoadPosts() { var box = document.getElementById('gcfList'); if (!box) return; var cat = window._gcCat; var posts = await sb().from('community_posts').select('*').eq('group_type', 'category').eq('group_id', cat.id).order('created_at', { ascending: false }).limit(50); if (posts.error) { box.innerHTML = esc(posts.error.message); return; } var ids = (posts.data || []).map(function (p) { return p.id; }); var cs = { data: [] }; if (ids.length) cs = await sb().from('community_comments').select('*').in('post_id', ids).order('created_at'); var us = await users(); window._gcUsers = us; var byPost = {}; (cs.data || []).forEach(function (c) { (byPost[c.post_id] = byPost[c.post_id] || []).push(c); });
    function tree(list) { var map = {}, roots = []; list.forEach(function (c) { c._k = []; map[c.id] = c; }); list.forEach(function (c) { if (c.parent_comment_id && map[c.parent_comment_id]) map[c.parent_comment_id]._k.push(c); else roots.push(c); }); return roots; }
    function comments(list, depth, postId) { return list.map(function (c) { var u = us.find(function (x) { return x.id === c.user_id; }); var canDel = isAdmin() || (me() && c.user_id === me().id); return '<div style="margin-left:' + Math.min(depth, 4) * 16 + 'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px"><div style="display:flex;gap:6px;align-items:center">' + avatarHtml(u, 26) + '<b style="font-size:.78rem;flex:1">' + esc((u && u.name) || 'Member') + '</b>' + (canDel ? '<button class="btn btn-danger btn-sm" onclick="gcCatDelComment(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div><div style="font-size:.88rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text || '') + '</div>' + mediaHtml(c.media_url) + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:4px" onclick="gcToggle(\'gcr-' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button><div id="gcr-' + c.id + '" style="display:none;margin-top:6px"><div style="display:flex;gap:6px;align-items:center"><input class="form-input" id="gcrt-' + c.id + '" placeholder="Reply..." style="flex:1"><button class="btn btn-secondary btn-sm" onclick="gcAttach(\'cr_' + c.id + '\',\'gcru-' + c.id + '\')"><i class="fas fa-paperclip"></i></button><span id="gcru-' + c.id + '" style="font-size:.65rem"></span><button class="btn btn-primary btn-sm" onclick="gcCatComment(\'' + postId + '\',\'' + c.id + '\')"><i class="fas fa-paper-plane"></i></button></div></div>' + comments(c._k || [], depth + 1, postId) + '</div>'; }).join(''); }
    box.innerHTML = (posts.data || []).map(function (p) { var u = us.find(function (x) { return x.id === p.user_id; }); var canDel = isAdmin() || (me() && p.user_id === me().id); return '<div class="card" style="border-radius:16px;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center">' + avatarHtml(u, 38) + '<div style="flex:1"><b style="font-size:.9rem">' + esc((u && u.name) || 'Member') + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>' + (canDel ? '<button class="btn btn-danger btn-sm" onclick="gcCatDelPost(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div><div style="white-space:pre-wrap;margin:8px 0">' + esc(p.text || '') + '</div>' + mediaHtml(p.media_url) + comments(tree(byPost[p.id] || []), 0, p.id) + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center"><input class="form-input" id="gci-' + p.id + '" placeholder="Comment..." style="flex:1"><button class="btn btn-secondary btn-sm" onclick="gcAttach(\'cc_' + p.id + '\',\'gcu-' + p.id + '\')"><i class="fas fa-paperclip"></i></button><span id="gcu-' + p.id + '" style="font-size:.65rem"></span><button class="btn btn-primary btn-sm" onclick="gcCatComment(\'' + p.id + '\',null)"><i class="fas fa-paper-plane"></i></button></div></div>'; }).join('') || '<div style="color:var(--text-light);text-align:center">No posts yet.</div>'; }
  async function gcCatMembers() { var cat = window._gcCat, box = document.getElementById('gcc-members'); if (!box) return; var gm = await gcGroupManage(cat.group_id); var m = (await sb().from('church_group_category_members').select('*').eq('category_id', cat.id)).data || []; var us = await users(); var html = m.map(function (r) { var u = us.find(function (x) { return x.id === r.user_id; }); return '<div class="card" style="margin-bottom:8px"><div style="display:flex;gap:10px;align-items:center">' + avatarHtml(u, 38) + '<div style="flex:1"><b>' + esc((u && u.name) || 'Member') + '</b><div style="font-size:.72rem;color:var(--primary);font-weight:700">' + esc(r.role || 'Member') + '</div></div></div>' + (gm ? '<div style="display:flex;gap:8px;margin-top:8px"><select class="form-select" onchange="gcCatSetRole(\'' + r.user_id + '\',this.value)">' + ['Member', 'Teacher', 'Leader', 'Chairman'].map(function (o) { return '<option' + ((r.role || 'Member') === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select><button class="btn btn-danger btn-sm" onclick="gcCatRemove(\'' + r.user_id + '\')"><i class="fas fa-trash"></i></button></div>' : '') + '</div>'; }).join('') || '<div class="card">No category members yet — join first.</div>'; if (gm) html += '<button class="btn btn-warm btn-block" onclick="gcCatAddPick()"><i class="fas fa-user-plus"></i> Add Member (from group)</button>'; box.innerHTML = html; }
  window.gcCatAddPick = async function () { var cat = window._gcCat; var gmRows = (await sb().from('church_group_members').select('user_id').eq('group_id', cat.group_id)).data || []; var have = ((await sb().from('church_group_category_members').select('user_id').eq('category_id', cat.id)).data || []).map(function (x) { return x.user_id; }); var us = await users(); var list = gmRows.filter(function (g) { return !have.includes(g.user_id); }).map(function (g) { return us.find(function (u) { return u.id === g.user_id; }); }).filter(Boolean); document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay show" id="gcAM" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">Add category member</div><div style="max-height:320px;overflow-y:auto">' + (list.map(function (u) { return '<div onclick="gcCatAdd(\'' + u.id + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">' + avatarHtml(u, 32) + '<b style="font-size:.85rem">' + esc(u.name) + '</b></div>'; }).join('') || '<div class="card">All group members already added.</div>') + '</div></div></div>'); };
  window.gcCatAdd = async function (uid) { var r = await sb().from('church_group_category_members').insert([{ category_id: window._gcCat.id, user_id: uid, role: 'Member' }]); if (r.error) return alert(r.error.message); document.getElementById('gcAM').remove(); gcCatMembers(); };
  async function gcCatMeetings() { var cat = window._gcCat, box = document.getElementById('gcc-meetings'); if (!box) return; var cm = await gcCatManage(cat); var r = (await sb().from('church_group_category_records').select('*').eq('category_id', cat.id).order('record_date', { ascending: false }).limit(100)).data || []; var html = ''; if (cm) html += '<div class="card"><b>📝 Take Attendance / Meeting</b><div class="grid-2" style="margin-top:8px"><input class="form-input" id="gcmDate" type="date"><input class="form-input" id="gcmPresent" type="number" placeholder="No. present"></div><textarea class="form-textarea" id="gcmNames" rows="2" placeholder="Names known attendance" style="margin-top:8px"></textarea><input class="form-input" id="gcmLesson" placeholder="Lesson / theme" style="margin-top:8px"><input class="form-input" id="gcmOffering" type="number" step="0.01" placeholder="Total offering" style="margin-top:8px"><div class="media-upload" id="gcmUp" style="margin-top:8px" onclick="gcAttach(\'mmedia\',\'gcmUp\')"><i class="fas fa-cloud-upload-alt"></i><span>Upload media (optional)</span></div><button class="btn btn-primary btn-block" onclick="gcSaveRecord()"><i class="fas fa-save"></i> Save Record</button></div>'; var tp = 0, to = 0; r.forEach(function (x) { tp += Number(x.students_present || 0); to += Number(x.total_offering || 0); html += '<div class="card"><b>' + esc(x.lesson || 'Meeting') + '</b><div style="font-size:.78rem;color:var(--text-light)">' + esc(x.record_date || '') + '</div><div style="margin-top:4px"><i class="fas fa-users"></i> ' + esc(x.students_present || 0) + ' present' + (cm ? ' &nbsp;<i class="fas fa-coins"></i> ' + Number(x.total_offering || 0).toFixed(2) : '') + '</div>' + (x.student_names ? '<div style="font-size:.78rem;white-space:pre-wrap;margin-top:4px">' + esc(x.student_names) + '</div>' : '') + mediaHtml(x.media_url) + '</div>'; }); html += '<div class="card" style="text-align:center;font-weight:800">Total Students Present: ' + tp + (cm ? '<br>Total Offering: ' + to.toFixed(2) : '<br><span style="font-size:.72rem;color:var(--text-lighter)">Offering visible to leadership/teacher only</span>') + '</div>'; box.innerHTML = html; }
  window.gcSaveRecord = async function () { var cat = window._gcCat, f = window._gcMedia.mmedia; var url = f ? await upload(f, 'category-records') : null; var r = await sb().from('church_group_category_records').insert([{ category_id: cat.id, group_id: cat.group_id, record_date: document.getElementById('gcmDate').value, student_names: document.getElementById('gcmNames').value.trim(), students_present: Number(document.getElementById('gcmPresent').value || 0), total_offering: Number(document.getElementById('gcmOffering').value || 0), lesson: document.getElementById('gcmLesson').value.trim(), media_url: url }]); if (r.error) return alert(r.error.message); window._gcMedia.mmedia = null; gcCatMeetings(); };
  async function gcCatReports() { var cat = window._gcCat, box = document.getElementById('gcc-reports'); if (!box) return; var cm = await gcCatManage(cat); var r = (await sb().from('church_group_category_records').select('*').eq('category_id', cat.id)).data || []; var tp = 0, to = 0; r.forEach(function (x) { tp += Number(x.students_present || 0); to += Number(x.total_offering || 0); }); box.innerHTML = '<div class="card" style="text-align:center;font-weight:800">Total Students Present: ' + tp + (cm ? '<br>Total Offering: ' + to.toFixed(2) : '<br><span style="font-size:.72rem;color:var(--text-lighter)">Offering totals hidden for members</span>') + '</div>' + (cm ? '<div class="card">' + r.map(function (x) { return '<div style="display:flex;justify-content:space-between;font-size:.82rem;padding:4px 0;border-bottom:1px solid var(--border)"><span>' + esc(x.record_date || '') + ' • ' + esc(x.lesson || 'Record') + '</span><b>' + Number(x.total_offering || 0).toFixed(2) + '</b></div>'; }).join('') + '</div>' : ''); }
  // ============ BLOCK C — quick-tile sub-pages + featured tap-to-add (photo/name/titles/info) ============
  // 1) Robust showSubPage override (fixes Trivia/Bible/Characters/Devotional tiles)
  window.showSubPage = function (id) {
    var el = document.getElementById(id); if (!el) return;
    var sec = el.closest('.section');
    if (sec) {
      document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
      sec.classList.add('active');
      sec.querySelectorAll('.sub-page').forEach(function (sp) { sp.classList.remove('active'); });
    }
    var target = el.classList.contains('sub-page') ? el : el.closest('.sub-page');
    if (target) target.classList.add('active');
    window._gcLastSub = id;
    window.scrollTo({ top: 0 });
    try {
      if (id === 'home-trivia' && window.loadRandomTrivia) window.loadRandomTrivia();
      if (id === 'home-bibleReader' && window.loadBibleChapter && !(window._bibleVerses || []).length) window.loadBibleChapter();
      if (id === 'home-devotional' && window.loadDevotional) window.loadDevotional();
      if (id === 'home-characters' && window.loadCharacters) window.loadCharacters();
    } catch (e) {}
  };

  // 2) Featured: tapping a member now opens the enrich form (photo option, editable system name,
  //    titles = all system roles with add/edit/remove, optional additional info)
  window._gcFeEdit = { uid: null, pic: null, roles: [] };
  window.feAdd21 = function (uid) { window.gcFeOpenForm(uid); };
  window.gcFeOpenForm = async function (uid) {
    var us = await users();
    var u = us.find(function (x) { return x.id === uid; }); if (!u) return alert('Member not found.');
    var roles = [];
    if (u.role && u.role !== 'member') roles.push(u.role);
    var d = (await sb().from('department_members').select('role,departments(name)').eq('user_id', uid)).data || [];
    d.forEach(function (m) { roles.push((m.role || 'Member') + ' – ' + ((m.departments || {}).name || 'Department')); });
    var uu = (await sb().from('ushirika_members').select('role,ushirikas(name)').eq('user_id', uid)).data || [];
    uu.forEach(function (m) { if ((m.role || 'Member') !== 'member') roles.push(m.role + ' – ' + ((m.ushirikas || {}).name || 'Ushirika')); });
    var g = (await sb().from('church_group_members').select('role,church_groups(name)').eq('user_id', uid)).data || [];
    g.forEach(function (m) { if ((m.role || 'Member') !== 'member') roles.push(m.role + ' – ' + ((m.church_groups || {}).name || 'Group')); });
    var c = (await sb().from('church_group_category_members').select('role,church_group_categories(name)').eq('user_id', uid)).data || [];
    c.forEach(function (m) { if ((m.role || 'Member') !== 'member') roles.push(m.role + ' – ' + ((m.church_group_categories || {}).name || 'Category')); });
    if (!roles.length) roles.push('Member');
    window._gcFeEdit = { uid: uid, pic: u.profile_pic || null, roles: roles };
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="gcFeForm" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div>'
      + '<div class="modal-title"><i class="fas fa-star"></i> Add to Front Page</div>'
      + '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px"><div id="gcFePic">' + (u.profile_pic ? '<img src="' + u.profile_pic + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block">' : '<div class="post-avatar" style="width:56px;height:56px">' + ini(u.name) + '</div>') + '</div><div style="flex:1"><b>' + esc(u.name) + '</b></div></div>'
      + '<button class="btn btn-secondary btn-sm" onclick="gcFePicUpload()"><i class="fas fa-camera"></i> Tap to choose photo</button> '
      + '<button class="btn btn-secondary-alt btn-sm" onclick="gcFePicProfile()"><i class="fas fa-user"></i> Use profile picture</button>'
      + '<div class="form-group" style="margin-top:10px"><label class="form-label">Name (system name — editable)</label><input class="form-input" id="gcFeName" value="' + esc(u.name || '') + '"></div>'
      + '<div class="form-group"><label class="form-label">Title / roles to display (add • edit ✎ • remove ✕)</label><div id="gcFeChips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px"></div>'
      + '<div style="display:flex;gap:6px"><input class="form-input" id="gcFeRoleAdd" placeholder="Add a title..." style="flex:1"><button class="btn btn-primary btn-sm" onclick="gcFeRoleAdd()"><i class="fas fa-plus"></i></button></div></div>'
      + '<div class="form-group"><label class="form-label">Additional info (optional)</label><textarea class="form-textarea" id="gcFeInfo" rows="2" placeholder="e.g. Serving since 2015…"></textarea></div>'
      + '<button class="btn btn-warm btn-block" onclick="gcFeSave()"><i class="fas fa-star"></i> Add to front page</button>'
      + '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="document.getElementById(\'gcFeForm\').remove()">Cancel</button>'
      + '</div></div>');
    gcFeChipsRender();
  };
  window.gcFePicUpload = function () { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = function () { var f = i.files && i.files[0]; if (!f) return; upload(f, 'featured').then(function (url) { window._gcFeEdit.pic = url; var b = document.getElementById('gcFePic'); if (b) b.innerHTML = '<img src="' + url + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block">'; }); }; i.click(); };
  window.gcFePicProfile = async function () { var us = await users(); var u = us.find(function (x) { return x.id === window._gcFeEdit.uid; }); window._gcFeEdit.pic = (u && u.profile_pic) || null; var b = document.getElementById('gcFePic'); if (b) b.innerHTML = window._gcFeEdit.pic ? '<img src="' + window._gcFeEdit.pic + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block">' : '<div class="post-avatar" style="width:56px;height:56px">' + ini(u && u.name) + '</div>'; };
  window.gcFeRoleAdd = function (v) { v = (v || (document.getElementById('gcFeRoleAdd') || {}).value || '').trim(); if (!v) return; window._gcFeEdit.roles.push(v); var i = document.getElementById('gcFeRoleAdd'); if (i) i.value = ''; gcFeChipsRender(); };
  window.gcFeRoleDel = function (i) { window._gcFeEdit.roles.splice(i, 1); gcFeChipsRender(); };
  window.gcFeRoleEdit = function (i) { var v = prompt('Edit title:', window._gcFeEdit.roles[i]); if (v === null) return; v = v.trim(); if (!v) return; window._gcFeEdit.roles[i] = v; gcFeChipsRender(); };
  function gcFeChipsRender() { var c = document.getElementById('gcFeChips'); if (!c) return; c.innerHTML = window._gcFeEdit.roles.map(function (r, i) { return '<span class="chip chip-green" style="font-size:.72rem">' + esc(r) + ' <b onclick="gcFeRoleEdit(' + i + ')" style="cursor:pointer;margin-left:4px;color:#3730A3">✎</b><b onclick="gcFeRoleDel(' + i + ')" style="cursor:pointer;margin-left:4px;color:#991B1B">✕</b></span>'; }).join('') || '<span style="font-size:.7rem;color:var(--text-lighter)">Add at least one title.</span>'; }
  window.gcFeSave = async function () {
    var fe = window._gcFeEdit;
    var name = (document.getElementById('gcFeName').value || '').trim(); if (!name) return alert('Name required.');
    if (!fe.roles.length) return alert('Add at least one title.');
    var info = (document.getElementById('gcFeInfo').value || '').trim();
    var payload = { user_id: fe.uid, name: name, role: fe.roles.join(' • '), image_url: fe.pic || null, sort: (window._featured || []).length, additional_info: info || null };
    (function tryInsert(p) {
      sb().from('featured_people').insert([p]).then(function (r) {
        if (r && r.error) {
          if (/sort/.test(r.error.message)) { delete p.sort; return tryInsert(p); }
          if (/additional_info/.test(r.error.message)) { delete p.additional_info; return tryInsert(p); }
          return alert('⚠️ Could not add: ' + r.error.message);
        }
        var m = document.getElementById('gcFeForm'); if (m) m.remove();
        if (window.loadFeatured) window.loadFeatured().then(function () { if (window.feShowPicker21) window.feShowPicker21(true); });
        alert('✅ ' + name + ' added to front page.');
      });
    })(payload);
  };
// ============ BLOCK D — rally progress (goal vs raised) + sub-page stacking fix ============
  // 1) showSubPage: clear EVERY active sub-page anywhere, then show only the tapped one
  window.showSubPage = function (id) {
    document.querySelectorAll('.sub-page.active').forEach(function (p) { p.classList.remove('active'); });
    var el = document.getElementById(id); if (!el) return;
    var sec = el.closest('.section');
    if (sec) { document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); }); sec.classList.add('active'); }
    var target = el.classList.contains('sub-page') ? el : el.closest('.sub-page');
    if (target) target.classList.add('active'); else el.classList.add('active');
    window._gcLastSub = id; window.scrollTo({ top: 0 });
    try {
      if (id === 'home-trivia' && window.loadRandomTrivia) window.loadRandomTrivia();
      if (id === 'home-bibleReader' && window.loadBibleChapter && !(window._bibleVerses || []).length) window.loadBibleChapter();
      if (id === 'home-devotional' && window.loadDevotional) window.loadDevotional();
      if (id === 'home-characters' && window.loadCharacters) window.loadCharacters();
    } catch (e) {}
  };

  // 2) Rally Cause: show current raised amount vs goal + fill the progress bar
  var GC_GIVE_TABLES = ['giving', 'contributions', 'payments', 'transactions', 'mpesa_transactions', 'giving_transactions', 'rally_contributions'];
  var GC_GIVE_FKS = ['cause_id', 'rally_id', 'causeId', 'campaign_id'];
  var _gcGiveSchema = null;
  async function gcGiveSchema() {
    if (_gcGiveSchema) return _gcGiveSchema;
    for (var i = 0; i < GC_GIVE_TABLES.length; i++) {
      for (var j = 0; j < GC_GIVE_FKS.length; j++) {
        var r = await sb().from(GC_GIVE_TABLES[i]).select('id,' + GC_GIVE_FKS[j] + ',amount').limit(1);
        if (!r.error) { _gcGiveSchema = { table: GC_GIVE_TABLES[i], fk: GC_GIVE_FKS[j] }; return _gcGiveSchema; }
      }
    }
    _gcGiveSchema = { table: null, fk: null }; return _gcGiveSchema;
  }
  function gcNum(s) { return Number(String(s || '').replace(/[^0-9.]/g, '')) || 0; }
  async function gcUpdateRallyProgress() {
    var box = document.getElementById('dyn-causes'); if (!box) return;
    var cards = box.querySelectorAll('.card'); if (!cards.length) return;
    var sch = await gcGiveSchema();
    var sums = {};
    if (sch.table) {
      var r = await sb().from(sch.table).select(sch.fk + ',amount,status');
      if (r.error) r = await sb().from(sch.table).select(sch.fk + ',amount');
      (r.data || []).forEach(function (row) {
        var st = String(row.status || '').toLowerCase();
        if (st && !/success|completed|paid|confirmed|done/.test(st)) return;
        sums[row[sch.fk]] = (sums[row[sch.fk]] || 0) + Number(row.amount || 0);
      });
    }
    cards.forEach(function (card) {
      var idm = (card.innerHTML || '').match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      var raised = idm ? (sums[idm[1]] || 0) : 0;
      var goal = 0, goalEl = null, kesEl = null;
      card.querySelectorAll('div,span,b').forEach(function (e) {
        var t = (e.textContent || '').trim();
        if (!goalEl && e.children.length === 0 && /^Goal:/i.test(t)) goalEl = e;
        if (!kesEl && e.children.length === 0 && /^KES/i.test(t)) kesEl = e;
      });
      if (goalEl) goal = gcNum(goalEl.textContent);
      if (kesEl) kesEl.textContent = 'KES ' + raised.toLocaleString() + ' raised';
      var pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
      var fill = null, bars = card.querySelectorAll('div');
      for (var k = 0; k < bars.length; k++) { var bar = bars[k]; if (bar.offsetHeight > 0 && bar.offsetHeight <= 12 && bar.querySelector('div')) { fill = bar.querySelector('div'); break; } }
      if (fill) { fill.style.width = pct + '%'; if (!fill.style.background || fill.style.background === 'none') fill.style.background = 'linear-gradient(90deg,#10B981,#059669)'; }
      var pctEl = card.querySelector('[data-gcpct]');
      if (!pctEl && kesEl) { pctEl = document.createElement('div'); pctEl.setAttribute('data-gcpct', '1'); pctEl.style.cssText = 'font-size:.68rem;color:var(--text-light);margin-top:2px'; kesEl.parentNode.insertBefore(pctEl, kesEl.nextSibling); }
      if (pctEl) pctEl.textContent = goal > 0 ? pct.toFixed(0) + '% of goal reached' : '';
    });
  }
  setInterval(gcUpdateRallyProgress, 4000);
  if (window.confirmGiving && !window.confirmGiving._gcr) {
    var _cg = window.confirmGiving;
    window.confirmGiving = function () { var r = _cg.apply(this, arguments); setTimeout(gcUpdateRallyProgress, 1500); setTimeout(gcUpdateRallyProgress, 4000); return r; };
    window.confirmGiving._gcr = true;
  }
})();
