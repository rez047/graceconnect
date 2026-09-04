// app17.js — FINAL: everything fixed in one place
console.log('✝️ app17.js loading...');
(function () {
  function g(id) { return document.getElementById(id); }
  function E(x) { return (typeof esc === 'function') ? esc(x) : String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ═══════════════════════════════════════════════
     PART 1 — KILL the 3 legacy meeting timers
     ═══════════════════════════════════════════════ */
  window.refreshDeptMeetingWidget13 = function () { };  // kills app13's 3s loop (it checks this function)
  window.renderDeptWeekMeet14 = function () { };       // kills app14's 3s loop
  ['deptWeekMeet14', 'deptWeekMeet17', 'deptWeekMeet18'].forEach(function (id) {
    var e = g(id); if (e && e.parentNode) e.parentNode.removeChild(e);
  });
  var st = document.createElement('style');
  st.textContent = '#home-mainDept .card-cool{display:none!important}';
  document.head.appendChild(st);

  /* ═══════════════════════════════════════════════
     PART 2 — ONE STATIC department meeting widget
     ═══════════════════════════════════════════════ */
  function sig(m, can) { return JSON.stringify([m && m.id, m && m.meeting_date, m && m.start_time, m && m.end_time, m && m.venue, m && m.theme, !!can]); }
  function hideStray() {
    var host = g('home-mainDept'); if (!host) return;
    var keep = g('deptWeekMeet20');
    host.querySelectorAll('.card').forEach(function (c) {
      if (/This Week'?s Meeting/i.test(c.textContent || '') && !(keep && keep.contains(c))) c.style.display = 'none';
    });
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
      if (!force && b.dataset.sig === s) { hideStray(); return; }   // ← STATIC: no redraw if unchanged
      b.dataset.sig = s;
      if (m) window._curMeetingId = m.id;
      var h = '<div class="card" style="margin-bottom:14px"><div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
      if (!m) h += '<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';
      else h += '<div style="font-size:.9rem;line-height:1.8">' +
        (m.meeting_date ? '<div><b>📅 Date:</b> ' + E(m.meeting_date) + '</div>' : '') +
        (m.start_time ? '<div><b>🕐 Time:</b> ' + E(m.start_time) + (m.end_time ? ' – ' + E(m.end_time) : '') + '</div>' : '') +
        (m.venue ? '<div><b>📍 Venue:</b> ' + E(m.venue) + '</div>' : '') +
        (m.theme ? '<div><b>🎯 Theme:</b> ' + E(m.theme) + '</div>' : '') +
        ((typeof mediaHTML === 'function') ? mediaHTML(mediaOf(m)) : '') + '</div>';
      if (can) h += '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\'' + deptId + '\')"><i class="fas fa-edit"></i> Update</button>' +
        (m ? '<button class="btn btn-danger btn-sm" onclick="delMeet20(\'' + m.id + '\',\'' + deptId + '\')"><i class="fas fa-trash"></i> Delete</button>' : '') + '</div>';
      b.innerHTML = h + '</div>';
      hideStray();
    });
  }
  window.delMeet20 = function (mid, deptId) {
    deptId = deptId || window.currentDeptId;
    if (!(typeof isDeptLeader9 === 'function' && isDeptLeader9(deptId))) return alert('🚫 Leader/admin only.');
    if (!confirm('Delete this meeting?')) return;
    sb.from('weekly_meetings').delete().eq('id', mid).then(function () { renderMeet(deptId, true); });
  };
  var _o = window.openDeptForum;
  window.openDeptForum = function (id) { var r = _o ? _o.apply(this, arguments) : undefined; setTimeout(function () { renderMeet(id, true); }, 700); return r; };
  var _s = window.saveDeptMeeting9;
  window.saveDeptMeeting9 = function () { var r = _s ? _s.apply(this, arguments) : undefined; setTimeout(function () { renderMeet((g('dm9Pick') || {}).value || window.currentDeptId, true); }, 900); return r; };
  var _u = window.updateMeeting;
  window.updateMeeting = function () { var r = _u ? _u.apply(this, arguments) : undefined; setTimeout(function () { renderMeet(window.currentDeptId, true); }, 900); return r; };
  setInterval(hideStray, 4000);  // DOM-only guard, never rewrites our card

  /* ═══════════════════════════════════════════════
     PART 3 — Edit / Delete Ushirika & Department (admin)
     ═══════════════════════════════════════════════ */
  if (!g('editUshModal')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="editUshModal" onclick="if(event.target===this)closeModalDirect()">' +
      '<div class="modal" onclick="event.stopPropagation()">' +
      '<div class="modal-handle"></div>' +
      '<div class="modal-title">✏️ Edit Ushirika</div>' +
      '<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="editUshName"></div>' +
      '<div class="form-group"><label class="form-label">Location</label><input class="form-input" id="editUshLoc"></div>' +
      '<div class="form-group"><label class="form-label">Meeting Day</label><select class="form-select" id="editUshDay"><option>Saturday</option><option>Sunday</option><option>Friday</option></select></div>' +
      '<button class="btn btn-primary btn-block" onclick="saveUshEdit()"><i class="fas fa-save"></i> Save</button>' +
      '<button class="btn btn-danger btn-block" style="margin-top:6px" onclick="delUsh()"><i class="fas fa-trash"></i> Delete Ushirika</button>' +
      '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button>' +
      '</div></div>');
  }
  if (!g('editDeptModal')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="editDeptModal" onclick="if(event.target===this)closeModalDirect()">' +
      '<div class="modal" onclick="event.stopPropagation()">' +
      '<div class="modal-handle"></div>' +
      '<div class="modal-title">✏️ Edit Department</div>' +
      '<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="editDeptName"></div>' +
      '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="editDeptDesc"></textarea></div>' +
      '<button class="btn btn-primary btn-block" onclick="saveDeptEdit()"><i class="fas fa-save"></i> Save</button>' +
      '<button class="btn btn-danger btn-block" style="margin-top:6px" onclick="delDept()"><i class="fas fa-trash"></i> Delete Department</button>' +
      '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button>' +
      '</div></div>');
  }
  window.openUshEdit = function (id) {
    if (!isAdmin()) return alert('🚫 Admin only.');
    var u = (ushirikasData || []).find(function (x) { return x.id === id; });
    if (!u) return;
    window._editingUshId = id;
    g('editUshName').value = u.name || '';
    g('editUshLoc').value = u.location || '';
    if (u.meeting_day) g('editUshDay').value = u.meeting_day;
    openModal('editUshModal');
  };
  window.saveUshEdit = function () {
    if (!isAdmin()) return alert('🚫 Admin only.');
    var id = window._editingUshId; if (!id) return;
    sb.from('ushirikas').update({ name: g('editUshName').value.trim(), location: g('editUshLoc').value.trim(), meeting_day: g('editUshDay').value }).eq('id', id).then(function (r) {
      if (r.error) return alert('⚠️ ' + r.error.message);
      alert('✅ Ushirika updated'); closeModalDirect(); if (typeof loadAll === 'function') loadAll();
    });
  };
  window.delUsh = function () {
    if (!isAdmin()) return alert('🚫 Admin only.');
    var id = window._editingUshId; if (!id) return;
    if (!confirm('Delete this ushirika and all its members/posts? This cannot be undone.')) return;
    sb.from('ushirika_members').delete().eq('ushirika_id', id).then(function () {
      sb.from('ushirikas').delete().eq('id', id).then(function () {
        alert('✅ Ushirika deleted'); closeModalDirect(); if (typeof loadAll === 'function') loadAll();
      });
    });
  };
  window.openDeptEdit = function (id) {
    if (!isAdmin()) return alert('🚫 Admin only.');
    var d = (depts || []).find(function (x) { return x.id === id; });
    if (!d) return;
    window._editingDeptId = id;
    g('editDeptName').value = d.name || '';
    g('editDeptDesc').value = d.description || '';
    openModal('editDeptModal');
  };
  window.saveDeptEdit = function () {
    if (!isAdmin()) return alert('🚫 Admin only.');
    var id = window._editingDeptId; if (!id) return;
    sb.from('departments').update({ name: g('editDeptName').value.trim(), description: g('editDeptDesc').value.trim() }).eq('id', id).then(function (r) {
      if (r.error) return alert('⚠️ ' + r.error.message);
      alert('✅ Department updated'); closeModalDirect(); if (typeof loadAll === 'function') loadAll();
    });
  };
  window.delDept = function () {
    if (!isAdmin()) return alert('🚫 Admin only.');
    var id = window._editingDeptId; if (!id) return;
    if (!confirm('Delete this department and all its members/posts/meetings? This cannot be undone.')) return;
    Promise.all([
      sb.from('department_members').delete().eq('department_id', id),
      sb.from('weekly_meetings').delete().eq('department_id', id)
    ]).then(function () {
      sb.from('departments').delete().eq('id', id).then(function () {
        alert('✅ Department deleted'); closeModalDirect(); if (typeof loadAll === 'function') loadAll();
      });
    });
  };

  /* inject edit buttons on ushirika & dept cards (admin only) */
  setInterval(function () {
    if (!isAdmin()) return;
    document.querySelectorAll('.ushirika-card').forEach(function (c) {
      if (c.dataset.editBound) return;
      var u = (ushirikasData || []).find(function (x) { return c.textContent.indexOf(x.name) > -1; });
      if (!u) return;
      c.dataset.editBound = '1';
      var btn = document.createElement('button');
      btn.className = 'btn btn-warm btn-sm'; btn.style.marginTop = '8px';
      btn.innerHTML = '<i class="fas fa-pen"></i> Edit';
      btn.onclick = function (e) { e.stopPropagation(); openUshEdit(u.id); };
      (c.querySelector('.ushirika-info') || c).appendChild(btn);
    });
    document.querySelectorAll('.dept-card').forEach(function (c) {
      if (c.dataset.editBound) return;
      var d = (depts || []).find(function (x) { return c.textContent.indexOf(x.name) > -1; });
      if (!d) return;
      c.dataset.editBound = '1';
      var btn = document.createElement('button');
      btn.className = 'btn btn-warm btn-sm'; btn.style.margin = '4px';
      btn.innerHTML = '<i class="fas fa-pen"></i> Edit';
      btn.onclick = function (e) { e.stopPropagation(); openDeptEdit(d.id); };
      var body = c.querySelector('.dept-body') || c;
      body.appendChild(btn);
    });
  }, 2500);

  /* ═══════════════════════════════════════════════
     PART 4 — Delete previous messages in inbox
     ═══════════════════════════════════════════════ */
  window.deleteChatMessage = function (msgId, chatId) {
    if (!user) return;
    if (!confirm('Delete this message?')) return;
    sb.from('chat_messages').delete().eq('id', msgId).eq('sender_id', user.id).then(function (r) {
      if (r.error) return alert('⚠️ ' + r.error.message);
      if (typeof loadChatMessages === 'function') loadChatMessages(chatId);
      else if (window._openChatWith) window._openChatWith(chatId);
    });
  };
  /* hook existing chat renderers to add trash icons next to each message the current user sent */
  var _renderChat = window.renderChatMessages;
  window.renderChatMessages = function (chatId) {
    var r = _renderChat ? _renderChat.apply(this, arguments) : undefined;
    setTimeout(function () {
      var list = document.querySelector('#chatMessages, .chat-messages');
      if (!list || !user) return;
      list.querySelectorAll('.chat-message, .chat-msg').forEach(function (m) {
        if (m.dataset.delBound) return;
        var mine = m.dataset.mine === '1' || m.classList.contains('mine') || m.textContent.trim() === m.getAttribute('data-text');
        var id = m.dataset.id || m.getAttribute('data-id');
        if (!id || !mine) return;
        m.dataset.delBound = '1';
        var btn = document.createElement('button');
        btn.className = 'post-delete'; btn.style.marginLeft = 'auto';
        btn.innerHTML = '<i class="fas fa-trash"></i>';
        btn.onclick = function (e) { e.stopPropagation(); deleteChatMessage(id, chatId); };
        m.appendChild(btn);
      });
    }, 400);
    return r;
  };

  /* ═══════════════════════════════════════════════
     PART 5 — Edit / Delete church branding media (Discover)
     ═══════════════════════════════════════════════ */
  if (!g('editBrandingModal')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="editBrandingModal" onclick="if(event.target===this)closeModalDirect()">' +
      '<div class="modal" onclick="event.stopPropagation()">' +
      '<div class="modal-handle"></div>' +
      '<div class="modal-title">✏️ Edit / Remove Media</div>' +
      '<div class="form-group"><label class="form-label">Hero Image URL</label><input class="form-input" id="ebHero"></div>' +
      '<div class="form-group"><label class="form-label">Pastor Image URL</label><input class="form-input" id="ebPastor"></div>' +
      '<button class="btn btn-primary btn-block" onclick="saveBrandingMedia()"><i class="fas fa-save"></i> Save</button>' +
      '<button class="btn btn-danger btn-block" style="margin-top:6px" onclick="clearBrandingMedia()"><i class="fas fa-trash"></i> Remove All Media</button>' +
      '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button>' +
      '</div></div>');
  }
  window.openBrandingEditor = function () {
    if (!isAdmin()) return alert('🚫 Admin only.');
    sb.from('church_branding').select('*').limit(1).then(function (r) {
      var row = (r.data && r.data[0]) || {};
      window._brandingId = row.id || null;
      g('ebHero').value = row.hero_image || '';
      g('ebPastor').value = row.pastor_image || '';
      openModal('editBrandingModal');
    });
  };
  window.saveBrandingMedia = function () {
    if (!isAdmin()) return;
    var payload = { hero_image: g('ebHero').value.trim() || null, pastor_image: g('ebPastor').value.trim() || null };
    var p = window._brandingId
      ? sb.from('church_branding').update(payload).eq('id', window._brandingId)
      : sb.from('church_branding').insert([payload]);
    p.then(function (r) {
      if (r.error) return alert('⚠️ ' + r.error.message);
      alert('✅ Media saved'); closeModalDirect(); if (typeof renderPublicLanding === 'function') renderPublicLanding();
    });
  };
  window.clearBrandingMedia = function () {
    if (!isAdmin()) return;
    if (!confirm('Remove all uploaded church branding media?')) return;
    var payload = { hero_image: null, pastor_image: null };
    var p = window._brandingId
      ? sb.from('church_branding').update(payload).eq('id', window._brandingId)
      : sb.from('church_branding').insert([payload]);
    p.then(function () { alert('✅ Cleared'); closeModalDirect(); if (typeof renderPublicLanding === 'function') renderPublicLanding(); });
  };
  setInterval(function () {
    if (!isAdmin()) return;
    var b = document.querySelector('[onclick*="openChurchBranding"]');
    if (b && !b.dataset.brandBound) {
      b.dataset.brandBound = '1';
      var btn = document.createElement('button');
      btn.className = 'btn btn-warm btn-block btn-sm'; btn.style.marginTop = '6px';
      btn.innerHTML = '<i class="fas fa-image"></i> Edit / Remove Media';
      btn.onclick = openBrandingEditor;
      b.parentNode.insertBefore(btn, b.nextSibling);
    }
  }, 2500);

  /* ═══════════════════════════════════════════════
     PART 6 — Bulletproof Bible loader (Swahili + YLT fixed)
     ═══════════════════════════════════════════════ */
  var BOOKS20 = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];
  function bn(b) { if (/^\d+$/.test(String(b))) { var n = +b; if (n > 0 && n < 67) return n; } for (var i = 0; i < BOOKS20.length; i++)if (BOOKS20[i].toLowerCase() === String(b).toLowerCase()) return i + 1; return 1; }
  function safeJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text().then(function (t) {
        t = (t || '').trim();
        if (!t || (t.charAt(0) !== '{' && t.charAt(0) !== '[')) throw new Error('HTML');
        return JSON.parse(t);
      });
    });
  }
  function paint(out, d, tag) {
    window._bibleVerses = d.verses; window._selectedVerses = [];
    var h = '<div style="font-weight:700;color:#92400E;margin-bottom:8px">' + E(d.reference) + E(tag || '') + '</div>';
    d.verses.forEach(function (v) {
      h += '<div data-v="' + v.verse + '" onclick="toggleVerseHighlight(this,' + v.verse + ')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>' + v.verse + '</sup> ' + E(v.text) + '</div>';
    });
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

    // 1) own proxy first (never fails for valid book/chapter)
    var urls = ['/api/bible?translation=' + (isSw ? 'swahili' : code) + '&book=' + encodeURIComponent(book) + '&chapter=' + ch];
    // 2) direct source as backup
    urls.push(isSw ? 'https://api.getbible.net/v2/swahili/' + bn(book) + '/' + ch + '.json'
                   : 'https://bible-api.com/' + encodeURIComponent(book + ' ' + ch) + '?translation=' + code);

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
console.log('✝️ app17.js FINAL active — all fixes in one place');
