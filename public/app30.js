// public/app32.js — exact verse share + visible private share, full category module
// (forum/roles/meetings/reports), offering role-gating, prayer delete, reply media.
(function () {
  console.log('✝️ app32.js');
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
  window._h32Media = window._h32Media || {};
  window.h32Attach = function (key, labelId) { var i = document.createElement('input'); i.type = 'file'; i.accept = '*/*'; i.onchange = function () { var f = i.files && i.files[0]; if (!f) return; window._h32Media[key] = f; var l = document.getElementById(labelId); if (l) l.innerHTML = '<i class="fas fa-check-circle"></i> ' + esc(f.name); }; i.click(); };

  // FIX #2 + APOLOGY VISIBILITY: .btn-secondary is white-on-white inside the app.
  // Make it visible everywhere EXCEPT the public landing hero (where white-on-gradient is correct).
  (function () {
    var st = document.createElement('style');
    st.textContent =
      '.btn-secondary{background:#EEF2FF;color:#3730A3;border:2px solid #C7D2FE;backdrop-filter:none}' +
      '.btn-secondary:hover{background:#E0E7FF}' +
      '.public-landing .btn-secondary,.hero-section .btn-secondary,.decision-overlay .btn-secondary{background:rgba(255,255,255,.2);color:#fff;border:2px solid rgba(255,255,255,.4);backdrop-filter:blur(10px)}';
    document.head.appendChild(st);
  })();

  // ---------- ROLE HELPERS (role integrity) ----------
  async function groupRole(gid) { if (!me()) return ''; var r = await sb().from('church_group_members').select('role').eq('group_id', gid).eq('user_id', me().id).limit(1); return String(((r.data || [])[0] || {}).role || '').toLowerCase(); }
  async function groupManage(gid) { if (isAdmin()) return true; return ['leader', 'chairman'].includes(await groupRole(gid)); }
  async function catRole(cid) { if (!me()) return ''; var r = await sb().from('church_group_category_members').select('role').eq('category_id', cid).eq('user_id', me().id).limit(1); return String(((r.data || [])[0] || {}).role || '').toLowerCase(); }
  async function catManage(cat) { if (!cat) return false; if (isAdmin()) return true; if (cat.teacher_id && me() && cat.teacher_id === me().id) return true; if (['leader', 'chairman'].includes(await groupRole(cat.group_id))) return true; return ['teacher', 'leader', 'chairman'].includes(await catRole(cat.id)); }
  async function catCanPost(cat) { return catManage(cat); } // leadership & teachers post; others comment

  // ---------- FIX #1: VERSE SHARE (book, chapter, verse no., exact text) ----------
  function parseRef(ref) { var m = String(ref || '').match(/^(.+?)\s+(\d+)$/); return m ? { book: m[1], chap: m[2] } : { book: String(ref || ''), chap: '' }; }
  function normSel() {
    var sel = window._selectedVerses || [], bank = window._bibleVerses || [], out = [];
    sel.forEach(function (v) {
      var num = null, txt = '';
      if (typeof v === 'number') num = v;
      else if (typeof v === 'string') { var mm = v.match(/\d+/); num = mm ? +mm[0] : null; txt = v.replace(/^\s*\d+\s*/, ''); }
      else if (v && v.nodeType === 1) { var t = (v.textContent || '').trim(); var mn = t.match(/^(\d+)/); num = mn ? +mn[1] : null; txt = t.replace(/^\d+\s*/, ''); }
      else if (v && typeof v === 'object') { num = (v.verse != null ? +v.verse : (v.v != null ? +v.v : (v.num != null ? +v.num : null))); txt = v.text || v.t || ''; }
      if (num != null && !txt) { var b = bank.find(function (x) { return +x.verse === num; }); if (b) txt = b.text || ''; }
      if (num != null || txt) out.push({ num: num, text: txt });
    });
    if (!out.length) document.querySelectorAll('#readerOut p[data-sel="1"],#readerOut p.selected,#readerOut p[style*="D1FAE5"]').forEach(function (p) { var t = (p.textContent || '').trim(); var mn = t.match(/^(\d+)/); if (mn) out.push({ num: +mn[1], text: t.replace(/^\d+\s*/, '') }); });
    return out;
  }
  function verseText32() {
    var ref = ''; var refEl = document.querySelector('[style*="92400E"]'); if (refEl) ref = (refEl.textContent || '').trim();
    if (!ref) { var rr = document.getElementById('readerRef'); if (rr) ref = rr.value || ''; }
    var pr = parseRef(ref);
    var body = normSel().map(function (s) { return pr.book + (pr.chap ? ' ' + pr.chap : '') + ':' + (s.num != null ? s.num : '') + ' "' + s.text + '"'; }).join('\n');
    return { ref: ref, body: body };
  }
  window.openShareVerses = function () {
    var v = verseText32();
    if (!v.body) return alert('Select verse(s) first by tapping them.');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="h32Share" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div>'
      + '<div class="modal-title"><i class="fas fa-share"></i> Share Verse</div>'
      + '<div style="background:var(--bg);border-radius:12px;padding:10px;margin-bottom:10px;white-space:pre-wrap;font-size:.85rem;max-height:200px;overflow-y:auto">' + esc(v.body).slice(0, 600) + '</div>'
      + '<button class="btn btn-primary btn-block" onclick="h32ShareForum()"><i class="fas fa-comments"></i> Share to Public Forum</button>'
      + '<button class="btn btn-warm btn-block" style="margin-top:8px" onclick="h32SharePrivatePick()"><i class="fas fa-user"></i> Share Privately (member inbox)</button>'
      + '<button class="btn btn-secondary-alt btn-block" style="margin-top:8px" onclick="document.getElementById(\'h32Share\').remove()">Cancel</button>'
      + '</div></div>');
  };
  window.h32ShareForum = async function () {
    var v = verseText32();
    var r = await sb().from('community_posts').insert([{ group_type: 'forum', group_id: '11111111-1111-1111-1111-111111111111', user_id: me().id, text: '📖 ' + v.body, media_url: null }]);
    if (r.error) return alert(r.error.message);
    document.getElementById('h32Share').remove(); alert('✅ Shared to Public Forum.');
    if (window.h30OpenForum) window.h30OpenForum(); else if (window.h27OpenPage) window.h27OpenPage('forum');
  };
  window.h32SharePrivatePick = async function () {
    var us = await users(); document.getElementById('h32Share').remove();
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="h32Priv" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title"><i class="fas fa-user"></i> Send to member inbox</div>'
      + '<div style="max-height:320px;overflow-y:auto">' + us.filter(function (u) { return !me() || u.id !== me().id; }).map(function (u) {
        return '<div onclick="h32SharePrivate(\'' + u.id + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">' + avatarHtml(u, 32) + '<div style="flex:1"><b style="font-size:.85rem">' + esc(u.name) + '</b></div><i class="fas fa-paper-plane" style="color:var(--primary)"></i></div>';
      }).join('') + '</div></div></div>');
  };
  window.h32SharePrivate = async function (uid) {
    var v = verseText32();
    var r = await sb().from('community_chat').insert([{ sender_id: me().id, receiver_id: uid, text: '📖 ' + v.body, media_url: null }]);
    if (r.error) return alert(r.error.message);
    sb().from('notifications').insert([{ user_id: uid, title: '📖 Verse shared with you', message: v.body.split('\n')[0], body: v.body }]).then(function () {});
    document.getElementById('h32Priv').remove(); alert('✅ Sent to member inbox.');
  };

  // ---------- FIX #4: FULL CATEGORY PAGE (forum + roles + meetings + reports) ----------
  if (window.ggOpenGroup && !window.ggOpenGroup._h32gid) { var _go = window.ggOpenGroup; window.ggOpenGroup = function (id) { window._h32GroupId = id; return _go.apply(this, arguments); }; window.ggOpenGroup._h32gid = true; }

  window.ggOpenCategory = async function (categoryId) {
    if (!me()) return alert('Please log in first.');
    var root = document.getElementById('gg-root'); if (!root) return;
    root.innerHTML = '<div class="card">Loading...</div>';
    var c = await sb().from('church_group_categories').select('*').eq('id', categoryId).single();
    if (c.error || !c.data) return alert('Category not found.');
    var cat = c.data; window._h32Cat = cat;
    var gm = await groupManage(cat.group_id), cm = await catManage(cat), cr = await catRole(cat.id);
    var us = await users(); var teacher = us.find(function (u) { return u.id === cat.teacher_id; });
    var memRow = me() ? ((await sb().from('church_group_category_members').select('*').eq('category_id', cat.id).eq('user_id', me().id).limit(1)).data || [])[0] : null;
    var inGroup = !!(await groupRole(cat.group_id)) || isAdmin();
    var html = '<button class="back-btn" onclick="ggOpenGroup(\'' + cat.group_id + '\');setTimeout(function(){ggSwitchGroupTab(\'categories\');},400)"><i class="fas fa-arrow-left"></i> Back</button>'
      + '<div class="dept-banner" style="border-radius:20px;margin-bottom:14px"><div class="dept-icon" style="background:var(--gradient-warm)"><i class="fas fa-child"></i></div><div><div style="font-weight:800;font-size:1.2rem">' + esc(cat.name) + '</div><div style="font-size:.83rem;opacity:.9">Age: ' + esc(cat.min_age || 0) + ' - ' + esc(cat.max_age || 99) + '</div><div style="font-size:.8rem;opacity:.9"><i class="fas fa-chalkboard-teacher"></i> Teacher: ' + esc((teacher && teacher.name) || 'Not assigned') + '</div></div></div>';
    if (inGroup) html += '<button class="btn ' + (memRow ? 'btn-danger' : 'btn-primary') + ' btn-sm" style="margin-bottom:10px" onclick="h32CatJoin(\'' + cat.id + '\')">' + (memRow ? '<i class="fas fa-sign-out-alt"></i> Leave Category' : '<i class="fas fa-sign-in-alt"></i> Join Category') + '</button>'
      + (memRow ? ' <span class="chip chip-green">Your role: ' + esc(memRow.role || 'Member') + '</span>' : '');
    if (gm) html += ' <button class="btn btn-warm btn-sm" style="margin-bottom:10px" onclick="h32AssignTeacher(\'' + cat.id + '\')"><i class="fas fa-chalkboard-teacher"></i> Assign Teacher</button>';
    html += '<div class="tabs"><div class="tab active" id="h32ct-forum" onclick="h32CatTab(\'forum\')">Forum</div><div class="tab" id="h32ct-members" onclick="h32CatTab(\'members\')">Members</div><div class="tab" id="h32ct-meetings" onclick="h32CatTab(\'meetings\')">Meetings</div><div class="tab" id="h32ct-reports" onclick="h32CatTab(\'reports\')">Reports</div></div>'
      + '<div id="h32c-forum"></div><div id="h32c-members" style="display:none"></div><div id="h32c-meetings" style="display:none"></div><div id="h32c-reports" style="display:none"></div>';
    root.innerHTML = html;
    window.h32CatTab('forum');
  };
  window.h32CatTab = function (t) {
    ['forum', 'members', 'meetings', 'reports'].forEach(function (x) { var b = document.getElementById('h32ct-' + x); if (b) b.classList.toggle('active', x === t); var p = document.getElementById('h32c-' + x); if (p) p.style.display = x === t ? 'block' : 'none'; });
    if (!window._h32Cat) return;
    if (t === 'forum') h32CatForum(); if (t === 'members') h32CatMembers(); if (t === 'meetings') h32CatMeetings(); if (t === 'reports') h32CatReports();
  };
  window.h32CatJoin = async function (cid) {
    if (me()) { var ex = (await sb().from('church_group_category_members').select('id').eq('category_id', cid).eq('user_id', me().id).limit(1)).data || [];
      if (ex.length) { await sb().from('church_group_category_members').delete().eq('id', ex[0].id); }
      else { var r = await sb().from('church_group_category_members').insert([{ category_id: cid, user_id: me().id, role: 'Member' }]); if (r.error) return alert(r.error.message); } }
    window.ggOpenCategory(cid);
  };
  window.h32AssignTeacher = async function (cid) {
    var us = await users();
    document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay show" id="h32T" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">Assign Teacher</div><div style="max-height:320px;overflow-y:auto">' + us.map(function (u) { return '<div onclick="h32SetTeacher(\'' + cid + '\',\'' + u.id + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">' + avatarHtml(u, 32) + '<b style="font-size:.85rem">' + esc(u.name) + '</b></div>'; }).join('') + '</div></div></div>');
  };
  window.h32SetTeacher = async function (cid, uid) { var r = await sb().from('church_group_categories').update({ teacher_id: uid }).eq('id', cid); if (r.error) return alert(r.error.message); document.getElementById('h32T').remove(); window.ggOpenCategory(cid); };
  window.h32CatSetRole = async function (uid, role) { var r = await sb().from('church_group_category_members').update({ role: role }).eq('category_id', window._h32Cat.id).eq('user_id', uid); if (r.error) return alert(r.error.message); h32CatMembers(); };
  window.h32CatRemove = async function (uid) { if (!confirm('Remove from category?')) return; await sb().from('church_group_category_members').delete().eq('category_id', window._h32Cat.id).eq('user_id', uid); h32CatMembers(); };

  async function h32CatForum() {
    var cat = window._h32Cat, box = document.getElementById('h32c-forum'); if (!box) return;
    var canPost = await catCanPost(cat);
    var html = '<div class="card">';
    if (canPost) html += '<textarea class="form-textarea" id="h32cfText" rows="2" placeholder="Post to ' + esc(cat.name) + ' forum..."></textarea>'
      + '<div class="media-upload" id="h32cfUp" onclick="h32Attach(\'cfpost\',\'h32cfUp\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media/video/file (optional)</span></div>'
      + '<button class="btn btn-primary btn-block" onclick="h32CatPost()"><i class="fas fa-paper-plane"></i> Post</button>';
    else html += '<div style="font-size:.8rem;color:var(--text-light)">Leadership & teachers can post. Members can comment on posts (with optional media).</div>';
    html += '<div id="h32cfList" style="margin-top:10px"></div></div>';
    box.innerHTML = html; h32CatLoadPosts();
  }
  window.h32CatPost = async function () {
    var t = document.getElementById('h32cfText').value.trim(), f = window._h32Media.cfpost;
    if (!t && !f) return alert('Write something or add media.');
    var url = f ? await upload(f, 'category-forum') : null;
    var r = await sb().from('community_posts').insert([{ group_type: 'category', group_id: window._h32Cat.id, user_id: me().id, text: t, media_url: url }]);
    if (r.error) return alert(r.error.message);
    window._h32Media.cfpost = null; document.getElementById('h32cfText').value = ''; h32CatLoadPosts();
  };
  window.h32CatDelPost = async function (id) { if (!confirm('Delete post?')) return; await sb().from('community_comments').delete().eq('post_id', id); await sb().from('community_posts').delete().eq('id', id); h32CatLoadPosts(); };
  window.h32CatDelComment = async function (id) { if (!confirm('Delete comment/reply?')) return; await sb().from('community_comments').delete().eq('id', id); h32CatLoadPosts(); };
  window.h32CatComment = async function (postId, parentId) {
    var iid = parentId ? 'h32rt-' + parentId : 'h32ci-' + postId;
    var key = parentId ? 'cr_' + parentId : 'cc_' + postId;
    var t = document.getElementById(iid).value.trim(), f = window._h32Media[key];
    if (!t && !f) return;
    var url = f ? await upload(f, 'category-comments') : null;
    var r = await sb().from('community_comments').insert([{ post_id: postId, user_id: me().id, text: t, media_url: url, parent_comment_id: parentId || null }]);
    if (r.error) return alert(r.error.message);
    window._h32Media[key] = null; h32CatLoadPosts();
  };
  window.h32Toggle = function (id) { var e = document.getElementById(id); if (e) e.style.display = e.style.display === 'none' ? 'block' : 'none'; };
  async function h32CatLoadPosts() {
    var box = document.getElementById('h32cfList'); if (!box) return;
    var cat = window._h32Cat;
    var posts = await sb().from('community_posts').select('*').eq('group_type', 'category').eq('group_id', cat.id).order('created_at', { ascending: false }).limit(50);
    if (posts.error) { box.innerHTML = esc(posts.error.message); return; }
    var ids = (posts.data || []).map(function (p) { return p.id; });
    var cs = { data: [] }; if (ids.length) cs = await sb().from('community_comments').select('*').in('post_id', ids).order('created_at');
    var us = await users(); window._h32Users = us;
    var byPost = {}; (cs.data || []).forEach(function (c) { (byPost[c.post_id] = byPost[c.post_id] || []).push(c); });
    function tree(list) { var map = {}, roots = []; list.forEach(function (c) { c._k = []; map[c.id] = c; }); list.forEach(function (c) { if (c.parent_comment_id && map[c.parent_comment_id]) map[c.parent_comment_id]._k.push(c); else roots.push(c); }); return roots; }
    function comments(list, depth, postId) {
      return list.map(function (c) {
        var u = us.find(function (x) { return x.id === c.user_id; });
        var canDel = isAdmin() || (me() && c.user_id === me().id);
        return '<div style="margin-left:' + Math.min(depth, 4) * 16 + 'px;margin-top:8px;background:var(--bg);border-radius:12px;padding:8px">'
          + '<div style="display:flex;gap:6px;align-items:center">' + avatarHtml(u, 26) + '<b style="font-size:.78rem;flex:1">' + esc((u && u.name) || 'Member') + '</b>' + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h32CatDelComment(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>'
          + '<div style="font-size:.88rem;white-space:pre-wrap;margin-top:4px">' + esc(c.text || '') + '</div>' + mediaHtml(c.media_url)
          + '<button style="border:none;background:none;color:var(--primary);font-size:.72rem;font-weight:800;margin-top:4px" onclick="h32Toggle(\'h32r-' + c.id + '\')"><i class="fas fa-reply"></i> Reply</button>'
          + '<div id="h32r-' + c.id + '" style="display:none;margin-top:6px"><div style="display:flex;gap:6px;align-items:center"><input class="form-input" id="h32rt-' + c.id + '" placeholder="Reply..." style="flex:1"><button class="btn btn-secondary btn-sm" onclick="h32Attach(\'cr_' + c.id + '\',\'h32ru-' + c.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h32ru-' + c.id + '" style="font-size:.65rem"></span><button class="btn btn-primary btn-sm" onclick="h32CatComment(\'' + postId + '\',\'' + c.id + '\')"><i class="fas fa-paper-plane"></i></button></div></div>'
          + comments(c._k || [], depth + 1, postId) + '</div>';
      }).join('');
    }
    box.innerHTML = (posts.data || []).map(function (p) {
      var u = us.find(function (x) { return x.id === p.user_id; });
      var canDel = isAdmin() || (me() && p.user_id === me().id);
      return '<div class="card" style="border-radius:16px;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:center">' + avatarHtml(u, 38)
        + '<div style="flex:1"><b style="font-size:.9rem">' + esc((u && u.name) || 'Member') + '</b><div style="font-size:.68rem;color:var(--text-light)">' + fdate(p.created_at) + '</div></div>'
        + (canDel ? '<button class="btn btn-danger btn-sm" onclick="h32CatDelPost(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>'
        + '<div style="white-space:pre-wrap;margin:8px 0">' + esc(p.text || '') + '</div>' + mediaHtml(p.media_url)
        + comments(tree(byPost[p.id] || []), 0, p.id)
        + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center"><input class="form-input" id="h32ci-' + p.id + '" placeholder="Comment..." style="flex:1"><button class="btn btn-secondary btn-sm" onclick="h32Attach(\'cc_' + p.id + '\',\'h32cu-' + p.id + '\')"><i class="fas fa-paperclip"></i></button><span id="h32cu-' + p.id + '" style="font-size:.65rem"></span><button class="btn btn-primary btn-sm" onclick="h32CatComment(\'' + p.id + '\',null)"><i class="fas fa-paper-plane"></i></button></div></div>';
    }).join('') || '<div style="color:var(--text-light);text-align:center">No posts yet.</div>';
  }
  async function h32CatMembers() {
    var cat = window._h32Cat, box = document.getElementById('h32c-members'); if (!box) return;
    var gm = await groupManage(cat.group_id);
    var m = await sb().from('church_group_category_members').select('*').eq('category_id', cat.id);
    var us = await users(); var html = '';
    (m.data || []).forEach(function (r) {
      var u = us.find(function (x) { return x.id === r.user_id; });
      html += '<div class="card" style="margin-bottom:8px"><div style="display:flex;gap:10px;align-items:center">' + avatarHtml(u, 38)
        + '<div style="flex:1"><b>' + esc((u && u.name) || 'Member') + '</b><div style="font-size:.72rem;color:var(--primary);font-weight:700">' + esc(r.role || 'Member') + '</div></div></div>'
        + (gm ? '<div style="display:flex;gap:8px;margin-top:8px"><select class="form-select" onchange="h32CatSetRole(\'' + r.user_id + '\',this.value)">' + ['Member', 'Teacher', 'Leader', 'Chairman'].map(function (o) { return '<option' + ((r.role || 'Member') === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select><button class="btn btn-danger btn-sm" onclick="h32CatRemove(\'' + r.user_id + '\')"><i class="fas fa-trash"></i></button></div>' : '') + '</div>';
    });
    if (!(m.data || []).length) html += '<div class="card">No category members yet. Join the category first.</div>';
    if (gm) html += '<button class="btn btn-warm btn-block" onclick="h32CatAddPick()"><i class="fas fa-user-plus"></i> Add Member (from group)</button>';
    box.innerHTML = html;
  }
  window.h32CatAddPick = async function () {
    var cat = window._h32Cat;
    var gmRows = await sb().from('church_group_members').select('user_id').eq('group_id', cat.group_id);
    var have = ((await sb().from('church_group_category_members').select('user_id').eq('category_id', cat.id)).data || []).map(function (x) { return x.user_id; });
    var us = await users();
    var list = (gmRows.data || []).filter(function (g) { return !have.includes(g.user_id); }).map(function (g) { return us.find(function (u) { return u.id === g.user_id; }); }).filter(Boolean);
    document.body.insertAdjacentHTML('beforeend', '<div class="modal-overlay show" id="h32AM" style="display:flex" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">Add category member</div><div style="max-height:320px;overflow-y:auto">' + (list.map(function (u) { return '<div onclick="h32CatAdd(\'' + u.id + '\')" style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:var(--bg);margin-bottom:6px;cursor:pointer">' + avatarHtml(u, 32) + '<b style="font-size:.85rem">' + esc(u.name) + '</b></div>'; }).join('') || '<div class="card">All group members are already in this category.</div>') + '</div></div></div>');
  };
  window.h32CatAdd = async function (uid) { var r = await sb().from('church_group_category_members').insert([{ category_id: window._h32Cat.id, user_id: uid, role: 'Member' }]); if (r.error) return alert(r.error.message); document.getElementById('h32AM').remove(); h32CatMembers(); };
  async function h32CatMeetings() {
    var cat = window._h32Cat, box = document.getElementById('h32c-meetings'); if (!box) return;
    var cm = await catManage(cat);
    var r = await sb().from('church_group_category_records').select('*').eq('category_id', cat.id).order('record_date', { ascending: false }).limit(100);
    var html = '';
    if (cm) html += '<div class="card"><b>📝 Take Category Attendance / Meeting</b>'
      + '<div class="grid-2" style="margin-top:8px"><input class="form-input" id="h32mDate" type="date"><input class="form-input" id="h32mPresent" type="number" placeholder="No. present"></div>'
      + '<textarea class="form-textarea" id="h32mNames" rows="2" placeholder="Names of students known attendance" style="margin-top:8px"></textarea>'
      + '<input class="form-input" id="h32mLesson" placeholder="Lesson / theme" style="margin-top:8px">'
      + '<input class="form-input" id="h32mOffering" type="number" step="0.01" placeholder="Total offering" style="margin-top:8px">'
      + '<div class="media-upload" id="h32mUp" style="margin-top:8px" onclick="h32Attach(\'mmedia\',\'h32mUp\')"><i class="fas fa-cloud-upload-alt"></i><span>Upload media (optional)</span></div>'
      + '<button class="btn btn-primary btn-block" onclick="h32SaveRecord()"><i class="fas fa-save"></i> Save Record</button></div>';
    var tp = 0, to = 0;
    (r.data || []).forEach(function (x) { tp += Number(x.students_present || 0); to += Number(x.total_offering || 0);
      html += '<div class="card"><b>' + esc(x.lesson || 'Meeting') + '</b><div style="font-size:.78rem;color:var(--text-light)">' + esc(x.record_date || '') + '</div><div style="margin-top:4px"><i class="fas fa-users"></i> ' + esc(x.students_present || 0) + ' present' + (cm ? ' &nbsp; <i class="fas fa-coins"></i> ' + Number(x.total_offering || 0).toFixed(2) : '') + '</div>' + (x.student_names ? '<div style="font-size:.78rem;white-space:pre-wrap;margin-top:4px">' + esc(x.student_names) + '</div>' : '') + mediaHtml(x.media_url) + '</div>'; });
    html += '<div class="card" style="text-align:center;font-weight:800">Total Students Present: ' + tp + (cm ? '<br>Total Offering: ' + to.toFixed(2) : '<br><span style="font-size:.72rem;color:var(--text-lighter)">Offering visible to leadership/teacher only</span>') + '</div>';
    box.innerHTML = html || '<div class="card">No meetings yet.</div>';
  }
  window.h32SaveRecord = async function () {
    var cat = window._h32Cat, f = window._h32Media.mmedia;
    var url = f ? await upload(f, 'category-records') : null;
    var r = await sb().from('church_group_category_records').insert([{ category_id: cat.id, group_id: cat.group_id, record_date: document.getElementById('h32mDate').value, student_names: document.getElementById('h32mNames').value.trim(), students_present: Number(document.getElementById('h32mPresent').value || 0), total_offering: Number(document.getElementById('h32mOffering').value || 0), lesson: document.getElementById('h32mLesson').value.trim(), media_url: url }]);
    if (r.error) return alert(r.error.message);
    window._h32Media.mmedia = null; h32CatMeetings();
  };
  async function h32CatReports() {
    var cat = window._h32Cat, box = document.getElementById('h32c-reports'); if (!box) return;
    var cm = await catManage(cat);
    var r = await sb().from('church_group_category_records').select('*').eq('category_id', cat.id);
    var tp = 0, to = 0; (r.data || []).forEach(function (x) { tp += Number(x.students_present || 0); to += Number(x.total_offering || 0); });
    box.innerHTML = '<div class="card" style="text-align:center;font-weight:800">Total Students Present: ' + tp + (cm ? '<br>Total Offering: ' + to.toFixed(2) : '<br><span style="font-size:.72rem;color:var(--text-lighter)">Offering totals hidden for members</span>') + '</div>'
      + (cm ? '<div class="card">' + (r.data || []).map(function (x) { return '<div style="display:flex;justify-content:space-between;font-size:.82rem;padding:4px 0;border-bottom:1px solid var(--border)"><span>' + esc(x.record_date || '') + ' • ' + esc(x.lesson || 'Record') + '</span><b>' + Number(x.total_offering || 0).toFixed(2) + '</b></div>'; }).join('') + '</div>' : '');
  }

  // ---------- FIX #3: GROUP REPORTS role-gated + TOTAL OFFERING placeholder ----------
  if (window.ggSwitchGroupTab && !window.ggSwitchGroupTab._h32) {
    var _gst = window.ggSwitchGroupTab;
    window.ggSwitchGroupTab = function (tab) { var res = _gst.apply(this, arguments); if (tab === 'reports') setTimeout(h32GroupReports, 80); if (tab === 'categories') setTimeout(h32CatTotalPlaceholder, 400); return res; };
    window.ggSwitchGroupTab._h32 = true;
  }
  async function h32GroupReports() {
    var gid = window._h32GroupId; var box = document.getElementById('gg-tab-reports'); if (!gid || !box) return;
    var see = await groupManage(gid);
    var cats = await sb().from('church_group_categories').select('*').eq('group_id', gid).order('name');
    var recs = await sb().from('church_group_category_records').select('*').eq('group_id', gid);
    var totals = {}, op = 0, oo = 0;
    (recs.data || []).forEach(function (r) { totals[r.category_id] = totals[r.category_id] || { p: 0, o: 0 }; totals[r.category_id].p += Number(r.students_present || 0); totals[r.category_id].o += Number(r.total_offering || 0); op += Number(r.students_present || 0); oo += Number(r.total_offering || 0); });
    var html = '';
    (cats.data || []).forEach(function (c) { var t = totals[c.id] || { p: 0, o: 0 };
      html += '<div class="card"><b>' + esc(c.name) + '</b><div style="font-size:.78rem;color:var(--text-light)">Age: ' + esc(c.min_age || 0) + ' - ' + esc(c.max_age || 99) + '</div><div style="margin-top:6px;display:flex;gap:14px"><span><i class="fas fa-users"></i> ' + t.p + '</span>' + (see ? '<span><i class="fas fa-coins"></i> ' + t.o.toFixed(2) + '</span>' : '') + '</div></div>'; });
    html += '<div class="card" style="text-align:center;font-weight:800">Total Students Present: ' + op + (see ? '<br>Total Offering (all categories): ' + oo.toFixed(2) : '<br><span style="font-size:.75rem;color:var(--text-lighter)">Offering totals visible to leadership only</span>') + '</div>';
    box.innerHTML = html;
  }
  async function h32CatTotalPlaceholder() {
    var gid = window._h32GroupId; var box = document.getElementById('gg-tab-categories'); if (!gid || !box || document.getElementById('h32TotalOffering')) return;
    if (!(await groupManage(gid))) return;
    var recs = await sb().from('church_group_category_records').select('total_offering').eq('group_id', gid);
    var oo = 0; (recs.data || []).forEach(function (r) { oo += Number(r.total_offering || 0); });
    box.insertAdjacentHTML('beforeend', '<div class="card" id="h32TotalOffering" style="text-align:center;font-weight:800;background:linear-gradient(135deg,#10B981,#059669);color:#fff">Total Offering (all categories): ' + oo.toFixed(2) + '</div>');
  }

  // ---------- PRAYER DELETE (admin + owner) ----------
  setInterval(function () { var client = window.sb; if (!client || !client.from || client._h32cap) return; client._h32cap = true; var _from = client.from.bind(client); client.from = function (t) { var q = _from(t); if (t === 'prayers' && q && q.then) { var _then = q.then.bind(q); q.then = function (ok, err) { return _then(function (res) { try { if (res && res.data) window._h32last_prayers = res.data; } catch (e) {} return ok ? ok(res) : res; }, err); }; } return q; }; }, 1000);
  window.h32DeletePrayer = async function (id) { if (!confirm('Delete this prayer?')) return; var r = await sb().from('prayers').delete().eq('id', id); if (r.error) return alert(r.error.message); if (window.loadPrayerWall) window.loadPrayerWall(); if (window.h27OpenPage) window.h27OpenPage('prayer'); };
  setInterval(function () {
    var caps = window._h32last_prayers || []; if (!caps.length) return;
    var cons = []; var pl = document.getElementById('prayersList'); if (pl) cons.push(pl);
    var h27 = document.getElementById('h27-root'); if (h27 && /Prayer/i.test(h27.textContent || '')) cons.push(h27);
    cons.forEach(function (con) {
      var cards = con.querySelectorAll('.card, .post'); if (cards.length !== caps.length) return;
      cards.forEach(function (card, i) {
        if (card.querySelector('[data-h32pdel]')) return;
        var row = caps[i]; if (!row) return;
        if (!isAdmin() && !(me() && row.user_id === me().id)) return;
        var b = document.createElement('button'); b.className = 'btn btn-danger btn-sm'; b.setAttribute('data-h32pdel', '1'); b.style.cssText = 'position:absolute;top:8px;right:8px'; b.innerHTML = '<i class="fas fa-trash"></i>';
        b.onclick = function (ev) { ev.stopPropagation(); window.h32DeletePrayer(row.id); };
        card.style.position = 'relative'; card.appendChild(b);
      });
    });
  }, 1500);

  // ---------- SYSTEM-WIDE OPTIONAL MEDIA ON REPLIES/COMMENTS ----------
  setInterval(function () {
    document.querySelectorAll('input[placeholder*="omment"],input[placeholder*="eply"],textarea[placeholder*="omment"],textarea[placeholder*="eply"]').forEach(function (inp) {
      if (inp.closest('#h32c-forum')) return;
      var wrap = inp.parentElement; if (!wrap || wrap.querySelector('[data-h32clip]')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-secondary btn-sm'; b.setAttribute('data-h32clip', '1'); b.innerHTML = '<i class="fas fa-paperclip"></i>';
      b.onclick = function () { var i = document.createElement('input'); i.type = 'file'; i.accept = '*/*'; i.onchange = function () { var f = i.files && i.files[0]; if (!f) return; window._h32Pending = f; b.innerHTML = '<i class="fas fa-check-circle"></i>'; }; i.click(); };
      wrap.insertBefore(b, inp.nextSibling);
    });
  }, 1500);
  setInterval(function () {
    ['ggComment', 'ggAddComment', 'ggSubmitComment', 'ggReply', 'c26Comment', 'c26AddComment', 'c26Reply', 'submitComment', 'addComment', 'replyComment', 'submitPrayer', 'prayerReply', 'submitPrayerReply', 'h27PrayerReply', 'h27Comment'].forEach(function (n) {
      var fn = window[n]; if (typeof fn !== 'function' || fn._h32w) return;
      window[n] = function () {
        var pending = window._h32Pending;
        var res = fn.apply(this, arguments);
        var after = async function () {
          if (!pending) return; window._h32Pending = null;
          try {
            var url = await upload(pending, 'replies');
            var since = new Date(Date.now() - 8000).toISOString();
            var r = await sb().from('community_comments').select('id').eq('user_id', me().id).gte('created_at', since).order('created_at', { ascending: false }).limit(1);
            if (r.data && r.data[0]) await sb().from('community_comments').update({ media_url: url }).eq('id', r.data[0].id);
          } catch (e) {}
        };
        if (res && res.then) res.then(after, after); else setTimeout(after, 900);
        return res;
      };
      window[n]._h32w = true;
    });
  }, 2000);


})();
