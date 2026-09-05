// app18.js v3 — landing fixes + notifications + profile + docs + socials + featured + branches
console.log('✝️ app18.js v3 loading...');
(function () {
  function g(id) { return document.getElementById(id); }
  function E(x) { return (typeof esc === 'function') ? esc(x) : String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function upsertSafe(table, payload, done) { var keys = Object.keys(payload); (function attempt() { var q = {}; keys.forEach(function (k) { q[k] = payload[k]; }); sb.from(table).upsert(q).then(function (r) { if (!r.error) return done(null); var mm = String(r.error.message || '').match(/'([a-zA-Z_]+)' column|column\s+'?"?([a-zA-Z_]+)/); var col = mm && (mm[1] || mm[2]); if (col && keys.indexOf(col) > -1) { keys = keys.filter(function (k) { return k !== col; }); return attempt(); } done(r.error.message); }); })(); }
  function rolesFor(uid) {
    return Promise.all([
      sb.from('profiles').select('role,profile_pic,name').eq('id', uid).single().catch(function () { return { data: null }; }),
      sb.from('department_members').select('role,departments(name)').eq('user_id', uid).catch(function () { return { data: [] }; }),
      sb.from('ushirika_members').select('role,ushirikas(name)').eq('user_id', uid).catch(function () { return { data: [] }; })
    ]).then(function (rs) {
      var out = []; var pr = rs[0].data && rs[0].data.role; if (pr && pr !== 'member') out.push(pr);
      (rs[1].data || []).forEach(function (m) { out.push((m.role || 'member') + ' – ' + ((m.departments || {}).name || 'Department')); });
      (rs[2].data || []).forEach(function (m) { if ((m.role || 'member') !== 'member') out.push(m.role + ' – ' + ((m.ushirikas || {}).name || 'Ushirika')); });
      if (!out.length) out.push('member');
      return { role: out.join(' • '), pic: rs[0].data && rs[0].data.profile_pic, name: rs[0].data && rs[0].data.name };
    });
  }

  /* ══ FIX 1: merge ALL church_settings rows (kills the 2-row .single() bug) ══ */
  window.loadChurchBranding = function () {
    return sb.from('church_settings').select('*').then(function (r) {
      var rows = r.data || []; var merged = {};
      rows.forEach(function (row) { Object.keys(row).forEach(function (k) { if (row[k] != null && merged[k] == null) merged[k] = row[k]; }); });
      merged.id = 1;
      window.churchBrandingData = rows.length ? merged : null;
      window._cs = rows.length ? merged : {};
    }).catch(function () { window.churchBrandingData = null; });
  };

  /* ══ FIX 2: landing re-apply (names, photo, hero) after EVERY render ══ */
  function fixNames() {
    var cb = window.churchBrandingData || {};
    if (cb.church_name) ['churchName', 'footerChurchName', 'footerCopyright'].forEach(function (id) { var e = g(id); if (e) e.textContent = cb.church_name; });
    if (cb.tagline) { var t = g('churchTagline'); if (t) t.textContent = cb.tagline; }
    if (cb.welcome_message) { var w = g('welcomeMessage'); if (w) w.textContent = cb.welcome_message; }
    if (cb.pastor_name) { var p = g('pastorName'); if (p) p.textContent = cb.pastor_name; }
  }
  function fixChurchPhoto() {
    var cb = window.churchBrandingData || {};
    var url = cb.church_photo_url || cb.pastor_image_url || cb.pastor_image;
    var img = g('pastorImage'); var ph = g('pastorPlaceholder');
    if (url && img) {
      img.src = url; img.style.display = 'block';
      if (ph) ph.style.display = 'none';
      var wrap = img.closest('.placeholder-image') || (ph && ph.parentElement); if (wrap) { wrap.style.background = 'none'; wrap.style.border = 'none'; }
    }
    if (cb.hero_image_url) { var hero = g('heroSection'); if (hero) hero.style.backgroundImage = 'url(' + cb.hero_image_url + ')'; }
  }

  /* ══ FIX 3: socials — ONLY typed links, with real logos ══ */
  var SOCIALS = [['facebook', 'Facebook', 'fab fa-facebook-f'], ['instagram', 'Instagram', 'fab fa-instagram'], ['whatsapp', 'WhatsApp', 'fab fa-whatsapp'], ['youtube', 'YouTube', 'fab fa-youtube'], ['tiktok', 'TikTok', 'fab fa-tiktok'], ['x', 'X / Twitter', 'fab fa-x-twitter']];
  function fixSocials() {
    var sec = g('socialsSection'); if (!sec) return;
    var so = (window.churchBrandingData || {}).socials || {};
    var items = SOCIALS.filter(function (s) { return so[s[0]]; });
    if (!items.length) { sec.style.display = 'none'; return; }
    sec.style.display = '';
    var cont = sec.querySelector('.container') || sec;
    cont.innerHTML = '<h2 class="section-title text-center">Connect With Us</h2><p class="section-subtitle">Follow our journey on social media</p><div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-top:20px">' +
      items.map(function (s) { return '<a href="' + E(so[s[0]]) + '" target="_blank" rel="noopener" aria-label="' + s[1] + '" style="width:50px;height:50px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;text-decoration:none;transition:transform .3s"><i class="' + s[2] + '"></i></a>'; }).join('') + '</div>';
  }
  if (!g('socialsModal21')) document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay" id="socialsModal21" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">🔗 Social Links (leave blank to hide)</div>' + SOCIALS.map(function (s) { return '<div class="form-group"><label class="form-label"><i class="' + s[2] + '"></i> ' + s[1] + ' URL</label><input class="form-input" id="so_' + s[0] + '" placeholder="https://…"></div>'; }).join('') + '<button class="btn btn-primary btn-block" onclick="saveSocials21()"><i class="fas fa-save"></i> Save</button><button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Close</button></div></div>');
  window.openSocialsEditor = function () { var so = (window.churchBrandingData || {}).socials || {}; SOCIALS.forEach(function (s) { var e = g('so_' + s[0]); if (e) e.value = so[s[0]] || ''; }); openModal('socialsModal21'); };
  window.saveSocials21 = function () { var so = {}; SOCIALS.forEach(function (s) { var v = g('so_' + s[0]).value.trim(); if (v) so[s[0]] = v; }); upsertSafe('church_settings', { id: 1, socials: so }, function (err) { if (err) return alert('⚠️ ' + err); alert('✅ Saved'); closeModalDirect(); loadChurchBranding().then(function () { if (window.renderPublicLanding) renderPublicLanding(); else applyLanding(); }); }); };

  /* ══ FIX 4: SAFE save — never overwrite with null unless trash button pressed ══ */
  document.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('button.btn-danger') : null; if (b && (b.getAttribute('onclick') || '').indexOf(".value=''") > -1) { var inp = b.parentElement.querySelector('input'); if (inp) inp.dataset.clear = '1'; } }, true);
  document.addEventListener('input', function (e) { if (e.target && e.target.dataset) delete e.target.dataset.clear; }, true);
  window.beSave = function () {
    var p = { id: 1 };
    ['church_name', 'tagline', 'welcome_message', 'location', 'pastor_name', 'pastor_title', 'hero_image', 'pastor_image', 'church_photo_url'].forEach(function (k) {
      var el = g('be_' + k); if (!el) return;
      var v = el.value.trim();
      if (el.dataset.clear === '1') p[k] = null;      // explicit trash press
      else if (v) p[k] = v;                            // typed / uploaded
      // empty = leave unchanged (protects existing data)
    });
    upsertSafe('church_settings', p, function (err) {
      if (err) return alert('⚠️ ' + err);
      alert('✅ Branding saved!'); closeModalDirect();
      loadChurchBranding().then(function () { if (window.renderPublicLanding) renderPublicLanding(); else applyLanding(); });
    });
  };

  /* ══ landing bundle (runs after every render + every 5s) ══ */
  function feSorted() { var fp = (window._featured || []).slice(); fp.sort(function (a, b) { return ((a.sort == null) ? 9999 : a.sort) - ((b.sort == null) ? 9999 : b.sort); }); return fp; }
  function renderFeaturedLanding() {
    var fp = feSorted(); if (!fp.length) return;
    var wrapEl = g('featuredPeople');
    if (!wrapEl) { var sigEl = document.querySelector('.pastor-signature'); var hostEl = sigEl ? sigEl.parentNode : document.querySelector('.welcome-grid'); if (!hostEl) return; wrapEl = document.createElement('div'); wrapEl.id = 'featuredPeople'; wrapEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px'; hostEl.appendChild(wrapEl); if (sigEl) sigEl.style.display = 'none'; }
    wrapEl.innerHTML = fp.map(function (p) { var pic = p.image_url ? '<img src="' + p.image_url + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover">' : '<div class="pastor-avatar">' + ini(p.name) + '</div>'; return '<div style="flex:1;min-width:180px;display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;padding:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,.07)">' + pic + '<div><div class="pastor-name">' + E(p.name) + '</div><div class="pastor-title" style="display:block">' + E(p.role) + '</div></div></div>'; }).join('');
  }
  function fixLandingEvents() { var eg = g('eventsPreviewGrid'); if (!eg || eg.querySelector('.event-preview-card')) return; var ev = window._eventsPreviewAll || window._eventsPreview || window.eventsData || []; if (!ev.length) return; eg.innerHTML = ev.slice(0, 6).map(function (e) { return '<div class="event-preview-card"><div class="event-preview-date">📅 ' + (typeof fdate === 'function' ? fdate(e.start_date) : '') + '</div><div class="event-preview-title">' + E(e.title) + '</div><div class="event-preview-desc">' + E(e.description || e.theme || '') + '</div></div>'; }).join(''); }
  function applyLanding() { fixNames(); fixChurchPhoto(); fixSocials(); renderFeaturedLanding(); fixLandingEvents(); }
  var _rpl = window.renderPublicLanding;
  window.renderPublicLanding = function () { var r = _rpl ? _rpl.apply(this, arguments) : undefined; Promise.resolve(r).then(applyLanding).catch(function () { }); setTimeout(applyLanding, 900); return r; };
  setInterval(applyLanding, 5000);
  loadChurchBranding().then(applyLanding);

  /* ══ NOTIFICATIONS (scoped to same group) ══ */
  function notifyInsert(uid, title, msg) { if (!uid || !user || uid === user.id) return; sb.from('notifications').insert([{ user_id: uid, title: title, message: msg, body: msg }]).then(function (r) { if (r && r.error) sb.from('notifications').insert([{ user_id: uid, title: title, message: msg }]).then(function () { }); }); }
  function notifyMany(ids, title, msg) { (ids || []).forEach(function (id) { notifyInsert(id, title, msg); }); }
  function deptMemberIds(d) { return sb.from('department_members').select('user_id').eq('department_id', d).then(function (r) { return (r.data || []).map(function (x) { return x.user_id; }); }); }
  function ushMemberIds(u) { return sb.from('ushirika_members').select('user_id').eq('ushirika_id', u).then(function (r) { return (r.data || []).map(function (x) { return x.user_id; }); }); }
  function wrap(name, fn) { var orig = window[name]; window[name] = function () { var r = orig ? orig.apply(this, arguments) : undefined; try { fn.apply(this, arguments); } catch (e) { } return r; }; }
  var _scm = window.sendChatMessage;
  window.sendChatMessage = function () { if (user && currentChatUserId) { var i = g('chatInput'); var v = i ? i.value.trim() : ''; if (v) notifyInsert(currentChatUserId, '💬 New message', (profile && profile.name || 'Someone') + ': ' + v.slice(0, 60)); } return _scm ? _scm.apply(this, arguments) : undefined; };
  wrap('submitUshPost', function () { var u = window._curUshForumId; if (!u) return; ushMemberIds(u).then(function (ids) { notifyMany(ids, '🏘️ New ushirika post', 'By ' + (profile && profile.name || 'a member')); }); });
  wrap('submitDeptPost', function () { var d = window.currentDeptId; if (!d) return; deptMemberIds(d).then(function (ids) { notifyMany(ids, '🏢 New department post', 'By ' + (profile && profile.name || 'a member')); }); });
  function meetNote(d, u) { var t = '📅 Weekly meeting updated', b = 'Check the new meeting details'; if (d) deptMemberIds(d).then(function (ids) { notifyMany(ids, t, b); }); else if (u) ushMemberIds(u).then(function (ids) { notifyMany(ids, t, b); }); }
  wrap('saveDeptMeeting9', function () { meetNote((g('dm9Pick') || {}).value || window.currentDeptId, null); });
  wrap('saveUshMeeting9', function () { meetNote(null, (g('um9Pick') || {}).value || window._curUshForumId); });
  wrap('updateMeeting', function () { meetNote(window.currentDeptId, window._curUshForumId); });
  setInterval(function () { if (user && typeof loadNotifs === 'function') loadNotifs(); }, 30000);

  /* ══ PROFILE EDITOR ══ */
  if (!g('editProfileModal21')) document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay" id="editProfileModal21" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">👤 Edit My Profile</div><div style="text-align:center;margin-bottom:10px"><div id="pf_preview"></div><button class="btn btn-secondary-alt btn-sm" style="margin-top:6px" onclick="pfUpload()"><i class="fas fa-camera"></i> Change photo</button></div><div class="form-group"><label class="form-label">Name</label><input class="form-input" id="pf_name"></div><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="pf_phone"></div><div class="form-group"><label class="form-label">Email (cannot change)</label><input class="form-input" id="pf_email" disabled></div><div class="form-group"><label class="form-label">Role (administered)</label><input class="form-input" id="pf_role" disabled></div><div class="form-group"><label class="form-label">New password (optional)</label><input class="form-input" id="pf_pass" type="password" placeholder="Leave blank to keep current"></div><button class="btn btn-primary btn-block" onclick="saveProfileEdit()"><i class="fas fa-save"></i> Save</button><button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
  function pfPreview(url) { var box = g('pf_preview'); if (box) box.innerHTML = url ? '<img src="' + url + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover">' : '<div class="post-avatar" style="width:64px;height:64px;font-size:1.2rem;margin:0 auto">' + ini(profile && profile.name || '?') + '</div>'; }
  window.pfUpload = function () { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = function () { if (i.files && i.files[0]) uploadMediaFile(i.files[0]).then(function (url) { window._pfPic = url; pfPreview(url); }); }; i.click(); };
  window.openProfileEditor = function () { if (!user || !profile) return alert('Log in first'); window._pfPic = profile.profile_pic || null; g('pf_name').value = profile.name || ''; g('pf_phone').value = profile.phone || ''; g('pf_email').value = user.email || ''; g('pf_role').value = profile.role || 'member'; g('pf_pass').value = ''; pfPreview(profile.profile_pic); openModal('editProfileModal21'); };
  window.saveProfileEdit = function () { var upd = { name: g('pf_name').value.trim(), phone: g('pf_phone').value.trim() }; if (window._pfPic) upd.profile_pic = window._pfPic; sb.from('profiles').update(upd).eq('id', user.id).then(function (r) { if (r.error) return alert('⚠️ ' + r.error.message); var pw = g('pf_pass').value; var fin = function () { alert('✅ Profile saved'); closeModalDirect(); if (typeof refreshRole === 'function') refreshRole(); }; if (pw) sb.auth.updateUser({ password: pw }).then(function (ar) { if (ar.error) return alert('⚠️ ' + ar.error.message); fin(); }); else fin(); }); };
  setInterval(function () { var pm = g('profileModal'); if (pm && !g('pfEditBtn')) { var b = document.createElement('button'); b.id = 'pfEditBtn'; b.className = 'btn btn-primary btn-block'; b.style.cssText = 'margin-top:6px;display:flex!important'; b.innerHTML = '<i class="fas fa-user-edit"></i> Edit Profile'; b.onclick = function () { closeModalDirect(); openProfileEditor(); }; var lo = pm.querySelector('[onclick*="doLogout"]'); if (lo) lo.parentNode.insertBefore(b, lo); else pm.querySelector('.modal').appendChild(b); } }, 2500);

  /* ══ DOCUMENTS manager ══ */
  if (!g('docsMgrModal')) document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay" id="docsMgrModal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">📄 Resources & Documents</div><div id="docList"></div><h4 style="margin:12px 0 6px">Add document</h4><input class="form-input" id="doc_title" placeholder="Title" style="margin-bottom:6px"><select class="form-select" id="doc_cat" style="margin-bottom:6px"><option value="general">General</option><option value="sermon">Sermon Notes</option><option value="report">Reports</option><option value="guide">Guides</option></select><button class="btn btn-secondary-alt btn-sm" onclick="docUpload21()"><i class="fas fa-upload"></i> Choose file</button><button class="btn btn-primary btn-sm" style="margin-left:6px" onclick="addDoc21()"><i class="fas fa-plus"></i> Add</button><button class="btn btn-secondary-alt btn-block" style="margin-top:10px" onclick="closeModalDirect()">Close</button></div></div>');
  function docListRender() { sb.from('documents').select('*').order('created_at', { ascending: false }).then(function (r) { window.documentsData = r.data || []; var box = g('docList'); box.innerHTML = (r.data || []).map(function (d) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem"><i class="fas fa-file"></i><div style="flex:1"><b>' + E(d.title) + '</b> <span style="color:var(--text-light)">(' + E(d.category || '') + ')</span></div><a class="btn btn-secondary-alt btn-sm" href="' + d.file_url + '" target="_blank"><i class="fas fa-download"></i></a><button class="post-delete" onclick="delDoc21(\'' + d.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>'; }); }
  window.openDocsMgr = function () { openModal('docsMgrModal'); docListRender(); };
  window.docUpload21 = function () { var i = document.createElement('input'); i.type = 'file'; i.accept = '.pdf,.doc,.docx,image/*,video/*,audio/*'; i.onchange = function () { if (i.files && i.files[0]) uploadMediaFile(i.files[0]).then(function (url) { window._docUrl = url; alert('✅ File ready — press Add'); }); }; i.click(); };
  window.addDoc21 = function () { var t = g('doc_title').value.trim(); if (!t || !window._docUrl) return alert('Title + file required'); sb.from('documents').insert([{ title: t, category: g('doc_cat').value, file_url: window._docUrl }]).then(function () { g('doc_title').value = ''; window._docUrl = null; docListRender(); if (typeof loadDocuments === 'function') loadDocuments(); }); };
  window.delDoc21 = function (id) { if (!confirm('Delete document?')) return; sb.from('documents').delete().eq('id', id).then(function () { docListRender(); if (typeof loadDocuments === 'function') loadDocuments().then(function () { if (window.renderPublicLanding) renderPublicLanding(); }); }); };

  /* ══ FEATURED MEMBERS manager (multi + order) ══ */
  window.loadFeatured = function () { return sb.from('featured_people').select('*').order('sort', { ascending: true }).then(function (r) { window._featured = r.data || []; }).catch(function () { return sb.from('featured_people').select('*').then(function (r) { window._featured = r.data || []; }).catch(function () { window._featured = []; }); }); };
  if (!g('feMgrModal')) document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay" id="feMgrModal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">⭐ Featured Members (front page)</div><div id="feList21"></div><button class="btn btn-primary btn-sm" onclick="feShowPicker21()"><i class="fas fa-plus"></i> Add member(s)</button><div id="fePicker21" class="user-picker" style="display:none;margin-top:6px"></div><button class="btn btn-secondary-alt btn-block" style="margin-top:10px" onclick="closeModalDirect()">Close</button></div></div>');
  function feRender21() { var fp = feSorted(); var box = g('feList21'); if (!box) return; if (!fp.length) { box.innerHTML = '<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>'; return; } box.innerHTML = '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><button class="btn btn-danger btn-sm" onclick="feDelSel21()"><i class="fas fa-trash"></i> Delete selected</button><span style="font-size:.7rem;color:var(--text-light)">tick = select • ▲▼ = order</span></div>' + fp.map(function (p, i) { return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:.85rem"><input type="checkbox" class="feChk21" value="' + p.id + '" style="width:16px;height:16px">' + (p.image_url ? '<img src="' + p.image_url + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover">' : '<div class="post-avatar" style="width:28px;height:28px;font-size:.65rem">' + ini(p.name) + '</div>') + '<div style="flex:1"><b>' + E(p.name) + '</b> <span style="color:var(--text-light)">(' + E(p.role) + ')</span></div><button class="btn btn-secondary-alt btn-sm" onclick="feMove21(' + i + ',-1)">▲</button><button class="btn btn-secondary-alt btn-sm" onclick="feMove21(' + i + ',1)">▼</button><button class="post-delete" onclick="feDelOne21(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join(''); }
  window.openFeaturedMgr = function () { openModal('feMgrModal'); loadFeatured().then(feRender21); };
  window.feMove21 = function (i, dir) { var fp = feSorted(); var j = i + dir; if (j < 0 || j >= fp.length) return; var t = fp[i]; fp[i] = fp[j]; fp[j] = t; window._featured = fp; Promise.all(fp.map(function (p, idx) { return sb.from('featured_people').update({ sort: idx }).eq('id', p.id); })).then(function () { feRender21(); applyLanding(); }).catch(function () { alert('⚠️ Run once in SQL Editor:\nalter table public.featured_people add column if not exists sort int;'); feRender21(); }); };
  window.feDelSel21 = function () { var ids = []; document.querySelectorAll('.feChk21').forEach(function (c) { if (c.checked) ids.push(c.value); }); if (!ids.length) return alert('Tick members first'); if (!confirm('Delete ' + ids.length + ' featured member(s)?')) return; Promise.all(ids.map(function (id) { return sb.from('featured_people').delete().eq('id', id); })).then(function () { loadFeatured().then(function () { feRender21(); applyLanding(); }); }); };
  window.feDelOne21 = function (id) { sb.from('featured_people').delete().eq('id', id).then(function () { loadFeatured().then(function () { feRender21(); applyLanding(); }); }); };
  window.feShowPicker21 = function () { var pk = g('fePicker21'); pk.style.display = pk.style.display === 'none' ? 'block' : 'none'; sb.from('profiles').select('id,name,role,profile_pic').order('name').then(function (r) { pk.innerHTML = (r.data || []).map(function (u) { return '<div class="user-pick-item" onclick="feAdd21(\'' + u.id + '\')">' + (u.profile_pic ? '<img src="' + u.profile_pic + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover">' : '<div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">' + ini(u.name) + '</div>') + '<div style="flex:1"><div style="font-weight:600">' + E(u.name) + '</div><div style="font-size:.7rem;color:var(--text-light)">' + E(u.role) + '</div></div></div>'; }).join(''); }); };
  window.feAdd21 = function (uid) { rolesFor(uid).then(function (info) { var payload = { user_id: uid, name: info.name, role: info.role, image_url: info.pic || null, sort: (window._featured || []).length }; sb.from('featured_people').insert([payload]).then(function (r) { if (r && r.error && /sort/.test(r.error.message)) { delete payload.sort; return sb.from('featured_people').insert([payload]); } return r; }).then(function () { loadFeatured().then(function () { feRender21(); applyLanding(); }); }); }); };

  /* ══ inject manager buttons ══ */
  setInterval(function () {
    var be = g('brandingEditor21');
    if (be && !g('mgrBtns21')) { var w = document.createElement('div'); w.id = 'mgrBtns21'; w.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px'; w.innerHTML = '<button class="btn btn-warm btn-sm" onclick="openFeaturedMgr()"><i class="fas fa-star"></i> Featured Members</button><button class="btn btn-warm btn-sm" onclick="openDocsMgr()"><i class="fas fa-file"></i> Documents</button><button class="btn btn-warm btn-sm" onclick="openSocialsEditor()"><i class="fas fa-share-alt"></i> Social Links</button>'; var modal = be.querySelector('.modal'); modal.insertBefore(w, modal.children[3] || null); }
    var panel = g('adminDiscoverPanel');
    if (panel && !g('discMgr21')) { var d = document.createElement('div'); d.id = 'discMgr21'; d.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px'; d.innerHTML = '<button class="btn btn-warm btn-block btn-sm" onclick="openFeaturedMgr()"><i class="fas fa-star"></i> Featured Members</button><button class="btn btn-warm btn-block btn-sm" onclick="openDocsMgr()"><i class="fas fa-file"></i> Documents</button><button class="btn btn-warm btn-block btn-sm" onclick="openSocialsEditor()"><i class="fas fa-share-alt"></i> Social Links</button>'; panel.appendChild(d); }
  }, 2500);
})();
console.log('✝️ app18.js v3 main active');

/* ═══════════════════════════════════════════════════════════
   BRANCHES — FULL REWRITE: real data only, placeholders killed.
   Runs every 2s so it can never be "too early" again.
═══════════════════════════════════════════════════════════ */
(function () {
  function g(id) { return document.getElementById(id); }
  function E(x) { return (typeof esc === 'function') ? esc(x) : String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function ensureSections() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;
    if (!g('locationsBranches')) {
      var loc = document.createElement('section');
      loc.id = 'locationsBranches'; loc.className = 'content-section';
      loc.innerHTML = '<div class="container"><h2 class="section-title text-center">Where We Are Located & Our Branches</h2><div id="branchesGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:30px"></div></div>';
      footer.parentNode.insertBefore(loc, footer);
    }
    if (!g('socialsSection')) {
      var soc = document.createElement('section');
      soc.id = 'socialsSection'; soc.className = 'content-section bg-light';
      soc.innerHTML = '<div class="container" style="text-align:center"><h2 class="section-title text-center">Connect With Us</h2><p class="section-subtitle">Follow our journey on social media</p><div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-top:20px"></div></div>';
      footer.parentNode.insertBefore(soc, footer);
    }
  }

  function fixBranches() {
    ensureSections();
    var sec = g('locationsBranches'); var grid = g('branchesGrid');
    if (!sec || !grid) return;
    var cb = window.churchBrandingData || {};
    var br = cb.branches || [];
    if (!br.length) { sec.style.display = 'none'; return; }
    sec.style.display = '';
    grid.innerHTML = br.map(function (b) {
      return '<div class="card" style="text-align:center"><h3>' + E(b.name) + '</h3><p style="white-space:pre-line;margin-top:6px">' + E(b.address || '') + '</p></div>';
    }).join('');
  }

  fixBranches();
  setInterval(fixBranches, 2000);
  if (window.loadChurchBranding) window.loadChurchBranding().then(fixBranches);
})();
console.log('✝️ app18.js v3 complete with branches');
