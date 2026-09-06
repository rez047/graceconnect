// public/app25.js
// Adds:
// 1. Service countdown timer under each service card: days, hours, minutes, seconds
// 2. New Ushirika meeting module

(function () {
  console.log('✝️ app25.js loaded — Service timer + Ushirika meetings');

  // =====================================================
  // SERVICE TIMER
  // =====================================================

  function u43InjectServiceTimers() {
    const cards = document.querySelectorAll('.service-card');

    cards.forEach(function (card) {
      if (card.querySelector('.u43-service-timer')) return;

      const timer = document.createElement('div');
      timer.className = 'u43-service-timer';
      timer.style.cssText =
        'margin-top:10px;padding:8px;border-radius:10px;background:rgba(79,70,229,.08);color:var(--primary);font-weight:800;text-align:center;font-size:.95rem;';
      timer.innerHTML = 'Calculating...';

      card.appendChild(timer);
    });
  }

  function u43ParseTimeToMinutes(timeStr) {
    if (!timeStr) return null;

    const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  function u43GetNextStart(dayName, startStr, now) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(String(dayName).trim());
    if (targetDay === -1) return null;

    const startMins = u43ParseTimeToMinutes(startStr);
    if (startMins === null) return null;

    const nowDay = now.getDay();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let daysUntil = targetDay - nowDay;

    if (daysUntil < 0 || (daysUntil === 0 && nowMins > startMins)) {
      daysUntil += 7;
    }

    const next = new Date(now);
    next.setDate(now.getDate() + daysUntil);
    next.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);

    return next;
  }

  function u43IsLive(dayName, startStr, endStr, now) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(String(dayName).trim());
    if (targetDay === -1) return false;

    const startMins = u43ParseTimeToMinutes(startStr);
    const endMins = u43ParseTimeToMinutes(endStr || startStr);

    if (startMins === null || endMins === null) return false;

    const today = now.getDay();
    const yesterday = (today + 6) % 7;
    const nowMins = now.getHours() * 60 + now.getMinutes();

    // Same-day service
    if (endMins > startMins) {
      return today === targetDay && nowMins >= startMins && nowMins <= endMins;
    }

    // Crosses midnight, example: 9:00 PM - 12:00 AM
    return (
      (today === targetDay && nowMins >= startMins) ||
      (yesterday === targetDay && nowMins <= endMins)
    );
  }

  function u43FormatCountdown(ms) {
    if (ms <= 0) return '0d 0h 0m 0s';

    const totalSeconds = Math.floor(ms / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
  }

  function u43UpdateServiceTimers() {
    const now = new Date();

    document.querySelectorAll('.service-card').forEach(function (card) {
      const timer = card.querySelector('.u43-service-timer');
      if (!timer) return;

      const dayEl = card.querySelector('.service-day');
      const timeEl = card.querySelector('.service-time');

      if (!dayEl || !timeEl) return;

      const dayName = dayEl.textContent.trim();
      const timeText = timeEl.textContent.trim();

      const parts = timeText.split('-').map(function (x) {
        return x.trim();
      });

      if (!parts.length) return;

      const startTime = parts[0];
      const endTime = parts[1] || parts[0];

      if (u43IsLive(dayName, startTime, endTime, now)) {
        timer.innerHTML = '<span style="color:#EF4444"><i class="fas fa-circle"></i> LIVE NOW</span>';
        return;
      }

      const nextStart = u43GetNextStart(dayName, startTime, now);
      if (!nextStart) {
        timer.textContent = '—';
        return;
      }

      const diff = nextStart.getTime() - now.getTime();

      if (diff <= 0) {
        timer.innerHTML = '<span style="color:#EF4444"><i class="fas fa-circle"></i> LIVE NOW</span>';
      } else {
        timer.innerHTML = '<i class="fas fa-clock"></i> Starts in: ' + u43FormatCountdown(diff);
      }
    });
  }

  u43InjectServiceTimers();
  u43UpdateServiceTimers();

  setInterval(u43InjectServiceTimers, 2000);
  setInterval(u43UpdateServiceTimers, 1000);

  // =====================================================
  // USHIRIKA NEW MEETING MODULE
  // =====================================================

  window._u43 = Object.assign(
    {
      myMemberships: [],
      ushirikas: [],
      ushirika: null,
      currentUshirikaId: null
    },
    window._u43 || {}
  );

  window._u43Media = window._u43Media || {};

  const U = window._u43;

  function u43Sb() {
    return window.sb;
  }

  function u43User() {
    return window.user;
  }

  function u43IsAdmin() {
    return window.isAdmin ? window.isAdmin() : false;
  }

  function u43Esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function u43Date(ts) {
    if (!ts) return '';
    if (window.fdate) return window.fdate(ts);
    return new Date(ts).toLocaleDateString();
  }

  function u43Today() {
    return new Date().toISOString().slice(0, 10);
  }

  function u43Error(msg) {
    return '<div class="card" style="color:#EF4444">' + u43Esc(msg || 'Error') + '</div>';
  }

  function u43MediaHtml(url) {
    if (!url) return '';

    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      return '<img src="' + url + '" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-top:8px">';
    }

    return '<a href="' + url + '" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:8px"><i class="fas fa-paperclip"></i> Media</a>';
  }

  async function u43UploadMedia(file, path) {
    if (!file) return null;

    if (window.uploadMediaFile) {
      try {
        return await window.uploadMediaFile(file);
      } catch (e) {
        console.error(e);
      }
    }

    if (!u43Sb()) return null;

    const fileName = (path || 'ushirika') + '/' + Date.now() + '_' + file.name;

    const { error } = await u43Sb()
      .storage
      .from('media')
      .upload(fileName, file);

    if (error) {
      console.error(error);
      alert('Media upload failed. Check Supabase storage bucket "media".');
      return null;
    }

    const { data } = u43Sb()
      .storage
      .from('media')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  window.u43AttachMedia = function (key, labelId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';

    input.onchange = function () {
      const file = input.files && input.files[0];
      if (!file) return;

      window._u43Media[key] = file;

      const label = document.getElementById(labelId);
      if (label) {
        label.innerHTML = '<i class="fas fa-check-circle"></i> ' + u43Esc(file.name);
      }
    };

    input.click();
  };

  window.u43CloseModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  };

  function u43CurrentUshirikaId() {
    return (
      window._curUshForumId ||
      window.currentUshId ||
      window.currentUshirikaId ||
      U.currentUshirikaId ||
      null
    );
  }

  // =====================================================
  // HIDE OLD USHIRIKA MEETING UI
  // =====================================================

  function u43AddHideCss() {
    if (document.getElementById('u43HideOldUshMeetings')) return;

    const style = document.createElement('style');
    style.id = 'u43HideOldUshMeetings';
    style.textContent = `
      #ushMeetingModal,
      #ushMeetings,
      #ushMeet,
      [id*="ushMeet"],
      [id*="ush-meet"],
      [id*="ush_meet"],
      [class*="ush-meeting"],
      [class*="ushMeeting"] {
        display:none !important;
      }
    `;

    document.head.appendChild(style);
  }

  function u43DisableOldMeetingFunctions() {
    const oldFns = [
      'loadUshMeeting',
      'loadUshMeetings',
      'loadUshMeeting9',
      'renderUshMeetings',
      'renderUshMeet9',
      'saveUshMeeting',
      'saveUshMeeting9',
      'updateUshMeeting',
      'openUshMeetingModal',
      'editUshMeeting',
      'saveUshMeetingMinutes'
    ];

    oldFns.forEach(function (name) {
      const current = window[name];

      if (!current || !current._u43Disabled) {
        const stub = function () {
          console.log('Old Ushirika meeting function disabled:', name);
          return Promise.resolve ? Promise.resolve() : undefined;
        };

        stub._u43Disabled = true;
        window[name] = stub;
      }
    });
  }

  function u43KillOldMeetingUI() {
    u43AddHideCss();

    const containers = document.querySelectorAll('[id*="ush"], [class*="ush"], #section-ushirika');

    containers.forEach(function (container) {
      if (!container) return;
      if (container.closest && container.closest('#section-u43-meetings')) return;
      if (container.id === 'u43OpenMeetingsBtn') return;

      const containerMeta =
        String(container.id || '') + ' ' +
        String(container.getAttribute ? container.getAttribute('class') || '' : '');

      container.querySelectorAll('[id*="meet"], [class*="meet"]').forEach(function (el) {
        if (el.closest && el.closest('#section-u43-meetings')) return;
        if (el.id === 'u43OpenMeetingsBtn') return;

        const meta =
          String(el.id || '') + ' ' +
          String(el.getAttribute ? el.getAttribute('class') || '' : '') + ' ' +
          String(el.getAttribute ? el.getAttribute('onclick') || '' : '');

        if (/ush/i.test(meta) || /ush/i.test(containerMeta)) {
          el.style.display = 'none';
        }
      });

      container.querySelectorAll('button, .btn, .tab').forEach(function (el) {
        if (el.id === 'u43OpenMeetingsBtn') return;
        if (el.closest && el.closest('#section-u43-meetings')) return;

        const onclick = String(el.getAttribute ? el.getAttribute('onclick') || '' : '');
        const text = String(el.textContent || '');

        if (
          /ushmeeting|saveushmeeting|updateushmeeting|openushmeeting|ushmeet/i.test(onclick) ||
          (/ush/i.test(containerMeta) && /weekly meeting|meeting minutes|add meeting|update meeting/i.test(text))
        ) {
          el.style.display = 'none';
        }
      });
    });
  }

  // =====================================================
  // SECTION
  // =====================================================

  function u43EnsureSection() {
    let sec = document.getElementById('section-u43-meetings');
    if (sec) return sec;

    sec = document.createElement('div');
    sec.id = 'section-u43-meetings';
    sec.className = 'section';
    sec.innerHTML = '<div id="u43-root" class="sub-page active"></div>';

    const main = document.querySelector('main') || document.body;
    main.appendChild(sec);

    return sec;
  }

  function u43ShowRoot(html) {
    const sec = u43EnsureSection();

    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });

    sec.classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) {
      b.classList.remove('active');
    });

    const ushBtn = Array.from(document.querySelectorAll('.bottom-nav .nav-item')).find(function (b) {
      return /ushirika/i.test(b.textContent || '');
    });

    if (ushBtn) ushBtn.classList.add('active');

    const root = document.getElementById('u43-root');
    if (root) root.innerHTML = html;

    try {
      window.scrollTo({ top: 0 });
    } catch (e) {}
  }

  window.u43BackToUshirika = function () {
    if (window.switchSection) {
      window.switchSection('ushirika');
    } else {
      window.history.back();
    }
  };

  // =====================================================
  // INJECT BUTTON INTO USHIRIKA
  // =====================================================

  function u43InjectUshirikaButton() {
    if (document.getElementById('u43OpenMeetingsBtn')) return;

    const host =
      document.querySelector('#section-ushirika .sub-page.active') ||
      document.getElementById('section-ushirika') ||
      document.querySelector('[id*="ushirika"]');

    if (!host) return;
    if (host.closest && host.closest('#section-u43-meetings')) return;

    const btn = document.createElement('button');
    btn.id = 'u43OpenMeetingsBtn';
    btn.className = 'btn btn-primary btn-block';
    btn.style.marginBottom = '12px';
    btn.innerHTML = '<i class="fas fa-calendar-check"></i> Weekly Meetings / Minutes';
    btn.onclick = function () {
      window.u43OpenMeetings();
    };

    host.prepend(btn);
  }

  // =====================================================
  // PERMISSIONS
  // =====================================================

  async function u43LoadMyMemberships() {
    if (!u43User() || !u43Sb()) return;

    const { data, error } = await u43Sb()
      .from('ushirika_members')
      .select('*')
      .eq('user_id', u43User().id);

    if (!error) U.myMemberships = data || [];
  }

  function u43MyRole(ushirikaId) {
    const m = (U.myMemberships || []).find(function (x) {
      return x.ushirika_id === ushirikaId;
    });

    return m ? String(m.role || 'Member').toLowerCase() : '';
  }

  function u43IsMember(ushirikaId) {
    return (U.myMemberships || []).some(function (x) {
      return x.ushirika_id === ushirikaId;
    });
  }

  function u43CanManageMinutes(ushirikaId) {
    if (u43IsAdmin()) return true;

    const r = u43MyRole(ushirikaId);
    return ['leader', 'chairman', 'secretary'].includes(r);
  }

  // =====================================================
  // OPEN USHIRIKA MEETINGS
  // =====================================================

  window.u43OpenMeetings = async function () {
    if (!u43User()) return alert('Please log in first.');
    if (!u43Sb()) return alert('Supabase not ready.');

    u43ShowRoot('<div class="section-title-app">Ushirika Meetings</div><div class="card">Loading...</div>');

    await u43LoadMyMemberships();

    const current = u43CurrentUshirikaId();

    if (current) {
      U.currentUshirikaId = current;
      await u43RenderMeetingsPage();
    } else {
      await u43RenderUshirikaList();
    }
  };

  async function u43RenderUshirikaList() {
    const { data, error } = await u43Sb()
      .from('ushirikas')
      .select('*')
      .order('name');

    if (error) {
      u43ShowRoot(u43Error(error.message));
      return;
    }

    U.ushirikas = data || [];

    let html = '';
    html += '<button class="back-btn" onclick="u43BackToUshirika()"><i class="fas fa-arrow-left"></i> Back</button>';
    html += '<div class="section-title-app"><i class="fas fa-people-group"></i> Choose Ushirika</div>';

    if (!U.ushirikas.length) {
      html += '<div class="card">No ushirikas found.</div>';
    }

    U.ushirikas.forEach(function (u) {
      html += `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <div>
              <div style="font-weight:800">${u43Esc(u.name)}</div>
              <div style="font-size:.85rem;color:var(--text-light)">${u43Esc(u.location || 'Ushirika')}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="u43SelectUshirika('${u.id}')">Open Meetings</button>
          </div>
        </div>
      `;
    });

    u43ShowRoot(html);
  }

  window.u43SelectUshirika = async function (ushirikaId) {
    U.currentUshirikaId = ushirikaId;
    window._curUshForumId = ushirikaId;

    u43ShowRoot('<div class="section-title-app">Ushirika Meetings</div><div class="card">Loading...</div>');

    await u43LoadMyMemberships();
    await u43RenderMeetingsPage();
  };

  async function u43RenderMeetingsPage() {
    const ushirikaId = U.currentUshirikaId;

    const { data: ushirika, error } = await u43Sb()
      .from('ushirikas')
      .select('*')
      .eq('id', ushirikaId)
      .single();

    if (error || !ushirika) {
      await u43RenderUshirikaList();
      return;
    }

    U.ushirika = ushirika;

    const mine = u43IsMember(ushirikaId);

    if (!mine && !u43IsAdmin()) {
      u43ShowRoot(`
        <button class="back-btn" onclick="u43BackToUshirika()"><i class="fas fa-arrow-left"></i> Back</button>
        <div class="card">
          <div style="font-weight:800;font-size:1.2rem">${u43Esc(ushirika.name)}</div>
          <div style="color:var(--text-light);margin:8px 0">${u43Esc(ushirika.location || 'Ushirika')}</div>
          <button class="btn btn-primary btn-block" onclick="u43JoinUshirika('${ushirika.id}')">
            <i class="fas fa-sign-in-alt"></i> Join Ushirika
          </button>
        </div>
      `);
      return;
    }

    u43ShowRoot(`
      <button class="back-btn" onclick="u43BackToUshirika()"><i class="fas fa-arrow-left"></i> Back</button>

      <div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px">
        <div class="dept-icon" style="background:var(--gradient-chat)"><i class="fas fa-people-group"></i></div>
        <div>
          <div style="font-weight:800;font-size:1.2rem">${u43Esc(ushirika.name)}</div>
          <div style="font-size:.8rem;opacity:.9">${u43Esc(ushirika.location || 'Ushirika')}</div>
        </div>
      </div>

      <div id="u43MeetingsList"></div>
    `);

    await u43LoadMeetings();
  }

  window.u43JoinUshirika = async function (ushirikaId) {
    if (!u43User()) return alert('Please log in first.');

    const payload = {
      ushirika_id: ushirikaId,
      user_id: u43User().id,
      role: 'Member'
    };

    let { error } = await u43Sb()
      .from('ushirika_members')
      .upsert(payload, { onConflict: 'ushirika_id,user_id' });

    if (error) {
      const insert = await u43Sb()
        .from('ushirika_members')
        .insert([payload]);

      if (insert.error) return alert(insert.error.message);
    }

    await u43LoadMyMemberships();
    await u43SelectUshirika(ushirikaId);
  };

  // =====================================================
  // MEETINGS LIST
  // =====================================================

  async function u43LoadMeetings() {
    const box = document.getElementById('u43MeetingsList');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    const canManage = u43CanManageMinutes(U.currentUshirikaId);
    const isMember = u43IsAdmin() || u43IsMember(U.currentUshirikaId);

    const { data: meetings, error } = await u43Sb()
      .from('ushirika_meetings')
      .select('*')
      .eq('ushirika_id', U.currentUshirikaId)
      .order('meeting_date', { ascending: false })
      .limit(50);

    if (error) {
      box.innerHTML = u43Error(error.message);
      return;
    }

    let html = '';

    if (canManage) {
      html += `
        <button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="u43MeetingModal()">
          <i class="fas fa-plus"></i> Add Weekly Meeting / Minutes
        </button>
      `;
    }

    if (!meetings || !meetings.length) {
      html += '<div class="card">No meetings yet.</div>';
    }

    (meetings || []).forEach(function (m) {
      html += `
        <div class="card" style="margin-bottom:12px">
          <div style="font-weight:800">${u43Esc(m.theme || 'Weekly Meeting')}</div>

          <div style="font-size:.85rem;color:var(--text-light);margin-top:4px">
            ${u43Esc(m.meeting_date || '')} ${m.start_time ? '• ' + u43Esc(m.start_time) : ''}
            ${m.end_time ? ' - ' + u43Esc(m.end_time) : ''}
          </div>

          ${m.venue ? '<div style="font-size:.85rem;color:var(--text-light);margin-top:2px"><i class="fas fa-map-marker-alt"></i> ' + u43Esc(m.venue) + '</div>' : ''}

          <div style="margin-top:8px;font-size:.9rem">
            <i class="fas fa-users"></i> Total present: ${u43Esc(m.total_members_present || 0)}
          </div>

          <details style="margin-top:8px">
            <summary style="cursor:pointer;color:var(--primary);font-weight:600">View Minutes</summary>

            ${m.agenda ? '<div style="margin-top:8px"><b>Agenda</b><div style="white-space:pre-wrap">' + u43Esc(m.agenda) + '</div></div>' : ''}
            ${m.members_present ? '<div style="margin-top:8px"><b>Members Present</b><div style="white-space:pre-wrap">' + u43Esc(m.members_present) + '</div></div>' : ''}
            ${m.absent_with_apology ? '<div style="margin-top:8px"><b>Absent with Apology</b><div style="white-space:pre-wrap">' + u43Esc(m.absent_with_apology) + '</div></div>' : ''}
            ${m.absent_without_apology ? '<div style="margin-top:8px"><b>Absent without Apology</b><div style="white-space:pre-wrap">' + u43Esc(m.absent_without_apology) + '</div></div>' : ''}
            ${m.guests ? '<div style="margin-top:8px"><b>Guests</b><div>' + u43Esc(m.guests) + '</div></div>' : ''}
            ${m.minutes ? '<div style="margin-top:8px"><b>Minutes</b><div style="white-space:pre-wrap">' + u43Esc(m.minutes) + '</div></div>' : ''}

            ${u43MediaHtml(m.media_url)}
          </details>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            ${isMember ? '<button class="btn btn-secondary btn-sm" onclick="u43ApologyModal(\'' + m.id + '\')"><i class="fas fa-hand-paper"></i> Submit Apology</button>' : ''}
            ${canManage ? '<button class="btn btn-primary btn-sm" onclick="u43MeetingModal(\'' + m.id + '\')"><i class="fas fa-edit"></i> Edit Meeting</button>' : ''}
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  }

  // =====================================================
  // MEETING MODAL
  // =====================================================

  window.u43MeetingModal = async function (meetingId) {
    if (!u43CanManageMinutes(U.currentUshirikaId)) {
      return alert('Only Admin, Leader, Chairman, or Secretary can manage meetings.');
    }

    let m = {};

    if (meetingId) {
      const { data } = await u43Sb()
        .from('ushirika_meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (data) m = data;
    }

    const defaultAgenda = [
      '1. Call to Order & Opening Prayer',
      '2. Reading & Approval of Previous Minutes',
      '3. Matters Arising',
      '4. New Business',
      '5. Any Other Business (AOB)',
      '6. Adjournment & Closing Prayer'
    ].join('\n');

    const html = `
      <div class="modal-overlay show" id="u43MeetingModal" style="display:flex" onclick="if(event.target===this)u43CloseModal('u43MeetingModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title">${meetingId ? '📝 Edit Ushirika Meeting' : '📝 Add Ushirika Meeting'}</div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="u43MeetingDate" type="date" value="${u43Esc(String(m.meeting_date || u43Today()).slice(0, 10))}">
            </div>

            <div class="form-group">
              <label class="form-label">Day</label>
              <select class="form-select" id="u43MeetingDay">
                ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                  .map(function (d) {
                    return '<option value="' + d + '" ' + (m.day === d ? 'selected' : '') + '>' + d + '</option>';
                  })
                  .join('')}
              </select>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Start</label>
              <input class="form-input" id="u43MeetingStart" type="time" value="${u43Esc(m.start_time || '')}">
            </div>

            <div class="form-group">
              <label class="form-label">End</label>
              <input class="form-input" id="u43MeetingEnd" type="time" value="${u43Esc(m.end_time || '')}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Venue</label>
            <input class="form-input" id="u43MeetingVenue" value="${u43Esc(m.venue || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Theme</label>
            <input class="form-input" id="u43MeetingTheme" value="${u43Esc(m.theme || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Agenda</label>
            <textarea class="form-textarea" id="u43MeetingAgenda" rows="5">${u43Esc(m.agenda || defaultAgenda)}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Members Present</label>
            <textarea class="form-textarea" id="u43MeetingPresent" rows="3" placeholder="One name per line">${u43Esc(m.members_present || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Absent with Apology</label>
            <textarea class="form-textarea" id="u43MeetingApology" rows="3" placeholder="Name - Reason">${u43Esc(m.absent_with_apology || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Absent without Apology</label>
            <textarea class="form-textarea" id="u43MeetingAbsent" rows="2">${u43Esc(m.absent_without_apology || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Guests / Others in Attendance</label>
            <input class="form-input" id="u43MeetingGuests" value="${u43Esc(m.guests || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Minutes / Proceedings</label>
            <textarea class="form-textarea" id="u43MeetingMinutes" rows="6">${u43Esc(m.minutes || '')}</textarea>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Time Taken (mins)</label>
              <input class="form-input" id="u43MeetingTimeTaken" type="number" value="${u43Esc(m.time_taken_minutes || 0)}">
            </div>

            <div class="form-group">
              <label class="form-label">Total Members Present</label>
              <input class="form-input" id="u43MeetingTotalPresent" type="number" value="${u43Esc(m.total_members_present || 0)}">
            </div>
          </div>

          <div class="media-upload" id="u43MeetingUpload" onclick="u43AttachMedia('meeting','u43MeetingUpload')">
            <i class="fas fa-cloud-upload-alt"></i><span>Upload media</span>
          </div>

          <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="u43SaveMeeting('${meetingId || ''}')">
            <i class="fas fa-save"></i> Save Meeting
          </button>

          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="u43CloseModal('u43MeetingModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.u43SaveMeeting = async function (meetingId) {
    const id = meetingId || null;

    const meeting_date = document.getElementById('u43MeetingDate').value || u43Today();
    const day = document.getElementById('u43MeetingDay').value;
    const start_time = document.getElementById('u43MeetingStart').value;
    const end_time = document.getElementById('u43MeetingEnd').value;
    const venue = document.getElementById('u43MeetingVenue').value.trim();
    const theme = document.getElementById('u43MeetingTheme').value.trim();
    const agenda = document.getElementById('u43MeetingAgenda').value.trim();
    const members_present = document.getElementById('u43MeetingPresent').value.trim();
    const absent_with_apology = document.getElementById('u43MeetingApology').value.trim();
    const absent_without_apology = document.getElementById('u43MeetingAbsent').value.trim();
    const guests = document.getElementById('u43MeetingGuests').value.trim();
    const minutes = document.getElementById('u43MeetingMinutes').value.trim();
    const time_taken_minutes = parseInt(document.getElementById('u43MeetingTimeTaken').value || '0', 10);

    let total_members_present = parseInt(document.getElementById('u43MeetingTotalPresent').value, 10);

    if (isNaN(total_members_present)) {
      total_members_present = members_present
        ? members_present.split(/\n+/).filter(function (x) { return x.trim(); }).length
        : 0;
    }

    const file = window._u43Media.meeting;
    let media_url = null;

    if (file) media_url = await u43UploadMedia(file, 'ushirika-meetings');

    const payload = {
      ushirika_id: U.currentUshirikaId,
      meeting_date: meeting_date,
      day: day,
      start_time: start_time,
      end_time: end_time,
      venue: venue,
      theme: theme,
      agenda: agenda,
      minutes: minutes,
      members_present: members_present,
      absent_with_apology: absent_with_apology,
      absent_without_apology: absent_without_apology,
      guests: guests,
      time_taken_minutes: time_taken_minutes,
      total_members_present: total_members_present
    };

    if (media_url) payload.media_url = media_url;

    if (id) {
      const { error } = await u43Sb()
        .from('ushirika_meetings')
        .update(payload)
        .eq('id', id);

      if (error) return alert(error.message);
    } else {
      payload.created_by = u43User().id;

      const { error } = await u43Sb()
        .from('ushirika_meetings')
        .insert([payload]);

      if (error) return alert(error.message);
    }

    window._u43Media.meeting = null;
    u43CloseModal('u43MeetingModal');
    u43LoadMeetings();
  };

  // =====================================================
  // APOLOGY
  // =====================================================

  window.u43ApologyModal = function (meetingId) {
    if (!u43User()) return alert('Please log in first.');

    const html = `
      <div class="modal-overlay show" id="u43ApologyModal" style="display:flex" onclick="if(event.target===this)u43CloseModal('u43ApologyModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title">🙏 Absent with Apology</div>

          <div class="form-group">
            <label class="form-label">Reason for Absence</label>
            <textarea class="form-textarea" id="u43ApologyReason" rows="4" placeholder="State reason..."></textarea>
          </div>

          <button class="btn btn-primary btn-block" onclick="u43SaveApology('${meetingId}')">
            <i class="fas fa-paper-plane"></i> Submit Apology
          </button>

          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="u43CloseModal('u43ApologyModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.u43SaveApology = async function (meetingId) {
    const reason = document.getElementById('u43ApologyReason').value.trim();
    if (!reason) return alert('Please enter a reason.');

    const name = (window.profile && window.profile.name) || 'Member';
    const entry = name + ': ' + reason;

    const { data: meeting } = await u43Sb()
      .from('ushirika_meetings')
      .select('absent_with_apology')
      .eq('id', meetingId)
      .single();

    const current = (meeting && meeting.absent_with_apology) || '';
    const updated = current ? current + '\n' + entry : entry;

    await u43Sb()
      .from('ushirika_meetings')
      .update({ absent_with_apology: updated })
      .eq('id', meetingId);

    await u43Sb()
      .from('ushirika_meeting_attendance')
      .insert([{
        meeting_id: meetingId,
        user_id: u43User().id,
        status: 'absent_with_apology',
        reason: reason
      }]);

    u43CloseModal('u43ApologyModal');
    alert('Apology submitted.');
    u43LoadMeetings();
  };

  // =====================================================
  // INIT
  // =====================================================

  function u43Init() {
    u43InjectServiceTimers();
    u43InjectUshirikaButton();
    u43DisableOldMeetingFunctions();
    u43KillOldMeetingUI();
  }

  u43Init();

  setInterval(u43InjectUshirikaButton, 1500);
  setInterval(u43DisableOldMeetingFunctions, 3000);
  setInterval(u43KillOldMeetingUI, 2000);
})();
