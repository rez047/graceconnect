/* ============================================================
   GRACECONNECT — APP35.JS
   Persistent Live Preachings + Previous Live Sessions
   Nested Discussion + Media
   Devotional fallback + Dedicated Notifications

   IMPORTANT:
   - NEVER writes live sessions into Sermons
   - NEVER uses #preachingsList for live history
   - Creates its own "Previous Live Sessions" tab/container
   - Existing App33/App34 sermon/document content is preserved
   ============================================================ */

(function () {
  'use strict';

  var LIVE_TABLE = 'preaching_lives';
  var COMMENT_TABLE = 'preaching_comments';

  var activeLive = null;
  var viewedLive = null;
  var commentChannel = null;

  /* =========================================================
     SUPABASE
     ========================================================= */

  function db() {
    try {
      if (typeof window.sb === 'function') {
        var c = window.sb();
        if (c && c.from) return c;
      }

      if (window.sb && window.sb.from) {
        return window.sb;
      }

      if (window.supabaseClient && window.supabaseClient.from) {
        return window.supabaseClient;
      }
    } catch (e) {
      console.warn('GraceConnect Supabase lookup failed:', e);
    }

    return null;
  }

  function now35() {
    return new Date().toISOString();
  }

  function esc35(v) {
    if (typeof window.esc === 'function') {
      return window.esc(v);
    }

    return String(v == null ? '' : v).replace(/[&<>\"]/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[c] || c;
    });
  }

  function admin35() {
    try {
      return typeof window.isAdmin === 'function' && window.isAdmin();
    } catch (e) {
      return false;
    }
  }

  function toast35(message, type) {
    try {
      if (window.showToast) {
        window.showToast(message, type || 'info');
        return;
      }

      if (window.toast) {
        window.toast(message, type || 'info');
        return;
      }
    } catch (e) {}

    console.log(message);
  }

  async function currentUser35() {
    var c = db();
    if (!c || !c.auth) return null;

    try {
      var result = await c.auth.getUser();
      return result.data && result.data.user
        ? result.data.user
        : null;
    } catch (e) {
      return null;
    }
  }

  /* =========================================================
     STYLE
     ========================================================= */

  function style35() {
    if (document.getElementById('gc35-style')) return;

    var s = document.createElement('style');
    s.id = 'gc35-style';

    s.textContent =
      '.gc35-tabs{' +
        'display:flex;' +
        'gap:8px;' +
        'overflow-x:auto;' +
        'padding:4px 0 10px;' +
        'margin-bottom:12px;' +
      '}' +

      '.gc35-tab{' +
        'border:1px solid #dbe3ef;' +
        'background:#fff;' +
        'color:#334155;' +
        'border-radius:12px;' +
        'padding:10px 14px;' +
        'cursor:pointer;' +
        'font-weight:800;' +
        'white-space:nowrap;' +
      '}' +

      '.gc35-tab.active{' +
        background:'#2563eb;' +
        color:'#fff;' +
        border-color:'#2563eb;' +
      '}' +

      '.gc35-live-section{' +
        margin-top:12px;' +
      '}' +

      '.gc35-card{' +
        background:#fff;' +
        border:1px solid #e2e8f0;' +
        border-radius:16px;' +
        padding:15px;' +
        margin-bottom:10px;' +
        box-shadow:0 3px 12px rgba(15,23,42,.06);' +
      '}' +

      '.gc35-live{' +
        border:2px solid #ef4444;' +
        background:linear-gradient(135deg,#fff,#fff7f7);' +
      '}' +

      '.gc35-badge{' +
        display:inline-flex;' +
        padding:4px 8px;' +
        border-radius:20px;' +
        font-size:.68rem;' +
        font-weight:800;' +
        background:#fee2e2;' +
        color:#b91c1c;' +
      '}' +

      '.gc35-meta{' +
        font-size:.76rem;' +
        color:#64748b;' +
        margin-top:5px;' +
      '}' +

      '.gc35-actions{' +
        display:flex;' +
        gap:7px;' +
        flex-wrap:wrap;' +
        margin-top:10px;' +
      '}' +

      '.gc35-btn{' +
        border:0;' +
        border-radius:9px;' +
        padding:8px 11px;' +
        cursor:pointer;' +
        font-weight:700;' +
      '}' +

      '.gc35-primary{' +
        background:#4f46e5;' +
        color:#fff;' +
      '}' +

      '.gc35-danger{' +
        background:#fee2e2;' +
        color:#b91c1c;' +
      '}' +

      '.gc35-muted{' +
        background:#eef2f7;' +
        color:#334155;' +
      '}' +

      '.gc35-comments{' +
        margin-top:15px;' +
        border-top:1px solid #e2e8f0;' +
        padding-top:12px;' +
      '}' +

      '.gc35-comment{' +
        padding:10px 0;' +
      '}' +

      '.gc35-reply{' +
        margin-left:22px;' +
        border-left:2px solid #e2e8f0;' +
        padding-left:12px;' +
      '}' +

      '.gc35-comment-head{' +
        display:flex;' +
        gap:8px;' +
        align-items:center;' +
      '}' +

      '.gc35-avatar{' +
        width:30px;' +
        height:30px;' +
        border-radius:50%;' +
        background:#dbeafe;' +
        display:flex;' +
        align-items:center;' +
        justify-content:center;' +
        font-size:.7rem;' +
        font-weight:800;' +
        color:#1d4ed8;' +
      '}' +

      '.gc35-body{' +
        font-size:.88rem;' +
        line-height:1.55;' +
        margin:5px 0 0 38px;' +
      '}' +

      '.gc35-small{' +
        font-size:.7rem;' +
        color:#94a3b8;' +
      '}' +

      '.gc35-media{' +
        max-width:100%;' +
        max-height:260px;' +
        border-radius:10px;' +
        margin:7px 0 0 38px;' +
      '}' +

      '.gc35-composer{' +
        margin-top:12px;' +
        background:#f8fafc;' +
        border-radius:12px;' +
        padding:10px;' +
      '}' +

      '.gc35-composer textarea{' +
        width:100%;' +
        min-height:70px;' +
        border:1px solid #e2e8f0;' +
        border-radius:9px;' +
        padding:9px;' +
        resize:vertical;' +
        box-sizing:border-box;' +
      '}' +

      '.gc35-devocard{' +
        background:linear-gradient(135deg,#0ea5e9,#2563eb);' +
        color:#fff;' +
        border-radius:16px;' +
        padding:18px;' +
        box-shadow:0 8px 24px rgba(37,99,235,.18);' +
        margin-bottom:15px;' +
      '}' +

      '.gc35-notif{' +
        display:flex;' +
        gap:12px;' +
        padding:13px 2px;' +
        border-bottom:1px solid #e2e8f0;' +
        cursor:pointer;' +
      '}' +

      '.gc35-notif.unread{' +
        background:#eff6ff;' +
        border-radius:10px;' +
        padding-left:10px;' +
        padding-right:10px;' +
      '}' +

      '.gc35-notif-icon{' +
        width:38px;' +
        height:38px;' +
        border-radius:50%;' +
        background:#dbeafe;' +
        color:#2563eb;' +
        display:flex;' +
        align-items:center;' +
        justify-content:center;' +
        flex:none;' +
      '}' +

      '.gc35-empty{' +
        text-align:center;' +
        color:#94a3b8;' +
        padding:25px;' +
      '}' +

      '.gc35-file{' +
        font-size:.75rem;' +
        color:#475569;' +
        margin-top:5px;' +
      '}' +

      '.gc35-history-title{' +
        margin:8px 0 12px;' +
        font-weight:850;' +
        font-size:1.05rem;' +
      '}' +

      '.gc35-video-frame{' +
        position:relative;' +
        padding-bottom:56.25%;' +
        height:0;' +
        overflow:hidden;' +
        border-radius:12px;' +
        margin:10px 0;' +
      '}' +

      '.gc35-video-frame iframe{' +
        position:absolute;' +
        inset:0;' +
        width:100%;' +
        height:100%;' +
        border:0;' +
      '}';

    document.head.appendChild(s);
  }

  /* =========================================================
     PREVIOUS LIVE SESSIONS TAB
     ========================================================= */

  function findPreachingArea35() {
    var candidates = [
      document.getElementById('preaching'),
      document.getElementById('preachings'),
      document.getElementById('preachingSection'),
      document.getElementById('sermons'),
      document.getElementById('sermonsSection'),
      document.getElementById('sermonSection'),
      document.getElementById('home-preaching')
    ];

    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i]) return candidates[i];
    }

    var liveBox = document.getElementById('sermonLiveBox');
    if (liveBox) {
      return liveBox.parentElement || liveBox;
    }

    var list = document.getElementById('preachingsList');
    if (list) {
      return list.parentElement || list;
    }

    return null;
  }

  function createPreviousLiveSessionsUI() {
    var existing = document.getElementById('gc35-live-sessions-module');

    if (existing) {
      return existing;
    }

    var area = findPreachingArea35();

    if (!area) {
      return null;
    }

    var module = document.createElement('div');
    module.id = 'gc35-live-sessions-module';
    module.className = 'gc35-live-section';

    module.innerHTML =
      '<div class="gc35-tabs">' +
        '<button type="button" id="gc35-tab-current" class="gc35-tab active">' +
          '🔴 Current Live' +
        '</button>' +

        '<button type="button" id="gc35-tab-history" class="gc35-tab">' +
          '📺 Previous Live Sessions' +
        '</button>' +
      '</div>' +

      '<div id="gc35-current-live-panel">' +
        '<div id="gc35-current-live-content"></div>' +
      '</div>' +

      '<div id="gc35-history-panel" style="display:none">' +
        '<div class="gc35-history-title">📺 Previous Live Sessions</div>' +
        '<div id="gc35-live-history-content">' +
          '<div class="gc35-empty">Loading previous live sessions…</div>' +
        '</div>' +
      '</div>';

    /*
      IMPORTANT:
      Insert the new module AFTER the existing preaching area
      instead of replacing #preachingsList.

      This means existing sermons/documents stay exactly where
      App33/App34 put them.
    */
    area.appendChild(module);

    var currentTab = module.querySelector('#gc35-tab-current');
    var historyTab = module.querySelector('#gc35-tab-history');

    if (currentTab) {
      currentTab.onclick = function () {
        showCurrentLiveTab35();
      };
    }

    if (historyTab) {
      historyTab.onclick = function () {
        showHistoryTab35();
      };
    }

    return module;
  }

  function showCurrentLiveTab35() {
    var current = document.getElementById('gc35-current-live-panel');
    var history = document.getElementById('gc35-history-panel');
    var currentTab = document.getElementById('gc35-tab-current');
    var historyTab = document.getElementById('gc35-tab-history');

    if (current) current.style.display = '';
    if (history) history.style.display = 'none';

    if (currentTab) currentTab.classList.add('active');
    if (historyTab) historyTab.classList.remove('active');

    renderLiveBox();
  }

  function showHistoryTab35() {
    var current = document.getElementById('gc35-current-live-panel');
    var history = document.getElementById('gc35-history-panel');
    var currentTab = document.getElementById('gc35-tab-current');
    var historyTab = document.getElementById('gc35-tab-history');

    if (current) current.style.display = 'none';
    if (history) history.style.display = '';

    if (currentTab) currentTab.classList.remove('active');
    if (historyTab) historyTab.classList.add('active');

    loadHistory();
  }

  /* =========================================================
     PERSISTENT LIVE
     ========================================================= */

  async function startPersistentLive() {
    var c = db();

    if (!c) {
      toast35('Supabase is not ready', 'error');
      return;
    }

    if (!admin35()) {
      toast35('Admin access required', 'error');
      return;
    }

    var titleInput = document.getElementById('liveTitle');
    var youtubeInput = document.getElementById('liveYouTube');

    var title = titleInput ? titleInput.value.trim() : '';
    var youtube = youtubeInput ? youtubeInput.value.trim() : '';

    if (!title) {
      toast35('Enter a live title', 'error');
      return;
    }

    var me = await currentUser35();

    if (!me) {
      toast35('Please sign in', 'error');
      return;
    }

    /*
      CRITICAL:
      This INSERT ONLY targets preaching_lives.

      It does NOT insert into sermons, preachings,
      documents, sermon_documents, or any existing
      sermon table.
    */
    var row = {
      title: title,
      youtube_url: youtube || null,
      description: null,
      started_at: now35(),
      ended_at: null,
      status: 'live',
      created_by: me.id,
      updated_at: now35()
    };

    var r = await c
      .from(LIVE_TABLE)
      .insert([row])
      .select('*')
      .single();

    if (r.error) {
      toast35(
        'Could not start saved live: ' + r.error.message,
        'error'
      );
      return;
    }

    activeLive = r.data;
    viewedLive = r.data;

    window.gc35ActiveLiveId = activeLive.id;

    try {
      localStorage.setItem(
        'gc35_live_id',
        activeLive.id
      );
    } catch (e) {}

    var modal = document.getElementById('liveModal');

    if (modal) {
      modal.classList.remove('show');
    }

    if (typeof window.renderLiveSession === 'function') {
      try {
        window.renderLiveSession({
          id: activeLive.id,
          title: activeLive.title,
          youtube_url: activeLive.youtube_url
        });
      } catch (e) {}
    }

    createPreviousLiveSessionsUI();
    showCurrentLiveTab35();
    renderLiveBox();
    subscribeComments(activeLive.id);

    toast35(
      'Live started and saved as a live session',
      'success'
    );
  }

  async function endPersistentLive() {
    var c = db();

    if (!c || !admin35()) {
      return;
    }

    var id = activeLive && activeLive.id;

    if (!id) {
      try {
        id = localStorage.getItem('gc35_live_id');
      } catch (e) {}
    }

    if (!id) {
      toast35(
        'No saved live is currently active',
        'error'
      );
      return;
    }

    var r = await c
      .from(LIVE_TABLE)
      .update({
        status: 'completed',
        ended_at: now35(),
        updated_at: now35()
      })
      .eq('id', id);

    if (r.error) {
      toast35(
        'Could not save ended live: ' + r.error.message,
        'error'
      );
      return;
    }

    activeLive = null;
    window.gc35ActiveLiveId = null;

    try {
      localStorage.removeItem('gc35_live_id');
    } catch (e) {}

    unsubscribeComments();

    renderLiveBox();
    loadHistory();

    toast35(
      'Live ended and saved in Previous Live Sessions',
      'success'
    );
  }

  async function loadActiveLive() {
    var c = db();

    if (!c) return;

    var r = await c
      .from(LIVE_TABLE)
      .select('*')
      .eq('status', 'live')
      .order('started_at', {
        ascending: false
      })
      .limit(1);

    if (!r.error && r.data && r.data[0]) {
      activeLive = r.data[0];
      viewedLive = r.data[0];

      window.gc35ActiveLiveId = activeLive.id;

      renderLiveBox();
      subscribeComments(activeLive.id);
    } else {
      activeLive = null;
      window.gc35ActiveLiveId = null;

      renderLiveBox();
    }
  }

  /* =========================================================
     CURRENT LIVE RENDERING
     ========================================================= */

  function youtubeId35(url) {
    if (!url) return '';

    var m = String(url).match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/))([^?&/]+)/i
    );

    return m ? m[1] : '';
  }

  function renderLiveBox() {
    var host = document.getElementById(
      'gc35-current-live-content'
    );

    /*
      Do NOT use #preachingsList.
      Do NOT write live UI into the sermon document list.
    */
    if (!host) {
      createPreviousLiveSessionsUI();

      host = document.getElementById(
        'gc35-current-live-content'
      );
    }

    if (!host) return;

    if (!activeLive) {
      host.innerHTML =
        '<div class="gc35-card">' +
          '<div class="gc35-empty">' +
            'No live preaching right now.' +
          '</div>' +
        '</div>';

      return;
    }

    var id = youtubeId35(
      activeLive.youtube_url || ''
    );

    var embed = '';

    if (id) {
      embed =
        '<div class="gc35-video-frame">' +
          '<iframe src="https://www.youtube.com/embed/' +
            encodeURIComponent(id) +
            '" ' +
            'allow="autoplay; encrypted-media" ' +
            'allowfullscreen>' +
          '</iframe>' +
        '</div>';
    }

    host.innerHTML =
      '<div class="gc35-live gc35-card">' +

        '<span class="gc35-badge">' +
          '🔴 LIVE NOW' +
        '</span>' +

        '<h3 style="margin-top:8px">' +
          esc35(activeLive.title) +
        '</h3>' +

        '<div class="gc35-meta">' +
          'Started ' +
          new Date(
            activeLive.started_at
          ).toLocaleString() +
        '</div>' +

        embed +

        (
          activeLive.youtube_url && !id
            ? '<div class="gc35-actions">' +
                '<a class="gc35-btn gc35-primary" ' +
                'href="' +
                esc35(activeLive.youtube_url) +
                '" target="_blank" rel="noopener">' +
                  '▶ Open Live' +
                '</a>' +
              '</div>'
            : ''
        ) +

        (
          admin35()
            ? '<div class="gc35-actions">' +
                '<button class="gc35-btn gc35-danger" ' +
                'onclick="gc35EndLive()">' +
                  'End & Save Live' +
                '</button>' +
              '</div>'
            : ''
        ) +

      '</div>';
  }

  /* =========================================================
     PREVIOUS LIVE SESSIONS
     ========================================================= */

  async function loadHistory() {
    var host = document.getElementById(
      'gc35-live-history-content'
    );

    if (!host) {
      createPreviousLiveSessionsUI();

      host = document.getElementById(
        'gc35-live-history-content'
      );
    }

    if (!host) return;

    var c = db();

    if (!c) {
      host.innerHTML =
        '<div class="gc35-empty">' +
          'Supabase is not available.' +
        '</div>';

      return;
    }

    /*
      ONLY completed rows from preaching_lives.

      There is NO query against sermons or existing
      sermon/document tables.
    */
    var r = await c
      .from(LIVE_TABLE)
      .select('*')
      .eq('status', 'completed')
      .order('ended_at', {
        ascending: false
      })
      .limit(100);

    if (r.error) {
      host.innerHTML =
        '<div class="gc35-empty">' +
          'Previous live sessions are unavailable. ' +
          esc35(r.error.message) +
        '</div>';

      return;
    }

    var rows = r.data || [];

    if (!rows.length) {
      host.innerHTML =
        '<div class="gc35-empty">' +
          'No previous live sessions yet.' +
        '</div>';

      return;
    }

    var html = '';

    rows.forEach(function (x) {
      var started = new Date(
        x.started_at
      );

      var ended = x.ended_at
        ? new Date(x.ended_at)
        : null;

      var duration = '';

      if (ended) {
        duration =
          Math.max(
            1,
            Math.round(
              (ended - started) / 60000
            )
          ) + ' min';
      }

      html +=
        '<div class="gc35-card">' +

          '<div style="font-weight:800">' +
            '🎤 ' +
            esc35(x.title) +
          '</div>' +

          '<div class="gc35-meta">' +
            started.toLocaleString() +
            (duration
              ? ' · ' + duration
              : '') +
          '</div>' +

          '<div class="gc35-actions">' +

            '<button class="gc35-btn gc35-primary" ' +
              'onclick="gc35OpenHistory(\'' +
                String(x.id).replace(/'/g, '') +
              '\')">' +
              '💬 Open Session' +
            '</button>' +

            (
              admin35()
                ? '<button class="gc35-btn gc35-muted" ' +
                    'onclick="gc35EditLive(\'' +
                      String(x.id).replace(/'/g, '') +
                    '\')">' +
                    'Edit' +
                  '</button>' +

                  '<button class="gc35-btn gc35-danger" ' +
                    'onclick="gc35DeleteLive(\'' +
                      String(x.id).replace(/'/g, '') +
                    '\')">' +
                    'Delete' +
                  '</button>'
                : ''
            ) +

          '</div>' +

        '</div>';
    });

    host.innerHTML = html;
  }

  /* =========================================================
     OPEN PREVIOUS LIVE SESSION
     ========================================================= */

  async function gc35OpenHistory(id) {
    var c = db();

    if (!c) return;

    var r = await c
      .from(LIVE_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (r.error || !r.data) {
      toast35(
        'Previous live session not found',
        'error'
      );
      return;
    }

    viewedLive = r.data;

    renderHistoryModal35(r.data);

    await loadComments(id);

    subscribeComments(id);
  }

  function renderHistoryModal35(x) {
    var old = document.getElementById(
      'gc35-history-modal'
    );

    if (old) {
      old.remove();
    }

    var id = String(x.id).replace(/'/g, '');

    var youtubeId = youtubeId35(
      x.youtube_url || ''
    );

    var video = '';

    if (youtubeId) {
      video =
        '<div class="gc35-video-frame">' +
          '<iframe src="https://www.youtube.com/embed/' +
            encodeURIComponent(youtubeId) +
            '" ' +
            'allow="autoplay; encrypted-media" ' +
            'allowfullscreen>' +
          '</iframe>' +
        '</div>';
    } else if (x.youtube_url) {
      video =
        '<div class="gc35-actions">' +
          '<a class="gc35-btn gc35-primary" ' +
          'href="' +
            esc35(x.youtube_url) +
          '" target="_blank" rel="noopener">' +
            '▶ Open Recording' +
          '</a>' +
        '</div>';
    }

    var modal = document.createElement('div');

    modal.id = 'gc35-history-modal';
    modal.className = 'modal-overlay show';

    modal.innerHTML =
      '<div class="modal" ' +
        'style="max-height:92vh;overflow:auto">' +

        '<div class="modal-handle"></div>' +

        '<div class="modal-title">' +
          '📺 ' +
          esc35(x.title) +
        '</div>' +

        '<div class="gc35-meta">' +
          new Date(
            x.started_at
          ).toLocaleString() +
          ' · Previous Live Session' +
        '</div>' +

        video +

        '<div id="gc35-comments" ' +
          'class="gc35-comments">' +
          '<div class="gc35-empty">' +
            'Loading discussion…' +
          '</div>' +
        '</div>' +

        '<button class="btn btn-secondary btn-block" ' +
          'style="margin-top:12px" ' +
          'onclick="' +
            'document.getElementById(\'gc35-history-modal\').remove();' +
            'gc35StopViewingHistory();' +
          '">' +
          'Close' +
        '</button>' +

      '</div>';

    document.body.appendChild(modal);
  }

  function gc35StopViewingHistory() {
    viewedLive = null;

    if (!activeLive) {
      unsubscribeComments();
    } else {
      subscribeComments(activeLive.id);
    }
  }

  /* =========================================================
     EDIT / DELETE
     ========================================================= */

  async function gc35EditLive(id) {
    if (!admin35()) {
      toast35(
        'Admin access required',
        'error'
      );
      return;
    }

    var c = db();

    if (!c) return;

    var r = await c
      .from(LIVE_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (r.error || !r.data) {
      toast35(
        'Live session not found',
        'error'
      );
      return;
    }

    var title = prompt(
      'Edit live session title:',
      r.data.title || ''
    );

    if (title === null) return;

    title = title.trim();

    if (!title) {
      toast35(
        'Title cannot be empty',
        'error'
      );
      return;
    }

    var url = prompt(
      'Edit recording / YouTube URL:',
      r.data.youtube_url || ''
    );

    if (url === null) return;

    var update = await c
      .from(LIVE_TABLE)
      .update({
        title: title,
        youtube_url: url.trim() || null,
        updated_at: now35()
      })
      .eq('id', id);

    if (update.error) {
      toast35(
        'Update failed: ' +
          update.error.message,
        'error'
      );
      return;
    }

    if (
      activeLive &&
      activeLive.id === id
    ) {
      activeLive.title = title;
      activeLive.youtube_url =
        url.trim() || null;

      renderLiveBox();
    }

    if (
      viewedLive &&
      viewedLive.id === id
    ) {
      viewedLive.title = title;
      viewedLive.youtube_url =
        url.trim() || null;
    }

    toast35(
      'Previous live session updated',
      'success'
    );

    loadHistory();
  }

  async function gc35DeleteLive(id) {
    if (!admin35()) {
      toast35(
        'Admin access required',
        'error'
      );
      return;
    }

    if (
      !confirm(
        'Delete this previous live session and all of its discussion?'
      )
    ) {
      return;
    }

    var c = db();

    if (!c) return;

    /*
      Comments are linked with ON DELETE CASCADE,
      but explicitly removing them first also supports
      older database configurations.
    */

    var comments = await c
      .from(COMMENT_TABLE)
      .delete()
      .eq('preaching_id', id);

    if (comments.error) {
      toast35(
        'Could not delete discussion: ' +
          comments.error.message,
        'error'
      );
      return;
    }

    var r = await c
      .from(LIVE_TABLE)
      .delete()
      .eq('id', id);

    if (r.error) {
      toast35(
        'Could not delete live session: ' +
          r.error.message,
        'error'
      );
      return;
    }

    if (
      activeLive &&
      activeLive.id === id
    ) {
      activeLive = null;
      window.gc35ActiveLiveId = null;
    }

    if (
      viewedLive &&
      viewedLive.id === id
    ) {
      viewedLive = null;
    }

    var modal = document.getElementById(
      'gc35-history-modal'
    );

    if (modal) {
      modal.remove();
    }

    toast35(
      'Previous live session deleted',
      'success'
    );

    loadHistory();
    renderLiveBox();
  }

  /* =========================================================
     COMMENTS / DISCUSSION
     ========================================================= */

  async function loadComments(id) {
    var out = document.getElementById(
      'gc35-comments'
    );

    if (!out) return;

    var c = db();

    if (!c) return;

    var r = await c
      .from(COMMENT_TABLE)
      .select('*')
      .eq('preaching_id', id)
      .order('created_at', {
        ascending: true
      });

    if (r.error) {
      out.innerHTML =
        '<div class="gc35-empty">' +
          'Discussion unavailable.' +
        '</div>';

      return;
    }

    var comments = r.data || [];

    var ids = [];

    comments.forEach(function (x) {
      if (x.user_id) {
        ids.push(x.user_id);
      }
    });

    var profiles = {};

    if (ids.length) {
      var uniqueIds =
        Array.from(
          new Set(ids)
        );

      var p = await c
        .from('profiles')
        .select(
          'id,name,full_name,avatar_url'
        )
        .in('id', uniqueIds);

      if (!p.error) {
        (p.data || []).forEach(
          function (profile) {
            profiles[profile.id] =
              profile;
          }
        );
      }
    }

    var me = await currentUser35();

    var roots = comments.filter(
      function (x) {
        return !x.parent_id;
      }
    );

    var byParent = {};

    comments.forEach(
      function (x) {
        var key =
          x.parent_id || 'root';

        if (!byParent[key]) {
          byParent[key] = [];
        }

        byParent[key].push(x);
      }
    );

    function renderOne(comment, level) {
      var profile =
        profiles[comment.user_id] || {};

      var name =
        profile.name ||
        profile.full_name ||
        'Member';

      var media = '';

      if (comment.media_url) {
        var isVideo =
          /\.(mp4|webm|mov)(\?|$)/i.test(
            comment.media_url
          );

        if (isVideo) {
          media =
            '<div>' +
              '<video controls ' +
                'class="gc35-media" ' +
                'src="' +
                  esc35(
                    comment.media_url
                  ) +
                '">' +
              '</video>' +
            '</div>';
        } else {
          media =
            '<div>' +
              '<img class="gc35-media" ' +
                'src="' +
                  esc35(
                    comment.media_url
                  ) +
                '" alt="Attached media">' +
            '</div>';
        }
      }

      var children =
        byParent[comment.id] || [];

      var canDelete =
        !!me &&
        (
          me.id === comment.user_id ||
          admin35()
        );

      return (
        '<div class="gc35-comment ' +
          (level
            ? 'gc35-reply'
            : '') +
        '">' +

          '<div class="gc35-comment-head">' +

            '<div class="gc35-avatar">' +
              esc35(
                (name || '?')
                  .slice(0, 2)
                  .toUpperCase()
              ) +
            '</div>' +

            '<div>' +
              '<b>' +
                esc35(name) +
              '</b>' +

              '<div class="gc35-small">' +
                new Date(
                  comment.created_at
                ).toLocaleString() +
              '</div>' +

            '</div>' +

          '</div>' +

          '<div class="gc35-body">' +
            esc35(
              comment.body || ''
            ) +
          '</div>' +

          media +

          '<div ' +
            'style="margin-left:38px;margin-top:5px">' +

            '<button class="gc35-btn gc35-muted" ' +
              'onclick="gc35Reply(\'' +
                String(comment.id)
                  .replace(/'/g, '') +
              '\')">' +
              'Reply' +
            '</button>' +

            (
              canDelete
                ? '<button class="gc35-btn gc35-danger" ' +
                    'onclick="gc35DeleteComment(\'' +
                      String(comment.id)
                        .replace(/'/g, '') +
                    '\')">' +
                    'Delete' +
                  '</button>'
                : ''
            ) +

          '</div>' +

          children
            .map(function (child) {
              return renderOne(
                child,
                level + 1
              );
            })
            .join('') +

        '</div>'
      );
    }

    var html =
      '<div style="font-weight:800;margin-bottom:8px">' +
        '💬 Discussion' +
      '</div>';

    if (!roots.length) {
      html +=
        '<div class="gc35-empty" ' +
          'style="padding:12px 0">' +
          'No comments yet. Start the discussion.' +
        '</div>';
    } else {
      html += roots
        .map(function (x) {
          return renderOne(x, 0);
        })
        .join('');
    }

    html +=
      '<div class="gc35-composer">' +

        '<textarea ' +
          'id="gc35-comment-text" ' +
          'placeholder="Share your thoughts...">' +
        '</textarea>' +

        '<input ' +
          'id="gc35-comment-file" ' +
          'type="file" ' +
          'accept="image/*,video/*" ' +
          'style="margin-top:7px">' +

        '<div class="gc35-actions">' +

          '<button ' +
            'class="gc35-btn gc35-primary" ' +
            'onclick="gc35PostComment(\'' +
              String(id).replace(/'/g, '') +
              '\',null)">' +
            'Post Comment' +
          '</button>' +

        '</div>' +

      '</div>';

    out.innerHTML = html;
  }

  /* =========================================================
     MEDIA UPLOAD
     ========================================================= */

  async function upload35(file) {
    if (!file) return null;

    var c = db();

    if (!c) {
      throw new Error(
        'Supabase unavailable'
      );
    }

    var me =
      await currentUser35();

    if (!me) {
      throw new Error(
        'Please sign in'
      );
    }

    var parts =
      String(file.name || '')
        .split('.');

    var ext =
      (
        parts[parts.length - 1] ||
        'bin'
      ).toLowerCase();

    var path =
      'preaching/' +
      me.id +
      '/' +
      Date.now() +
      '.' +
      ext;

    var r =
      await c.storage
        .from('media')
        .upload(
          path,
          file,
          {
            upsert: false
          }
        );

    if (r.error) {
      throw r.error;
    }

    return c.storage
      .from('media')
      .getPublicUrl(path)
      .data
      .publicUrl;
  }

  /* =========================================================
     POST COMMENT
     ========================================================= */

  async function gc35PostComment(
    id,
    parent
  ) {
    var c = db();

    if (!c) return;

    var me =
      await currentUser35();

    if (!me) {
      toast35(
        'Please sign in to comment',
        'error'
      );
      return;
    }

    var textarea =
      document.getElementById(
        'gc35-comment-text'
      );

    var body =
      textarea
        ? textarea.value.trim()
        : '';

    var file =
      document.getElementById(
        'gc35-comment-file'
      );

    var selectedFile =
      file &&
      file.files &&
      file.files[0]
        ? file.files[0]
        : null;

    if (!body && !selectedFile) {
      toast35(
        'Write a comment or attach media',
        'error'
      );
      return;
    }

    try {
      var media =
        selectedFile
          ? await upload35(
              selectedFile
            )
          : null;

      var r =
        await c
          .from(COMMENT_TABLE)
          .insert([
            {
              preaching_id: id,
              user_id: me.id,
              parent_id:
                parent || null,
              body: body,
              media_url: media,
              created_at: now35(),
              updated_at: now35()
            }
          ]);

      if (r.error) {
        throw r.error;
      }

      await loadComments(id);

      toast35(
        'Comment posted',
        'success'
      );
    } catch (e) {
      toast35(
        'Comment failed: ' +
          e.message,
        'error'
      );
    }
  }

  /* =========================================================
     REPLY
     ========================================================= */

  async function gc35Reply(parent) {
    if (!parent) return;

    var id =
      viewedLive &&
      viewedLive.id
        ? viewedLive.id
        : activeLive &&
          activeLive.id
          ? activeLive.id
          : null;

    if (!id) {
      toast35(
        'No live session selected',
        'error'
      );
      return;
    }

    var body = prompt(
      'Write your reply:'
    );

    if (
      body === null ||
      !body.trim()
    ) {
      return;
    }

    var c = db();

    if (!c) return;

    var me =
      await currentUser35();

    if (!me) {
      toast35(
        'Please sign in',
        'error'
      );
      return;
    }

    var r =
      await c
        .from(COMMENT_TABLE)
        .insert([
          {
            preaching_id: id,
            user_id: me.id,
            parent_id: parent,
            body: body.trim(),
            media_url: null,
            created_at: now35(),
            updated_at: now35()
          }
        ]);

    if (r.error) {
      toast35(
        r.error.message,
        'error'
      );
      return;
    }

    loadComments(id);
  }

  /* =========================================================
     DELETE COMMENT
     ========================================================= */

  async function gc35DeleteComment(id) {
    if (
      !confirm(
        'Delete this comment and its replies?'
      )
    ) {
      return;
    }

    var c = db();

    if (!c) return;

    var r =
      await c
        .from(COMMENT_TABLE)
        .delete()
        .eq('id', id);

    if (r.error) {
      toast35(
        r.error.message,
        'error'
      );
      return;
    }

    var liveId =
      viewedLive &&
      viewedLive.id
        ? viewedLive.id
        : activeLive &&
          activeLive.id
          ? activeLive.id
          : null;

    if (liveId) {
      loadComments(liveId);
    }
  }

  /* =========================================================
     REALTIME COMMENTS
     ========================================================= */

  function subscribeComments(id) {
    var c = db();

    id =
      id ||
      (
        viewedLive &&
        viewedLive.id
      ) ||
      (
        activeLive &&
        activeLive.id
      );

    if (
      !c ||
      !id ||
      !c.channel
    ) {
      return;
    }

    unsubscribeComments();

    try {
      commentChannel =
        c
          .channel(
            'gc35-comments-' +
            id
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: COMMENT_TABLE,
              filter:
                'preaching_id=eq.' +
                id
            },
            function () {
              loadComments(id);
            }
          )
          .subscribe();
    } catch (e) {
      console.warn(
        'Comment realtime subscription failed:',
        e
      );
    }
  }

  function unsubscribeComments() {
    if (!commentChannel) {
      return;
    }

    try {
      var c = db();

      if (c && c.removeChannel) {
        c.removeChannel(
          commentChannel
        );
      }
    } catch (e) {}

    commentChannel = null;
  }

  /* =========================================================
     DEVOTIONAL
     ========================================================= */

  function ensureDevotional() {
    var host =
      document.getElementById(
        'home-devotional'
      );

    if (!host) return;

    if (
      document.getElementById(
        'devotionalCard'
      )
    ) {
      return;
    }

    if (
      document.getElementById(
        'gc35-devotional-placeholder'
      )
    ) {
      return;
    }

    var card =
      document.createElement(
        'div'
      );

    card.id =
      'gc35-devotional-placeholder';

    card.className =
      'gc35-devocard';

    card.innerHTML =
      '<div style="font-weight:800;font-size:1.05rem">' +
        '🙏 Daily Devotional' +
      '</div>' +

      '<div id="gc35-devo-title" ' +
        'style="font-weight:800;margin-top:10px">' +
        'Loading today’s devotional…' +
      '</div>' +

      '<div id="gc35-devo-verse" ' +
        'style="margin-top:8px;opacity:.9">' +
      '</div>' +

      '<div id="gc35-devo-body" ' +
        'style="margin-top:10px;line-height:1.6">' +
      '</div>';

    host.appendChild(card);

    loadDevotional35();
  }

  async function loadDevotional35() {
    var c = db();

    var today =
      new Date()
        .toISOString()
        .slice(0, 10);

    var devotional = null;

    if (c) {
      try {
        var r =
          await c
            .from('devotionals')
            .select('*')
            .eq('active', true)
            .eq('date', today)
            .order(
              'updated_at',
              {
                ascending: false
              }
            )
            .limit(1);

        if (
          !r.error &&
          r.data &&
          r.data[0]
        ) {
          devotional =
            r.data[0];
        }
      } catch (e) {}
    }

    if (!devotional) {
      try {
        var response =
          await fetch(
            'https://www.christhimself.com/api/v1/devotionals/' +
            String(
              new Date().getMonth() + 1
            ).padStart(2, '0') +
            '-' +
            String(
              new Date().getDate()
            ).padStart(2, '0') +
            '.json'
          );

        var json =
          await response.json();

        var am =
          (json.periods || [])
            .find(function (x) {
              return x.period === 'am';
            }) ||
          (
            json.periods &&
            json.periods[0]
          );

        var x =
          am &&
          am.languages &&
          am.languages.en;

        devotional = {
          title:
            x &&
            x.theme ||
            'Today’s Devotional',

          body:
            x &&
            x.summary ||
            '',

          verse:
            (
              x &&
              x.verses ||
              []
            )
              .map(function (v) {
                return (
                  v.reference ||
                  v.text ||
                  ''
                );
              })
              .join(' · ')
        };
      } catch (e) {
        devotional = {
          title:
            'Today’s Devotional',

          body:
            'Spend time in prayer, Scripture and reflection today.',

          verse: ''
        };
      }
    }

    var title =
      document.getElementById(
        'gc35-devo-title'
      );

    var verse =
      document.getElementById(
        'gc35-devo-verse'
      );

    var body =
      document.getElementById(
        'gc35-devo-body'
      );

    if (title) {
      title.textContent =
        devotional.title ||
        'Today’s Devotional';
    }

    if (verse) {
      verse.textContent =
        devotional.verse
          ? '📖 ' +
            devotional.verse
          : '';
    }

    if (body) {
      body.textContent =
        devotional.body ||
        '';
    }
  }

  /* =========================================================
     NOTIFICATIONS
     ========================================================= */

  function openNotifications35() {
    if (
      typeof window.switchSection ===
      'function'
    ) {
      window.switchSection(
        'home'
      );
    }

    if (
      typeof window.showSubPage ===
      'function'
    ) {
      window.showSubPage(
        'home-notifications'
      );
    }

    setTimeout(
      renderNotifications35,
      50
    );
  }

  async function renderNotifications35() {
    var host =
      document.getElementById(
        'home-notifications'
      );

    if (!host) return;

    var c = db();

    if (!c) return;

    var me =
      await currentUser35();

    if (!me) return;

    var r =
      await c
        .from('notifications')
        .select('*')
        .eq('user_id', me.id)
        .order(
          'created_at',
          {
            ascending: false
          }
        )
        .limit(100);

    if (r.error) {
      return;
    }

    var rows =
      r.data || [];

    var html =
      '<button class="back-btn" ' +
        'onclick="showSubPage(\'home-main\')">' +
        '<i class="fas fa-arrow-left"></i> Back' +
      '</button>' +

      '<div class="section-title-app">' +
        '🔔 Notifications' +
      '</div>' +

      '<div style="text-align:right;margin-bottom:8px">' +
        '<button class="gc35-btn gc35-muted" ' +
          'onclick="gc35MarkAllRead()">' +
          'Mark all as read' +
        '</button>' +
      '</div>';

    if (!rows.length) {
      html +=
        '<div class="gc35-empty">' +
          'You have no notifications.' +
        '</div>';
    }

    rows.forEach(
      function (n) {
        var title =
          n.title ||
          'Notification';

        var body =
          n.body ||
          n.message ||
          '';

        var target =
          n.target_id ||
          n.reference_id ||
          '';

        html +=
          '<div class="gc35-notif ' +
            (n.is_read
              ? ''
              : 'unread') +
            '" ' +

            'onclick="gc35OpenNotification(\'' +
              String(n.id)
                .replace(/'/g, '') +
              '\',\'' +
              String(n.type || '')
                .replace(/'/g, '') +
              '\',\'' +
              String(target)
                .replace(/'/g, '') +
            '\')">' +

            '<div class="gc35-notif-icon">' +
              (
                n.is_read
                  ? '✓'
                  : '●'
              ) +
            '</div>' +

            '<div style="flex:1">' +

              '<b>' +
                esc35(title) +
              '</b>' +

              '<div style="font-size:.84rem;margin-top:3px">' +
                esc35(body) +
              '</div>' +

              '<div class="gc35-small" ' +
                'style="margin-top:4px">' +
                (
                  n.created_at
                    ? new Date(
                        n.created_at
                      ).toLocaleString()
                    : ''
                ) +
              '</div>' +

            '</div>' +

          '</div>';
      }
    );

    host.innerHTML = html;
  }

  async function gc35MarkAllRead() {
    var c = db();

    if (!c) return;

    var me =
      await currentUser35();

    if (!me) return;

    await c
      .from('notifications')
      .update({
        is_read: true
      })
      .eq(
        'user_id',
        me.id
      )
      .eq(
        'is_read',
        false
      );

    renderNotifications35();

    if (
      typeof window.refreshNotificationBadge ===
      'function'
    ) {
      window.refreshNotificationBadge();
    }
  }

  async function gc35OpenNotification(
    id,
    type,
    target
  ) {
    var c = db();

    if (c) {
      await c
        .from('notifications')
        .update({
          is_read: true
        })
        .eq('id', id);
    }

    /*
      Notifications referring to live preaching
      open the Previous Live Session directly.
    */

    if (
      type &&
      /preach|live/i.test(type) &&
      target
    ) {
      gc35OpenHistory(target);
      return;
    }

    renderNotifications35();
  }

  /* =========================================================
     INSTALLATION
     ========================================================= */

  function install35() {
    style35();

    /*
      Public functions used by existing live UI.
    */

    window.startLive =
      startPersistentLive;

    window.endLive =
      endPersistentLive;

    window.gc35EndLive =
      endPersistentLive;

    window.gc35OpenHistory =
      gc35OpenHistory;

    window.gc35EditLive =
      gc35EditLive;

    window.gc35DeleteLive =
      gc35DeleteLive;

    window.gc35PostComment =
      gc35PostComment;

    window.gc35Reply =
      gc35Reply;

    window.gc35DeleteComment =
      gc35DeleteComment;

    window.gc35MarkAllRead =
      gc35MarkAllRead;

    window.gc35OpenNotification =
      gc35OpenNotification;

    window.gc35StopViewingHistory =
      gc35StopViewingHistory;

    /*
      Create the new dedicated live-session area.
    */

    createPreviousLiveSessionsUI();

    /*
      IMPORTANT:
      We intentionally DO NOT touch #preachingsList.

      Existing sermons/documents remain under their
      original App33/App34 rendering system.
    */

    /*
      Bell buttons.
    */

    var bells =
      document.querySelectorAll(
        '.header-btn'
      );

    bells.forEach(
      function (button) {
        if (
          button.querySelector(
            '.fa-bell'
          )
        ) {
          button.onclick =
            openNotifications35;
        }
      }
    );

    /*
      Initial rendering.
    */

    renderLiveBox();
    loadHistory();
    loadActiveLive();
    ensureDevotional();

    /*
      Refresh live state without touching
      the Sermons/document collection.
    */

    if (window.__gc35Timer) {
      clearInterval(
        window.__gc35Timer
      );
    }

    window.__gc35Timer =
      setInterval(
        function () {
          createPreviousLiveSessionsUI();
          loadActiveLive();

          /*
            Only refresh history if the
            Previous Live Sessions tab is open.
          */
          var history =
            document.getElementById(
              'gc35-history-panel'
            );

          if (
            history &&
            history.style.display !== 'none'
          ) {
            loadHistory();
          }

          ensureDevotional();
        },
        30000
      );
  }

  /*
    Prevent duplicate installation if the script
    is accidentally loaded twice.
  */

  if (
    window.__gc35Installed
  ) {
    return;
  }

  window.__gc35Installed = true;

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      install35
    );
  } else {
    install35();
  }

})();
