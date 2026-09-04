// app17.js — FINAL v5: events fixed + plans/messages delete + gallery/articles editor
console.log('✝️ app17.js v5 loading...');
(function () {
  function g(id) { return document.getElementById(id); }
  function E(x) { return (typeof esc === 'function') ? esc(x) : String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function dayOpts(sel) { return DAYS.map(function (d) { return '<option' + (d === sel ? ' selected' : '') + '>' + d + '</option>'; }).join(''); }

  /* ══ 1) static meeting widget ══ */
  window.refreshDeptMeetingWidget13 = function () { };
  window.renderDeptWeekMeet14 = function () { };
  ['deptWeekMeet14', 'deptWeekMeet17', 'deptWeekMeet18'].forEach(function (id) { var e = g(id); if (e && e.parentNode) e.parentNode.removeChild(e); });
  var st = document.createElement('style');
  st.textContent = '#home-mainDept .card-cool{display:none!important}#editLandingBtn{display:none!important}#readerSearch{display:none!important}';
  document.head.appendChild(st);
  function sig(m, can) { return JSON.stringify([m && m.id, m && m.meeting_date, m && m.start_time, m && m.end_time, m && m.venue, m && m.theme, !!can]); }
  function hideStray() {
    var host = g('home-mainDept'); if (!host) return;
    var keep = g('deptWeekMeet20');
    host.querySelectorAll('.card').forEach(function (c) { if (/This Week'?s Meeting/i.test(c.textContent || '') && !(keep && keep.contains(c))) c.style.display = 'none'; });
    var rs = g('readerSearch'); if (rs) { rs.style.display = 'none'; var b = rs.nextElementSibling; if (b && b.tagName === 'BUTTON') b.style.display = 'none'; }
    var dl = g('dyn-leaders'); if (dl) { var p = dl.previousElementSibling; if (p && /Servants of God/i.test(p.textContent || '') && !p.id) p.style.display = 'none'; }
    if (!window._featured || !window._featured.length) document.querySelectorAll('.pastor-signature').forEach(function (el) { if (!el.closest('#featuredPeople')) el.style.display = 'none'; });
  }
  function renderMeet(deptId, force) {
    if (!window.sb || !deptId) return;
    var host = g('home-mainDept'); if (!host) return;
    var b = g('deptWeekMeet20');
    if (!b) { b = document.createElement('div'); b.id = 'deptWeekMeet20'; host.insertBefore(b, host.firstChild); }
    sb.from('weekly_meetings').select('*').eq('department_id', deptId).order('created_at', { ascending: false }).limit(1).then(function (r) {
      var m = (r.data && r.data[0]) || null;
      var can = false; try { can = typeof isDeptLeader9 === 'function' && isDeptLeader9(deptId); } catch (e) { }
      var s = sig(m, can);
      if (!force && b.dataset.sig === s) { hideStray(); return; }
      b.dataset.sig = s; if (m) window._curMeetingId = m.id;
      var h = '<div class="card" style="margin-bottom:14px"><div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
      if (!m) h += '<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';
      else h += '<div style="font-size:.9rem;line-height:1.8">' +
        (m.meeting_date ? '<div><b>📅 Date:</b> ' + E(m.meeting_date) + '</div>' : '') +
        (m.start_time ? '<div><b>🕐 Time:</b> ' + E(m.start_time) + (m.end_time ? ' – ' + E(m.end_time) : '') + '</div>' : '') +
        (m.venue ? '<div><b>📍 Venue:</b> ' + E(m.venue) + '</div>' : '') +
        (m.theme ? '<div><b>🎯 Theme:</b> ' + E(m.theme) + '</div>' : '') +
        ((typeof mediaHTML === 'function') ? mediaHTML(mediaOf(m)) : '') + '</div>';
      if (can) h += '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\'' + deptId + '\')"><i class="fas fa-edit"></i> Update</button>' + (m ? '<button class="btn btn-danger btn-sm" onclick="delMeet20(\'' + m.id + '\',\'' + deptId + '\')"><i class="fas fa-trash"></i> Delete</button>' : '') + '</div>';
      b.innerHTML = h + '</div>'; hideStray();
    });
  }
  window.delMeet20 = function (mid, deptId) { deptId = deptId || window.currentDeptId; if (!(typeof isDeptLeader9 === 'function' && isDeptLeader9(deptId))) return alert('🚫 Leader/admin only.'); if (!confirm('Delete this meeting?')) return; sb.from('weekly_meetings').delete().eq('id', mid).then(function () { renderMeet(deptId, true); }); };
  var _o = window.openDeptForum; window.openDeptForum = function (id) { var r = _o ? _o.apply(this, arguments) : undefined; setTimeout(function () { renderMeet(id, true); }, 700); return r; };
  var _s = window.saveDeptMeeting9; window.saveDeptMeeting9 = function () { var r = _s ? _s.apply(this, arguments) : undefined; setTimeout(function () { renderMeet((g('dm9Pick') || {}).value || window.currentDeptId, true); }, 900); return r; };
  var _u = window.updateMeeting; window.updateMeeting = function () { var r = _u ? _u.apply(this, arguments) : undefined; setTimeout(function () { renderMeet(window.currentDeptId, true); }, 900); return r; };
  setInterval(hideStray, 3000);

  /* ══ 2) Edit/Delete Ushirika + Department ══ */
  if (!g('editUshModal')) document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay" id="editUshModal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">✏️ Edit Ushirika</div><div class="form-group"><label class="form-label">Name</label><input class="form-input" id="editUshName"></div><div class="form-group"><label class="form-label">Location</label><input class="form-input" id="editUshLoc"></div><div class="form-group"><label class="form-label">Meeting Day</label><select class="form-select" id="editUshDay">' + dayOpts() + '</select></div><button class="btn btn-primary btn-block" onclick="saveUshEdit()"><i class="fas fa-save"></i> Save</button><button class="btn btn-danger btn-block" style="margin-top:6px" onclick="delUsh()"><i class="fas fa-trash"></i> Delete Ushirika</button><button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
  if (!g('editDeptModal')) document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay" id="editDeptModal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">✏️ Edit Department</div><div class="form-group"><label class="form-label">Name</label><input class="form-input" id="editDeptName"></div><div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="editDeptDesc"></textarea></div><button class="btn btn-primary btn-block" onclick="saveDeptEdit()"><i class="fas fa-save"></i> Save</button><button class="btn btn-danger btn-block" style="margin-top:6px" onclick="delDept()"><i class="fas fa-trash"></i> Delete Department</button><button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
  window.openUshEdit = function (id) { if (!isAdmin()) return alert('🚫 Admin only.'); var u = (ushirikasData || []).find(function (x) { return x.id === id; }); if (!u) return; window._editingUshId = id; g('editUshName').value = u.name || ''; g('editUshLoc').value = u.location || ''; g('editUshDay').value = u.meeting_day || 'Saturday'; openModal('editUshModal'); };
  window.saveUshEdit = function () { var id = window._editingUshId; if (!id) return; sb.from('ushirikas').update({ name: g('editUshName').value.trim(), location: g('editUshLoc').value.trim(), meeting_day: g('editUshDay').value }).eq('id', id).then(function (r) { if (r.error) return alert('⚠️ ' + r.error.message); alert('✅ Saved'); closeModalDirect(); if (window.loadAll) loadAll(); }); };
  window.delUsh = function () { var id = window._editingUshId; if (!id || !confirm('Delete this ushirika completely?')) return; sb.from('ushirika_members').delete().eq('ushirika_id', id).then(function () { sb.from('ushirikas').delete().eq('id', id).then(function () { alert('✅ Deleted'); closeModalDirect(); if (window.loadAll) loadAll(); }); }); };
  window.openDeptEdit = function (id) { if (!isAdmin()) return alert('🚫 Admin only.'); var d = (depts || []).find(function (x) { return x.id === id; }); if (!d) return; window._editingDeptId = id; g('editDeptName').value = d.name || ''; g('editDeptDesc').value = d.description || ''; openModal('editDeptModal'); };
  window.saveDeptEdit = function () { var id = window._editingDeptId; if (!id) return; sb.from('departments').update({ name: g('editDeptName').value.trim(), description: g('editDeptDesc').value.trim() }).eq('id', id).then(function (r) { if (r.error) return alert('⚠️ ' + r.error.message); alert('✅ Saved'); closeModalDirect(); if (window.loadAll) loadAll(); }); };
  window.delDept = function () { var id = window._editingDeptId; if (!id || !confirm('Delete this department completely?')) return; Promise.all([sb.from('department_members').delete().eq('department_id', id), sb.from('weekly_meetings').delete().eq('department_id', id)]).then(function () { sb.from('departments').delete().eq('id', id).then(function () { alert('✅ Deleted'); closeModalDirect(); if (window.loadAll) loadAll(); }); }); };
  setInterval(function () {
    if (!isAdmin()) return;
    document.querySelectorAll('.ushirika-card').forEach(function (c) { if (c.dataset.editBound) return; var u = (ushirikasData || []).find(function (x) { return c.textContent.indexOf(x.name) > -1; }); if (!u) return; c.dataset.editBound = '1'; var b = document.createElement('button'); b.className = 'btn btn-warm btn-sm'; b.style.marginTop = '8px'; b.innerHTML = '<i class="fas fa-pen"></i> Edit'; b.onclick = function (e) { e.stopPropagation(); openUshEdit(u.id); }; (c.querySelector('.ushirika-info') || c).appendChild(b); });
    document.querySelectorAll('.dept-card').forEach(function (c) { if (c.dataset.editBound) return; var d = (depts || []).find(function (x) { return c.textContent.indexOf(x.name) > -1; }); if (!d) return; c.dataset.editBound = '1'; var b = document.createElement('button'); b.className = 'btn btn-warm btn-sm'; b.style.margin = '4px'; b.innerHTML = '<i class="fas fa-pen"></i> Edit'; b.onclick = function (e) { e.stopPropagation(); openDeptEdit(d.id); }; (c.querySelector('.dept-body') || c).appendChild(b); });
  }, 2500);

  /* ══ 3) MESSAGES — full override so delete works (real ids) ══ */
  window.deleteChatMessage = function (msgId) {
    if (!confirm('Delete this message?')) return;
    sb.from('messages').delete().eq('id', msgId).eq('sender_id', user.id).then(function (r) {
      if (r.error) return alert('⚠️ ' + r.error.message);
      if (typeof loadChatMessages === 'function') loadChatMessages();
      if (typeof loadChatInbox === 'function') loadChatInbox();
    });
  };
  window.loadChatMessages = function () {
    if (!user || !currentChatUserId || !sb) return;
    var c = g('chatMessages'); if (!c) return;
    sb.from('messages').select('*').or('and(sender_id.eq.' + user.id + ',receiver_id.eq.' + currentChatUserId + '),and(sender_id.eq.' + currentChatUserId + ',receiver_id.eq.' + user.id + ')').order('created_at', { ascending: true }).then(function (r) {
      var m = r.data || [];
      c.innerHTML = m.length ? m.map(function (x) {
        var mine = x.sender_id === user.id;
        return '<div class="chat-message' + (mine ? ' sent' : '') + '" data-msg-id="' + x.id + '"><div class="chat-message-bubble">' + E(x.content || '') + '</div><div class="chat-message-time">' + (typeof ftime === 'function' ? ftime(x.created_at) : '') + '</div>' + (mine ? '<button data-del="' + x.id + '" style="background:none;border:none;color:#EF4444;font-size:.68rem;cursor:pointer;margin-top:2px"><i class="fas fa-trash"></i> Delete</button>' : '') + '</div>';
      }).join('') : '<div style="text-align:center;padding:40px;color:var(--text-lighter)">Say hi! 👋</div>';
      c.scrollTop = c.scrollHeight;
      c.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); deleteChatMessage(b.getAttribute('data-del')); }; });
    }).catch(function () { });
  };

  /* ══ 4) adaptive upsert helper (drops missing columns) ══ */
  window.updateAdaptive = function (table, id, payload, done) {
    var keys = Object.keys(payload);
    (function attempt() {
      var q = {}; keys.forEach(function (k) { q[k] = payload[k]; });
      sb.from(table).update(q).eq('id', id).then(function (r) {
        if (!r.error) return done(null);
        var mm = String(r.error.message || '').match(/'([a-zA-Z_]+)' column|column\s+'?"?([a-zA-Z_]+)/);
        var col = mm && (mm[1] || mm[2]);
        if (col && keys.indexOf(col) > -1) { keys = keys.filter(function (k) { return k !== col; }); return attempt(); }
        done(r.error.message);
      });
    })();
  };

  /* ══ 5) branding editor + gallery + articles/testimonials ══ */
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
  window.openBrandingEditor = function () {
    if (!isAdmin()) return alert('🚫 Admin only.');
    Promise.all([
      sb.from('church_settings').select('*').limit(1).then(function (r) { window._cs = (r.data && r.data[0]) || {}; }).catch(function () { window._cs = {}; }),
      sb.from('featured_people').select('*').then(function (r) { window._fp = r.data || []; }).catch(function () { window._fp = []; }),
      sb.from('ministries').select('*').then(function (r) { window._min = r.data || []; }).catch(function () { window._min = []; }),
      sb.from('gallery_items').select('*').order('created_at', { ascending: false }).then(function (r) { window._gal = r.data || []; }).catch(function () { window._gal = []; }),
      sb.from('news_articles').select('*').order('published_at', { ascending: false }).then(function (r) { window._art = r.data || []; }).catch(function () { window._art = []; })
    ]).then(buildEditor);
  };
  function imgRow(key, label) {
    var v = (window._cs || {})[key] || '';
    return '<div class="form-group"><label class="form-label">' + label + (v ? ' <img src="' + v + '" style="width:34px;height:34px;border-radius:6px;object-fit:cover;vertical-align:middle">' : '') + '</label><div style="display:flex;gap:6px"><input class="form-input" id="be_' + key + '" value="' + E(v) + '" placeholder="Image URL or upload"><button class="btn btn-secondary-alt" onclick="beUpload(\'' + key + '\')"><i class="fas fa-upload"></i></button><button class="btn btn-danger" onclick="document.getElementById(\'be_' + key + '\').value=\'\'"><i class="fas fa-trash"></i></button></div></div>';
  }
  function buildEditor() {
    var cs = window._cs || {};
    var h = '<div class="modal-overlay show" id="brandingEditor21" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">✏️ Church Branding — Edit / Remove</div>';
    [['church_name', 'Church Name'], ['tagline', 'Tagline'], ['welcome_message', 'Welcome Message'], ['location', 'Location / Address'], ['pastor_name', 'Pastor Name']].forEach(function (f) { h += '<div class="form-group"><label class="form-label">' + f[1] + '</label><input class="form-input" id="be_' + f[0] + '" value="' + E(cs[f[0]] || '') + '"></div>'; });
    h += imgRow('hero_image', 'Hero Image') + imgRow('pastor_image', 'Pastor Image') + imgRow('church_photo_url', 'Church Photo (beside welcome)');
    h += '<h4 style="margin:12px 0 6px">Services</h4><div id="beSvcList"></div><div class="grid-2"><select class="form-select" id="be_svcDay">' + dayOpts() + '</select><input class="form-input" id="be_svcTime" placeholder="Time e.g. 9:00 AM - 12:00 PM"></div><input class="form-input" id="be_svcType" placeholder="Service type" style="margin:6px 0"><button class="btn btn-primary btn-sm" onclick="beAddService()"><i class="fas fa-plus"></i> Add Service</button>';
    h += '<h4 style="margin:12px 0 6px">🏛️ Ministries</h4><div id="beMinList"></div><input class="form-input" id="be_minName" placeholder="Ministry name" style="margin-bottom:6px"><textarea class="form-textarea" id="be_minStory" rows="2" placeholder="The story behind it..."></textarea><button class="btn btn-primary btn-sm" onclick="beAddMinistry()"><i class="fas fa-plus"></i> Add Ministry</button>';
    h += '<h4 style="margin:12px 0 6px">🖼️ Gallery</h4><div id="beGalList"></div><input class="form-input" id="be_galTitle" placeholder="Gallery title" style="margin-bottom:6px"><div style="display:flex;gap:6px"><input class="form-input" id="be_galUrl" placeholder="Image URL or upload"><button class="btn btn-secondary-alt" onclick="beUpload(\'galUrl\')"><i class="fas fa-upload"></i></button></div><button class="btn btn-primary btn-sm" style="margin-top:6px" onclick="beAddGallery()"><i class="fas fa-plus"></i> Add Gallery Item</button>';
    h += '<h4 style="margin:12px 0 6px">📰 Articles / Testimonials</h4><div id="beArtList"></div><input class="form-input" id="be_artTitle" placeholder="Title" style="margin-bottom:6px"><select class="form-select" id="be_artCat" style="margin-bottom:6px"><option value="article">Article</option><option value="testimonial">Testimonial</option><option value="news">News</option><option value="devotional">Devotional</option><option value="announcement">Announcement</option></select><textarea class="form-textarea" id="be_artContent" rows="2" placeholder="Content..."></textarea><button class="btn btn-primary btn-sm" style="margin-top:6px" onclick="beAddArticle()"><i class="fas fa-plus"></i> Publish</button>';
    h += '<h4 style="margin:12px 0 6px">👥 Featured People on Landing</h4><div id="beFeList"></div><button class="btn btn-primary btn-sm" onclick="beShowPicker()"><i class="fas fa-plus"></i> Add Member</button><div id="bePicker" class="user-picker" style="display:none;margin-top:6px"></div>';
    h += '<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="beSave()"><i class="fas fa-save"></i> SAVE ALL CHANGES</button><button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Close</button></div></div>';
    var old = g('brandingEditor21'); if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', h);
    beLists();
  }
  function beLists() {
    var sv = g('beSvcList'); if (sv) sv.innerHTML = ((window._cs || {}).services || []).map(function (s, i) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem">' + E(s.day) + ' • ' + E(s.time) + ' • ' + E(s.type) + '<button class="post-delete" onclick="beDelService(' + i + ')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
    var ml = g('beMinList'); if (ml) ml.innerHTML = (window._min || []).map(function (m) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem"><b>' + E(m.name) + '</b><button class="post-delete" onclick="beDelMinistry(\'' + m.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
    var gl = g('beGalList'); if (gl) gl.innerHTML = (window._gal || []).map(function (x) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem">' + (x.media_url ? '<img src="' + x.media_url + '" style="width:28px;height:28px;border-radius:4px;object-fit:cover">' : '') + '<b>' + E(x.title || 'Gallery') + '</b><button class="post-delete" onclick="beDelGallery(\'' + x.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
    var al = g('beArtList'); if (al) al.innerHTML = (window._art || []).map(function (x) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem"><b>' + E(x.title || '') + '</b> <span style="color:var(--text-light)">(' + E(x.category || '') + ')</span><button class="post-delete" onclick="beDelArticle(\'' + x.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
    var fl = g('beFeList'); if (fl) fl.innerHTML = (window._fp || []).map(function (p) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem">' + (p.image_url ? '<img src="' + p.image_url + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover">' : '<div class="post-avatar" style="width:28px;height:28px;font-size:.65rem">' + ini(p.name) + '</div>') + '<b>' + E(p.name) + '</b> <span style="color:var(--text-light)">(' + E(p.role) + ')</span><button class="post-delete" onclick="beDelFeatured(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet — add members below.</div>';
  }
  window.beUpload = function (key) { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = function () { if (i.files && i.files[0]) uploadMediaFile(i.files[0]).then(function (url) { g('be_' + key).value = url; alert('✅ Uploaded — press SAVE / ADD to keep it'); }); }; i.click(); };
  window.beAddService = function () { var cs = window._cs || {}; var svcs = (cs.services || []).slice(); svcs.push({ day: g('be_svcDay').value, time: g('be_svcTime').value, type: g('be_svcType').value || 'Main Service' }); sb.from('church_settings').upsert({ id: 1, services: svcs }).then(function () { window._cs.services = svcs; beLists(); }); };
  window.beDelService = function (i) { var cs = window._cs || {}; var svcs = (cs.services || []).slice(); svcs.splice(i, 1); sb.from('church_settings').upsert({ id: 1, services: svcs }).then(function () { window._cs.services = svcs; beLists(); }); };
  window.beAddMinistry = function () { var n = g('be_minName').value.trim(); if (!n) return alert('Name required'); sb.from('ministries').insert([{ name: n, story: g('be_minStory').value }]).then(function () { sb.from('ministries').select('*').then(function (r) { window._min = r.data || []; beLists(); }); }); };
  window.beDelMinistry = function (id) { if (!confirm('Delete ministry?')) return; sb.from('ministries').delete().eq('id', id).then(function () { sb.from('ministries').select('*').then(function (r) { window._min = r.data || []; beLists(); }); }); };
  window.beAddGallery = function () { var t = g('be_galTitle').value.trim(); var u = g('be_galUrl').value.trim(); if (!u) return alert('Add an image first'); sb.from('gallery_items').insert([{ title: t || 'Gallery', media_url: u, media_type: 'image' }]).then(function () { g('be_galTitle').value = ''; g('be_galUrl').value = ''; sb.from('gallery_items').select('*').order('created_at', { ascending: false }).then(function (r) { window._gal = r.data || []; beLists(); }); }); };
  window.beDelGallery = function (id) { if (!confirm('Delete gallery item?')) return; sb.from('gallery_items').delete().eq('id', id).then(function () { sb.from('gallery_items').select('*').order('created_at', { ascending: false }).then(function (r) { window._gal = r.data || []; beLists(); }); }); };
  window.beAddArticle = function () { var t = g('be_artTitle').value.trim(); var c = g('be_artContent').value.trim(); if (!t || !c) return alert('Title & content required'); sb.from('news_articles').insert([{ title: t, excerpt: c, content: c, category: g('be_artCat').value, author_name: (window.profile && profile.name) || 'Admin' }]).then(function () { g('be_artTitle').value = ''; g('be_artContent').value = ''; sb.from('news_articles').select('*').order('published_at', { ascending: false }).then(function (r) { window._art = r.data || []; beLists(); }); }); };
  window.beDelArticle = function (id) { if (!confirm('Delete this article/testimonial?')) return; sb.from('news_articles').delete().eq('id', id).then(function () { sb.from('news_articles').select('*').order('published_at', { ascending: false }).then(function (r) { window._art = r.data || []; beLists(); }); }); };
  window.beShowPicker = function () { var pk = g('bePicker'); pk.style.display = pk.style.display === 'none' ? 'block' : 'none'; sb.from('profiles').select('id,name,role,profile_pic').order('name').then(function (r) { pk.innerHTML = (r.data || []).map(function (u) { return '<div class="user-pick-item" onclick="beAddFeatured(\'' + u.id + '\')">' + (u.profile_pic ? '<img src="' + u.profile_pic + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover">' : '<div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">' + ini(u.name) + '</div>') + '<div style="flex:1"><div style="font-weight:600">' + E(u.name) + '</div><div style="font-size:.7rem;color:var(--text-light)">' + E(u.role) + '</div></div></div>'; }).join(''); }); };
  window.beAddFeatured = function (uid) { rolesFor(uid).then(function (info) { return sb.from('featured_people').insert([{ user_id: uid, name: info.name, role: info.role, image_url: info.pic || null }]); }).then(function () { alert('✅ Added to landing page'); sb.from('featured_people').select('*').then(function (r) { window._fp = r.data || []; beLists(); }); }); };
  window.beDelFeatured = function (id) { sb.from('featured_people').delete().eq('id', id).then(function () { sb.from('featured_people').select('*').then(function (r) { window._fp = r.data || []; beLists(); }); }); };
  window.beSave = function () {
    var p = { id: 1 };
    ['church_name', 'tagline', 'welcome_message', 'location', 'pastor_name', 'hero_image', 'pastor_image', 'church_photo_url'].forEach(function (k) { var el = g('be_' + k); if (el) p[k] = el.value.trim() || null; });
    var keys = Object.keys(p);
    (function attempt() {
      var q = {}; keys.forEach(function (k) { q[k] = p[k]; });
      sb.from('church_settings').upsert(q).then(function (r) {
        if (!r.error) { alert('✅ Branding saved!'); closeModalDirect(); if (window.loadChurchBranding) loadChurchBranding().then(function () { if (window.renderPublicLanding) renderPublicLanding(); }); return; }
        var mm = String(r.error.message || '').match(/'([a-zA-Z_]+)' column|column\s+'?"?([a-zA-Z_]+)/);
        var col = mm && (mm[1] || mm[2]);
        if (col && keys.indexOf(col) > -1) { keys = keys.filter(function (k) { return k !== col; }); return attempt(); }
        alert('⚠️ ' + r.error.message);
      });
    })();
  };
  setInterval(function () {
    document.querySelectorAll('.app-header button, #editLandingBtn').forEach(function (b) { if (/Edit \/ Remove Media|Edit Landing/i.test(b.textContent || '')) b.remove(); });
    var panel = g('adminDiscoverPanel'); if (!panel || !isAdmin()) return;
    panel.querySelectorAll('button').forEach(function (b) { if (/Church Branding|Add News Article|Upload to Gallery|Upload Document/i.test(b.textContent || '')) b.style.display = 'none'; });
    if (!g('brandEditBtn21')) { var ref = panel.querySelector('[onclick*="inviteAdmin"]'); var b = document.createElement('button'); b.id = 'brandEditBtn21'; b.className = 'btn btn-warm btn-block btn-sm'; b.style.marginTop = '6px'; b.innerHTML = '<i class="fas fa-image"></i> Edit / Remove Media'; b.onclick = openBrandingEditor; if (ref) ref.parentNode.insertBefore(b, ref.nextSibling); else panel.appendChild(b); }
  }, 2500);

  /* ══ 6) EVENTS — one editor, adaptive save (no venue crash) ══ */
  if (!g('editEventModal21')) document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay" id="editEventModal21" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">🎉 Edit Event <span class="admin-only">Admin</span></div><div class="form-group"><label class="form-label">Title</label><input class="form-input" id="ev_title"></div><div class="form-group"><label class="form-label">Theme</label><input class="form-input" id="ev_theme"></div><div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="ev_desc" rows="3"></textarea></div><div class="form-group"><label class="form-label">Venue</label><input class="form-input" id="ev_venue"></div><div class="grid-2"><div class="form-group"><label class="form-label">Start</label><input class="form-input" id="ev_start" type="datetime-local"></div><div class="form-group"><label class="form-label">End</label><input class="form-input" id="ev_end" type="datetime-local"></div></div><div class="form-group"><label class="form-label">Status</label><select class="form-select" id="ev_status"><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></div><div class="form-group"><label class="form-label">Poster / Media</label><div style="display:flex;gap:6px"><input class="form-input" id="ev_media" placeholder="Image URL or upload"><button class="btn btn-secondary-alt" onclick="evUploadMedia()"><i class="fas fa-upload"></i></button><button class="btn btn-danger" onclick="evClearMedia()"><i class="fas fa-trash"></i></button></div><div id="ev_media_preview" style="margin-top:6px"></div></div><div class="grid-2"><button class="btn btn-primary btn-block" onclick="saveEventEdit21()"><i class="fas fa-save"></i> Save</button><button class="btn btn-danger btn-block" onclick="delEvent21()"><i class="fas fa-trash"></i> Delete Event</button></div><button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
  window.openEventEdit = function (id) {
    if (!isAdmin()) return alert('🚫 Admin only.');
    var e = (window.eventsData || []).find(function (x) { return x.id === id; }); if (!e) return alert('Event not found — refresh the page.');
    window._editingEventId = id;
    g('ev_title').value = e.title || ''; g('ev_theme').value = e.theme || ''; g('ev_desc').value = e.description || ''; g('ev_venue').value = e.venue || '';
    var fmt = function (v) { if (!v) return ''; try { return new Date(v).toISOString().slice(0, 16); } catch (e) { return ''; } };
    g('ev_start').value = fmt(e.start_date); g('ev_end').value = fmt(e.end_date); g('ev_status').value = e.status || 'upcoming';
    var murl = e.media_url || (Array.isArray(e.media_urls) && e.media_urls[0]) || (typeof e.media_urls === 'string' ? e.media_urls : '');
    g('ev_media').value = murl || ''; evShowMediaPreview(murl);
    openModal('editEventModal21');
  };
  window.evUploadMedia = function () { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,video/*'; i.onchange = function () { if (i.files && i.files[0]) uploadMediaFile(i.files[0]).then(function (url) { g('ev_media').value = url; evShowMediaPreview(url); alert('✅ Uploaded — press Save'); }); }; i.click(); };
  window.evClearMedia = function () { g('ev_media').value = ''; evShowMediaPreview(''); };
  function evShowMediaPreview(url) { var box = g('ev_media_preview'); if (!box) return; if (!url) { box.innerHTML = '<div style="color:var(--text-lighter);font-size:.8rem">No media</div>'; return; } var isImg = /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url) || !/\.([a-z0-9]+)(\?|$)/i.test(url); box.innerHTML = isImg ? '<img src="' + url + '" style="max-width:100%;max-height:180px;border-radius:8px">' : '<a href="' + url + '" target="_blank">📎 Open media</a>'; }
  window.saveEventEdit21 = function () {
    var id = window._editingEventId; if (!id) return alert('No event');
    if (!g('ev_title').value.trim()) return alert('Title required');
    var payload = { title: g('ev_title').value.trim(), theme: g('ev_theme').value.trim(), description: g('ev_desc').value.trim(), venue: g('ev_venue').value.trim(), start_date: g('ev_start').value ? new Date(g('ev_start').value).toISOString() : null, end_date: g('ev_end').value ? new Date(g('ev_end').value).toISOString() : null, status: g('ev_status').value, media_url: g('ev_media').value.trim() || null };
    updateAdaptive('events', id, payload, function (err) {
      if (err) return alert('⚠️ ' + err);
      alert('✅ Event saved'); closeModalDirect(); if (typeof loadEvents === 'function') loadEvents();
    });
  };
  window.delEvent21 = function () { var id = window._editingEventId; if (!id) return; if (!confirm('Delete this event permanently?')) return; sb.from('events').delete().eq('id', id).then(function (r) { if (r.error) return alert('⚠️ ' + r.error.message); alert('✅ Event deleted'); closeModalDirect(); if (typeof loadEvents === 'function') loadEvents(); }); };
  var _re = window.renderEvents;
  window.renderEvents = function () {
    var r = _re ? _re.apply(this, arguments) : undefined;
    setTimeout(function () {
      if (!isAdmin()) return;
      document.querySelectorAll('.event-card').forEach(function (c) {
        // remove OLD duplicate edit button from previous code
        c.querySelectorAll('button').forEach(function (b) { var oc = b.getAttribute('onclick') || ''; if (oc.indexOf('editEvent(') > -1) b.remove(); });
        if (c.dataset.editBound) return;
        var title = (c.querySelector('.event-title') || {}).textContent || '';
        var e = (window.eventsData || []).find(function (x) { return x.title === title; }); if (!e) return;
        c.dataset.editBound = '1';
        var btn = document.createElement('button'); btn.className = 'btn btn-warm btn-sm'; btn.style.marginTop = '8px'; btn.innerHTML = '<i class="fas fa-edit"></i> Edit / Delete'; btn.onclick = function (ev) { ev.stopPropagation(); openEventEdit(e.id); };
        (c.querySelector('.event-info') || c).appendChild(btn);
      });
    }, 300);
    return r;
  };

  /* ══ 7) PLANS — own renderer + working delete ══ */
  window.deletePlan = function (id) {
    if (!id) return alert('No plan selected');
    if (!confirm('Delete this plan?')) return;
    sb.from('plans').delete().eq('id', id).then(function (r) {
      if (r.error) return alert('⚠️ ' + r.error.message);
      (window.plansData || []).splice((window.plansData || []).findIndex(function (p) { return p.id === id; }), 1);
      renderPlans();
      alert('✅ Plan deleted');
      if (typeof loadPlans === 'function') loadPlans();
    });
  };
  window.renderPlans = function () {
    var host = document.getElementById('ushirika-plans'); if (!host) return;
    var c = g('dyn-plans'); if (!c) { c = document.createElement('div'); c.id = 'dyn-plans'; host.appendChild(c); }
    if (typeof hideStatic === 'function') hideStatic('ushirika-plans', '.card');
    var plans = window.plansData || [];
    if (!plans.length) { c.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-lighter)">No plans yet.</div>'; return; }
    var admin = typeof isAdmin === 'function' && isAdmin();
    c.innerHTML = plans.map(function (p) {
      var mine = window.user && p.created_by === window.user.id;
      return '<div class="card" style="border-left:4px solid var(--accent);position:relative"><b>' + E(p.title) + '</b>' +
        (p.plan_type ? '<div style="font-size:.72rem;color:var(--text-light);margin-top:2px">' + E(p.plan_type) + '</div>' : '') +
        (p.meeting_date ? '<div style="font-size:.75rem;color:var(--text-light)">' + (typeof fdate === 'function' ? fdate(p.meeting_date) : E(p.meeting_date)) + '</div>' : '') +
        ((mine || admin) ? '<button class="post-delete" style="position:absolute;top:8px;right:8px" onclick="deletePlan(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') +
        '</div>';
    }).join('');
  };

  /* ══ 8) Bible loader ══ */
  var BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];
  function bn(b) { if (/^\d+$/.test(String(b))) { var n = +b; if (n > 0 && n < 67) return n; } for (var i = 0; i < BOOKS.length; i++)if (BOOKS[i].toLowerCase() === String(b).toLowerCase()) return i + 1; return 1; }
  function safeJSON(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text().then(function (t) { t = (t || '').trim(); if (!t || (t.charAt(0) !== '{' && t.charAt(0) !== '[')) throw new Error('HTML'); return JSON.parse(t); }); }); }
  function paint(out, d, tag) {
    window._bibleVerses = d.verses; window._selectedVerses = [];
    var h = '<div style="font-weight:700;color:#92400E;margin-bottom:8px">' + E(d.reference) + (tag || '') + '</div>';
    d.verses.forEach(function (v) { h += '<div data-v="' + v.verse + '" onclick="toggleVerseHighlight(this,' + v.verse + ')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>' + v.verse + '</sup> ' + E(v.text) + '</div>'; });
    h += '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()"><i class="fas fa-bookmark"></i> Save</button><button class="btn btn-chat btn-sm" onclick="openShareVerses()"><i class="fas fa-share"></i> Share</button></div>';
    out.innerHTML = h;
  }
  window.loadBibleChapter = function () {
    var trans = (g('readerTrans') || {}).value || 'KJV';
    var ref = (g('readerRef') || { value: 'Genesis 1' }).value.trim() || 'Genesis 1';
    var p = ref.match(/^(.+?)\s+(\d+)$/); var book = p ? p[1] : 'Genesis'; var ch = p ? p[2] : 1;
    var out = g('readerOut'); if (!out) return;
    out.innerHTML = '<div style="color:#94A3B8">Loading ' + E(trans) + '…</div>';
    var isSw = (trans === 'Swahili');
    var code = ({ KJV: 'kjv', NKJV: 'kjv', NIV: 'web', WEB: 'web', ASV: 'asv', YLT: 'ylt', DARBY: 'darby', DRA: 'dra' })[trans] || 'kjv';
    var key = 'gc_bible_' + trans + '_' + bn(book) + '_' + ch;
    var urls = ['/api/bible?translation=' + (isSw ? 'swahili' : code) + '&book=' + encodeURIComponent(book) + '&chapter=' + ch];
    urls.push(isSw ? 'https://api.getbible.net/v2/swahili/' + bn(book) + '/' + ch + '.json' : 'https://bible-api.com/' + encodeURIComponent(book + ' ' + ch) + '?translation=' + code);
    var chain = Promise.reject(new Error('start'));
    urls.forEach(function (u) { chain = chain.catch(function () { return safeJSON(u); }); });
    chain.then(function (d) {
      var vs = (d && d.verses) ? d.verses : []; if (!vs.length) throw new Error('empty');
      var data = { reference: d.reference || d.name || (book + ' ' + ch), verses: vs.map(function (v) { return { verse: v.verse, text: v.text }; }) };
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { }
      paint(out, data, '');
    }).catch(function () {
      var c = null; try { c = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { }
      if (c && c.verses && c.verses.length) return paint(out, c, ' <span class="chip chip-green">offline</span>');
      out.innerHTML = '<div style="color:#991B1B">Could not load ' + E(trans) + '. <button class="btn btn-primary btn-sm" onclick="loadBibleChapter()"><i class="fas fa-rotate-right"></i> Retry</button></div>';
    });
  };
})();
console.log('✝️ app17.js v5 active');
