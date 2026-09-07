// public/app29.js — featured-members fix, profile pics everywhere,
// group category delete, landing ministries with login gate.

(function () {
  console.log('✝️ app29.js — pics / featured / categories / ministries');

  function sb() { return window.sb; }
  function me() { return window.user; }
  function isAdmin() { return window.isAdmin ? window.isAdmin() : false; }
  function esc(s) {
    if (window.esc) return window.esc(s);
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  async function users() {
    if (window.usersData && window.usersData.length) return window.usersData;
    let r = await sb().from('profiles').select('id,name,profile_pic,email,role').order('name');
    if (r.error) r = await sb().from('profiles').select('id,name,profile_pic,role').order('name');
    window.usersData = r.data || [];
    return window.usersData;
  }

  // =====================================================
  // 1) FEATURED MEMBERS: enrich in-system users (name + photo)
  // =====================================================
  async function h29Enrich() {
    const list = window._featured || [];
    const need = list.filter(function (p) { return p && p.user_id && (!p.name || !p.image_url); });
    if (!need.length) return;
    const us = await users();
    need.forEach(function (p) {
      const u = us.find(function (x) { return x.id === p.user_id; });
      if (u) {
        if (!p.name) p.name = u.name || 'Member';
        if (!p.image_url) p.image_url = u.profile_pic || null;
        if (!p.role) p.role = u.role || 'Member';
      }
    });
  }

  if (window.loadFeatured && !window.loadFeatured._h29) {
    const _lf = window.loadFeatured;
    window.loadFeatured = function () {
      const p = _lf.apply(this, arguments);
      return Promise.resolve(p).then(function () { return h29Enrich(); });
    };
    window.loadFeatured._h29 = true;
  }

  // =====================================================
  // 2) PROFILE PICS EVERYWHERE (replace initials when photo exists)
  // =====================================================
  async function h29Pics() {
    const us = window.usersData && window.usersData.length ? window.usersData : await users();
    if (!us || !us.length) return;

    document.querySelectorAll('div.post-avatar').forEach(function (el) {
      if (el.dataset.h29pic) return;
      if (el.querySelector('img')) { el.dataset.h29pic = '1'; return; }

      const scope = el.parentElement || el;
      const leaves = Array.from(scope.querySelectorAll('div,b,strong,span')).filter(function (d) {
        return d.children.length === 0;
      });

      for (let i = 0; i < leaves.length; i++) {
        const nm = (leaves[i].textContent || '').trim();
        if (nm.length < 2 || nm.length > 40) continue;
        const u = us.find(function (x) {
          return x.name && x.profile_pic && x.name.trim().toLowerCase() === nm.toLowerCase();
        });
        if (u) {
          el.innerHTML = '<img src="' + u.profile_pic + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';
          el.dataset.h29pic = '1';
          return;
        }
      }
      el.dataset.h29pic = '1';
    });
  }

  // =====================================================
  // 3) DELETE CATEGORY IN GROUPS
  // =====================================================
  if (window.ggOpenGroup && !window.ggOpenGroup._h29wrap) {
    const _go = window.ggOpenGroup;
    window.ggOpenGroup = function (id) {
      window._h29GroupId = id;
      return _go.apply(this, arguments);
    };
    window.ggOpenGroup._h29wrap = true;
  }

  function h29CatDeleteButtons() {
    const box = document.getElementById('gg-tab-categories');
    if (!box) return;

    box.querySelectorAll('[onclick*="ggOpenCategory"]').forEach(function (btn) {
      const card = btn.closest('.card');
      if (!card || card.querySelector('[data-h29del]')) return;
      const m = (btn.getAttribute('onclick') || '').match(/ggOpenCategory\('([^']+)'\)/);
      if (!m) return;
      const id = m[1];

      const b = document.createElement('button');
      b.className = 'btn btn-danger btn-sm';
      b.setAttribute('data-h29del', '1');
      b.style.marginLeft = '8px';
      b.innerHTML = '<i class="fas fa-trash"></i> Delete';
      b.onclick = function (ev) { ev.stopPropagation(); window.h29DeleteCategory(id); };
      btn.parentNode.insertBefore(b, btn.nextSibling);
    });
  }

  window.h29DeleteCategory = async function (id) {
    if (!confirm('Delete this category? Its attendance records will also be deleted.')) return;

    const gid = window._h29GroupId;
    let ok = isAdmin();
    if (!ok && gid && me()) {
      const r = await sb().from('church_group_members').select('role')
        .eq('group_id', gid).eq('user_id', me().id).limit(1);
      const role = String(((r.data || [])[0] || {}).role || '').toLowerCase();
      ok = ['leader', 'chairman'].includes(role);
    }
    if (!ok) return alert('Only Admin or Group Leader/Chairman can delete categories.');

    const r = await sb().from('church_group_categories').delete().eq('id', id);
    if (r.error) return alert(r.error.message);

    alert('Category deleted.');
    if (window.ggSwitchGroupTab) window.ggSwitchGroupTab('categories');
  };

  // =====================================================
  // 4) LANDING MINISTRIES = real groups + login gate
  // =====================================================
  function h29Ministries() {
    const landing = document.querySelector('.public-landing');
    if (!landing || landing.classList.contains('hidden')) return;

    const head = Array.from(landing.querySelectorAll('h1,h2,h3,h4,.section-title'))
      .find(function (h) { return /ministries|ministry/i.test(h.textContent || ''); });
    if (!head) return;

    const sec = head.closest('section') || head.parentElement;
    if (!sec || sec.dataset.h29min) return;
    sec.dataset.h29min = '1';

    (async function () {
      const r = await sb().from('church_groups').select('id,name,description').order('name');
      const groups = r.data || [];
      if (!groups.length) return;

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:18px';
      grid.innerHTML = groups.map(function (g) {
        return '<div onclick="h29MinistryTap(\'' + g.id + '\')" style="border-radius:16px;padding:16px;text-align:center;color:#fff;background:var(--gradient);cursor:pointer;font-weight:800;box-shadow:0 10px 22px -10px rgba(79,70,229,.6)">'
          + esc(g.name)
          + '<div style="font-size:.7rem;font-weight:600;opacity:.85;margin-top:4px">' + esc(g.description || 'Ministry') + '</div></div>';
      }).join('');
      sec.appendChild(grid);
    })();
  }

  window.h29MinistryTap = function (id) {
    if (!me()) {
      alert('Please log in first, or register if you do not have an account.');
      ['loginModal', 'authModal', 'signInModal', 'loginSection'].forEach(function (mid) {
        const el = document.getElementById(mid);
        if (el && window.openModal) { try { window.openModal(mid); } catch (e) {} }
      });
      return;
    }
    if (window.ggOpenGroup) window.ggOpenGroup(id);
  };

  // =====================================================
  // SYNC
  // =====================================================
  function sync() {
    h29Enrich();
    h29Pics();
    h29CatDeleteButtons();
    h29Ministries();
  }
  sync();
  setInterval(sync, 2000);
})();
