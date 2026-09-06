// public/app24.js
// Corrected Department section:
// - Department keeps Feed, Members, Leadership, Meetings
// - Only Department meeting module is replaced
// - Ushirika remains separate
// - Department admin functions are separate from Ushirika
// - Forum and Plans are moved/injected into Home where possible

(function () {
  console.log('✝️ app24.js loaded — Corrected Department section');

  window._d43 = Object.assign(
    {
      myMemberships: [],
      departments: [],
      department: null,
      deptMembers: [],
      currentDepartmentId: null
    },
    window._d43 || {}
  );

  window._d43Media = window._d43Media || {};

  const D = window._d43;

  function sb() {
    return window.sb;
  }

  function d43User() {
    return window.user;
  }

  function d43IsAdmin() {
    return window.isAdmin ? window.isAdmin() : false;
  }

  function d43Esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function d43Initials(name) {
    if (window.ini) return window.ini(name);
    if (!name) return '?';
    return String(name)
      .split(' ')
      .map(function (x) { return x[0] || ''; })
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  function d43Date(ts) {
    if (!ts) return '';
    if (window.fdate) return window.fdate(ts);
    return new Date(ts).toLocaleDateString();
  }

  function d43Today() {
    return new Date().toISOString().slice(0, 10);
  }

  function d43Error(msg) {
    return '<div class="card" style="color:#EF4444">' + d43Esc(msg || 'Error') + '</div>';
  }

  function d43MediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      return '<img src="' + url + '" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-top:8px">';
    }
    return '<a href="' + url + '" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:8px"><i class="fas fa-paperclip"></i> Media</a>';
  }

  async function d43GetUsers() {
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

  async function d43UploadMedia(file, path) {
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

  window.d43AttachMedia = function (key, labelId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = function () {
      const file = input.files && input.files[0];
      if (!file) return;
      window._d43Media[key] = file;
      const label = document.getElementById(labelId);
      if (label) {
        label.innerHTML = '<i class="fas fa-check-circle"></i> ' + d43Esc(file.name);
      }
    };
    input.click();
  };

  window.d43CloseModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  };

  // =====================================================
  // REMOVE OLD APP23 DEPARTMENT SHELL IF PRESENT
  // =====================================================

  function d43CleanupOldDepartmentShell() {
    ['dp23NavBtn', 'section-dp23'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  // =====================================================
  // SECTION + NAV
  // =====================================================

  function d43EnsureSection() {
    let sec = document.getElementById('section-d43-department');
    if (sec) return sec;

    sec = document.createElement('div');
    sec.id = 'section-d43-department';
    sec.className = 'section';
    sec.innerHTML = '<div id="d43-root" class="sub-page active"></div>';

    const main = document.querySelector('main') || document.body;
    main.appendChild(sec);
    return sec;
  }

  function d43ShowRoot(html) {
    const sec = d43EnsureSection();

    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });

    sec.classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) {
      b.classList.remove('active');
    });

    const navBtn = document.getElementById('d43NavBtn');
    if (navBtn) navBtn.classList.add('active');

    const root = document.getElementById('d43-root');
    if (root) root.innerHTML = html;

    try {
      window.scrollTo({ top: 0 });
    } catch (e) {}
  }

  function d43InjectNav() {
    d43CleanupOldDepartmentShell();

    const nav = document.querySelector('.bottom-nav');
    if (!nav || document.getElementById('d43NavBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'd43NavBtn';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="fas fa-building"></i>Department';
    btn.onclick = function () {
      window.d43OpenHome();
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

  window.d43GoBackApp = function () {
    if (window.switchSection) window.switchSection('home');
  };

  // =====================================================
  // MOVE / SURFACE FORUM + PLANS IN HOME
  // =====================================================

  function d43MoveForumAndPlansToHome() {
    const home =
      document.querySelector('#section-home') ||
      document.querySelector('#home-main') ||
      document.querySelector('.main-section');

    if (!home) return;

    const forumSelectors = [
      '#section-forum',
      '#forumSection',
      '#publicForum',
      '#section-public-forum',
      '#homeForumSection'
    ];

    const plansSelectors = [
      '#section-plans',
      '#plansSection',
      '#communityPlans',
      '#section-community-plans',
      '#homePlansSection'
    ];

    function moveExact(selectors) {
      for (let i = 0; i < selectors.length; i++) {
        const el = document.querySelector(selectors[i]);
        if (el && !home.contains(el)) {
          home.appendChild(el);
          el.style.display = 'block';
          return el;
        }
      }
      return null;
    }

    moveExact(forumSelectors);
    moveExact(plansSelectors);

    // If exact sections are not found, add safe shortcuts only once.
    if (!document.getElementById('d43HomeForumPlanShortcuts')) {
      const wrap = document.createElement('div');
      wrap.id = 'd43HomeForumPlanShortcuts';
      wrap.className = 'grid-2';
      wrap.style.marginBottom = '14px';
      wrap.innerHTML = `
        <button class="btn btn-primary btn-block" onclick="d43TryOpenForum()">
          <i class="fas fa-comments"></i> Public Forum
        </button>
        <button class="btn btn-secondary btn-block" onclick="d43TryOpenPlans()">
          <i class="fas fa-calendar-check"></i> Plans
        </button>
      `;

      const firstCard = home.querySelector('.card, .section-title-app');
      if (firstCard) {
        home.insertBefore(wrap, firstCard);
      } else {
        home.prepend(wrap);
      }
    }
  }

  window.d43TryOpenForum = function () {
    const candidates = ['forum', 'publicForum', 'public-forum', 'communityForum'];

    for (let i = 0; i < candidates.length; i++) {
      const el = document.getElementById(candidates[i]) || document.getElementById('section-' + candidates[i]);
      if (el) {
        document.querySelectorAll('.section').forEach(function (s) {
          s.classList.remove('active');
        });
        el.classList.add('active');
        return;
      }
    }

    if (window.switchSection) {
      window.switchSection('discover');
    }
  };

  window.d43TryOpenPlans = function () {
    const candidates = ['plans', 'communityPlans', 'community-plans', 'planSection'];

    for (let i = 0; i < candidates.length; i++) {
      const el = document.getElementById(candidates[i]) || document.getElementById('section-' + candidates[i]);
      if (el) {
        document.querySelectorAll('.section').forEach(function (s) {
          s.classList.remove('active');
        });
        el.classList.add('active');
        return;
      }
    }

    if (window.switchSection) {
      window.switchSection('discover');
    }
  };

  // =====================================================
  // HIDE OLD DEPARTMENT MEETING UI
  // =====================================================

  function d43AddHideCss() {
    if (document.getElementById('d43HideOldDeptMeetings')) return;

    const style = document.createElement('style');
    style.id = 'd43HideOldDeptMeetings';
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

  function d43DisableOldMeetingFunctions() {
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
      if (!current || !current._d43Disabled) {
        const stub = function () {
          console.log('Old department meeting function disabled:', name);
          return Promise.resolve ? Promise.resolve() : undefined;
        };
        stub._d43Disabled = true;
        window[name] = stub;
      }
    });
  }

  function d43KillOldMeetingUI() {
    d43AddHideCss();

    const containers = document.querySelectorAll('[id*="dept"], [class*="dept"], #section-department');

    containers.forEach(function (container) {
      if (!container) return;
      if (container.closest && container.closest('#section-d43-department')) return;
      if (container.id === 'd43NavBtn') return;

      const containerMeta =
        String(container.id || '') + ' ' +
        String(container.getAttribute ? container.getAttribute('class') || '' : '');

      container.querySelectorAll('[id*="meet"], [class*="meet"]').forEach(function (el) {
        if (el.closest && el.closest('#section-d43-department')) return;

        const meta =
          String(el.id || '') + ' ' +
          String(el.getAttribute ? el.getAttribute('class') || '' : '') + ' ' +
          String(el.getAttribute ? el.getAttribute('onclick') || '' : '');

        if (/dept/i.test(meta) || /dept/i.test(containerMeta)) {
          el.style.display = 'none';
        }
      });

      container.querySelectorAll('button, .btn, .tab').forEach(function (el) {
        if (el.closest && el.closest('#section-d43-department')) return;

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

  // =====================================================
  // PERMISSIONS
  // =====================================================

  async function d43LoadMyMemberships() {
    if (!d43User() || !sb()) return;

    const { data, error } = await sb()
      .from('department_members')
      .select('*')
      .eq('user_id', d43User().id);

    if (!error) D.myMemberships = data || [];
  }

  function d43MyRole(departmentId) {
    const m = (D.myMemberships || []).find(function (x) {
      return x.department_id === departmentId;
    });
    return m ? String(m.role || 'Member').toLowerCase() : '';
  }

  function d43IsMember(departmentId) {
    return (D.myMemberships || []).some(function (x) {
      return x.department_id === departmentId;
    });
  }

  function d43CanManageMembers(departmentId) {
    if (d43IsAdmin()) return true;
    const r = d43MyRole(departmentId);
    return ['leader', 'chairman'].includes(r);
  }

  function d43CanManageMinutes(departmentId) {
    if (d43IsAdmin()) return true;
    const r = d43MyRole(departmentId);
    return ['leader', 'chairman', 'secretary'].includes(r);
  }

  function d43RoleOptions(selected) {
    const roles = ['Member', 'Leader', 'Chairman', 'Secretary', 'Treasurer'];
    const selectedLower = String(selected || '').toLowerCase();

    return roles
      .map(function (r) {
        const sel = r.toLowerCase() === selectedLower ? 'selected' : '';
        return '<option value="' + r + '" ' + sel + '>' + r + '</option>';
      })
      .join('');
  }

  function d43UserOptions(users, selectedId, excludeIds) {
    excludeIds = excludeIds || [];

    return (users || [])
      .filter(function (u) {
        return excludeIds.indexOf(u.id) === -1;
      })
      .map(function (u) {
        const sel = u.id === selectedId ? 'selected' : '';
        return '<option value="' + u.id + '" ' + sel + '>' + d43Esc(u.name || u.email || 'User') + '</option>';
      })
      .join('');
  }

  async function d43RefreshDeptMembers() {
    if (!sb() || !D.currentDepartmentId) return;

    const { data } = await sb()
      .from('department_members')
      .select('*')
      .eq('department_id', D.currentDepartmentId);

    D.deptMembers = data || [];
    await d43LoadMyMemberships();
  }

  // =====================================================
  // DEPARTMENT HOME
  // =====================================================

  window.d43OpenHome = async function () {
    if (!d43User()) return alert('Please log in first.');
    if (!sb()) return alert('Supabase not ready.');

    d43ShowRoot('<div class="section-title-app">Departments</div><div class="card">Loading...</div>');

    await d43LoadMyMemberships();

    const { data, error } = await sb()
      .from('departments')
      .select('*')
      .order('name');

    if (error) return d43ShowRoot(d43Error(error.message));

    D.departments = data || [];

    let html = '';
    html += '<button class="back-btn" onclick="d43GoBackApp()"><i class="fas fa-arrow-left"></i> Back</button>';
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
              <div style="font-weight:800;font-size:1.05rem">${d43Esc(d.name)}</div>
              <div style="font-size:.85rem;color:var(--text-light)">${d43Esc(d.description || 'Department')}</div>
              ${mine ? '<div style="font-size:.75rem;color:var(--accent);margin-top:4px"><i class="fas fa-check"></i> ' + d43Esc(mine.role || 'Member') + '</div>' : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${(mine || d43IsAdmin()) ? '<button class="btn btn-primary btn-sm" onclick="d43OpenDepartment(\'' + d.id + '\')">Open</button>' : ''}
              ${!mine ? '<button class="btn btn-secondary btn-sm" onclick="d43JoinDepartment(\'' + d.id + '\')">Join</button>' : ''}
            </div>
          </div>
        </div>
      `;
    });

    d43ShowRoot(html);
  };

  window.d43JoinDepartment = async function (departmentId) {
    if (!d43User()) return alert('Please log in first.');

    const payload = {
      department_id: departmentId,
      user_id: d43User().id,
      role: 'Member'
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

    await d43LoadMyMemberships();
    window.d43OpenDepartment(departmentId);
  };

  window.d43LeaveDepartment = async function (departmentId) {
    if (!d43User()) return;
    if (!confirm('Leave this department?')) return;

    await sb()
      .from('department_members')
      .delete()
      .eq('department_id', departmentId)
      .eq('user_id', d43User().id);

    await d43LoadMyMemberships();
    window.d43OpenHome();
  };

  // =====================================================
  // DEPARTMENT PAGE
  // =====================================================

  window.d43OpenDepartment = async function (departmentId) {
    if (!d43User()) return alert('Please log in first.');
    if (!sb()) return alert('Supabase not ready.');

    D.currentDepartmentId = departmentId;

    d43ShowRoot('<div class="section-title-app">Department</div><div class="card">Loading...</div>');

    await d43LoadMyMemberships();

    const { data: department, error } = await sb()
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .single();

    if (error || !department) return window.d43OpenHome();

    D.department = department;

    const mine = (D.myMemberships || []).find(function (m) {
      return m.department_id === departmentId;
    });

    if (!mine && !d43IsAdmin()) {
      d43ShowRoot(`
        <button class="back-btn" onclick="d43OpenHome()"><i class="fas fa-arrow-left"></i> Back</button>
        <div class="card">
          <div style="font-weight:800;font-size:1.2rem">${d43Esc(department.name)}</div>
          <div style="color:var(--text-light);margin:8px 0">${d43Esc(department.description || 'Department')}</div>
          <button class="btn btn-primary btn-block" onclick="d43JoinDepartment('${department.id}')">
            <i class="fas fa-sign-in-alt"></i> Join Department
          </button>
        </div>
      `);
      return;
    }

    await d43RefreshDeptMembers();

    const html = `
      <button class="back-btn" onclick="d43OpenHome()"><i class="fas fa-arrow-left"></i> Back</button>

      <div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px">
        <div class="dept-icon" style="background:var(--gradient-dept)"><i class="fas fa-building"></i></div>
        <div>
          <div style="font-weight:800;font-size:1.2rem">${d43Esc(department.name)}</div>
          <div style="font-size:.8rem;opacity:.9">${d43Esc(department.description || 'Department')}</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        ${mine
          ? '<button class="btn btn-danger btn-sm" onclick="d43LeaveDepartment(\'' + department.id + '\')"><i class="fas fa-sign-out-alt"></i> Leave</button>'
          : '<button class="btn btn-primary btn-sm" onclick="d43JoinDepartment(\'' + department.id + '\')"><i class="fas fa-sign-in-alt"></i> Join</button>'
        }
      </div>

      <div class="tabs">
        <div class="tab active" id="d43-tabbtn-feed" onclick="d43SwitchTab('feed')">Feed</div>
        <div class="tab" id="d43-tabbtn-members" onclick="d43SwitchTab('members')">Members</div>
        <div class="tab" id="d43-tabbtn-leadership" onclick="d43SwitchTab('leadership')">Leadership</div>
        <div class="tab" id="d43-tabbtn-meetings" onclick="d43SwitchTab('meetings')">Meetings</div>
      </div>

      <div id="d43-tab-feed" class="d43-tab"></div>
      <div id="d43-tab-members" class="d43-tab" style="display:none"></div>
      <div id="d43-tab-leadership" class="d43-tab" style="display:none"></div>
      <div id="d43-tab-meetings" class="d43-tab" style="display:none"></div>
    `;

    d43ShowRoot(html);
    window.d43SwitchTab('feed');
  };

  window.d43SwitchTab = function (tab) {
    document.querySelectorAll('#d43-root .tab').forEach(function (t) {
      t.classList.remove('active');
    });

    const btn = document.getElementById('d43-tabbtn-' + tab);
    if (btn) btn.classList.add('active');

    ['feed', 'members', 'leadership', 'meetings'].forEach(function (t) {
      const el = document.getElementById('d43-tab-' + t);
      if (el) el.style.display = t === tab ? 'block' : 'none';
    });

    if (tab === 'feed') d43LoadFeed();
    if (tab === 'members') d43LoadMembers();
    if (tab === 'leadership') d43LoadLeadership();
    if (tab === 'meetings') d43LoadMeetings();
  };

  // =====================================================
  // FEED
  // =====================================================

  async function d43LoadFeed() {
    const box = document.getElementById('d43-tab-feed');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    const canPost = d43IsAdmin() || d43IsMember(D.currentDepartmentId);

    const { data: posts, error } = await sb()
      .from('department_posts')
      .select('*')
      .eq('department_id', D.currentDepartmentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      box.innerHTML = d43Error(error.message);
      return;
    }

    const users = await d43GetUsers();

    let html = '';

    if (canPost) {
      html += `
        <div class="card">
          <div class="form-group">
            <textarea class="form-textarea" id="d43PostText" placeholder="Post to this department..."></textarea>
          </div>
          <div class="media-upload" id="d43PostUpload" onclick="d43AttachMedia('post','d43PostUpload')">
            <i class="fas fa-cloud-upload-alt"></i><span>Add media</span>
          </div>
          <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="d43SubmitPost()">
            <i class="fas fa-paper-plane"></i> Post
          </button>
        </div>
      `;
    }

    if (!posts || !posts.length) {
      html += '<div class="card" style="text-align:center;color:var(--text-light)">No posts yet.</div>';
    }

    (posts || []).forEach(function (p) {
      const u = users.find(function (x) {
        return x.id === p.user_id;
      });

      const text = p.text || p.post_text || p.content || '';

      html += `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
            <div class="post-avatar">${d43Initials(u && u.name)}</div>
            <div>
              <div style="font-weight:700">${d43Esc((u && u.name) || 'Member')}</div>
              <div style="font-size:.75rem;color:var(--text-light)">${d43Date(p.created_at)}</div>
            </div>
          </div>
          <div style="white-space:pre-wrap">${d43Esc(text)}</div>
          ${d43MediaHtml(p.media_url)}
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.d43SubmitPost = async function () {
    const textEl = document.getElementById('d43PostText');
    if (!textEl) return;

    const text = textEl.value.trim();
    const file = window._d43Media.post;

    if (!text && !file) return alert('Write something or attach media.');

    let media_url = null;
    if (file) media_url = await d43UploadMedia(file, 'department-posts');

    const payloads = [
      {
        department_id: D.currentDepartmentId,
        user_id: d43User().id,
        text: text,
        media_url: media_url
      },
      {
        department_id: D.currentDepartmentId,
        user_id: d43User().id,
        post_text: text,
        media_url: media_url
      },
      {
        department_id: D.currentDepartmentId,
        user_id: d43User().id,
        content: text,
        media_url: media_url
      }
    ];

    let lastError = null;

    for (let i = 0; i < payloads.length; i++) {
      const { error } = await sb()
        .from('department_posts')
        .insert([payloads[i]]);

      if (!error) {
        window._d43Media.post = null;
        d43LoadFeed();
        return;
      }

      lastError = error;
    }

    alert(lastError ? lastError.message : 'Could not submit post.');
  };

  // =====================================================
  // MEMBERS
  // =====================================================

  async function d43LoadMembers() {
    const box = document.getElementById('d43-tab-members');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    await d43RefreshDeptMembers();

    const users = await d43GetUsers();
    const canManage = d43CanManageMembers(D.currentDepartmentId);

    let html = '';

    if (canManage) {
      html += `
        <button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="d43AddMemberModal()">
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

      const isSelf = d43User() && m.user_id === d43User().id;

      html += `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;gap:10px;align-items:center">
            <div class="post-avatar">${d43Initials(u && u.name)}</div>
            <div style="flex:1">
              <div style="font-weight:700">${d43Esc((u && u.name) || 'Member')}</div>
              <div style="font-size:.75rem;color:var(--text-light)">${d43Esc(m.role || 'Member')}</div>
            </div>
          </div>

          ${canManage && !isSelf ? `
            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
              <select class="form-select" onchange="d43ChangeMemberRole('${m.id}', this.value)">
                ${d43RoleOptions(m.role)}
              </select>
              <button class="btn btn-danger btn-sm" onclick="d43RemoveMember('${m.id}')"><i class="fas fa-trash"></i></button>
            </div>
          ` : ''}
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.d43AddMemberModal = async function () {
    const users = await d43GetUsers();

    const existingIds = D.deptMembers.map(function (m) {
      return m.user_id;
    });

    const html = `
      <div class="modal-overlay show" id="d43AddMemberModal" style="display:flex" onclick="if(event.target===this)d43CloseModal('d43AddMemberModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title"><i class="fas fa-user-plus"></i> Add Member</div>

          <div class="form-group">
            <label class="form-label">Member</label>
            <select class="form-select" id="d43AddMemberUser">
              <option value="">Select member</option>
              ${d43UserOptions(users, null, existingIds)}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select" id="d43AddMemberRole">
              ${d43RoleOptions('Member')}
            </select>
          </div>

          <button class="btn btn-primary btn-block" onclick="d43SaveNewMember()"><i class="fas fa-save"></i> Add</button>
          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="d43CloseModal('d43AddMemberModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.d43SaveNewMember = async function () {
    const user_id = document.getElementById('d43AddMemberUser').value;
    const role = document.getElementById('d43AddMemberRole').value;

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

    d43CloseModal('d43AddMemberModal');
    d43LoadMembers();
  };

  window.d43ChangeMemberRole = async function (memberId, role) {
    const { error } = await sb()
      .from('department_members')
      .update({ role: role })
      .eq('id', memberId);

    if (error) return alert(error.message);

    await d43RefreshDeptMembers();
    d43LoadMembers();
    d43LoadLeadership();
  };

  window.d43RemoveMember = async function (memberId) {
    if (!confirm('Remove this member?')) return;

    const { error } = await sb()
      .from('department_members')
      .delete()
      .eq('id', memberId);

    if (error) return alert(error.message);

    await d43RefreshDeptMembers();
    d43LoadMembers();
    d43LoadLeadership();
  };

  // =====================================================
  // LEADERSHIP
  // =====================================================

  async function d43LoadLeadership() {
    const box = document.getElementById('d43-tab-leadership');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    await d43RefreshDeptMembers();
    const users = await d43GetUsers();

    const leaders = D.deptMembers.filter(function (m) {
      const r = String(m.role || '').toLowerCase();
      return r !== 'member';
    });

    let html = '';

    if (!leaders.length) {
      html += '<div class="card">No leadership listed yet.</div>';
    }

    leaders.forEach(function (m) {
      const u = users.find(function (x) {
        return x.id === m.user_id;
      });

      html += `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;gap:10px;align-items:center">
            <div class="post-avatar">${d43Initials(u && u.name)}</div>
            <div style="flex:1">
              <div style="font-weight:800">${d43Esc((u && u.name) || 'Member')}</div>
              <div style="font-size:.8rem;color:var(--primary);font-weight:700">${d43Esc(m.role || 'Leader')}</div>
            </div>
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  }

  // =====================================================
  // MEETINGS
  // =====================================================

  async function d43LoadMeetings() {
    const box = document.getElementById('d43-tab-meetings');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    const canManage = d43CanManageMinutes(D.currentDepartmentId);
    const isMember = d43IsAdmin() || d43IsMember(D.currentDepartmentId);

    const { data: meetings, error } = await sb()
      .from('department_meetings')
      .select('*')
      .eq('department_id', D.currentDepartmentId)
      .order('meeting_date', { ascending: false })
      .limit(50);

    if (error) {
      box.innerHTML = d43Error(error.message);
      return;
    }

    let html = '';

    if (canManage) {
      html += `
        <button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="d43MeetingModal()">
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
          <div style="font-weight:800">${d43Esc(m.theme || 'Weekly Meeting')}</div>

          <div style="font-size:.85rem;color:var(--text-light);margin-top:4px">
            ${d43Esc(m.meeting_date || '')} ${m.start_time ? '• ' + d43Esc(m.start_time) : ''}
            ${m.end_time ? ' - ' + d43Esc(m.end_time) : ''}
          </div>

          ${m.venue ? '<div style="font-size:.85rem;color:var(--text-light);margin-top:2px"><i class="fas fa-map-marker-alt"></i> ' + d43Esc(m.venue) + '</div>' : ''}

          <div style="margin-top:8px;font-size:.9rem">
            <i class="fas fa-users"></i> Total present: ${d43Esc(m.total_members_present || 0)}
          </div>

          <details style="margin-top:8px">
            <summary style="cursor:pointer;color:var(--primary);font-weight:600">View Minutes</summary>

            ${m.agenda ? '<div style="margin-top:8px"><b>Agenda</b><div style="white-space:pre-wrap">' + d43Esc(m.agenda) + '</div></div>' : ''}
            ${m.members_present ? '<div style="margin-top:8px"><b>Members Present</b><div style="white-space:pre-wrap">' + d43Esc(m.members_present) + '</div></div>' : ''}
            ${m.absent_with_apology ? '<div style="margin-top:8px"><b>Absent with Apology</b><div style="white-space:pre-wrap">' + d43Esc(m.absent_with_apology) + '</div></div>' : ''}
            ${m.absent_without_apology ? '<div style="margin-top:8px"><b>Absent without Apology</b><div style="white-space:pre-wrap">' + d43Esc(m.absent_without_apology) + '</div></div>' : ''}
            ${m.guests ? '<div style="margin-top:8px"><b>Guests</b><div>' + d43Esc(m.guests) + '</div></div>' : ''}
            ${m.minutes ? '<div style="margin-top:8px"><b>Minutes</b><div style="white-space:pre-wrap">' + d43Esc(m.minutes) + '</div></div>' : ''}

            ${d43MediaHtml(m.media_url)}
          </details>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            ${isMember ? '<button class="btn btn-secondary btn-sm" onclick="d43ApologyModal(\'' + m.id + '\')"><i class="fas fa-hand-paper"></i> Submit Apology</button>' : ''}
            ${canManage ? '<button class="btn btn-primary btn-sm" onclick="d43MeetingModal(\'' + m.id + '\')"><i class="fas fa-edit"></i> Edit Meeting</button>' : ''}
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.d43MeetingModal = async function (meetingId) {
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
      <div class="modal-overlay show" id="d43MeetingModal" style="display:flex" onclick="if(event.target===this)d43CloseModal('d43MeetingModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title">${meetingId ? '📝 Edit Department Meeting' : '📝 Add Department Meeting'}</div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="d43MeetingDate" type="date" value="${d43Esc(String(m.meeting_date || d43Today()).slice(0, 10))}">
            </div>

            <div class="form-group">
              <label class="form-label">Day</label>
              <select class="form-select" id="d43MeetingDay">
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
              <input class="form-input" id="d43MeetingStart" type="time" value="${d43Esc(m.start_time || '')}">
            </div>

            <div class="form-group">
              <label class="form-label">End</label>
              <input class="form-input" id="d43MeetingEnd" type="time" value="${d43Esc(m.end_time || '')}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Venue</label>
            <input class="form-input" id="d43MeetingVenue" value="${d43Esc(m.venue || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Theme</label>
            <input class="form-input" id="d43MeetingTheme" value="${d43Esc(m.theme || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Agenda</label>
            <textarea class="form-textarea" id="d43MeetingAgenda" rows="5">${d43Esc(m.agenda || defaultAgenda)}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Members Present</label>
            <textarea class="form-textarea" id="d43MeetingPresent" rows="3" placeholder="One name per line">${d43Esc(m.members_present || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Absent with Apology</label>
            <textarea class="form-textarea" id="d43MeetingApology" rows="3" placeholder="Name - Reason">${d43Esc(m.absent_with_apology || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Absent without Apology</label>
            <textarea class="form-textarea" id="d43MeetingAbsent" rows="2">${d43Esc(m.absent_without_apology || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Guests / Others in Attendance</label>
            <input class="form-input" id="d43MeetingGuests" value="${d43Esc(m.guests || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Minutes / Proceedings</label>
            <textarea class="form-textarea" id="d43MeetingMinutes" rows="6">${d43Esc(m.minutes || '')}</textarea>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Time Taken (mins)</label>
              <input class="form-input" id="d43MeetingTimeTaken" type="number" value="${d43Esc(m.time_taken_minutes || 0)}">
            </div>

            <div class="form-group">
              <label class="form-label">Total Members Present</label>
              <input class="form-input" id="d43MeetingTotalPresent" type="number" value="${d43Esc(m.total_members_present || 0)}">
            </div>
          </div>

          <div class="media-upload" id="d43MeetingUpload" onclick="d43AttachMedia('meeting','d43MeetingUpload')">
            <i class="fas fa-cloud-upload-alt"></i><span>Upload media</span>
          </div>

          <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="d43SaveMeeting('${meetingId || ''}')">
            <i class="fas fa-save"></i> Save Meeting
          </button>

          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="d43CloseModal('d43MeetingModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.d43SaveMeeting = async function (meetingId) {
    const id = meetingId || null;

    const meeting_date = document.getElementById('d43MeetingDate').value || d43Today();
    const day = document.getElementById('d43MeetingDay').value;
    const start_time = document.getElementById('d43MeetingStart').value;
    const end_time = document.getElementById('d43MeetingEnd').value;
    const venue = document.getElementById('d43MeetingVenue').value.trim();
    const theme = document.getElementById('d43MeetingTheme').value.trim();
    const agenda = document.getElementById('d43MeetingAgenda').value.trim();
    const members_present = document.getElementById('d43MeetingPresent').value.trim();
    const absent_with_apology = document.getElementById('d43MeetingApology').value.trim();
    const absent_without_apology = document.getElementById('d43MeetingAbsent').value.trim();
    const guests = document.getElementById('d43MeetingGuests').value.trim();
    const minutes = document.getElementById('d43MeetingMinutes').value.trim();
    const time_taken_minutes = parseInt(document.getElementById('d43MeetingTimeTaken').value || '0', 10);

    let total_members_present = parseInt(document.getElementById('d43MeetingTotalPresent').value, 10);

    if (isNaN(total_members_present)) {
      total_members_present = members_present
        ? members_present.split(/\n+/).filter(function (x) { return x.trim(); }).length
        : 0;
    }

    const file = window._d43Media.meeting;
    let media_url = null;

    if (file) media_url = await d43UploadMedia(file, 'department-meetings');

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
      payload.created_by = d43User().id;

      const { error } = await sb()
        .from('department_meetings')
        .insert([payload]);

      if (error) return alert(error.message);
    }

    window._d43Media.meeting = null;
    d43CloseModal('d43MeetingModal');
    d43LoadMeetings();
  };

  window.d43ApologyModal = function (meetingId) {
    if (!d43User()) return alert('Please log in first.');

    const html = `
      <div class="modal-overlay show" id="d43ApologyModal" style="display:flex" onclick="if(event.target===this)d43CloseModal('d43ApologyModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title">🙏 Absent with Apology</div>

          <div class="form-group">
            <label class="form-label">Reason for Absence</label>
            <textarea class="form-textarea" id="d43ApologyReason" rows="4" placeholder="State reason..."></textarea>
          </div>

          <button class="btn btn-primary btn-block" onclick="d43SaveApology('${meetingId}')">
            <i class="fas fa-paper-plane"></i> Submit Apology
          </button>

          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="d43CloseModal('d43ApologyModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.d43SaveApology = async function (meetingId) {
    const reason = document.getElementById('d43ApologyReason').value.trim();
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
        user_id: d43User().id,
        status: 'absent_with_apology',
        reason: reason
      }]);

    d43CloseModal('d43ApologyModal');
    alert('Apology submitted.');
    d43LoadMeetings();
  };

  // =====================================================
  // INIT
  // =====================================================

  function d43Init() {
    d43CleanupOldDepartmentShell();
    d43InjectNav();
    d43MoveForumAndPlansToHome();
    d43DisableOldMeetingFunctions();
    d43KillOldMeetingUI();
  }

  d43Init();

  setInterval(d43InjectNav, 1000);
  setInterval(d43MoveForumAndPlansToHome, 3000);
  setInterval(d43DisableOldMeetingFunctions, 3000);
  setInterval(d43KillOldMeetingUI, 1500);
})();
