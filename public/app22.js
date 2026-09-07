// public/app22.js
// Groups system:
// Group > Category > Assigned Teacher
// Groups behave like Ushirika/Department:
// members, leader, secretary, treasurer, teacher, meetings, posts.

(function () {
  console.log('✝️ app22.js loaded — Groups, Categories, Teachers, Meetings');

  window._gg = Object.assign(
    {
      myMemberships: [],
      groups: [],
      group: null,
      groupMembers: [],
      categories: [],
      currentGroupId: null,
      currentCategoryId: null,
      currentCategory: null
    },
    window._gg || {}
  );

  window._ggMedia = window._ggMedia || {};

  const G = window._gg;

  function sb() {
    return window.sb;
  }

  function ggUser() {
    return window.user;
  }

  function ggIsAdmin() {
    return window.isAdmin ? window.isAdmin() : false;
  }

  function ggEsc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ggInitials(name) {
    if (window.ini) return window.ini(name);
    if (!name) return '?';
    return String(name)
      .split(' ')
      .map(function (x) { return x[0] || ''; })
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  function ggDate(ts) {
    if (!ts) return '';
    if (window.fdate) return window.fdate(ts);
    return new Date(ts).toLocaleDateString();
  }

  function ggToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function ggError(msg) {
    return '<div class="card" style="color:#EF4444">' + ggEsc(msg || 'Error') + '</div>';
  }

  function ggMediaHtml(url) {
    if (!url) return '';
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      return '<img src="' + url + '" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-top:8px">';
    }
    return '<a href="' + url + '" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:8px"><i class="fas fa-paperclip"></i> Media</a>';
  }

  async function ggGetUsers() {
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

  async function ggUploadMedia(file, path) {
    if (!file) return null;

    if (window.uploadMediaFile) {
      try {
        return await window.uploadMediaFile(file);
      } catch (e) {
        console.error(e);
      }
    }

    if (!sb()) return null;

    const fileName = (path || 'groups') + '/' + Date.now() + '_' + file.name;
    const { error } = await sb().storage.from('media').upload(fileName, file);

    if (error) {
      console.error(error);
      alert('Media upload failed. Check Supabase storage bucket "media" and policies.');
      return null;
    }

    const { data } = sb().storage.from('media').getPublicUrl(fileName);
    return data.publicUrl;
  }

  window.ggAttachMedia = function (key, labelId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = function () {
      const file = input.files && input.files[0];
      if (!file) return;
      window._ggMedia[key] = file;
      const label = document.getElementById(labelId);
      if (label) {
        label.innerHTML = '<i class="fas fa-check-circle"></i> ' + ggEsc(file.name);
      }
    };
    input.click();
  };

  window.ggCloseModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  };

  function ggEnsureSection() {
    let sec = document.getElementById('section-gg-groups');
    if (sec) return sec;

    sec = document.createElement('div');
    sec.id = 'section-gg-groups';
    sec.className = 'section';
    sec.innerHTML = '<div id="gg-root" class="sub-page active"></div>';

    const main = document.querySelector('main') || document.body;
    main.appendChild(sec);
    return sec;
  }

  function ggShowRoot(html) {
    const sec = ggEnsureSection();

    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });

    sec.classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) {
      b.classList.remove('active');
    });

    const navBtn = document.getElementById('ggNavBtn');
    if (navBtn) navBtn.classList.add('active');

    const root = document.getElementById('gg-root');
    if (root) root.innerHTML = html;

    try {
      window.scrollTo({ top: 0 });
    } catch (e) {}
  }

  function ggInjectNav() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav || document.getElementById('ggNavBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'ggNavBtn';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="fas fa-users"></i>Groups';
    btn.onclick = function () {
      window.ggOpenHome();
    };

    const discoverBtn = Array.from(nav.querySelectorAll('.nav-item')).find(function (b) {
      return /discover/i.test(b.textContent || '');
    });

    if (discoverBtn) nav.insertBefore(btn, discoverBtn);
    else nav.appendChild(btn);
  }

  window.ggGoBackApp = function () {
    if (window.switchSection) window.switchSection('home');
  };

  async function ggLoadMyMemberships() {
    if (!ggUser() || !sb()) return;
    const { data, error } = await sb()
      .from('church_group_members')
      .select('*')
      .eq('user_id', ggUser().id);

    if (!error) G.myMemberships = data || [];
  }

  function ggMyRole(groupId) {
    const m = (G.myMemberships || []).find(function (x) {
      return x.group_id === groupId;
    });
    return m ? String(m.role || 'Member').toLowerCase() : '';
  }

  function ggIsGroupMember(groupId) {
    return (G.myMemberships || []).some(function (x) {
      return x.group_id === groupId;
    });
  }

  function ggCanManageMembers(groupId) {
    if (ggIsAdmin()) return true;
    const r = ggMyRole(groupId);
    return ['leader', 'chairman'].includes(r);
  }

  function ggCanManageCategories(groupId) {
    if (ggIsAdmin()) return true;
    const r = ggMyRole(groupId);
    return ['leader', 'chairman'].includes(r);
  }

  function ggCanManageMinutes(groupId) {
    if (ggIsAdmin()) return true;
    const r = ggMyRole(groupId);
    return ['leader', 'chairman', 'secretary'].includes(r);
  }

  function ggCanManageCategory(cat) {
    if (!cat) return false;
    if (ggIsAdmin()) return true;
    if (cat.teacher_id && ggUser() && cat.teacher_id === ggUser().id) return true;
    const r = ggMyRole(cat.group_id);
    return ['leader', 'chairman'].includes(r);
  }

  function ggRoleOptions(selected) {
    const roles = ['Member', 'Leader', 'Chairman', 'Secretary', 'Treasurer', 'Teacher'];
    const selectedLower = String(selected || '').toLowerCase();
    return roles
      .map(function (r) {
        const sel = r.toLowerCase() === selectedLower ? 'selected' : '';
        return '<option value="' + r + '" ' + sel + '>' + r + '</option>';
      })
      .join('');
  }

  function ggUserOptions(users, selectedId, excludeIds) {
    excludeIds = excludeIds || [];
    return (users || [])
      .filter(function (u) {
        return excludeIds.indexOf(u.id) === -1;
      })
      .map(function (u) {
        const sel = u.id === selectedId ? 'selected' : '';
        return '<option value="' + u.id + '" ' + sel + '>' + ggEsc(u.name || u.email || 'User') + '</option>';
      })
      .join('');
  }

  async function ggRefreshGroupMembers() {
    if (!sb() || !G.currentGroupId) return;
    const { data } = await sb()
      .from('church_group_members')
      .select('*')
      .eq('group_id', G.currentGroupId);
    G.groupMembers = data || [];
    await ggLoadMyMemberships();
  }

  // =====================================================
  // GROUPS HOME
  // =====================================================

  window.ggOpenHome = async function () {
    if (!ggUser()) return alert('Please log in first.');
    if (!sb()) return alert('Supabase not ready.');

    ggShowRoot('<div class="section-title-app">Groups</div><div class="card">Loading...</div>');

    await ggLoadMyMemberships();

    const { data, error } = await sb()
      .from('church_groups')
      .select('*')
      .order('name');

    if (error) return ggShowRoot(ggError(error.message));

    G.groups = data || [];

    let html = '';
    html += '<button class="back-btn" onclick="ggGoBackApp()"><i class="fas fa-arrow-left"></i> Back</button>';
    html += '<div class="section-title-app"><i class="fas fa-users"></i> Groups</div>';

    if (ggIsAdmin()) {
      html += '<button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="ggCreateGroupModal()"><i class="fas fa-plus"></i> Create Group</button>';
    }

    if (!G.groups.length) {
      html += '<div class="card">No groups yet. Admin can create Sunday School, Youth, Men, Women, Elderly, etc.</div>';
    }

    G.groups.forEach(function (g) {
      const mine = (G.myMemberships || []).find(function (m) {
        return m.group_id === g.id;
      });

      html += `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
            <div style="flex:1">
              <div style="font-weight:800;font-size:1.05rem">${ggEsc(g.name)}</div>
              <div style="font-size:.85rem;color:var(--text-light)">${ggEsc(g.description || 'Group')}</div>
              ${mine ? '<div style="font-size:.75rem;color:var(--accent);margin-top:4px"><i class="fas fa-check"></i> ' + ggEsc(mine.role || 'Member') + '</div>' : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${(mine || ggIsAdmin()) ? '<button class="btn btn-primary btn-sm" onclick="ggOpenGroup(\'' + g.id + '\')">Open</button>' : ''}
              ${!mine ? '<button class="btn btn-secondary btn-sm" onclick="ggJoinGroup(\'' + g.id + '\')">Join</button>' : ''}
            </div>
          </div>
        </div>
      `;
    });

    ggShowRoot(html);
  };

  window.ggCreateGroupModal = function () {
    const html = `
      <div class="modal-overlay show" id="ggCreateGroupModal" style="display:flex" onclick="if(event.target===this)ggCloseModal('ggCreateGroupModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title"><i class="fas fa-users"></i> Create Group</div>
          <div class="form-group">
            <label class="form-label">Group Name</label>
            <input class="form-input" id="ggGroupName" placeholder="Sunday School, Youth, Men, Women...">
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="ggGroupDescription" rows="3"></textarea>
          </div>
          <button class="btn btn-primary btn-block" onclick="ggSaveGroup()"><i class="fas fa-save"></i> Save Group</button>
          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="ggCloseModal('ggCreateGroupModal')">Cancel</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.ggSaveGroup = async function () {
    const name = document.getElementById('ggGroupName').value.trim();
    const description = document.getElementById('ggGroupDescription').value.trim();

    if (!name) return alert('Group name is required.');

    const { error } = await sb()
      .from('church_groups')
      .insert([{ name: name, description: description }]);

    if (error) return alert(error.message);

    ggCloseModal('ggCreateGroupModal');
    window.ggOpenHome();
  };

  window.ggJoinGroup = async function (groupId) {
    if (!ggUser()) return alert('Please log in first.');

    const payload = {
      group_id: groupId,
      user_id: ggUser().id,
      role: 'Member'
    };

    const { error } = await sb()
      .from('church_group_members')
      .upsert(payload, { onConflict: 'group_id,user_id' });

    if (error) return alert(error.message);

    await ggLoadMyMemberships();
    window.ggOpenGroup(groupId);
  };

  window.ggLeaveGroup = async function (groupId) {
    if (!ggUser()) return;
    if (!confirm('Leave this group?')) return;

    await sb()
      .from('church_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', ggUser().id);

    await ggLoadMyMemberships();
    window.ggOpenHome();
  };

  // =====================================================
  // GROUP PAGE
  // =====================================================

  window.ggOpenGroup = async function (groupId) {
    if (!ggUser()) return alert('Please log in first.');
    if (!sb()) return alert('Supabase not ready.');

    G.currentGroupId = groupId;

    ggShowRoot('<div class="section-title-app">Group</div><div class="card">Loading...</div>');

    await ggLoadMyMemberships();

    const { data: group, error: groupError } = await sb()
      .from('church_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) return window.ggOpenHome();

    G.group = group;

    const mine = (G.myMemberships || []).find(function (m) {
      return m.group_id === groupId;
    });

    if (!mine && !ggIsAdmin()) {
      ggShowRoot(`
        <button class="back-btn" onclick="ggOpenHome()"><i class="fas fa-arrow-left"></i> Back</button>
        <div class="card">
          <div style="font-weight:800;font-size:1.2rem">${ggEsc(group.name)}</div>
          <div style="color:var(--text-light);margin:8px 0">${ggEsc(group.description || 'Group')}</div>
          <button class="btn btn-primary btn-block" onclick="ggJoinGroup('${group.id}')"><i class="fas fa-sign-in-alt"></i> Join Group</button>
        </div>
      `);
      return;
    }

    await ggRefreshGroupMembers();

    const html = `
      <button class="back-btn" onclick="ggOpenHome()"><i class="fas fa-arrow-left"></i> Back</button>

      <div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px">
        <div class="dept-icon" style="background:var(--gradient-warm)"><i class="fas fa-users"></i></div>
        <div>
          <div style="font-weight:800;font-size:1.2rem">${ggEsc(group.name)}</div>
          <div style="font-size:.8rem;opacity:.9">${ggEsc(group.description || 'Group')}</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        ${mine
          ? '<button class="btn btn-danger btn-sm" onclick="ggLeaveGroup(\'' + group.id + '\')"><i class="fas fa-sign-out-alt"></i> Leave</button>'
          : '<button class="btn btn-primary btn-sm" onclick="ggJoinGroup(\'' + group.id + '\')"><i class="fas fa-sign-in-alt"></i> Join</button>'
        }
      </div>

      <div class="tabs">
        <div class="tab active" id="gg-tabbtn-feed" onclick="ggSwitchGroupTab('feed')">Feed</div>
        <div class="tab" id="gg-tabbtn-categories" onclick="ggSwitchGroupTab('categories')">Categories</div>
        <div class="tab" id="gg-tabbtn-members" onclick="ggSwitchGroupTab('members')">Members</div>
        <div class="tab" id="gg-tabbtn-meetings" onclick="ggSwitchGroupTab('meetings')">Meetings</div>
        <div class="tab" id="gg-tabbtn-reports" onclick="ggSwitchGroupTab('reports')">Reports</div>
      </div>

      <div id="gg-tab-feed" class="gg-tab"></div>
      <div id="gg-tab-categories" class="gg-tab" style="display:none"></div>
      <div id="gg-tab-members" class="gg-tab" style="display:none"></div>
      <div id="gg-tab-meetings" class="gg-tab" style="display:none"></div>
      <div id="gg-tab-reports" class="gg-tab" style="display:none"></div>
    `;

    ggShowRoot(html);
    window.ggSwitchGroupTab('feed');
  };

  window.ggSwitchGroupTab = function (tab) {
    document.querySelectorAll('#gg-root .tab').forEach(function (t) {
      t.classList.remove('active');
    });

    const btn = document.getElementById('gg-tabbtn-' + tab);
    if (btn) btn.classList.add('active');

    ['feed', 'categories', 'members', 'meetings', 'reports'].forEach(function (t) {
      const el = document.getElementById('gg-tab-' + t);
      if (el) el.style.display = t === tab ? 'block' : 'none';
    });

    if (tab === 'feed') ggLoadFeed();
    if (tab === 'categories') ggLoadCategories();
    if (tab === 'members') ggLoadMembers();
    if (tab === 'meetings') ggLoadMeetings();
    if (tab === 'reports') ggLoadReports();
  };

  // =====================================================
  // FEED
  // =====================================================

  async function ggLoadFeed() {
    const box = document.getElementById('gg-tab-feed');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    const canPost = ggIsAdmin() || ggIsGroupMember(G.currentGroupId);

    const { data: posts, error } = await sb()
      .from('church_group_posts')
      .select('*')
      .eq('group_id', G.currentGroupId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      box.innerHTML = ggError(error.message);
      return;
    }

    const users = await ggGetUsers();

    let html = '';

    if (canPost) {
      html += `
        <div class="card">
          <div class="form-group">
            <textarea class="form-textarea" id="ggPostText" placeholder="Post to this group..."></textarea>
          </div>
          <div class="media-upload" id="ggPostUpload" onclick="ggAttachMedia('post','ggPostUpload')">
            <i class="fas fa-cloud-upload-alt"></i><span>Add media</span>
          </div>
          <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="ggSubmitGroupPost()">
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

      html += `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
            <div class="post-avatar">${ggInitials(u && u.name)}</div>
            <div>
              <div style="font-weight:700">${ggEsc((u && u.name) || 'Member')}</div>
              <div style="font-size:.75rem;color:var(--text-light)">${ggDate(p.created_at)}</div>
            </div>
          </div>
          <div style="white-space:pre-wrap">${ggEsc(p.text || '')}</div>
          ${ggMediaHtml(p.media_url)}
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.ggSubmitGroupPost = async function () {
    const textEl = document.getElementById('ggPostText');
    if (!textEl) return;

    const text = textEl.value.trim();
    const file = window._ggMedia.post;

    if (!text && !file) return alert('Write something or attach media.');

    let media_url = null;
    if (file) media_url = await ggUploadMedia(file, 'group-posts');

    const { error } = await sb()
      .from('church_group_posts')
      .insert([{
        group_id: G.currentGroupId,
        user_id: ggUser().id,
        text: text,
        media_url: media_url
      }]);

    if (error) return alert(error.message);

    window._ggMedia.post = null;
    ggLoadFeed();
  };

  // =====================================================
  // CATEGORIES
  // =====================================================

  async function ggLoadCategories() {
    const box = document.getElementById('gg-tab-categories');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    const { data: categories, error } = await sb()
      .from('church_group_categories')
      .select('*')
      .eq('group_id', G.currentGroupId)
      .order('name');

    if (error) {
      box.innerHTML = ggError(error.message);
      return;
    }

    G.categories = categories || [];
    const users = await ggGetUsers();
    const canManage = ggCanManageCategories(G.currentGroupId);

    let html = '';

    if (canManage) {
      html += `
        <button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="ggAddCategoryModal()">
          <i class="fas fa-plus"></i> Add Category
        </button>
      `;
    }

    if (!G.categories.length) {
      html += '<div class="card">No categories yet. Example: Kids 3–10, Teens 11–14.</div>';
    }

    G.categories.forEach(function (c) {
      const teacher = users.find(function (u) {
        return u.id === c.teacher_id;
      });

      html += `
        <div class="card" style="margin-bottom:12px">
          <div style="font-weight:800">${ggEsc(c.name)}</div>
          <div style="font-size:.85rem;color:var(--text-light)">Age: ${ggEsc(c.min_age || 0)} - ${ggEsc(c.max_age || 99)}</div>
          <div style="font-size:.85rem;color:var(--text-light);margin-top:4px">
            <i class="fas fa-chalkboard-teacher"></i> Teacher: ${ggEsc((teacher && teacher.name) || 'Not assigned')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button class="btn btn-primary btn-sm" onclick="ggOpenCategory('${c.id}')">Open Category</button>
            ${canManage ? '<button class="btn btn-secondary btn-sm" onclick="ggAssignTeacherModal(\'' + c.id + '\')">Assign Teacher</button>' : ''}
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.ggAddCategoryModal = async function () {
    const users = await ggGetUsers();

    const memberOptions = G.groupMembers
      .map(function (m) {
        const u = users.find(function (x) {
          return x.id === m.user_id;
        });
        return '<option value="' + m.user_id + '">' + ggEsc((u && u.name) || 'User') + ' — ' + ggEsc(m.role || 'Member') + '</option>';
      })
      .join('');

    const html = `
      <div class="modal-overlay show" id="ggAddCategoryModal" style="display:flex" onclick="if(event.target===this)ggCloseModal('ggAddCategoryModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title"><i class="fas fa-layer-group"></i> Add Category</div>

          <div class="form-group">
            <label class="form-label">Category Name</label>
            <input class="form-input" id="ggCategoryName" placeholder="Kids, Teens, Young Adults...">
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Min Age</label>
              <input class="form-input" id="ggCategoryMinAge" type="number" value="0">
            </div>
            <div class="form-group">
              <label class="form-label">Max Age</label>
              <input class="form-input" id="ggCategoryMaxAge" type="number" value="99">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Assign Teacher</label>
            <select class="form-select" id="ggCategoryTeacher">
              <option value="">No teacher yet</option>
              ${memberOptions}
            </select>
          </div>

          <button class="btn btn-primary btn-block" onclick="ggSaveCategory()"><i class="fas fa-save"></i> Save Category</button>
          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="ggCloseModal('ggAddCategoryModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.ggSaveCategory = async function () {
    const name = document.getElementById('ggCategoryName').value.trim();
    const min_age = parseInt(document.getElementById('ggCategoryMinAge').value || '0', 10);
    const max_age = parseInt(document.getElementById('ggCategoryMaxAge').value || '99', 10);
    const teacher_id = document.getElementById('ggCategoryTeacher').value || null;

    if (!name) return alert('Category name is required.');

    const { error } = await sb()
      .from('church_group_categories')
      .insert([{
        group_id: G.currentGroupId,
        name: name,
        min_age: min_age,
        max_age: max_age,
        teacher_id: teacher_id
      }]);

    if (error) return alert(error.message);

    ggCloseModal('ggAddCategoryModal');
    ggLoadCategories();
  };

  window.ggAssignTeacherModal = async function (categoryId) {
    const cat = (G.categories || []).find(function (c) {
      return c.id === categoryId;
    });

    if (!cat) return;

    const users = await ggGetUsers();

    const memberOptions = G.groupMembers
      .map(function (m) {
        const u = users.find(function (x) {
          return x.id === m.user_id;
        });
        const sel = m.user_id === cat.teacher_id ? 'selected' : '';
        return '<option value="' + m.user_id + '" ' + sel + '>' + ggEsc((u && u.name) || 'User') + ' — ' + ggEsc(m.role || 'Member') + '</option>';
      })
      .join('');

    const html = `
      <div class="modal-overlay show" id="ggAssignTeacherModal" style="display:flex" onclick="if(event.target===this)ggCloseModal('ggAssignTeacherModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title"><i class="fas fa-chalkboard-teacher"></i> Assign Teacher</div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <input class="form-input" value="${ggEsc(cat.name)}" disabled>
          </div>

          <div class="form-group">
            <label class="form-label">Teacher</label>
            <select class="form-select" id="ggAssignTeacherSelect">
              <option value="">No teacher</option>
              ${memberOptions}
            </select>
          </div>

          <button class="btn btn-primary btn-block" onclick="ggSaveCategoryTeacher('${cat.id}')"><i class="fas fa-save"></i> Save</button>
          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="ggCloseModal('ggAssignTeacherModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.ggSaveCategoryTeacher = async function (categoryId) {
    const teacher_id = document.getElementById('ggAssignTeacherSelect').value || null;

    const { error } = await sb()
      .from('church_group_categories')
      .update({ teacher_id: teacher_id })
      .eq('id', categoryId);

    if (error) return alert(error.message);

    ggCloseModal('ggAssignTeacherModal');
    ggLoadCategories();
  };

  // =====================================================
  // CATEGORY PAGE
  // =====================================================

  window.ggOpenCategory = async function (categoryId) {
    if (!ggUser()) return alert('Please log in first.');
    if (!sb()) return alert('Supabase not ready.');

    G.currentCategoryId = categoryId;

    ggShowRoot('<div class="section-title-app">Category</div><div class="card">Loading...</div>');

    const { data: cat, error } = await sb()
      .from('church_group_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error || !cat) return alert('Category not found.');

    G.currentCategory = cat;

    if (!ggIsAdmin() && !ggIsGroupMember(cat.group_id)) {
      ggShowRoot(`
        <button class="back-btn" onclick="ggOpenGroup('${cat.group_id}')"><i class="fas fa-arrow-left"></i> Back</button>
        <div class="card">
          <div style="font-weight:800">${ggEsc(cat.name)}</div>
          <div style="color:var(--text-light);margin:8px 0">Join this group to access it.</div>
          <button class="btn btn-primary btn-block" onclick="ggJoinGroup('${cat.group_id}')"><i class="fas fa-sign-in-alt"></i> Join Group</button>
        </div>
      `);
      return;
    }

    const { data: records } = await sb()
      .from('church_group_category_records')
      .select('*')
      .eq('category_id', categoryId)
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    const canManage = ggCanManageCategory(cat);
    const canAssign = ggCanManageCategories(cat.group_id);

    const users = await ggGetUsers();
    const teacher = users.find(function (u) {
      return u.id === cat.teacher_id;
    });

    let html = `
      <button class="back-btn" onclick="ggOpenGroup('${cat.group_id}')"><i class="fas fa-arrow-left"></i> Back</button>

      <div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px">
        <div class="dept-icon" style="background:var(--gradient-warm)"><i class="fas fa-child"></i></div>
        <div>
          <div style="font-weight:800;font-size:1.2rem">${ggEsc(cat.name)}</div>
          <div style="font-size:.8rem;opacity:.9">Age: ${ggEsc(cat.min_age || 0)} - ${ggEsc(cat.max_age || 99)}</div>
          <div style="font-size:.8rem;opacity:.9;margin-top:4px">
            <i class="fas fa-chalkboard-teacher"></i> Teacher: ${ggEsc((teacher && teacher.name) || 'Not assigned')}
          </div>
        </div>
      </div>

      ${canAssign ? '<button class="btn btn-secondary btn-block" style="margin-bottom:14px" onclick="ggAssignTeacherModal(\'' + cat.id + '\')"><i class="fas fa-chalkboard-teacher"></i> Assign Teacher</button>' : ''}
    `;

    if (canManage) {
      html += `
        <div class="card card-warm" style="margin-bottom:14px">
          <div class="section-title-app">📝 Take Category Attendance</div>

          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" id="ggRecordDate" type="date" value="${ggToday()}">
          </div>

          <div class="form-group">
            <label class="form-label">Names of Students Known Attendance</label>
            <textarea class="form-textarea" id="ggStudentNames" rows="4" placeholder="One name per line"></textarea>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">No. Present</label>
              <input class="form-input" id="ggStudentsPresent" type="number" placeholder="Auto counts names if left blank">
            </div>
            <div class="form-group">
              <label class="form-label">Total Offering</label>
              <input class="form-input" id="ggOffering" type="number" step="0.01" value="0">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Lesson</label>
            <input class="form-input" id="ggLesson" placeholder="Today's lesson">
          </div>

          <div class="media-upload" id="ggRecordUpload" onclick="ggAttachMedia('record','ggRecordUpload')">
            <i class="fas fa-cloud-upload-alt"></i><span>Upload media</span>
          </div>

          <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="ggSaveCategoryRecord('${cat.id}')">
            <i class="fas fa-save"></i> Save Record
          </button>
        </div>
      `;
    }

    html += '<div id="ggCategoryRecords"></div>';

    ggShowRoot(html);

    let totalPresent = 0;
    let totalOffering = 0;
    let recordsHtml = '';

    (records || []).forEach(function (r) {
      totalPresent += Number(r.students_present || 0);
      totalOffering += Number(r.total_offering || 0);

      recordsHtml += `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <div style="font-weight:800">${ggEsc(r.lesson || 'Record')}</div>
            <div style="font-size:.8rem;color:var(--text-light)">${ggEsc(r.record_date || '')}</div>
          </div>

          <div style="margin-top:8px;display:flex;gap:14px;flex-wrap:wrap">
            <span><i class="fas fa-users"></i> ${ggEsc(r.students_present || 0)} present</span>
            <span><i class="fas fa-coins"></i> ${ggEsc(r.total_offering || 0)}</span>
          </div>

          ${r.student_names ? '<div style="margin-top:8px;font-size:.85rem;color:var(--text-light);white-space:pre-wrap">' + ggEsc(r.student_names) + '</div>' : ''}
          ${ggMediaHtml(r.media_url)}
        </div>
      `;
    });

    recordsHtml += `
      <div class="card card-cool" style="text-align:center;font-size:1.15rem;font-weight:800;margin-top:18px">
        Total Students Present: <span id="ggTotalPresent">${totalPresent}</span><br>
        Total Offering: <span id="ggTotalOffering">${totalOffering.toFixed(2)}</span>
      </div>
    `;

    document.getElementById('ggCategoryRecords').innerHTML = recordsHtml;
  };

  window.ggSaveCategoryRecord = async function (categoryId) {
    const cat = G.currentCategory;
    if (!cat) return;

    const record_date = document.getElementById('ggRecordDate').value || ggToday();
    const student_names = document.getElementById('ggStudentNames').value.trim();
    const lesson = document.getElementById('ggLesson').value.trim();

    let students_present = parseInt(document.getElementById('ggStudentsPresent').value, 10);

    if (isNaN(students_present)) {
      students_present = student_names
        ? student_names.split(/\n+/).filter(function (x) { return x.trim(); }).length
        : 0;
    }

    const total_offering = parseFloat(document.getElementById('ggOffering').value || '0');
    const file = window._ggMedia.record;

    let media_url = null;
    if (file) media_url = await ggUploadMedia(file, 'group-category-records');

    const payload = {
      group_id: cat.group_id,
      category_id: categoryId,
      record_date: record_date,
      student_names: student_names,
      students_present: students_present,
      total_offering: total_offering,
      lesson: lesson,
      media_url: media_url,
      recorded_by: ggUser().id
    };

    const { error } = await sb()
      .from('church_group_category_records')
      .insert([payload]);

    if (error) return alert(error.message);

    window._ggMedia.record = null;
    alert('Record saved.');
    window.ggOpenCategory(categoryId);
  };

  // =====================================================
  // MEMBERS
  // =====================================================

  async function ggLoadMembers() {
    const box = document.getElementById('gg-tab-members');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    await ggRefreshGroupMembers();

    const users = await ggGetUsers();
    const canManage = ggCanManageMembers(G.currentGroupId);

    let html = '';

    if (canManage) {
      html += `
        <button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="ggAddMemberModal()">
          <i class="fas fa-user-plus"></i> Add Member
        </button>
      `;
    }

    if (!G.groupMembers.length) {
      html += '<div class="card">No members yet.</div>';
    }

    G.groupMembers.forEach(function (m) {
      const u = users.find(function (x) {
        return x.id === m.user_id;
      });

      const isSelf = ggUser() && m.user_id === ggUser().id;

      html += `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;gap:10px;align-items:center">
            <div class="post-avatar">${ggInitials(u && u.name)}</div>
            <div style="flex:1">
              <div style="font-weight:700">${ggEsc((u && u.name) || 'Member')}</div>
              <div style="font-size:.75rem;color:var(--text-light)">${ggEsc(m.role || 'Member')}</div>
            </div>
          </div>

          ${canManage && !isSelf ? `
            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
              <select class="form-select" onchange="ggChangeMemberRole('${m.id}', this.value)">
                ${ggRoleOptions(m.role)}
              </select>
              <button class="btn btn-danger btn-sm" onclick="ggRemoveMember('${m.id}')"><i class="fas fa-trash"></i></button>
            </div>
          ` : ''}
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.ggAddMemberModal = async function () {
    const users = await ggGetUsers();
    const existingIds = G.groupMembers.map(function (m) {
      return m.user_id;
    });

    const html = `
      <div class="modal-overlay show" id="ggAddMemberModal" style="display:flex" onclick="if(event.target===this)ggCloseModal('ggAddMemberModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title"><i class="fas fa-user-plus"></i> Add Member</div>

          <div class="form-group">
            <label class="form-label">Member</label>
            <select class="form-select" id="ggAddMemberUser">
              <option value="">Select member</option>
              ${ggUserOptions(users, null, existingIds)}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select" id="ggAddMemberRole">
              ${ggRoleOptions('Member')}
            </select>
          </div>

          <button class="btn btn-primary btn-block" onclick="ggSaveNewMember()"><i class="fas fa-save"></i> Add</button>
          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="ggCloseModal('ggAddMemberModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.ggSaveNewMember = async function () {
    const user_id = document.getElementById('ggAddMemberUser').value;
    const role = document.getElementById('ggAddMemberRole').value;

    if (!user_id) return alert('Select a member.');

    const { error } = await sb()
      .from('church_group_members')
      .upsert([{
        group_id: G.currentGroupId,
        user_id: user_id,
        role: role
      }], { onConflict: 'group_id,user_id' });

    if (error) return alert(error.message);

    ggCloseModal('ggAddMemberModal');
    ggLoadMembers();
  };

  window.ggChangeMemberRole = async function (memberId, role) {
    const { error } = await sb()
      .from('church_group_members')
      .update({ role: role })
      .eq('id', memberId);

    if (error) return alert(error.message);

    await ggRefreshGroupMembers();
    ggLoadMembers();
  };

  window.ggRemoveMember = async function (memberId) {
    if (!confirm('Remove this member?')) return;

    const { error } = await sb()
      .from('church_group_members')
      .delete()
      .eq('id', memberId);

    if (error) return alert(error.message);

    await ggRefreshGroupMembers();
    ggLoadMembers();
  };

  // =====================================================
  // MEETINGS
  // =====================================================

  async function ggLoadMeetings() {
    const box = document.getElementById('gg-tab-meetings');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    const canManage = ggCanManageMinutes(G.currentGroupId);
    const isMember = ggIsAdmin() || ggIsGroupMember(G.currentGroupId);

    const { data: meetings, error } = await sb()
      .from('church_group_meetings')
      .select('*')
      .eq('group_id', G.currentGroupId)
      .order('meeting_date', { ascending: false })
      .limit(50);

    if (error) {
      box.innerHTML = ggError(error.message);
      return;
    }

    let html = '';

    if (canManage) {
      html += `
        <button class="btn btn-warm btn-block" style="margin-bottom:14px" onclick="ggMeetingModal()">
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
          <div style="font-weight:800">${ggEsc(m.theme || 'Weekly Meeting')}</div>
          <div style="font-size:.85rem;color:var(--text-light);margin-top:4px">
            ${ggEsc(m.meeting_date || '')} ${m.start_time ? '• ' + ggEsc(m.start_time) : ''}
            ${m.end_time ? ' - ' + ggEsc(m.end_time) : ''}
          </div>
          ${m.venue ? '<div style="font-size:.85rem;color:var(--text-light);margin-top:2px"><i class="fas fa-map-marker-alt"></i> ' + ggEsc(m.venue) + '</div>' : ''}
          <div style="margin-top:8px;font-size:.9rem">
            <i class="fas fa-users"></i> Total present: ${ggEsc(m.total_members_present || 0)}
          </div>

          <details style="margin-top:8px">
            <summary style="cursor:pointer;color:var(--primary);font-weight:600">View Minutes</summary>
            ${m.agenda ? '<div style="margin-top:8px"><b>Agenda</b><div style="white-space:pre-wrap">' + ggEsc(m.agenda) + '</div></div>' : ''}
            ${m.members_present ? '<div style="margin-top:8px"><b>Members Present</b><div style="white-space:pre-wrap">' + ggEsc(m.members_present) + '</div></div>' : ''}
            ${m.absent_with_apology ? '<div style="margin-top:8px"><b>Absent with Apology</b><div style="white-space:pre-wrap">' + ggEsc(m.absent_with_apology) + '</div></div>' : ''}
            ${m.absent_without_apology ? '<div style="margin-top:8px"><b>Absent without Apology</b><div style="white-space:pre-wrap">' + ggEsc(m.absent_without_apology) + '</div></div>' : ''}
            ${m.guests ? '<div style="margin-top:8px"><b>Guests</b><div>' + ggEsc(m.guests) + '</div></div>' : ''}
            ${m.minutes ? '<div style="margin-top:8px"><b>Minutes</b><div style="white-space:pre-wrap">' + ggEsc(m.minutes) + '</div></div>' : ''}
            ${ggMediaHtml(m.media_url)}
          </details>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button class="btn btn-secondary btn-sm" onclick="ggApologyModal(\'' + m.id + '\')"><i class="fas fa-hand-paper"></i> Submit Apology</button>
            ${canManage ? '<button class="btn btn-primary btn-sm" onclick="ggMeetingModal(\'' + m.id + '\')"><i class="fas fa-edit"></i> Edit Meeting</button>' : ''}
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  }

  window.ggMeetingModal = async function (meetingId) {
    let m = {};

    if (meetingId) {
      const { data } = await sb()
        .from('church_group_meetings')
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
      <div class="modal-overlay show" id="ggMeetingModal" style="display:flex" onclick="if(event.target===this)ggCloseModal('ggMeetingModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title">${meetingId ? '📝 Edit Weekly Meeting' : '📝 Add Weekly Meeting'}</div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" id="ggMeetingDate" type="date" value="${ggEsc(String(m.meeting_date || ggToday()).slice(0, 10))}">
            </div>
            <div class="form-group">
              <label class="form-label">Day</label>
              <select class="form-select" id="ggMeetingDay">
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
              <input class="form-input" id="ggMeetingStart" type="time" value="${ggEsc(m.start_time || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">End</label>
              <input class="form-input" id="ggMeetingEnd" type="time" value="${ggEsc(m.end_time || '')}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Venue</label>
            <input class="form-input" id="ggMeetingVenue" value="${ggEsc(m.venue || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Theme</label>
            <input class="form-input" id="ggMeetingTheme" value="${ggEsc(m.theme || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Agenda</label>
            <textarea class="form-textarea" id="ggMeetingAgenda" rows="5">${ggEsc(m.agenda || defaultAgenda)}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Members Present</label>
            <textarea class="form-textarea" id="ggMeetingPresent" rows="3" placeholder="One name per line">${ggEsc(m.members_present || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Absent with Apology</label>
            <textarea class="form-textarea" id="ggMeetingApology" rows="3" placeholder="Name - Reason">${ggEsc(m.absent_with_apology || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Absent without Apology</label>
            <textarea class="form-textarea" id="ggMeetingAbsent" rows="2">${ggEsc(m.absent_without_apology || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Guests / Others in Attendance</label>
            <input class="form-input" id="ggMeetingGuests" value="${ggEsc(m.guests || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Minutes / Proceedings</label>
            <textarea class="form-textarea" id="ggMeetingMinutes" rows="6">${ggEsc(m.minutes || '')}</textarea>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Time Taken (mins)</label>
              <input class="form-input" id="ggMeetingTimeTaken" type="number" value="${ggEsc(m.time_taken_minutes || 0)}">
            </div>
            <div class="form-group">
              <label class="form-label">Total Members Present</label>
              <input class="form-input" id="ggMeetingTotalPresent" type="number" value="${ggEsc(m.total_members_present || 0)}">
            </div>
          </div>

          <div class="media-upload" id="ggMeetingUpload" onclick="ggAttachMedia('meeting','ggMeetingUpload')">
            <i class="fas fa-cloud-upload-alt"></i><span>Upload media</span>
          </div>

          <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="ggSaveMeeting('${meetingId || ''}')">
            <i class="fas fa-save"></i> Save Meeting
          </button>
          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="ggCloseModal('ggMeetingModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.ggSaveMeeting = async function (meetingId) {
    const id = meetingId || null;

    const meeting_date = document.getElementById('ggMeetingDate').value || ggToday();
    const day = document.getElementById('ggMeetingDay').value;
    const start_time = document.getElementById('ggMeetingStart').value;
    const end_time = document.getElementById('ggMeetingEnd').value;
    const venue = document.getElementById('ggMeetingVenue').value.trim();
    const theme = document.getElementById('ggMeetingTheme').value.trim();
    const agenda = document.getElementById('ggMeetingAgenda').value.trim();
    const members_present = document.getElementById('ggMeetingPresent').value.trim();
    const absent_with_apology = document.getElementById('ggMeetingApology').value.trim();
    const absent_without_apology = document.getElementById('ggMeetingAbsent').value.trim();
    const guests = document.getElementById('ggMeetingGuests').value.trim();
    const minutes = document.getElementById('ggMeetingMinutes').value.trim();
    const time_taken_minutes = parseInt(document.getElementById('ggMeetingTimeTaken').value || '0', 10);

    let total_members_present = parseInt(document.getElementById('ggMeetingTotalPresent').value, 10);

    if (isNaN(total_members_present)) {
      total_members_present = members_present
        ? members_present.split(/\n+/).filter(function (x) { return x.trim(); }).length
        : 0;
    }

    const file = window._ggMedia.meeting;
    let media_url = null;

    if (file) media_url = await ggUploadMedia(file, 'group-meetings');

    const payload = {
      group_id: G.currentGroupId,
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
        .from('church_group_meetings')
        .update(payload)
        .eq('id', id);

      if (error) return alert(error.message);
    } else {
      payload.created_by = ggUser().id;

      const { error } = await sb()
        .from('church_group_meetings')
        .insert([payload]);

      if (error) return alert(error.message);
    }

    window._ggMedia.meeting = null;
    ggCloseModal('ggMeetingModal');
    ggLoadMeetings();
  };

  window.ggApologyModal = function (meetingId) {
    if (!ggUser()) return alert('Please log in first.');

    const html = `
      <div class="modal-overlay show" id="ggApologyModal" style="display:flex" onclick="if(event.target===this)ggCloseModal('ggApologyModal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-handle"></div>
          <div class="modal-title">🙏 Absent with Apology</div>

          <div class="form-group">
            <label class="form-label">Reason for Absence</label>
            <textarea class="form-textarea" id="ggApologyReason" rows="4" placeholder="State reason..."></textarea>
          </div>

          <button class="btn btn-primary btn-block" onclick="ggSaveApology('${meetingId}')"><i class="fas fa-paper-plane"></i> Submit Apology</button>
          <button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="ggCloseModal('ggApologyModal')">Cancel</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.ggSaveApology = async function (meetingId) {
    const reason = document.getElementById('ggApologyReason').value.trim();
    if (!reason) return alert('Please enter a reason.');

    const name = (window.profile && window.profile.name) || 'Member';
    const entry = name + ': ' + reason;

    const { data: meeting } = await sb()
      .from('church_group_meetings')
      .select('absent_with_apology')
      .eq('id', meetingId)
      .single();

    const current = (meeting && meeting.absent_with_apology) || '';
    const updated = current ? current + '\n' + entry : entry;

    await sb()
      .from('church_group_meetings')
      .update({ absent_with_apology: updated })
      .eq('id', meetingId);

    await sb()
      .from('church_group_meeting_attendance')
      .insert([{
        meeting_id: meetingId,
        user_id: ggUser().id,
        status: 'absent_with_apology',
        reason: reason
      }]);

    ggCloseModal('ggApologyModal');
    alert('Apology submitted.');
    ggLoadMeetings();
  };

  // =====================================================
  // REPORTS
  // =====================================================

  async function ggLoadReports() {
    const box = document.getElementById('gg-tab-reports');
    if (!box) return;

    box.innerHTML = '<div class="card">Loading...</div>';

    const { data: categories } = await sb()
      .from('church_group_categories')
      .select('*')
      .eq('group_id', G.currentGroupId)
      .order('name');

    const { data: records } = await sb()
      .from('church_group_category_records')
      .select('*')
      .eq('group_id', G.currentGroupId);

    const totals = {};
    let overallPresent = 0;
    let overallOffering = 0;

    (records || []).forEach(function (r) {
      if (!totals[r.category_id]) {
        totals[r.category_id] = { present: 0, offering: 0 };
      }
      totals[r.category_id].present += Number(r.students_present || 0);
      totals[r.category_id].offering += Number(r.total_offering || 0);

      overallPresent += Number(r.students_present || 0);
      overallOffering += Number(r.total_offering || 0);
    });

    let html = '';

    if (!categories || !categories.length) {
      html += '<div class="card">No categories yet.</div>';
    }

    (categories || []).forEach(function (c) {
      const t = totals[c.id] || { present: 0, offering: 0 };

      html += `
        <div class="card" style="margin-bottom:12px">
          <div style="font-weight:800">${ggEsc(c.name)}</div>
          <div style="font-size:.85rem;color:var(--text-light)">Age: ${ggEsc(c.min_age || 0)} - ${ggEsc(c.max_age || 99)}</div>
          <div style="margin-top:8px;display:flex;gap:14px;flex-wrap:wrap">
            <span><i class="fas fa-users"></i> ${t.present}</span>
            <span><i class="fas fa-coins"></i> ${t.offering.toFixed(2)}</span>
          </div>
        </div>
      `;
    });

    html += `
      <div class="card card-cool" style="text-align:center;font-size:1.15rem;font-weight:800;margin-top:18px">
        Total Students Present: ${overallPresent}<br>
        Total Offering: ${overallOffering.toFixed(2)}
      </div>
    `;

    box.innerHTML = html;
  }

  // =====================================================
  // INIT
  // =====================================================

  ggInjectNav();
  setInterval(ggInjectNav, 1000);
})();
