// app17.js — FINAL v3: branding editor in Discover, static meeting, 7-day selects, bible fixed
console.log('✝️ app17.js v3 loading...');
(function () {
  function g(id) { return document.getElementById(id); }
  function E(x) { return (typeof esc === 'function') ? esc(x) : String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function dayOpts(sel) { return DAYS.map(function (d) { return '<option' + (d === sel ? ' selected' : '') + '>' + d + '</option>'; }).join(''); }

  /* ══ 1) KILL legacy meeting timers + ONE static widget ══ */
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
    host.querySelectorAll('.card').forEach(function (c) {
      if (/This Week'?s Meeting/i.test(c.textContent || '') && !(keep && keep.contains(c))) c.style.display = 'none';
    });
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
      if (can) h += '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\'' + deptId + '\')"><i class="fas fa-edit"></i> Update</button>' +
        (m ? '<button class="btn btn-danger btn-sm" onclick="delMeet20(\'' + m.id + '\',\'' + deptId + '\')"><i class="fas fa-trash"></i> Delete</button>' : '') + '</div>';
      b.innerHTML = h + '</div>'; hideStray();
    });
  }
  window.delMeet20 = function (mid, deptId) {
    deptId = deptId || window.currentDeptId;
    if (!(typeof isDeptLeader9 === 'function' && isDeptLeader9(deptId))) return alert('🚫 Leader/admin only.');
    if (!confirm('Delete this meeting?')) return;
    sb.from('weekly_meetings').delete().eq('id', mid).then(function () { renderMeet(deptId, true); });
  };
  var _o = window.openDeptForum; window.openDeptForum = function (id) { var r = _o ? _o.apply(this, arguments) : undefined; setTimeout(function () { renderMeet(id, true); }, 700); return r; };
  var _s = window.saveDeptMeeting9; window.saveDeptMeeting9 = function () { var r = _s ? _s.apply(this, arguments) : undefined; setTimeout(function () { renderMeet((g('dm9Pick') || {}).value || window.currentDeptId, true); }, 900); return r; };
  var _u = window.updateMeeting; window.updateMeeting = function () { var r = _u ? _u.apply(this, arguments) : undefined; setTimeout(function () { renderMeet(window.currentDeptId, true); }, 900); return r; };
  setInterval(hideStray, 3000);

  /* ══ 2) Edit/Delete Ushirika + Department (7-day selects) ══ */
  if (!g('editUshModal')) document.body.insertAdjacentHTML('beforeend',
    '<div class="modal-overlay" id="editUshModal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">✏️ Edit Ushirika</div>' +
    '<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="editUshName"></div>' +
    '<div class="form-group"><label class="form-label">Location</label><input class="form-input" id="editUshLoc"></div>' +
    '<div class="form-group"><label class="form-label">Meeting Day</label><select class="form-select" id="editUshDay">' + dayOpts() + '</select></div>' +
    '<button class="btn btn-primary btn-block" onclick="saveUshEdit()"><i class="fas fa-save"></i> Save</button>' +
    '<button class="btn btn-danger btn-block" style="margin-top:6px" onclick="delUsh()"><i class="fas fa-trash"></i> Delete Ushirika</button>' +
    '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
  if (!g('editDeptModal')) document.body.insertAdjacentHTML('beforeend',
    '<div class="modal-overlay" id="editDeptModal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">✏️ Edit Department</div>' +
    '<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="editDeptName"></div>' +
    '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="editDeptDesc"></textarea></div>' +
    '<button class="btn btn-primary btn-block" onclick="saveDeptEdit()"><i class="fas fa-save"></i> Save</button>' +
    '<button class="btn btn-danger btn-block" style="margin-top:6px" onclick="delDept()"><i class="fas fa-trash"></i> Delete Department</button>' +
    '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
  window.openUshEdit = function (id) { if (!isAdmin()) return alert('🚫 Admin only.'); var u = (ushirikasData || []).find(function (x) { return x.id === id; }); if (!u) return; window._editingUshId = id; g('editUshName').value = u.name || ''; g('editUshLoc').value = u.location || ''; g('editUshDay').value = u.meeting_day || 'Saturday'; openModal('editUshModal'); };
  window.saveUshEdit = function () { var id = window._editingUshId; if (!id) return; sb.from('ushirikas').update({ name: g('editUshName').value.trim(), location: g('editUshLoc').value.trim(), meeting_day: g('editUshDay').value }).eq('id', id).then(function (r) { if (r.error) return alert('⚠️ ' + r.error.message); alert('✅ Saved'); closeModalDirect(); if (window.loadAll) loadAll(); }); };
  window.delUsh = function () { var id = window._editingUshId; if (!id || !confirm('Delete this ushirika completely?')) return; sb.from('ushirika_members').delete().eq('ushirika_id', id).then(function () { sb.from('ushirikas').delete().eq('id', id).then(function () { alert('✅ Deleted'); closeModalDirect(); if (window.loadAll) loadAll(); }); }); };
  window.openDeptEdit = function (id) { if (!isAdmin()) return alert('🚫 Admin only.'); var d = (depts || []).find(function (x) { return x.id === id; }); if (!d) return; window._editingDeptId = id; g('editDeptName').value = d.name || ''; g('editDeptDesc').value = d.description || ''; openModal('editDeptModal'); };
  window.saveDeptEdit = function () { var id = window._editingDeptId; if (!id) return; sb.from('departments').update({ name: g('editDeptName').value.trim(), description: g('editDeptDesc').value.trim() }).eq('id', id).then(function (r) { if (r.error) return alert('⚠️ ' + r.error.message); alert('✅ Saved'); closeModalDirect(); if (window.loadAll) loadAll(); }); };
  window.delDept = function () { var id = window._editingDeptId; if (!id || !confirm('Delete this department completely?')) return; Promise.all([sb.from('department_members').delete().eq('department_id', id), sb.from('weekly_meetings').delete().eq('department_id', id)]).then(function () { sb.from('departments').delete().eq('id', id).then(function () { alert('✅ Deleted'); closeModalDirect(); if (window.loadAll) loadAll(); }); }); };
  setInterval(function () {
    if (!isAdmin()) return;
    document.querySelectorAll('.ushirika-card').forEach(function (c) {
      if (c.dataset.editBound) return; var u = (ushirikasData || []).find(function (x) { return c.textContent.indexOf(x.name) > -1; }); if (!u) return;
      c.dataset.editBound = '1'; var b = document.createElement('button'); b.className = 'btn btn-warm btn-sm'; b.style.marginTop = '8px'; b.innerHTML = '<i class="fas fa-pen"></i> Edit'; b.onclick = function (e) { e.stopPropagation(); openUshEdit(u.id); }; (c.querySelector('.ushirika-info') || c).appendChild(b);
    });
    document.querySelectorAll('.dept-card').forEach(function (c) {
      if (c.dataset.editBound) return; var d = (depts || []).find(function (x) { return c.textContent.indexOf(x.name) > -1; }); if (!d) return;
      c.dataset.editBound = '1'; var b = document.createElement('button'); b.className = 'btn btn-warm btn-sm'; b.style.margin = '4px'; b.innerHTML = '<i class="fas fa-pen"></i> Edit'; b.onclick = function (e) { e.stopPropagation(); openDeptEdit(d.id); }; (c.querySelector('.dept-body') || c).appendChild(b);
    });
  }, 2500);

  /* ══ 3) Delete own inbox messages ══ */
  window.deleteChatMessage = function (msgId, chatId) {
    if (!confirm('Delete this message?')) return;
    sb.from('chat_messages').delete().eq('id', msgId).eq('sender_id', user.id).then(function (r) {
      if (r.error) return alert('⚠️ ' + r.error.message);
      if (typeof loadChatMessages === 'function') loadChatMessages(chatId);
    });
  };
  var _rc = window.renderChatMessages;
  window.renderChatMessages = function (chatId) {
    var r = _rc ? _rc.apply(this, arguments) : undefined;
    setTimeout(function () {
      var list = document.querySelector('#chatMessages, .chat-messages'); if (!list || !user) return;
      list.querySelectorAll('.chat-message, .chat-msg').forEach(function (m) {
        if (m.dataset.delBound) return;
        var id = m.dataset.id || m.getAttribute('data-id');
        var mine = m.dataset.mine === '1' || m.classList.contains('mine');
        if (!id || !mine) return;
        m.dataset.delBound = '1'; var b = document.createElement('button'); b.className = 'post-delete'; b.style.marginLeft = 'auto'; b.innerHTML = '<i class="fas fa-trash"></i>'; b.onclick = function (e) { e.stopPropagation(); deleteChatMessage(id, chatId); }; m.appendChild(b);
      });
    }, 400); return r;
  };

  /* ══ 4) FULL branding editor — lives ONLY in Discover, reads church_settings ══ */
  function rolesFor(uid) {
    return Promise.all([
      sb.from('profiles').select('role,profile_pic,name').eq('id', uid).single().catch(function () { return { data: null }; }),
      sb.from('department_members').select('role,departments(name)').eq('user_id', uid).catch(function () { return { data: [] }; }),
      sb.from('ushirika_members').select('role,ushirikas(name)').eq('user_id', uid).catch(function () { return { data: [] }; })
    ]).then(function (rs) {
      var out = []; var pr = rs[0].data && rs[0].data.role;
      if (pr && pr !== 'member') out.push(pr);
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
      sb.from('ministries').select('*').then(function (r) { window._min = r.data || []; }).catch(function () { window._min = []; })
    ]).then(buildEditor);
  };
  function imgRow(key, label) {
    var v = (window._cs || {})[key] || '';
    return '<div class="form-group"><label class="form-label">' + label + (v ? ' <img src="' + v + '" style="width:34px;height:34px;border-radius:6px;object-fit:cover;vertical-align:middle">' : '') + '</label>' +
      '<div style="display:flex;gap:6px"><input class="form-input" id="be_' + key + '" value="' + E(v) + '" placeholder="Image URL or upload">' +
      '<button class="btn btn-secondary-alt" onclick="beUpload(\'' + key + '\')"><i class="fas fa-upload"></i></button>' +
      '<button class="btn btn-danger" onclick="document.getElementById(\'be_' + key + '\').value=\'\'"><i class="fas fa-trash"></i></button></div></div>';
  }
  function buildEditor() {
    var cs = window._cs || {};
    var h = '<div class="modal-overlay show" id="brandingEditor21" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">✏️ Church Branding — Edit / Remove</div>';
    [['church_name', 'Church Name'], ['tagline', 'Tagline'], ['welcome_message', 'Welcome Message'], ['location', 'Location / Address'], ['pastor_name', 'Pastor Name']].forEach(function (f) {
      h += '<div class="form-group"><label class="form-label">' + f[1] + '</label><input class="form-input" id="be_' + f[0] + '" value="' + E(cs[f[0]] || '') + '"></div>';
    });
    h += imgRow('hero_image', 'Hero Image') + imgRow('pastor_image', 'Pastor Image') + imgRow('church_photo_url', 'Church Photo (beside welcome)');
    h += '<h4 style="margin:12px 0 6px"> Services</h4><div id="beSvcList"></div><div class="grid-2"><select class="form-select" id="be_svcDay">' + dayOpts() + '</select><input class="form-input" id="be_svcTime" placeholder="Time e.g. 9:00 AM - 12:00 PM"></div><input class="form-input" id="be_svcType" placeholder="Service type" style="margin:6px 0"><button class="btn btn-primary btn-sm" onclick="beAddService()"><i class="fas fa-plus"></i> Add Service</button>';
    h += '<h4 style="margin:12px 0 6px">🏛️ Ministries</h4><div id="beMinList"></div><input class="form-input" id="be_minName" placeholder="Ministry name" style="margin-bottom:6px"><textarea class="form-textarea" id="be_minStory" rows="2" placeholder="The story behind it..."></textarea><button class="btn btn-primary btn-sm" onclick="beAddMinistry()"><i class="fas fa-plus"></i> Add Ministry</button>';
    h += '<h4 style="margin:12px 0 6px">👥 Featured People on Landing</h4><div id="beFeList"></div><button class="btn btn-primary btn-sm" onclick="beShowPicker()"><i class="fas fa-plus"></i> Add Member</button><div id="bePicker" class="user-picker" style="display:none;margin-top:6px"></div>';
    h += '<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="beSave()"><i class="fas fa-save"></i> SAVE ALL CHANGES</button>';
    h += '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Close</button></div></div>';
    var old = g('brandingEditor21'); if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', h);
    beLists();
  }
  function beLists() {
    var sv = g('beSvcList'); if (sv) sv.innerHTML = ((window._cs || {}).services || []).map(function (s, i) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem">' + E(s.day) + ' • ' + E(s.time) + ' • ' + E(s.type) + '<button class="post-delete" onclick="beDelService(' + i + ')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
    var ml = g('beMinList'); if (ml) ml.innerHTML = (window._min || []).map(function (m) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem"><b>' + E(m.name) + '</b><button class="post-delete" onclick="beDelMinistry(\'' + m.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
    var fl = g('beFeList'); if (fl) fl.innerHTML = (window._fp || []).map(function (p) { return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem">' + (p.image_url ? '<img src="' + p.image_url + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover">' : '<div class="post-avatar" style="width:28px;height:28px;font-size:.65rem">' + ini(p.name) + '</div>') + '<b>' + E(p.name) + '</b> <span style="color:var(--text-light)">(' + E(p.role) + ')</span><button class="post-delete" onclick="beDelFeatured(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div>'; }).join('') || '<div style="color:var(--text-lighter);font-size:.8rem">None yet — add members below.</div>';
  }
  window.beUpload = function (key) { var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = function () { if (i.files && i.files[0]) uploadMediaFile(i.files[0]).then(function (url) { g('be_' + key).value = url; alert('✅ Uploaded — press SAVE to keep it'); }); }; i.click(); };
  window.beAddService = function () { var cs = window._cs || {}; var svcs = (cs.services || []).slice(); svcs.push({ day: g('be_svcDay').value, time: g('be_svcTime').value, type: g('be_svcType').value || 'Main Service' }); sb.from('church_settings').upsert({ id: 1, services: svcs }).then(function () { window._cs.services = svcs; beLists(); }); };
  window.beDelService = function (i) { var cs = window._cs || {}; var svcs = (cs.services || []).slice(); svcs.splice(i, 1); sb.from('church_settings').upsert({ id: 1, services: svcs }).then(function () { window._cs.services = svcs; beLists(); }); };
  window.beAddMinistry = function () { var n = g('be_minName').value.trim(); if (!n) return alert('Name required'); sb.from('ministries').insert([{ name: n, story: g('be_minStory').value }]).then(function () { sb.from('ministries').select('*').then(function (r) { window._min = r.data || []; beLists(); }); }); };
  window.beDelMinistry = function (id) { if (!confirm('Delete ministry?')) return; sb.from('ministries').delete().eq('id', id).then(function () { sb.from('ministries').select('*').then(function (r) { window._min = r.data || []; beLists(); }); }); };
  window.beShowPicker = function () { var pk = g('bePicker'); pk.style.display = pk.style.display === 'none' ? 'block' : 'none'; sb.from('profiles').select('id,name,role,profile_pic').order('name').then(function (r) { pk.innerHTML = (r.data || []).map(function (u) { return '<div class="user-pick-item" onclick="beAddFeatured(\'' + u.id + '\')">' + (u.profile_pic ? '<img src="' + u.profile_pic + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover">' : '<div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">' + ini(u.name) + '</div>') + '<div style="flex:1"><div style="font-weight:600">' + E(u.name) + '</div><div style="font-size:.7rem;color:var(--text-light)">' + E(u.role) + '</div></div></div>'; }).join(''); }); };
  window.beAddFeatured = function (uid) { rolesFor(uid).then(function (info) { return sb.from('featured_people').insert([{ user_id: uid, name: info.name, role: info.role, image_url: info.pic || null }]); }).then(function () { alert('✅ Added to landing page'); sb.from('featured_people').select('*').then(function (r) { window._fp = r.data || []; beLists(); }); }); };
  window.beDelFeatured = function (id) { sb.from('featured_people').delete().eq('id', id).then(function () { sb.from('featured_people').select('*').then(function (r) { window._fp = r.data || []; beLists(); }); }); };
  window.beSave = function () {
    var p = { id: 1 };
    ['church_name', 'tagline', 'welcome_message', 'location', 'pastor_name', 'hero_image', 'pastor_image', 'church_photo_url'].forEach(function (k) { var el = g('be_' + k); if (el) p[k] = el.value.trim() || null; });
    sb.from('church_settings').upsert(p).then(function (r) {
      if (r.error) return alert('⚠️ ' + r.error.message);
      alert('✅ Branding saved!'); closeModalDirect();
      if (window.loadChurchBranding) loadChurchBranding().then(function () { if (window.renderPublicLanding) renderPublicLanding(); });
    });
  };
  /* put the button ONLY in Discover, remove old header/landing buttons */
  setInterval(function () {
    document.querySelectorAll('.app-header button, #editLandingBtn').forEach(function (b) { if (/Edit \/ Remove Media|Edit Landing/i.test(b.textContent || '')) b.remove(); });
    var panel = g('adminDiscoverPanel'); if (!panel || !isAdmin()) return;
    panel.querySelectorAll('button').forEach(function (b) { if (/Church Branding|Add News Article|Upload to Gallery|Upload Document/i.test(b.textContent || '')) b.style.display = 'none'; });
    if (!g('brandEditBtn21')) {
      var ref = panel.querySelector('[onclick*="inviteAdmin"]');
      var b = document.createElement('button'); b.id = 'brandEditBtn21'; b.className = 'btn btn-warm btn-block btn-sm'; b.style.marginTop = '6px';
      b.innerHTML = '<i class="fas fa-image"></i> Edit / Remove Media'; b.onclick = openBrandingEditor;
      if (ref) ref.parentNode.insertBefore(b, ref.nextSibling); else panel.appendChild(b);
    }
  }, 2500);

  /* ══ 5) Bible loader (Swahili + YLT fixed, offline cache) ══ */
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
console.log('✝️ app17.js v3 active');
