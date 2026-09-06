// public/app23.js
// Department section + replacement department weekly meetings
// Department section appears after Ushirika and before Groups.
// Old department meeting rendering is hidden/disabled.

(function () {
  console.log('✝️ app23.js loaded — Department section + new department meetings');

  window._dp23 = Object.assign(
    {
      myMemberships: [],
      departments: [],
      department: null,
      deptMembers: [],
      currentDepartmentId: null
    },
    window._dp23 || {}
  );

  window._dp23Media = window._dp23Media || {};

  const D = window._dp23;

  function sb() {
    return window.sb;
  }

  function dp23User() {
    return window.user;
  }

  function dp23IsAdmin() {
    return window.isAdmin ? window.isAdmin() : false;
  }

  function dp23Esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function dp23Initials(name) {
    if (window.ini) return window.ini(name);
    if (!name) return '?';
    return String(name)
      .split(' ')
      .map(function (x) { return x[0] || ''; })
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  function dp23Date(ts) {
    if (!ts) return '';
    if (window.fdate) return window.fdate(ts);
    return new Date(ts).toLocaleDateString();
  }

  function dp23Today() {
    return new Date().toISOString().slice(0, 10);
  }

  function dp23Error(msg) {
    return '<div class="card" style="color:#EF4444">' + dp23Esc(msg || 'Error') + '</div>';
  }

  function dp23MediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      return '<img src="' + url + '" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-top:8px">';
    }
    return '<a href="' + url + '" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:8px"><i class="fas fa-paperclip"></i> Media</a>';
  }

  async function dp23GetUsers() {
    if (window.usersData && window.usersData.length) return window.usersData;
    if (!sb()) return [];

    const { data, error } = await sb()
      .from('profiles')
      .select('id,name,profile_pic,role')
      .order('name');

    if (error) {
      console.error(error);
      return [];
    }

    window.usersData = data || [];
    return window.usersData;
  }

  async function dp23UploadMedia(file, path) {
    if (!file) return null;

    if (window.uploadMediaFile) {
      try {
        return await window.uploadMediaFile(file);
      } catch (e) {
        console.error(e);
      }
    }

    if (!sb()) return null;

    const fileName = (path || 'departments') + '/' + Date.now() + '_' + file.name;
    const { error } = await sb().storage.from('media').upload(fileName, file);

    if (error) {
      console.error(error);
      alert('Media upload failed. Check Supabase storage bucket "media".');
      return null;
    }

    const { data } = sb().storage.from('media').getPublicUrl(fileName);
    return data.publicUrl;
  }

  window.dp23AttachMedia = function (key, labelId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = function () {
      const file = input.files && input.files[0];
      if (!file) return;
      window._dp23Media[key] = file;
      const label = document.getElementById(labelId);
      if (label) {
        label.innerHTML = '<i class="fas fa-check-circle"></i> ' + dp23Esc(file.name);
      }
    };
    input.click();
  };

  window.dp23CloseModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  };

  // =====================================================
  // SECTION + NAV
  // =====================================================

  function dp23EnsureSection() {
    let sec = document.getElementById('section-dp23');
    if (sec) return sec;

    sec = document.createElement('div');
    sec.id = 'section-dp23';
    sec.className = 'section';
    sec.innerHTML = '<div id="dp23-root" class="sub-page active"></div>';

    const main = document.querySelector('main') || document.body;
    main.appendChild(sec);
    return sec;
  }

  function dp23ShowRoot(html) {
    const sec = dp23EnsureSection();

    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });

    sec.classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) {
      b.classList.remove('active');
    });

    const navBtn = document.getElementById('dp23NavBtn');
    if (navBtn) navBtn.classList.add('active');

    const root = document.getElementById('dp23-root');
    if (root) root.innerHTML = html;

    try {
      window.scrollTo({ top: 0 });
    } catch (e) {}
  }

  function dp23InjectNav() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav || document.getElementById('dp23NavBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'dp23NavBtn';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="fas fa-building"></i>Department';
    btn.onclick = function () {
      window.dp23OpenHome();
    };

    const navItems = Array.from(nav.querySelectorAll('.nav-item'));

    const groupsBtn =
      document.getElementById('ggNavBtn') ||
      navItems.find(function (b) {
        return /groups/i.test(b.textContent || '');
      });

    const ushirikaBtn = navItems.find(function (b) {
      return /ushirika/i.test(b.textContent || '');
    });

    const discoverBtn = navItems.find(function (b) {
      return /discover/i.test(b.textContent || '');
    });

    if (groupsBtn) {
      nav.insertBefore(btn, groupsBtn);
    } else if (ushirikaBtn) {
      ushirikaBtn.after(btn);
    } else if (discoverBtn) {
      nav.insertBefore(btn, discoverBtn);
    } else {
      nav.appendChild(btn);
    }
  }

  window.dp23GoBackApp = function () {
    if (window.switchSection) window.switchSection('home');
  };

  // =====================================================
  // REMOVE / HIDE OLD DEPARTMENT WEEKLY MEETINGS
  // =====================================================

  function dp23AddHideCss() {
    if (document.getElementById('dp23HideOldDeptMeetings')) return;

    const style = document.createElement('style');
    style.id = 'dp23HideOldDeptMeetings';
    style.textContent = `
      #deptMeetings,
      #deptMeet,
      #dept-weekmeet,
      #deptWeekMeet,
      #deptWeekMeetings,
      [id*="deptMeet"],
      [id*="dept-meet"],
      [id*="dept_meet"],
      [class*="dept-meeting"],
      [class*="deptMeeting"],
      [class*="dept_weekmeet"] {
        display:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function dp23DisableOldMeetingFunctions() {
    const oldFns = [
      'loadDeptMeetings',
      'loadDeptMeetings9',
      'renderDeptMeetings',
      'renderDeptMeet9',
      'renderDeptWeekMeet9',
      'loadDeptWeekMeet9',
      'saveDeptMeeting',
      'saveDeptMeeting9',
      'updateDeptMeeting',
      'openDeptMeetingModal',
      'openDeptMeeting',
      'editDeptMeeting',
      'deleteDeptMeeting'
    ];

    oldFns.forEach(function (name) {
      const current = window[name];
      if (!current || !current._dp23Disabled) {
        const stub = function () {
          console.log('Old department meeting function disabled:', name);
          return Promise.resolve ? Promise.resolve() : undefined;
        };
        stub._dp23Disabled = true;
        window[name] = stub;
      }
    });
  }

  function dp23KillOldMeetingUI() {
    dp23AddHideCss();

    const containers = document.querySelectorAll('[id*="dept"], [class*="dept"], #section-department');

    containers.forEach(function (container) {
      if (!container) return;
      if (container.closest && container.closest('#section-dp23')) return;
      if (container.id === 'dp23NavBtn') return;

      const containerMeta =
        String(container.id || '') + ' ' +
        String(container.getAttribute ? container.getAttribute('class') || '' : '');

      // Hide old meeting containers/cards inside department areas
      container.querySelectorAll('[id*="meet"], [class*="meet"]').forEach(function (el) {
        if (el.closest && el.closest('#section-dp23')) return;

        const meta =
          String(el.id || '') + ' ' +
          String(el.getAttribute ? el.getAttribute('class') || '' : '') + ' ' +
          String(el.getAttribute ? el.getAttribute('onclick') || '' : '');

        if (/dept/i.test(meta) || /dept/i.test(containerMeta)) {
          el.style.display = 'none';
        }
      });

      // Hide old department meeting buttons/tabs
      container.querySelectorAll('button, .btn, .tab').forEach(function (el) {
        if (el.closest && el.closest('#section-dp23')) return;

        const onclick = String(el.getAttribute ? el.getAttribute('onclick') || '' : '');
        const text = String(el.textContent || '');

        if (
          /deptmeeting|savedeptmeeting|updatedeptmeeting|opendeptmeeting|deptmeet/i.test(onclick) ||
          (/dept/i.test(containerMeta) && /weekly meeting|meeting minutes|add meeting|update meeting/i.test(text)) ||
          (el.classList && el.classList.contains('tab') && /meetings?/i.test(text) && /dept/i.test(containerMeta))
        ) {
          el.style.display = 'none';
        }
      });
    });
  }

  dp23DisableOldMeetingFunctions();
  dp23KillOldMeetingUI();

  setInterval(dp23DisableOldMeetingFunctions, 3000);
  setInterval(dp23KillOldMeetingUI, 1500);

  // =====================================================
  // PERMISSIONS
  // =====================================================

  async function dp23LoadMyMemberships() {
    if (!dp23User() || !sb()) return;

    const { data, error } = await sb()
      .from('department_members')
      .select('*')
      .eq('user_id', dp23User().id);

    if (!error) D.myMemberships = data || [];
  }

  function dp23MyRole(departmentId) {
    const m = (D.myMemberships || []).find(function (x) {
      return x.department_id === departmentId;
    });
    return m ? String(m.role || 'Member').toLowerCase() : '';
  }

  function dp23IsMember(departmentId) {
    return (D.myMemberships || []).some(function (x) {
      return x.department_id === departmentId;
    });
  }

  function dp23CanManageMinutes(departmentId) {
    if (dp23IsAdmin()) return true;
    const r = dp23MyRole(departmentId);
    return ['leader', 'chairman', 'secretary'].includes(r);
  }

  function dp23CanManageMembers(departmentId) {
    if (dp23IsAdmin()) return true;
    const r = dp23MyRole(departmentId);
    return ['leader', 'chairman'].includes(r);
  }

  function dp23RoleOptions(selected) {
    const roles = ['Member', 'Leader', 'Chairman', 'Secretary', 'Treasurer'];
    const selectedLower = String(selected || '').toLowerCase();

    return roles
      .map(function (r) {
        const sel = r.toLowerCase() === selectedLower ? 'selected' : '';
        return '<option value="' + r + '" ' + sel + '>' + r + '</option>';
      })
      .join('');
  }

  function dp23UserOptions(users, selectedId, excludeIds) {
    excludeIds = excludeIds || [];

    return (users || [])
      .filter(function (u) {
        return excludeIds.indexOf(u.id) === -1;
      })
      .map(function (u) {
        const sel = u.id === selectedId ? 'selected' : '';
        return '<option value="' + u.id + '" ' + sel + '>' + dp23Esc(u.name || u.email || 'User') + '</option>';
      })
      .join('');
  }

  async function dp23RefreshDeptMembers() {
    if (!sb() || !D.currentDepartmentId) return;

    const { data } = await sb()
      .from('department_members')
      .select('*')
      .eq('department_id', D.currentDepartmentId);

    D.deptMembers = data || [];
    await dp23LoadMyMemberships();
  }

  // =====================================================
  // DEPARTMENT HOME
  // =====================================================

  window.dp23OpenHome = async function () {
    if (!dp23User()) return alert('Please log in first.');
    if (!sb()) return alert('Supabase not ready.');

    dp23ShowRoot('<div class="section-title-app">Departments</div><div class="card">Loading...</div>');

    await dp23LoadMyMemberships();

    const { data, error } = await sb()
      .from('departments')
      .select('*')
      .order('name');

    if (error) return dp23ShowRoot(dp23Error(error.message));

    D.departments = data || [];

    let html = '';
    html += '<button class="back-btn" onclick="dp23GoBackApp()"><i class="fas fa-arrow-left"></i> Back</button>';
    html += '<div class="section-title-app"><i class="fas fa-building"></i> Departments</div>';

    if (!D.departments.length) {
      html += '<div class="card">No departments found.</div>';
    }

    D.departments.forEach(function (d) {
      const mine = (D.myMemberships || []).find(function (m) {
        return m.department_id === d.id;
      });

      html += `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
            <div style="flex:1">
              <div style="font-weight:800;font-size:1.05rem">${dp23Esc(d.name)}</div>
              <div style="font-size:.85rem;color:var(--text-light)">${dp23Esc(d.description || 'Department')}</div>
              ${mine ? '<div style="font-size:.75rem;color:var(--accent);margin-top:4px"><i class="fas fa-check"></i> ' + dp23Esc(mine.role || 'Member') + '</div>' : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${(mine || dp23IsAdmin()) ? '<button class="btn btn-primary btn-sm" onclick="dp23OpenDepartment(\'' + d.id + '\')">Open</button>' : ''}
              ${!mine ? '<button class="btn btn-secondary btn-sm" onclick="dp23JoinDepartment(\'' + d.id + '\')">Join</button>' : ''}
            </div>
          </div>
        </div>
      `;
    });

    dp23ShowRoot(html);
  };

  window.dp23JoinDepartment = async function (departmentId) {
    if (!dp23User()) return alert('Please log in first.');

    const payload = {
      department_id: departmentId,
      user_id: dp23User().id,
      role: 'Member'
    };

    let { error } = await sb()
      .from('department_members')
      .upsert(payload, { onConflict: 'department_id,user_id' });

    if (error) {
      // Fallback if upsert conflict column is not accepted
      const insert = await sb()
        .from('department_members')
        .insert([payload]);

      if (insert.error) return alert(insert.error.message);
    }

    await dp23LoadMyMemberships();
    window.dp23OpenDepartment(departmentId);
  };

  window.dp23LeaveDepartment = async function (departmentId) {
    if (!dp23User()) return;
    if (!confirm('Leave this department?')) return;

    await sb()
      .from('department_members')
      .delete()
      .eq('department_id', departmentId)
      .eq('user_id', dp23User().id);

    await dp23LoadMyMemberships();
    window.dp23OpenHome();
  };

  // =====================================================
  // DEPARTMENT PAGE
  // =====================================================

  window.dp23OpenDepartment = async function (departmentId) {
    if (!dp23User()) return alert('Please log in first.');
    if (!sb()) return alert('Supabase not ready.');

    D.currentDepartmentId = departmentId;

    dp23ShowRoot('<div class="section-title-app">Department</div><div class="card">Loading...</div>');

    await dp23LoadMyMemberships();

    const { data: department, error } = await sb()
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .single();

    if (error || !department) return window.dp23OpenHome();

    D.department = department;

    const mine = (D.myMemberships || []).find(function (m) {
      return m.department_id === departmentId;
    });

    if (!mine && !dp23IsAdmin()) {
      dp23ShowRoot(`
        <button class="back-btn" onclick="dp23OpenHome()"><i class="fas fa-arrow-left"></i> Back</button>
        <div class="card">
          <div style="font-weight:800;font-size:1.2rem">${dp23Esc(department.name)}</div>
          <div style="color:var(--text-light);margin:8px 0">${dp23Esc(department.description || 'Department')}</div>
          <button class="btn btn-primary btn-block" onclick="dp23JoinDepartment('${department.id}')">
            <i class="fas fa-sign-in-alt"></i> Join Department
          </button>
        </div>
      `);
      return;
    }

    await dp23RefreshDeptMembers();

    const html = `
      <button class="back-btn" onclick="dp23OpenHome()"><i class="fas fa-arrow-left"></i> Back</button>

      <div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px">
        <div class="dept-icon" style="background:var(--gradient-dept)"><i class="fas fa-building"></i></div>
        <div>
          <div style="font-weight:800;font-size:1.2rem">${dp23Esc(department.name)}</div>
          <div style="font-size:.8rem;opacity:.9">${dp23Esc(department.description || 'Department')}</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        ${mine
          ? '<button class="btn btn-danger btn-sm" onclick="dp23LeaveDepartment(\'' + department.id + '\')"><i class="fas fa-sign-out-alt"></i> Leave</button>'
          : '<button class="btn btn-primary btn-sm" onclick="dp23JoinDepartment(\'' + department.id + '\')"><i class="fas fa-sign-in-alt"></i> Join</button>'
        }
      </div>

      <div class="tabs">
        <div class="tab active" id="dp23-tabbtn-meetings" onclick="dp23SwitchTab('meetings')">Meetings</div>
        <div class="tab" id="dp23-tabbtn-members" onclick="dp23SwitchTab('members')">Members</div>
      </div>

      <div id="dp23-tab-meetings" class="dp23-tab"></div>
      <div id="dp23-tab-members" class="dp23-tab" style="display:none"></div>
    `;

    dp23ShowRoot(html);
    window.dp23SwitchTab('meetings');
  };

  window.dp23SwitchTab = function (tab) {
    document.querySelectorAll('#dp23-root .tab').forEach(function (t) {
      t.classList.remove('active');
    });

    const btn = document.getElementById('dp23-tabbtn-' + tab);
    if (btn) btn.classList.add('active');

    ['meetings', 'members'].forEach(function (t) {
      const el = document.getElementById('dp23-tab-' + t);
      if (el) el.style.display = t === tab ? 'block' : 'none';
    });

    if (tab === 'meetings') dp23LoadMeetings();
    if (tab === 'members') dp23LoadMembers();
  };

  // =====================================================
  // MEETINGS
  // =====================================================

  async function dp23LoadMeetings() {
    const box = document.getElementById('dp23-tab-meetings');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    const canManage = dp23CanManageMinutes(D.currentDepartmentId);
    const isMember = dp23IsAdmin() || dp23IsMember(D.currentDepartmentId);

    const { data: meetings, error } = await sb()
      .from('department_meetings')
      .select('*')
      .eq('department_id', D.currentDepartmentId)
      .order('meeting_date', { ascending: false })
      .limit(50);

    if (error) {
      box.innerHTML = dp23Error(error.message);
      return;
    }

    let html = '';

    if (canManage) {
      html += `
        <button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="dp23MeetingModal()">
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
          <div style="font-weight:800">${dp23Esc(m.theme || 'Weekly Meeting')}</div>
          <div style="font-size:.85rem;color:var(--text-light);margin-top:4px">
            ${dp23Esc(m.meeting_date || '')} ${m.start_time ? '• ' + dp23Esc(m.start_time) : ''}
            ${m.end_time ? ' - ' + dp23Esc(m.end_time) : ''}
          </div>

          ${m.venue ? '<div style="font-size:.85rem;color:var(--text-light);margin-top:2px"><i class="fas fa-map-marker-alt"></i> ' + dp23Esc(m.venue) + '</div>' : ''}

          <div style="margin-top:8px;font-size:.9rem">
            <i class="fas fa-users"></i> Total present: ${dp23Esc(m.total_members_present || 0)}
          </div>

          <details style="margin-top:8px">
            <summary style="cursor:pointer;color:var(--primary);font-weight:600">View Minutes</summary>

            ${m.agenda ? '<div style="margin-top:8px"><b>Agenda</b><div style="white-space:pre-wrap">' + dp23Esc(m.agenda) + '</div></div>' : ''}
            ${m.members_present ? '<div style="margin-top:8px"><b>Members Present</b><div style="white-space:pre-wrap">' + dp23Esc(m.members_present) + '</div></div>' : ''}
            ${m.absent_with_apology ? '<div style="margin-top:8px"><b>Absent with Apology</b><div style="white-space:pre-wrap">' + dp23Esc(m.absent_with_apology) + '</div></div>' : ''}
            ${m.absent_without_apology ? '<div style="margin-top:8px"><b>Absent without Apology</b><div style="white-space:pre-wrap">' + dp23Esc(m.absent_without_apology) + '</div></div>' : ''}
            ${m.guests ? '<div style="margin-top:8px"><b>Guests</b><div>' + dp23Esc(m.guests) + '</div></div>' : ''}
            ${m.minutes ? '<div style="margin-top:8px"><b>Minutes</b><div style="white-space:pre-wrap">' + dp23Esc(m.minutes) + '</div></div>' : ''}

            ${dp23MediaHtml(m.media_url)}
          </details>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            ${isMember ? '<button class="btn btn-secondary btn-sm" onclick="dp23ApologyModal(\'' + m.id + '\')"><i class="fas fa-hand-paper"></i> Submit Apology</button>' : ''}
            ${canManage ? '<button class="btn btn-primary btn-sm" onclick="dp23MeetingModal(\'' + m.id + '\')"><i class="fas fa-edit"></i> Edit Meeting</button>' : ''}
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.dp23MeetingModal = async function (meetingId) {
    let m = {};

    if (meetingId) {
      const { data } = await sb()
        .from('department_meetings')
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
      <div class="modal-overlay show" id="dp23MeetingModal" style="display:flex" onclick="if(event.target===this)dp23CloseModal('dp23MeetingModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title">${meetingId ? '📝 Edit Department Meeting' : '📝 Add Department Meeting'}</div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="dp23MeetingDate" type="date" value="${dp23Esc(String(m.meeting_date || dp23Today()).slice(0, 10))}">
            </div>

            <div class="form-group">
              <label class="form-label">Day</label>
              <select class="form-select" id="dp23MeetingDay">
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
              <input class="form-input" id="dp23MeetingStart" type="time" value="${dp23Esc(m.start_time || '')}">
            </div>

            <div class="form-group">
              <label class="form-label">End</label>
              <input class="form-input" id="dp23MeetingEnd" type="time" value="${dp23Esc(m.end_time || '')}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Venue</label>
            <input class="form-input" id="dp23MeetingVenue" value="${dp23Esc(m.venue || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Theme</label>
            <input class="form-input" id="dp23MeetingTheme" value="${dp23Esc(m.theme || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Agenda</label>
            <textarea class="form-textarea" id="dp23MeetingAgenda" rows="5">${dp23Esc(m.agenda || defaultAgenda)}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Members Present</label>
            <textarea class="form-textarea" id="dp23MeetingPresent" rows="3" placeholder="One name per line">${dp23Esc(m.members_present || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Absent with Apology</label>
            <textarea class="form-textarea" id="dp23MeetingApology" rows="3" placeholder="Name - Reason">${dp23Esc(m.absent_with_apology || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Absent without Apology</label>
            <textarea class="form-textarea" id="dp23MeetingAbsent" rows="2">${dp23Esc(m.absent_without_apology || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Guests / Others in Attendance</label>
            <input class="form-input" id="dp23MeetingGuests" value="${dp23Esc(m.guests || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Minutes / Proceedings</label>
            <textarea class="form-textarea" id="dp23MeetingMinutes" rows="6">${dp23Esc(m.minutes || '')}</textarea>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Time Taken (mins)</label>
              <input class="form-input" id="dp23MeetingTimeTaken" type="number" value="${dp23Esc(m.time_taken_minutes || 0)}">
            </div>

            <div class="form-group">
              <label class="form-label">Total Members Present</label>
              <input class="form-input" id="dp23MeetingTotalPresent" type="number" value="${dp23Esc(m.total_members_present || 0)}">
            </div>
          </div>

          <div class="media-upload" id="dp23MeetingUpload" onclick="dp23AttachMedia('meeting','dp23MeetingUpload')">
            <i class="fas fa-cloud-upload-alt"></i><span>Upload media</span>
          </div>

          <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="dp23SaveMeeting('${meetingId || ''}')">
            <i class="fas fa-save"></i> Save Meeting
          </button>

          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="dp23CloseModal('dp23MeetingModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.dp23SaveMeeting = async function (meetingId) {
    const id = meetingId || null;

    const meeting_date = document.getElementById('dp23MeetingDate').value || dp23Today();
    const day = document.getElementById('dp23MeetingDay').value;
    const start_time = document.getElementById('dp23MeetingStart').value;
    const end_time = document.getElementById('dp23MeetingEnd').value;
    const venue = document.getElementById('dp23MeetingVenue').value.trim();
    const theme = document.getElementById('dp23MeetingTheme').value.trim();
    const agenda = document.getElementById('dp23MeetingAgenda').value.trim();
    const members_present = document.getElementById('dp23MeetingPresent').value.trim();
    const absent_with_apology = document.getElementById('dp23MeetingApology').value.trim();
    const absent_without_apology = document.getElementById('dp23MeetingAbsent').value.trim();
    const guests = document.getElementById('dp23MeetingGuests').value.trim();
    const minutes = document.getElementById('dp23MeetingMinutes').value.trim();
    const time_taken_minutes = parseInt(document.getElementById('dp23MeetingTimeTaken').value || '0', 10);

    let total_members_present = parseInt(document.getElementById('dp23MeetingTotalPresent').value, 10);

    if (isNaN(total_members_present)) {
      total_members_present = members_present
        ? members_present.split(/\n+/).filter(function (x) { return x.trim(); }).length
        : 0;
    }

    const file = window._dp23Media.meeting;
    let media_url = null;

    if (file) media_url = await dp23UploadMedia(file, 'department-meetings');

    const payload = {
      department_id: D.currentDepartmentId,
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
      const { error } = await sb()
        .from('department_meetings')
        .update(payload)
        .eq('id', id);

      if (error) return alert(error.message);
    } else {
      payload.created_by = dp23User().id;

      const { error } = await sb()
        .from('department_meetings')
        .insert([payload]);

      if (error) return alert(error.message);
    }

    window._dp23Media.meeting = null;
    dp23CloseModal('dp23MeetingModal');
    dp23LoadMeetings();
  };

  window.dp23ApologyModal = function (meetingId) {
    if (!dp23User()) return alert('Please log in first.');

    const html = `
      <div class="modal-overlay show" id="dp23ApologyModal" style="display:flex" onclick="if(event.target===this)dp23CloseModal('dp23ApologyModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title">🙏 Absent with Apology</div>

          <div class="form-group">
            <label class="form-label">Reason for Absence</label>
            <textarea class="form-textarea" id="dp23ApologyReason" rows="4" placeholder="State reason..."></textarea>
          </div>

          <button class="btn btn-primary btn-block" onclick="dp23SaveApology('${meetingId}')">
            <i class="fas fa-paper-plane"></i> Submit Apology
          </button>

          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="dp23CloseModal('dp23ApologyModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.dp23SaveApology = async function (meetingId) {
    const reason = document.getElementById('dp23ApologyReason').value.trim();
    if (!reason) return alert('Please enter a reason.');

    const name = (window.profile && window.profile.name) || 'Member';
    const entry = name + ': ' + reason;

    const { data: meeting } = await sb()
      .from('department_meetings')
      .select('absent_with_apology')
      .eq('id', meetingId)
      .single();

    const current = (meeting && meeting.absent_with_apology) || '';
    const updated = current ? current + '\n' + entry : entry;

    await sb()
      .from('department_meetings')
      .update({ absent_with_apology: updated })
      .eq('id', meetingId);

    await sb()
      .from('department_meeting_attendance')
      .insert([{
        meeting_id: meetingId,
        user_id: dp23User().id,
        status: 'absent_with_apology',
        reason: reason
      }]);

    dp23CloseModal('dp23ApologyModal');
    alert('Apology submitted.');
    dp23LoadMeetings();
  };

  // =====================================================
  // MEMBERS
  // =====================================================

  async function dp23LoadMembers() {
    const box = document.getElementById('dp23-tab-members');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    await dp23RefreshDeptMembers();

    const users = await dp23GetUsers();
    const canManage = dp23CanManageMembers(D.currentDepartmentId);

    let html = '';

    if (canManage) {
      html += `
        <button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="dp23AddMemberModal()">
          <i class="fas fa-user-plus"></i> Add Member
        </button>
      `;
    }

    if (!D.deptMembers.length) {
      html += '<div class="card">No members yet.</div>';
    }

    D.deptMembers.forEach(function (m) {
      const u = users.find(function (x) {
        return x.id === m.user_id;
      });

      const isSelf = dp23User() && m.user_id === dp23User().id;

      html += `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;gap:10px;align-items:center">
            <div class="post-avatar">${dp23Initials(u && u.name)}</div>
            <div style="flex:1">
              <div style="font-weight:700">${dp23Esc((u && u.name) || 'Member')}</div>
              <div style="font-size:.75rem;color:var(--text-light)">${dp23Esc(m.role || 'Member')}</div>
            </div>
          </div>

          ${canManage && !isSelf ? `
            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
              <select class="form-select" onchange="dp23ChangeMemberRole('${m.id}', this.value)">
                ${dp23RoleOptions(m.role)}
              </select>
              <button class="btn btn-danger btn-sm" onclick="dp23RemoveMember('${m.id}')"><i class="fas fa-trash"></i></button>
            </div>
          ` : ''}
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.dp23AddMemberModal = async function () {
    const users = await dp23GetUsers();

    const existingIds = D.deptMembers.map(function (m) {
      return m.user_id;
    });

    const html = `
      <div class="modal-overlay show" id="dp23AddMemberModal" style="display:flex" onclick="if(event.target===this)dp23CloseModal('dp23AddMemberModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title"><i class="fas fa-user-plus"></i> Add Member</div>

          <div class="form-group">
            <label class="form-label">Member</label>
            <select class="form-select" id="dp23AddMemberUser">
              <option value="">Select member</option>
              ${dp23UserOptions(users, null, existingIds)}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select" id="dp23AddMemberRole">
              ${dp23RoleOptions('Member')}
            </select>
          </div>

          <button class="btn btn-primary btn-block" onclick="dp23SaveNewMember()"><i class="fas fa-save"></i> Add</button>
          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="dp23CloseModal('dp23AddMemberModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.dp23SaveNewMember = async function () {
    const user_id = document.getElementById('dp23AddMemberUser').value;
    const role = document.getElementById('dp23AddMemberRole').value;

    if (!user_id) return alert('Select a member.');

    const payload = {
      department_id: D.currentDepartmentId,
      user_id: user_id,
      role: role
    };

    let { error } = await sb()
      .from('department_members')
      .upsert(payload, { onConflict: 'department_id,user_id' });

    if (error) {
      const insert = await sb()
        .from('department_members')
        .insert([payload]);

      if (insert.error) return alert(insert.error.message);
    }

    dp23CloseModal('dp23AddMemberModal');
    dp23LoadMembers();
  };

  window.dp23ChangeMemberRole = async function (memberId, role) {
    const { error } = await sb()
      .from('department_members')
      .update({ role: role })
      .eq('id', memberId);

    if (error) return alert(error.message);

    await dp23RefreshDeptMembers();
    dp23LoadMembers();
  };

  window.dp23RemoveMember = async function (memberId) {
    if (!confirm('Remove this member?')) return;

    const { error } = await sb()
      .from('department_members')
      .delete()
      .eq('id', memberId);

    if (error) return alert(error.message);

    await dp23RefreshDeptMembers();
    dp23LoadMembers();
  };

  // =====================================================
  // INIT
  // =====================================================

  dp23InjectNav();
  setInterval(dp23InjectNav, 1000);
})();
