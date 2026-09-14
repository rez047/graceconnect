/* ============================================================
   GRACECONNECT — APP35.JS
   Persistent Preaching Lives + Nested Discussion + Media
   + Devotional section fallback + Dedicated Notifications
   + SEPARATE PREVIOUS LIVE SESSIONS TAB
   ADDITIVE PATCH — keeps existing app33/app34 functionality
   ============================================================ */

(function(){
  'use strict';

  var LIVE_TABLE='preaching_lives';
  var COMMENT_TABLE='preaching_comments';

  var client=null;
  var activeLive=null;
  var discussionLive=null;
  var commentChannel=null;

  /* -------------------- DATABASE -------------------- */

  function db(){
    try{
      if(typeof window.sb==='function'){
        var c=window.sb();

        if(c&&c.from){
          return c;
        }
      }

      if(window.sb&&window.sb.from){
        return window.sb;
      }

      if(
        window.supabaseClient&&
        window.supabaseClient.from
      ){
        return window.supabaseClient;
      }

    }catch(e){}

    return null;
  }

  /* -------------------- HELPERS -------------------- */

  function esc35(v){

    if(typeof window.esc==='function'){
      return window.esc(v);
    }

    return String(v==null?'':v).replace(
      /[&<>"]/g,
      function(c){
        return {
          '&':'&amp;',
          '<':'&lt;',
          '>':'&gt;',
          '"':'&quot;'
        }[c]||c;
      }
    );
  }

  function admin35(){

    try{
      return (
        typeof window.isAdmin==='function' &&
        window.isAdmin()
      );
    }catch(e){
      return false;
    }
  }

  function toast35(m,t){

    try{

      if(window.showToast){
        window.showToast(
          m,
          t||'info'
        );
        return;
      }

      if(window.toast){
        window.toast(
          m,
          t||'info'
        );
        return;
      }

    }catch(e){}

    console.log(m);
  }

  function uid35(){

    var c=db();

    if(!c){
      return Promise.resolve(null);
    }

    return c.auth.getUser().then(
      function(r){

        return (
          r.data&&
          r.data.user
        )
        ?
        r.data.user.id
        :
        null;

      }
    );
  }

  function now35(){
    return new Date().toISOString();
  }

  /* ============================================================
     STYLES
     ============================================================ */

  function style35(){

    if(
      document.getElementById(
        'gc35-style'
      )
    ){
      return;
    }

    var s=document.createElement(
      'style'
    );

    s.id='gc35-style';

    s.textContent=''

      /* History */

      +'.gc35-history{margin:14px 0}'

      +'.gc35-history-tab-wrap{'
      +'margin:14px 0;'
      +'border:1px solid #e2e8f0;'
      +'border-radius:16px;'
      +'overflow:hidden;'
      +'background:#fff;'
      +'}'

      +'.gc35-history-tabs{'
      +'display:flex;'
      +'gap:6px;'
      +'padding:8px;'
      +'background:#f8fafc;'
      +'border-bottom:1px solid #e2e8f0;'
      +'overflow-x:auto;'
      +'}'

      +'.gc35-history-tab{'
      +'border:0;'
      +'border-radius:10px;'
      +'padding:10px 14px;'
      +'cursor:pointer;'
      +'font-weight:800;'
      +'white-space:nowrap;'
      +'background:transparent;'
      +'color:#475569;'
      +'}'

      +'.gc35-history-tab.active{'
      +'background:#4f46e5;'
      +'color:#fff;'
      +'}'

      +'.gc35-history-panel{'
      +'padding:2px 12px 12px;'
      +'}'

      +'.gc35-card{'
      +'background:#fff;'
      +'border:1px solid #e2e8f0;'
      +'border-radius:16px;'
      +'padding:15px;'
      +'margin-bottom:10px;'
      +'box-shadow:0 3px 12px rgba(15,23,42,.06)'
      +'}'

      +'.gc35-live{'
      +'border:2px solid #ef4444;'
      +'background:linear-gradient(135deg,#fff,#fff7f7)'
      +'}'

      +'.gc35-badge{'
      +'display:inline-flex;'
      +'padding:4px 8px;'
      +'border-radius:20px;'
      +'font-size:.68rem;'
      +'font-weight:800;'
      +'background:#fee2e2;'
      +'color:#b91c1c'
      +'}'

      +'.gc35-meta{'
      +'font-size:.76rem;'
      +'color:#64748b;'
      +'margin-top:5px'
      +'}'

      +'.gc35-actions{'
      +'display:flex;'
      +'gap:7px;'
      +'flex-wrap:wrap;'
      +'margin-top:10px'
      +'}'

      +'.gc35-btn{'
      +'border:0;'
      +'border-radius:9px;'
      +'padding:8px 11px;'
      +'cursor:pointer;'
      +'font-weight:700'
      +'}'

      +'.gc35-primary{'
      +'background:#4f46e5;'
      +'color:#fff'
      +'}'

      +'.gc35-danger{'
      +'background:#fee2e2;'
      +'color:#b91c1c'
      +'}'

      +'.gc35-muted{'
      +'background:#eef2f7;'
      +'color:#334155'
      +'}'

      +'.gc35-comments{'
      +'margin-top:15px;'
      +'border-top:1px solid #e2e8f0;'
      +'padding-top:12px'
      +'}'

      +'.gc35-comment{'
      +'padding:10px 0'
      +'}'

      +'.gc35-reply{'
      +'margin-left:22px;'
      +'border-left:2px solid #e2e8f0;'
      +'padding-left:12px'
      +'}'

      +'.gc35-comment-head{'
      +'display:flex;'
      +'gap:8px;'
      +'align-items:center'
      +'}'

      +'.gc35-avatar{'
      +'width:30px;'
      +'height:30px;'
      +'border-radius:50%;'
      +'background:#dbeafe;'
      +'display:flex;'
      +'align-items:center;'
      +'justify-content:center;'
      +'font-size:.7rem;'
      +'font-weight:800;'
      +'color:#1d4ed8'
      +'}'

      +'.gc35-body{'
      +'font-size:.88rem;'
      +'line-height:1.55;'
      +'margin:5px 0 0 38px'
      +'}'

      +'.gc35-small{'
      +'font-size:.7rem;'
      +'color:#94a3b8'
      +'}'

      +'.gc35-media{'
      +'max-width:100%;'
      +'max-height:260px;'
      +'border-radius:10px;'
      +'margin:7px 0 0 38px'
      +'}'

      +'.gc35-composer{'
      +'margin-top:12px;'
      +'background:#f8fafc;'
      +'border-radius:12px;'
      +'padding:10px'
      +'}'

      +'.gc35-composer textarea{'
      +'width:100%;'
      +'min-height:70px;'
      +'border:1px solid #e2e8f0;'
      +'border-radius:9px;'
      +'padding:9px;'
      +'resize:vertical'
      +'}'

      +'.gc35-devocard{'
      +'background:linear-gradient(135deg,#0ea5e9,#2563eb);'
      +'color:#fff;'
      +'border-radius:16px;'
      +'padding:18px;'
      +'box-shadow:0 8px 24px rgba(37,99,235,.18);'
      +'margin-bottom:15px'
      +'}'

      +'.gc35-notif{'
      +'display:flex;'
      +'gap:12px;'
      +'padding:13px 2px;'
      +'border-bottom:1px solid #e2e8f0;'
      +'cursor:pointer'
      +'}'

      +'.gc35-notif.unread{'
      +'background:#eff6ff;'
      +'border-radius:10px;'
      +'padding-left:10px;'
      +'padding-right:10px'
      +'}'

      +'.gc35-notif-icon{'
      +'width:38px;'
      +'height:38px;'
      +'border-radius:50%;'
      +'background:#dbeafe;'
      +'color:#2563eb;'
      +'display:flex;'
      +'align-items:center;'
      +'justify-content:center;'
      +'flex:none'
      +'}'

      +'.gc35-empty{'
      +'text-align:center;'
      +'color:#94a3b8;'
      +'padding:25px'
      +'}'

      +'.gc35-file{'
      +'font-size:.75rem;'
      +'color:#475569'
      +'}';

    document.head.appendChild(s);
  }

  /* ============================================================
     PREVIOUS LIVE SESSIONS — DEDICATED TAB
     IMPORTANT:
     This deliberately NEVER uses #preachingsList.
     ============================================================ */

  function ensurePreviousLivesTab(){

    var existing=
      document.getElementById(
        'gc35-previous-live-wrap'
      );

    if(existing){
      return existing;
    }

    var liveBox=
      document.getElementById(
        'sermonLiveBox'
      );

    if(!liveBox){
      return null;
    }

    /*
      Find a safe location near the existing live preaching
      component without touching the Sermons list.
    */

    var parent=
      liveBox.parentElement;

    if(!parent){
      return null;
    }

    var wrap=document.createElement(
      'div'
    );

    wrap.id=
      'gc35-previous-live-wrap';

    wrap.className=
      'gc35-history-tab-wrap';

    wrap.innerHTML=

      '<div class="gc35-history-tabs">'

      +'<button'
      +' type="button"'
      +' id="gc35-previous-live-tab"'
      +' class="gc35-history-tab active"'
      +' onclick="gc35ShowPreviousLives()"'
      +'>'
      +'📜 Previous Live Sessions'
      +'</button>'

      +'</div>'

      +'<div'
      +' id="gc35-previous-live-panel"'
      +' class="gc35-history-panel"'
      +'>'
      +'<div class="gc35-empty">'
      +'Loading previous live sessions…'
      +'</div>'
      +'</div>';

    /*
      Insert after the live box.
      This leaves the existing Sermons DOM untouched.
    */

    if(
      liveBox.nextSibling
    ){
      parent.insertBefore(
        wrap,
        liveBox.nextSibling
      );
    }else{
      parent.appendChild(
        wrap
      );
    }

    return wrap;
  }

  function gc35ShowPreviousLives(){

    var panel=
      document.getElementById(
        'gc35-previous-live-panel'
      );

    var tab=
      document.getElementById(
        'gc35-previous-live-tab'
      );

    if(!panel)return;

    if(tab){
      tab.classList.add(
        'active'
      );
    }

    panel.style.display='block';

    loadHistory();
  }

  /* ============================================================
     PERSISTENT LIVE
     ============================================================ */

  async function startPersistentLive(){

    var c=db();

    if(!c){
      toast35(
        'Supabase is not ready',
        'error'
      );
      return;
    }

    if(!admin35()){
      toast35(
        'Admin access required',
        'error'
      );
      return;
    }

    var title=
      (
        document.getElementById(
          'liveTitle'
        )||{}
      ).value||'';

    var youtube=
      (
        document.getElementById(
          'liveYouTube'
        )||{}
      ).value||'';

    title=title.trim();
    youtube=youtube.trim();

    if(!title){
      toast35(
        'Enter a live title',
        'error'
      );
      return;
    }

    var u=
      await c.auth.getUser();

    var me=
      u.data&&
      u.data.user;

    if(!me){
      toast35(
        'Please sign in',
        'error'
      );
      return;
    }

    var row={
      title:title,
      youtube_url:youtube||null,
      description:null,
      started_at:now35(),
      ended_at:null,
      status:'live',
      created_by:me.id,
      updated_at:now35()
    };

    var r=
      await c.from(
        LIVE_TABLE
      )
      .insert([row])
      .select('*')
      .single();

    if(r.error){

      toast35(
        'Could not start saved live: '+
        r.error.message,
        'error'
      );

      return;
    }

    activeLive=r.data;

    window.gc35ActiveLiveId=
      activeLive.id;

    try{

      localStorage.setItem(
        'gc35_live_id',
        activeLive.id
      );

    }catch(e){}

    var m=
      document.getElementById(
        'liveModal'
      );

    if(m){
      m.classList.remove(
        'show'
      );
    }

    if(
      typeof window.renderLiveSession===
      'function'
    ){

      try{

        window.renderLiveSession({
          id:activeLive.id,
          title:activeLive.title,
          youtube_url:
            activeLive.youtube_url
        });

      }catch(e){}
    }

    renderLiveBox();

    ensurePreviousLivesTab();

    loadHistory();

    subscribeComments(
      activeLive.id
    );

    toast35(
      'Live started and saved',
      'success'
    );
  }

  async function endPersistentLive(){

    var c=db();

    if(
      !c||
      !admin35()
    ){
      return;
    }

    var id=
      activeLive&&
      activeLive.id;

    if(!id){

      try{
        id=
          localStorage.getItem(
            'gc35_live_id'
          );
      }catch(e){}
    }

    if(!id){

      toast35(
        'No saved live is currently active',
        'error'
      );

      return;
    }

    var r=
      await c.from(
        LIVE_TABLE
      )
      .update({
        status:'completed',
        ended_at:now35(),
        updated_at:now35()
      })
      .eq(
        'id',
        id
      );

    if(r.error){

      toast35(
        'Could not save ended live: '+
        r.error.message,
        'error'
      );

      return;
    }

    activeLive=null;

    window.gc35ActiveLiveId=
      null;

    try{
      localStorage.removeItem(
        'gc35_live_id'
      );
    }catch(e){}

    renderLiveBox();

    ensurePreviousLivesTab();

    loadHistory();

    unsubscribeComments();

    toast35(
      'Live ended and saved to previous live sessions',
      'success'
    );
  }

  async function loadActiveLive(){

    var c=db();

    if(!c)return;

    var r=
      await c.from(
        LIVE_TABLE
      )
      .select('*')
      .eq(
        'status',
        'live'
      )
      .order(
        'started_at',
        {ascending:false}
      )
      .limit(1);

    if(
      !r.error&&
      r.data&&
      r.data[0]
    ){

      activeLive=
        r.data[0];

      window.gc35ActiveLiveId=
        activeLive.id;

      renderLiveBox();

      subscribeComments(
        activeLive.id
      );

    }else{

      activeLive=null;

      window.gc35ActiveLiveId=
        null;

      renderLiveBox();
    }
  }

  function renderLiveBox(){

    var box=
      document.getElementById(
        'sermonLiveBox'
      );

    if(!box)return;

    if(!activeLive){

      box.innerHTML=
        '<div style="text-align:center;padding:20px;color:var(--text-lighter)">'
        +'No live sermon right now.'
        +'</div>';

      return;
    }

    var yt=
      activeLive.youtube_url||'';

    var embed='';

    var m=
      yt.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/))([^?&/]+)/i
      );

    if(m){

      embed=
        '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:10px 0">'
        +'<iframe src="https://www.youtube.com/embed/'
        +encodeURIComponent(m[1])
        +'" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="autoplay;encrypted-media" allowfullscreen></iframe>'
        +'</div>';
    }

    box.innerHTML=

      '<div class="gc35-live gc35-card">'

      +'<span class="gc35-badge">'
      +'🔴 LIVE'
      +'</span>'

      +'<h3 style="margin-top:8px">'
      +esc35(activeLive.title)
      +'</h3>'

      +'<div class="gc35-meta">'
      +'Started '
      +new Date(
        activeLive.started_at
      ).toLocaleString()
      +'</div>'

      +embed

      +(
        admin35()
        ?
        '<div class="gc35-actions">'
        +'<button class="gc35-btn gc35-danger" onclick="gc35EndLive()">'
        +'End & Save Live'
        +'</button>'
        +'</div>'
        :
        ''
      )

      +'</div>';
  }

  /* ============================================================
     HISTORY
     IMPORTANT:
     ONLY renders inside gc35-previous-live-panel.
     NEVER touches Sermons / #preachingsList.
     ============================================================ */

  async function loadHistory(){

    var host=
      document.getElementById(
        'gc35-previous-live-panel'
      );

    if(!host){

      ensurePreviousLivesTab();

      host=
        document.getElementById(
          'gc35-previous-live-panel'
        );
    }

    if(!host)return;

    var c=db();

    if(!c)return;

    var r=
      await c.from(
        LIVE_TABLE
      )
      .select('*')
      .eq(
        'status',
        'completed'
      )
      .order(
        'ended_at',
        {ascending:false}
      )
      .limit(100);

    if(r.error){

      host.innerHTML=
        '<div class="gc35-empty">'
        +'Saved live sessions are unavailable until the preaching tables are configured.'
        +'</div>';

      return;
    }

    var rows=
      r.data||[];

    var h=
      '<div class="gc35-history">'

      +'<div style="font-weight:800;font-size:1rem;margin:8px 0 12px">'
      +'📜 Previous Live Sessions'
      +'</div>';

    if(!rows.length){

      h+=
        '<div class="gc35-empty">'
        +'No completed live preachings yet.'
        +'</div>';
    }

    rows.forEach(
      function(x){

        var id=
          String(
            x.id
          ).replace(
            /'/g,
            ''
          );

        var duration='';

        if(
          x.ended_at&&
          x.started_at
        ){

          duration=
            Math.max(
              1,
              Math.round(
                (
                  new Date(
                    x.ended_at
                  )-
                  new Date(
                    x.started_at
                  )
                )/60000
              )
            )+
            ' min';
        }

        h+=

          '<div class="gc35-card">'

          +'<div style="font-weight:800">'
          +'🎤 '
          +esc35(x.title)
          +'</div>'

          +'<div class="gc35-meta">'
          +new Date(
            x.started_at
          ).toLocaleString()

          +(
            duration
            ?
            ' · '+duration
            :
            ''
          )

          +'</div>'

          +(
            x.ended_at
            ?
            '<div class="gc35-small" style="margin-top:3px">'
            +'Ended '
            +new Date(
              x.ended_at
            ).toLocaleString()
            +'</div>'
            :
            ''
          )

          +'<div class="gc35-actions">'

          +'<button class="gc35-btn gc35-primary" onclick="gc35OpenHistory(\''+
            id+
            '\')">'
          +'Open Discussion'
          +'</button>'

          +(
            admin35()
            ?

              '<button class="gc35-btn gc35-muted" onclick="gc35EditLive(\''+
              id+
              '\')">'
              +'Edit'
              +'</button>'

              +'<button class="gc35-btn gc35-danger" onclick="gc35DeleteLive(\''+
              id+
              '\')">'
              +'Delete'
              +'</button>'

            :
            ''
          )

          +'</div>'

          +'</div>';
      }
    );

    h+='</div>';

    host.innerHTML=h;
  }

  /* ============================================================
     OPEN PREVIOUS LIVE
     ============================================================ */

  async function gc35OpenHistory(id){

    var c=db();

    if(!c)return;

    var r=
      await c.from(
        LIVE_TABLE
      )
      .select('*')
      .eq(
        'id',
        id
      )
      .single();

    if(
      r.error||
      !r.data
    ){

      toast35(
        'Preaching not found',
        'error'
      );

      return;
    }

    /*
      IMPORTANT:
      Do not replace activeLive here.
      A completed session being viewed must not become the
      session that End & Save Live operates on.
    */

    discussionLive=
      r.data;

    renderHistoryModal(
      r.data
    );

    /*
      The realtime channel may currently belong to another
      live. Remove it before subscribing to this discussion.
    */

    unsubscribeComments();

    loadComments(
      id
    );

    subscribeComments(
      id
    );
  }

  function renderHistoryModal(x){

    var old=
      document.getElementById(
        'gc35-history-modal'
      );

    if(old){
      old.remove();
    }

    var b=
      document.createElement(
        'div'
      );

    b.id=
      'gc35-history-modal';

    b.className=
      'modal-overlay show';

    b.innerHTML=

      '<div class="modal" style="max-height:92vh;overflow:auto">'

      +'<div class="modal-handle"></div>'

      +'<div class="modal-title">'
      +'🎤 '
      +esc35(x.title)
      +'</div>'

      +'<div class="gc35-meta">'
      +new Date(
        x.started_at
      ).toLocaleString()
      +' · Saved preaching'
      +'</div>'

      +(
        x.youtube_url
        ?
        '<div style="margin-top:12px">'
        +'<a href="'+
          esc35(
            x.youtube_url
          )+
          '" target="_blank" rel="noopener" class="btn btn-primary btn-block">'
        +'▶ Open Video / Live Recording'
        +'</a>'
        +'</div>'
        :
        ''
      )

      +'<div id="gc35-comments" class="gc35-comments">'
      +'<div class="gc35-empty">'
      +'Loading discussion…'
      +'</div>'
      +'</div>'

      +'<button class="btn btn-secondary btn-block" style="margin-top:12px" onclick="gc35CloseHistory()">'
      +'Close'
      +'</button>'

      +'</div>';

    document.body.appendChild(
      b
    );
  }

  function gc35CloseHistory(){

    var m=
      document.getElementById(
        'gc35-history-modal'
      );

    if(m){
      m.remove();
    }

    discussionLive=null;

    /*
      If there is a currently active live, restore its realtime
      comment subscription. This does not change activeLive.
    */

    unsubscribeComments();

    if(activeLive){
      subscribeComments(
        activeLive.id
      );
    }
  }

  /* ============================================================
     EDIT LIVE
     ============================================================ */

  async function gc35EditLive(id){

    var c=db();

    if(!c)return;

    var r=
      await c.from(
        LIVE_TABLE
      )
      .select('*')
      .eq(
        'id',
        id
      )
      .single();

    if(r.error){

      return toast35(
        r.error.message,
        'error'
      );
    }

    var title=
      prompt(
        'Edit preaching title:',
        r.data.title
      );

    if(title===null){
      return;
    }

    var url=
      prompt(
        'Edit recording/YouTube URL:',
        r.data.youtube_url||''
      );

    if(url===null){
      return;
    }

    var u=
      await c.from(
        LIVE_TABLE
      )
      .update({
        title:title.trim(),
        youtube_url:
          url.trim()||null,
        updated_at:now35()
      })
      .eq(
        'id',
        id
      );

    if(u.error){

      toast35(
        u.error.message,
        'error'
      );

    }else{

      toast35(
        'Preaching updated',
        'success'
      );

      loadHistory();
    }
  }

  /* ============================================================
     DELETE LIVE
     ============================================================ */

  async function gc35DeleteLive(id){

    if(
      !confirm(
        'Delete this saved preaching and its discussion?'
      )
    ){
      return;
    }

    var c=db();

    if(!c)return;

    /*
      Delete only comments belonging to this live.
      No Sermons/document data is touched.
    */

    var commentsDelete=
      await c.from(
        COMMENT_TABLE
      )
      .delete()
      .eq(
        'preaching_id',
        id
      );

    if(commentsDelete.error){

      toast35(
        'Could not delete discussion: '+
        commentsDelete.error.message,
        'error'
      );

      return;
    }

    var r=
      await c.from(
        LIVE_TABLE
      )
      .delete()
      .eq(
        'id',
        id
      );

    if(r.error){

      toast35(
        r.error.message,
        'error'
      );

    }else{

      toast35(
        'Preaching deleted',
        'success'
      );

      var m=
        document.getElementById(
          'gc35-history-modal'
        );

      if(m){
        m.remove();
      }

      if(
        discussionLive&&
        discussionLive.id===id
      ){
        discussionLive=null;
      }

      loadHistory();
    }
  }

  /* ============================================================
     COMMENTS
     ============================================================ */

  async function loadComments(id){

    var out=
      document.getElementById(
        'gc35-comments'
      );

    if(!out)return;

    var c=db();

    if(!c)return;

    var r=
      await c.from(
        COMMENT_TABLE
      )
      .select('*')
      .eq(
        'preaching_id',
        id
      )
      .order(
        'created_at',
        {ascending:true}
      );

    if(r.error){

      out.innerHTML=
        '<div class="gc35-empty">'
        +'Discussion unavailable.'
        +'</div>';

      return;
    }

    var comments=
      r.data||[];

    var ids=[];

    comments.forEach(
      function(x){

        if(x.user_id){
          ids.push(
            x.user_id
          );
        }
      }
    );

    var prof={};

    if(ids.length){

      var p=
        await c.from(
          'profiles'
        )
        .select(
          'id,name,full_name,avatar_url'
        )
        .in(
          'id',
          Array.from(
            new Set(ids)
          )
        );

      (p.data||[]).forEach(
        function(x){
          prof[x.id]=x;
        }
      );
    }

    var roots=
      comments.filter(
        function(x){
          return !x.parent_id;
        }
      );

    var by={};

    comments.forEach(
      function(x){

        var key=
          x.parent_id||
          'root';

        if(!by[key]){
          by[key]=[];
        }

        by[key].push(
          x
        );
      }
    );

    function one(x,level){

      var p=
        prof[x.user_id]||{};

      var name=
        p.name||
        p.full_name||
        'Member';

      var media='';

      if(x.media_url){

        if(
          /\.(mp4|webm|mov)$/i.test(
            x.media_url
          )
        ){

          media=
            '<div>'
            +'<video controls class="gc35-media" src="'+
            esc35(
              x.media_url
            )+
            '"></video>'
            +'</div>';

        }else{

          media=
            '<div>'
            +'<img class="gc35-media" src="'+
            esc35(
              x.media_url
            )+
            '" alt="Attached media">'
            +'</div>';
        }
      }

      var children=
        by[x.id]||[];

      var commentId=
        String(
          x.id
        ).replace(
          /'/g,
          ''
        );

      var ownerButtons='';

      /*
        Do not reference an undefined global `user`.
        Get the authenticated user safely.
      */

      ownerButtons=
        '<button class="gc35-btn gc35-muted" onclick="gc35Reply(\''+
        commentId+
        '\')">'
        +'Reply'
        +'</button>';

      ownerButtons+=
        '<button class="gc35-btn gc35-danger" onclick="gc35DeleteComment(\''+
        commentId+
        '\')">'
        +'Delete'
        +'</button>';

      return (

        '<div class="gc35-comment '+
        (
          level
          ?
          'gc35-reply'
          :
          ''
        )+
        '">'

        +'<div class="gc35-comment-head">'

        +'<div class="gc35-avatar">'
        +esc35(
          (name||'?')
            .slice(
              0,
              2
            )
            .toUpperCase()
        )
        +'</div>'

        +'<div>'

        +'<b>'
        +esc35(name)
        +'</b>'

        +'<div class="gc35-small">'
        +new Date(
          x.created_at
        ).toLocaleString()
        +'</div>'

        +'</div>'

        +'</div>'

        +'<div class="gc35-body">'
        +esc35(
          x.body||''
        )
        +'</div>'

        +media

        +'<div style="margin-left:38px;margin-top:5px">'
        +ownerButtons
        +'</div>'

        +children.map(
          function(y){
            return one(
              y,
              level+1
            );
          }
        ).join('')

        +'</div>'
      );
    }

    var h=
      '<div style="font-weight:800;margin-bottom:8px">'
      +'💬 Discussion'
      +'</div>';

    h+=
      roots.map(
        function(x){
          return one(
            x,
            0
          );
        }
      ).join('');

    h+=

      '<div class="gc35-composer">'

      +'<textarea id="gc35-comment-text" placeholder="Share your thoughts..."></textarea>'

      +'<input id="gc35-comment-file" type="file" accept="image/*,video/*" style="margin-top:7px">'

      +'<div class="gc35-actions">'

      +'<button class="gc35-btn gc35-primary" onclick="gc35PostComment(\''+
        String(id).replace(
          /'/g,
          ''
        )+
        '\',null)">'
      +'Post Comment'
      +'</button>'

      +'</div>'

      +'</div>';

    out.innerHTML=h;
  }

  /* ============================================================
     MEDIA UPLOAD
     ============================================================ */

  async function upload35(file){

    if(!file){
      return null;
    }

    var c=db();

    if(!c){
      return null;
    }

    var u=
      await c.auth.getUser();

    var me=
      u.data&&
      u.data.user;

    if(!me){
      return null;
    }

    var ext=
      (
        file.name
          .split('.')
          .pop()||
        'bin'
      ).toLowerCase();

    var path=
      'preaching/' +
      me.id +
      '/' +
      Date.now() +
      '.' +
      ext;

    var r=
      await c.storage
      .from('media')
      .upload(
        path,
        file,
        {
          upsert:false
        }
      );

    if(r.error){
      throw r.error;
    }

    return c.storage
      .from('media')
      .getPublicUrl(
        path
      )
      .data.publicUrl;
  }

  /* ============================================================
     POST COMMENT
     ============================================================ */

  async function gc35PostComment(
    id,
    parent
  ){

    var c=db();

    if(!c)return;

    var u=
      await c.auth.getUser();

    var me=
      u.data&&
      u.data.user;

    if(!me){

      toast35(
        'Please sign in to comment',
        'error'
      );

      return;
    }

    var ta=
      document.getElementById(
        'gc35-comment-text'
      );

    var body=
      (
        ta&&
        ta.value||
        ''
      ).trim();

    var file=
      document.getElementById(
        'gc35-comment-file'
      );

    var selectedFile=
      file&&
      file.files&&
      file.files[0]
      ?
      file.files[0]
      :
      null;

    if(
      !body&&
      !selectedFile
    ){
      return;
    }

    try{

      var media=
        selectedFile
        ?
        await upload35(
          selectedFile
        )
        :
        null;

      var r=
        await c.from(
          COMMENT_TABLE
        )
        .insert([{
          preaching_id:id,
          user_id:me.id,
          parent_id:
            parent||
            null,
          body:body,
          media_url:media,
          created_at:now35(),
          updated_at:now35()
        }]);

      if(r.error){
        throw r.error;
      }

      loadComments(
        id
      );

      toast35(
        'Comment posted',
        'success'
      );

    }catch(e){

      toast35(
        'Comment failed: '+
        e.message,
        'error'
      );
    }
  }

  /* ============================================================
     REPLY
     ============================================================ */

  async function gc35Reply(
    parent
  ){

    var body=
      prompt(
        'Write your reply:'
      );

    if(
      body===null||
      !body.trim()
    ){
      return;
    }

    var c=db();

    if(!c)return;

    var u=
      await c.auth.getUser();

    var me=
      u.data&&
      u.data.user;

    if(!me)return;

    /*
      Replies belong to the currently opened historical session,
      NOT necessarily the currently active live.
    */

    var target=
      discussionLive||
      activeLive;

    if(
      !target||
      !target.id
    ){

      toast35(
        'Open a preaching discussion first',
        'error'
      );

      return;
    }

    var r=
      await c.from(
        COMMENT_TABLE
      )
      .insert([{
        preaching_id:
          target.id,
        user_id:
          me.id,
        parent_id:
          parent,
        body:
          body.trim(),
        media_url:null,
        created_at:
          now35(),
        updated_at:
          now35()
      }]);

    if(r.error){

      toast35(
        r.error.message,
        'error'
      );

    }else{

      loadComments(
        target.id
      );
    }
  }

  /* ============================================================
     DELETE COMMENT
     ============================================================ */

  async function gc35DeleteComment(
    id
  ){

    if(
      !confirm(
        'Delete this comment?'
      )
    ){
      return;
    }

    var c=db();

    if(!c)return;

    var r=
      await c.from(
        COMMENT_TABLE
      )
      .delete()
      .eq(
        'id',
        id
      );

    if(r.error){

      toast35(
        r.error.message,
        'error'
      );

    }else{

      var target=
        discussionLive||
        activeLive;

      if(
        target&&
        target.id
      ){

        loadComments(
          target.id
        );
      }
    }
  }

  /* ============================================================
     REALTIME COMMENTS
     ============================================================ */

  function subscribeComments(
    id
  ){

    var c=db();

    id=
      id||
      (
        activeLive&&
        activeLive.id
      );

    if(
      !c||
      !id||
      !c.channel
    ){
      return;
    }

    /*
      If the current channel is already for this session,
      leave it alone.
    */

    if(commentChannel){
      return;
    }

    try{

      commentChannel=
        c.channel(
          'gc35-comments-'+
          id
        )
        .on(
          'postgres_changes',
          {
            event:'*',
            schema:'public',
            table:COMMENT_TABLE,
            filter:
              'preaching_id=eq.'+
              id
          },
          function(){

            loadComments(
              id
            );
          }
        )
        .subscribe();

    }catch(e){}
  }

  function unsubscribeComments(){

    if(commentChannel){

      try{

        var c=db();

        if(c){

          c.removeChannel(
            commentChannel
          );
        }

      }catch(e){}

      commentChannel=null;
    }
  }

  /* ============================================================
     DEVOTIONAL
     ============================================================ */

  function ensureDevotional(){

    var host=
      document.getElementById(
        'home-devotional'
      );

    if(!host)return;

    if(
      document.getElementById(
        'devotionalCard'
      )
    ){
      return;
    }

    var card=
      document.createElement(
        'div'
      );

    card.id=
      'gc35-devotional-placeholder';

    card.className=
      'gc35-devocard';

    card.innerHTML=

      '<div style="font-weight:800;font-size:1.05rem">'
      +'🙏 Daily Devotional'
      +'</div>'

      +'<div id="gc35-devo-title" style="font-weight:800;margin-top:10px">'
      +'Loading today’s devotional…'
      +'</div>'

      +'<div id="gc35-devo-verse" style="margin-top:8px;opacity:.9">'
      +'</div>'

      +'<div id="gc35-devo-body" style="margin-top:10px;line-height:1.6">'
      +'</div>';

    host.appendChild(
      card
    );

    loadDevotional35();
  }

  async function loadDevotional35(){

    var c=db();

    var today=
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    var d=null;

    if(c){

      var r=
        await c.from(
          'devotionals'
        )
        .select('*')
        .eq(
          'active',
          true
        )
        .eq(
          'date',
          today
        )
        .order(
          'updated_at',
          {
            ascending:false
          }
        )
        .limit(1);

      if(
        !r.error&&
        r.data&&
        r.data[0]
      ){

        d=
          r.data[0];
      }
    }

    if(!d){

      try{

        var j=
          await fetch(
            'https://www.christhimself.com/api/v1/devotionals/'
            +
            String(
              new Date()
                .getMonth()+1
            ).padStart(
              2,
              '0'
            )
            +
            '-'
            +
            String(
              new Date()
                .getDate()
            ).padStart(
              2,
              '0'
            )
            +
            '.json'
          )
          .then(
            function(r){
              return r.json();
            }
          );

        var am=
          (j.periods||[])
            .find(
              function(x){
                return x.period==='am';
              }
            )||
          (
            j.periods&&
            j.periods[0]
          );

        var x=
          am&&
          am.languages&&
          am.languages.en;

        d={
          title:
            x&&
            x.theme||
            'Today’s Devotional',

          body:
            x&&
            x.summary||
            '',

          verse:
            (x&&
              x.verses||
              []
            )
            .map(
              function(v){
                return (
                  v.reference||
                  v.text||
                  ''
                );
              }
            )
            .join(
              ' · '
            )
        };

      }catch(e){

        d={
          title:
            'Today’s Devotional',

          body:
            'Spend time in prayer, Scripture and reflection today.',

          verse:''
        };
      }
    }

    var t=
      document.getElementById(
        'gc35-devo-title'
      );

    var v=
      document.getElementById(
        'gc35-devo-verse'
      );

    var b=
      document.getElementById(
        'gc35-devo-body'
      );

    if(t){

      t.textContent=
        d.title||
        'Today’s Devotional';
    }

    if(v){

      v.textContent=
        d.verse
        ?
        '📖 '+d.verse
        :
        '';
    }

    if(b){

      b.textContent=
        d.body||
        '';
    }
  }

  /* ============================================================
     DEDICATED NOTIFICATIONS
     ============================================================ */

  function openNotifications35(){

    if(
      typeof window.switchSection===
      'function'
    ){

      window.switchSection(
        'home'
      );
    }

    if(
      typeof window.showSubPage===
      'function'
    ){

      window.showSubPage(
        'home-notifications'
      );
    }

    setTimeout(
      renderNotifications35,
      50
    );
  }

  async function renderNotifications35(){

    var host=
      document.getElementById(
        'home-notifications'
      );

    if(!host)return;

    var c=db();

    if(!c)return;

    var u=
      await c.auth.getUser();

    var me=
      u.data&&
      u.data.user;

    if(!me)return;

    var r=
      await c.from(
        'notifications'
      )
      .select('*')
      .eq(
        'user_id',
        me.id
      )
      .order(
        'created_at',
        {
          ascending:false
        }
      )
      .limit(100);

    if(r.error)return;

    var rows=
      r.data||[];

    var h=

      '<button class="back-btn" onclick="showSubPage(\'home-main\')">'
      +'<i class="fas fa-arrow-left"></i> Back'
      +'</button>'

      +'<div class="section-title-app">'
      +'🔔 Notifications'
      +'</div>'

      +'<div style="text-align:right;margin-bottom:8px">'

      +'<button class="gc35-btn gc35-muted" onclick="gc35MarkAllRead()">'
      +'Mark all as read'
      +'</button>'

      +'</div>';

    if(!rows.length){

      h+=
        '<div class="gc35-empty">'
        +'You have no notifications.'
        +'</div>';
    }

    rows.forEach(
      function(n){

        var title=
          n.title||
          'Notification';

        var body=
          n.body||
          n.message||
          '';

        var target=
          n.target_id||
          n.reference_id||
          '';

        var nid=
          String(
            n.id
          ).replace(
            /'/g,
            ''
          );

        var ntype=
          String(
            n.type||''
          ).replace(
            /'/g,
            ''
          );

        var ntarget=
          String(
            target
          ).replace(
            /'/g,
            ''
          );

        h+=

          '<div class="gc35-notif '+
          (
            n.is_read
            ?
            ''
            :
            'unread'
          )+
          '" onclick="gc35OpenNotification(\''+
          nid+
          '\',\''+
          ntype+
          '\',\''+
          ntarget+
          '\')">'

          +'<div class="gc35-notif-icon">'
          +
          (
            n.is_read
            ?
            '✓'
            :
            '●'
          )
          +'</div>'

          +'<div style="flex:1">'

          +'<b>'
          +esc35(title)
          +'</b>'

          +'<div style="font-size:.84rem;margin-top:3px">'
          +esc35(body)
          +'</div>'

          +'<div class="gc35-small" style="margin-top:4px">'
          +
          (
            n.created_at
            ?
            new Date(
              n.created_at
            ).toLocaleString()
            :
            ''
          )
          +'</div>'

          +'</div>'

          +'</div>';
      }
    );

    host.innerHTML=h;
  }

  async function gc35MarkAllRead(){

    var c=db();

    if(!c)return;

    var u=
      await c.auth.getUser();

    var me=
      u.data&&
      u.data.user;

    if(!me)return;

    await c.from(
      'notifications'
    )
    .update({
      is_read:true
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

    if(
      typeof window.refreshNotificationBadge===
      'function'
    ){

      window.refreshNotificationBadge();
    }
  }

  async function gc35OpenNotification(
    id,
    type,
    target
  ){

    var c=db();

    if(c){

      await c.from(
        'notifications'
      )
      .update({
        is_read:true
      })
      .eq(
        'id',
        id
      );
    }

    if(
      type&&
      /preach|live|sermon/i.test(
        type
      )&&
      target
    ){

      gc35OpenHistory(
        target
      );

    }else{

      renderNotifications35();
    }
  }

  /* ============================================================
     INSTALL
     ============================================================ */

  function install35(){

    style35();

    /*
      Preserve the existing public API.
    */

    window.startLive=
      startPersistentLive;

    window.endLive=
      endPersistentLive;

    window.gc35EndLive=
      endPersistentLive;

    window.gc35OpenHistory=
      gc35OpenHistory;

    window.gc35EditLive=
      gc35EditLive;

    window.gc35DeleteLive=
      gc35DeleteLive;

    window.gc35PostComment=
      gc35PostComment;

    window.gc35Reply=
      gc35Reply;

    window.gc35DeleteComment=
      gc35DeleteComment;

    window.gc35MarkAllRead=
      gc35MarkAllRead;

    window.gc35OpenNotification=
      gc35OpenNotification;

    window.gc35ShowPreviousLives=
      gc35ShowPreviousLives;

    window.gc35CloseHistory=
      gc35CloseHistory;

    /*
      Bell notifications.
    */

    var bells=
      document.querySelectorAll(
        '.header-btn'
      );

    bells.forEach(
      function(b){

        if(
          b.querySelector(
            '.fa-bell'
          )
        ){

          b.onclick=
            openNotifications35;
        }
      }
    );

    /*
      Create the new Previous Live Sessions
      container only.
    */

    ensurePreviousLivesTab();

    /*
      Existing devotional functionality.
    */

    ensureDevotional();

    /*
      Load completed lives into the NEW
      dedicated panel — never Sermons.
    */

    loadHistory();

    /*
      Restore active live.
    */

    loadActiveLive();

    if(window.__gc35Timer){

      clearInterval(
        window.__gc35Timer
      );
    }

    window.__gc35Timer=
      setInterval(
        function(){

          ensurePreviousLivesTab();

          loadActiveLive();

          loadHistory();

          ensureDevotional();

        },
        30000
      );
  }

  /* ============================================================
     START
     ============================================================ */

  if(
    document.readyState===
    'loading'
  ){

    document.addEventListener(
      'DOMContentLoaded',
      install35
    );

  }else{

    install35();
  }


/* ============================================================
   GRACECONNECT FINAL GROUP / CATEGORY FUNCTIONALITY FIX
   ============================================================

   FIXES:
   1. Ushirika feed:
      - post
      - comment
      - reply
      - optional media
      - user deletes own post/comment/reply
      - admin deletes any post/comment/reply
      - group leader/chairman can delete posts/comments in group

   2. Department feed:
      - same complete functionality

   3. Groups main feed:
      - post
      - comment
      - reply
      - optional media
      - delete own post/comment/reply
      - admin delete
      - uses community_posts/community_comments so it has
        the same comment engine as the working public forum/category

   4. Category Members:
      - every member gets ONE blue Chat button
      - uses existing c26OpenChat / h27ChatWith functionality
      - does not remove member management controls

   IMPORTANT:
   This is intentionally placed in APP35 because app35 is loaded
   after app25/app22/app30.
   ============================================================ */

(function () {
    'use strict';

    console.log('✝️ GraceConnect FINAL GROUP FUNCTIONALITY PATCH loaded');

    /* =========================================================
       BASIC HELPERS
    ========================================================= */

    function DB() {
        try {
            if (typeof window.sb === 'function') {
                return window.sb();
            }

            if (window.sb && typeof window.sb.from === 'function') {
                return window.sb;
            }

            if (
                window.supabaseClient &&
                typeof window.supabaseClient.from === 'function'
            ) {
                return window.supabaseClient;
            }
        } catch (e) {
            console.error('Supabase client error:', e);
        }

        return null;
    }

    function USER() {
        return window.user ||
               window.currentUser ||
               window.loggedInUser ||
               null;
    }

    function ADMIN() {
        try {
            return window.isAdmin ? !!window.isAdmin() : false;
        } catch (e) {
            return false;
        }
    }

    function ESC(value) {
        if (window.esc) {
            return window.esc(value);
        }

        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function DATE(value) {
        if (!value) return '';

        try {
            if (window.fdate) {
                return window.fdate(value);
            }

            return new Date(value).toLocaleDateString();
        } catch (e) {
            return '';
        }
    }

    function INITIALS(name) {
        if (window.ini) {
            return window.ini(name);
        }

        if (!name) return '?';

        return String(name)
            .split(/\s+/)
            .map(function (x) {
                return x.charAt(0);
            })
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    function AVATAR(user, size) {
        size = size || 38;

        if (user && user.profile_pic) {
            return '<img src="' + ESC(user.profile_pic) + '"' +
                ' style="width:' + size + 'px;height:' + size +
                'px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block">';
        }

        return '<div class="post-avatar"' +
            ' style="width:' + size + 'px;height:' + size +
            'px;display:flex;align-items:center;justify-content:center">' +
            INITIALS(user && user.name) +
            '</div>';
    }

    async function USERS() {
        var db = DB();

        if (!db) return [];

        if (window.usersData && window.usersData.length) {
            return window.usersData;
        }

        var r = await db
            .from('profiles')
            .select('id,name,profile_pic,email,role')
            .order('name');

        if (r.error) {
            r = await db
                .from('profiles')
                .select('id,name,profile_pic,role')
                .order('name');
        }

        window.usersData = r.data || [];

        return window.usersData;
    }

    function MEDIA(url) {
        if (!url) return '';

        var safe = ESC(url);

        if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
            return '<img src="' + safe + '"' +
                ' style="width:100%;max-height:300px;object-fit:cover;' +
                'border-radius:12px;margin-top:7px;display:block">';
        }

        if (/\.(mp4|webm|ogg|ogv|mov|m4v|3gp)(\?.*)?$/i.test(url)) {
            return '<video src="' + safe + '"' +
                ' controls playsinline' +
                ' style="width:100%;max-height:320px;border-radius:12px;' +
                'margin-top:7px;display:block"></video>';
        }

        if (/\.(mp3|wav|m4a|aac)(\?.*)?$/i.test(url)) {
            return '<audio src="' + safe + '"' +
                ' controls style="width:100%;margin-top:7px;display:block"></audio>';
        }

        return '<a href="' + safe +
            '" target="_blank" class="btn btn-secondary btn-sm"' +
            ' style="margin-top:7px">' +
            '<i class="fas fa-paperclip"></i> Attachment</a>';
    }

    async function UPLOAD(file, folder) {
        if (!file) return null;

        try {
            if (window.uploadMediaFile) {
                return await window.uploadMediaFile(file);
            }
        } catch (e) {
            console.warn('uploadMediaFile failed, using storage fallback');
        }

        var db = DB();

        if (!db) {
            alert('Supabase is not ready.');
            return null;
        }

        var filename =
            (folder || 'media') +
            '/' +
            Date.now() +
            '_' +
            String(file.name || 'file').replace(/\s+/g, '_');

        var result = await db
            .storage
            .from('media')
            .upload(filename, file);

        if (result.error) {
            alert('Upload failed: ' + result.error.message);
            return null;
        }

        return db
            .storage
            .from('media')
            .getPublicUrl(filename)
            .data
            .publicUrl;
    }


    /* =========================================================
       COMMENT TREE
    ========================================================= */

    function BUILD_TREE(comments) {
        var map = {};
        var roots = [];

        (comments || []).forEach(function (c) {
            c._children = [];
            map[String(c.id)] = c;
        });

        (comments || []).forEach(function (c) {
            var parent = c.parent_comment_id;

            if (
                parent !== null &&
                parent !== undefined &&
                map[String(parent)]
            ) {
                map[String(parent)]._children.push(c);
            } else {
                roots.push(c);
            }
        });

        return roots;
    }


    /* =========================================================
       GROUP COMMENT DELETE
    ========================================================= */

    async function DELETE_COMMENT_TREE(commentId, refreshFunction) {
        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var target = await db
            .from('community_comments')
            .select('id,user_id,post_id,parent_comment_id')
            .eq('id', commentId)
            .maybeSingle();

        if (target.error) {
            alert(target.error.message);
            return;
        }

        if (!target.data) {
            alert('Comment no longer exists.');
            return;
        }

        if (
            !ADMIN() &&
            String(target.data.user_id) !== String(user.id)
        ) {
            alert('You can only delete your own comment.');
            return;
        }

        if (!confirm('Delete this comment and its replies?')) {
            return;
        }

        var all = await db
            .from('community_comments')
            .select('id,parent_comment_id,user_id')
            .eq('post_id', target.data.post_id);

        if (all.error) {
            alert(all.error.message);
            return;
        }

        var rows = all.data || [];
        var ids = [String(commentId)];

        var changed = true;

        while (changed) {
            changed = false;

            rows.forEach(function (row) {
                var id = String(row.id);
                var parent = row.parent_comment_id == null
                    ? null
                    : String(row.parent_comment_id);

                if (
                    parent &&
                    ids.indexOf(parent) !== -1 &&
                    ids.indexOf(id) === -1
                ) {
                    ids.push(id);
                    changed = true;
                }
            });
        }

        for (var i = 0; i < ids.length; i++) {
            var del = await db
                .from('community_comments')
                .delete()
                .eq('id', ids[i]);

            if (del.error) {
                alert(del.error.message);
                return;
            }
        }

        if (typeof refreshFunction === 'function') {
            refreshFunction();
        }
    }


    /* =========================================================
       COMMON COMMENT RENDERER
    ========================================================= */

    function RENDER_COMMENTS(
        comments,
        postId,
        users,
        prefix,
        canDeleteComment
    ) {
        var roots = BUILD_TREE(comments);

        function render(list, depth) {
            return (list || []).map(function (c) {

                var u = users.find(function (x) {
                    return String(x.id) === String(c.user_id);
                });

                var own =
                    USER() &&
                    String(c.user_id) === String(USER().id);

                var canDelete =
                    ADMIN() ||
                    own ||
                    !!canDeleteComment;

                var replyInputId =
                    prefix + 'replytext_' + c.id;

                var replyMediaKey =
                    prefix + 'replymedia_' + c.id;

                var replyMediaLabel =
                    prefix + 'replylabel_' + c.id;

                var children =
                    c._children && c._children.length
                        ? render(c._children, depth + 1)
                        : '';

                return (
                    '<div style="' +
                    'margin-left:' +
                    Math.min(depth, 4) * 18 +
                    'px;' +
                    'margin-top:8px;' +
                    'background:var(--bg);' +
                    'border-radius:12px;' +
                    'padding:9px">' +

                    '<div style="display:flex;gap:7px;align-items:center">' +

                    AVATAR(u, 28) +

                    '<div style="flex:1">' +
                    '<b style="font-size:.78rem">' +
                    ESC((u && u.name) || 'Member') +
                    '</b>' +

                    '<div style="font-size:.65rem;color:var(--text-light)">' +
                    DATE(c.created_at) +
                    '</div>' +

                    '</div>' +

                    (
                        canDelete
                            ? '<button class="btn btn-danger btn-sm"' +
                              ' onclick="' +
                              prefix +
                              'DeleteComment(\'' +
                              c.id +
                              '\')">' +
                              '<i class="fas fa-trash"></i>' +
                              '</button>'
                            : ''
                    ) +

                    '</div>' +

                    (
                        c.text
                            ? '<div style="' +
                              'font-size:.85rem;' +
                              'white-space:pre-wrap;' +
                              'margin-top:5px">' +
                              ESC(c.text) +
                              '</div>'
                            : ''
                    ) +

                    MEDIA(c.media_url) +

                    '<button class="btn btn-secondary btn-sm"' +
                    ' style="margin-top:5px;font-size:.7rem"' +
                    ' onclick="' +
                    prefix +
                    'ToggleReply(\'' +
                    c.id +
                    '\')">' +
                    '<i class="fas fa-reply"></i> Reply' +
                    '</button>' +

                    (
                        '<div id="' +
                        prefix +
                        'reply_' +
                        c.id +
                        '" style="display:none;margin-top:7px">' +

                        '<div style="display:flex;gap:5px;align-items:center">' +

                        '<input class="form-input"' +
                        ' id="' +
                        replyInputId +
                        '"' +
                        ' placeholder="Reply..."' +
                        ' style="flex:1">' +

                        '<button class="btn btn-secondary btn-sm"' +
                        ' onclick="' +
                        prefix +
                        'Attach(\'' +
                        replyMediaKey +
                        '\',\'' +
                        replyMediaLabel +
                        '\')">' +
                        '<i class="fas fa-paperclip"></i>' +
                        '</button>' +

                        '<button class="btn btn-primary btn-sm"' +
                        ' onclick="' +
                        prefix +
                        'Reply(\'' +
                        postId +
                        '\',\'' +
                        c.id +
                        '\')">' +
                        '<i class="fas fa-paper-plane"></i>' +
                        '</button>' +

                        '</div>' +

                        '<span id="' +
                        replyMediaLabel +
                        '" style="font-size:.65rem"></span>' +

                        '</div>'
                    ) +

                    children +

                    '</div>'
                );
            }).join('');
        }

        return render(roots, 0);
    }


    /* =========================================================
       USHIRIKA + DEPARTMENT
       EXACT ORIGINAL LOCATION:
       public/app25.js
       c26Tab() / loadFeed()
       ========================================================= */

    var originalC26Tab = window.c26Tab;

    window.c26gx_DeleteComment = async function (id) {
        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var comment = await db
            .from('community_comments')
            .select('id,user_id,post_id')
            .eq('id', id)
            .maybeSingle();

        if (comment.error) {
            alert(comment.error.message);
            return;
        }

        if (!comment.data) {
            alert('Comment no longer exists.');
            return;
        }

        if (
            !ADMIN() &&
            String(comment.data.user_id) !== String(user.id)
        ) {
            alert('You can only delete your own comment.');
            return;
        }

        if (!confirm('Delete comment/reply?')) {
            return;
        }

        var deleted = await db
            .from('community_comments')
            .delete()
            .eq('id', id);

        if (deleted.error) {
            alert(deleted.error.message);
            return;
        }

        if (typeof window.c26Tab === 'function') {
            window.c26Tab('feed');
        }
    };
    window.c26GroupDeleteComment = window.c26gx_DeleteComment;

    window.c26GroupToggleReply = function (id) {
        var el = document.getElementById('c26gx_reply_' + id);

        if (el) {
            el.style.display =
                el.style.display === 'none'
                    ? 'block'
                    : 'none';
        }
    };

    window.c26GroupAttach = function (key, labelId) {
        if (window.c26Attach) {
            window.c26Attach(key, labelId);
            return;
        }

        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';

        input.onchange = function () {
            var f = input.files && input.files[0];

            if (!f) return;

            window._c26Media = window._c26Media || {};
            window._c26Media[key] = f;

            var label = document.getElementById(labelId);

            if (label) {
                label.innerHTML =
                    '<i class="fas fa-check-circle"></i> ' +
                    ESC(f.name);
            }
        };

        input.click();
    };

    window.c26GroupComment = async function (
        postId,
        parentId
    ) {
        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var inputId =
            parentId
                ? 'c26gx_replytext_' + parentId
                : 'c26gx_comment_' + postId;

        var mediaKey =
            parentId
                ? 'c26gx_replymedia_' + parentId
                : 'c26gx_media_' + postId;

        var input = document.getElementById(inputId);

        if (!input) return;

        var text = input.value.trim();

        window._c26Media =
            window._c26Media || {};

        var file =
            window._c26Media[mediaKey] || null;

        if (!text && !file) {
            return alert('Write a comment or attach media.');
        }

        var mediaUrl = null;

        if (file) {
            mediaUrl =
                await UPLOAD(
                    file,
                    'community-comments'
                );

            if (!mediaUrl) return;
        }

        var payload = {
            post_id: postId,
            user_id: user.id,
            text: text,
            media_url: mediaUrl
        };

        if (parentId) {
            payload.parent_comment_id = parentId;
        }

        var result = await db
            .from('community_comments')
            .insert([payload]);

        if (result.error) {
            alert(result.error.message);
            return;
        }

        delete window._c26Media[mediaKey];

        if (typeof window.c26Tab === 'function') {
            window.c26Tab('feed');
        }
    };

    window.c26GroupDeletePost = async function (id) {
        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var post = await db
            .from('community_posts')
            .select('id,user_id,group_type,group_id')
            .eq('id', id)
            .maybeSingle();

        if (post.error) {
            alert(post.error.message);
            return;
        }

        if (!post.data) {
            alert('Post no longer exists.');
            return;
        }

        if (
            !ADMIN() &&
            String(post.data.user_id) !== String(user.id)
        ) {
            alert('You can only delete your own post.');
            return;
        }

        if (!confirm('Delete this post and all its comments?')) {
            return;
        }

        var comments =
            await db
                .from('community_comments')
                .delete()
                .eq('post_id', id);

        if (comments.error) {
            alert(comments.error.message);
            return;
        }

        var deleted =
            await db
                .from('community_posts')
                .delete()
                .eq('id', id);

        if (deleted.error) {
            alert(deleted.error.message);
            return;
        }

        if (typeof window.c26Tab === 'function') {
            window.c26Tab('feed');
        }
    };

    async function LOAD_C26_FEED() {

        var box =
            document.getElementById('c26-feed');

        if (!box) return;

        var db = DB();
        var user = USER();

        if (!db || !user) {
            box.innerHTML =
                '<div class="card">Please log in first.</div>';
            return;
        }

        var state = window._c26 || {};

        var type =
            state.currentType;

        var groupId =
            state.currentId;

        if (!type || !groupId) {
            box.innerHTML =
                '<div class="card">Group information unavailable.</div>';
            return;
        }

        box.innerHTML =
            '<div class="card">Loading feed...</div>';

        var postsResult =
            await db
                .from('community_posts')
                .select('*')
                .eq('group_type', type)
                .eq('group_id', groupId)
                .order('created_at', {
                    ascending: false
                })
                .limit(50);

        if (postsResult.error) {
            box.innerHTML =
                '<div class="card" style="color:#EF4444">' +
                ESC(postsResult.error.message) +
                '</div>';
            return;
        }

        var posts =
            postsResult.data || [];

        var ids =
            posts.map(function (p) {
                return p.id;
            });

        var comments = [];

        if (ids.length) {

            var cr =
                await db
                    .from('community_comments')
                    .select('*')
                    .in('post_id', ids)
                    .order('created_at', {
                        ascending: true
                    });

            if (!cr.error) {
                comments = cr.data || [];
            }
        }

        var users =
            await USERS();

        var byPost = {};

        comments.forEach(function (c) {
            if (!byPost[c.post_id]) {
                byPost[c.post_id] = [];
            }

            byPost[c.post_id].push(c);
        });

        var html = '';

        /* POST COMPOSER */

        html +=
            '<div class="card" style="border-radius:18px">' +

            '<textarea class="form-textarea"' +
            ' id="c26gx_posttext"' +
            ' rows="2"' +
            ' placeholder="Share an update..."></textarea>' +

            '<div class="media-upload"' +
            ' id="c26gx_postupload"' +
            ' onclick="c26GroupAttach(\'post\',\'c26gx_postupload\')">' +
            '<i class="fas fa-cloud-upload-alt"></i>' +
            '<span>Add media (any format)</span>' +
            '</div>' +

            '<button class="btn btn-primary btn-block"' +
            ' style="margin-top:8px"' +
            ' onclick="c26GroupPost()">' +
            '<i class="fas fa-paper-plane"></i> Post' +
            '</button>' +

            '</div>';

        if (!posts.length) {
            html +=
                '<div class="card" style="text-align:center;' +
                'color:var(--text-light)">' +
                'No posts yet. Be the first to post.' +
                '</div>';
        }

        posts.forEach(function (p) {

            var u =
                users.find(function (x) {
                    return String(x.id) === String(p.user_id);
                });

            var own =
                String(p.user_id) === String(user.id);

            var canDelete =
                ADMIN() || own;

            var cs =
                byPost[p.id] || [];

            html +=
                '<div class="card" style="' +
                'border-radius:18px;margin-bottom:12px">' +

                '<div style="display:flex;gap:9px;' +
                'align-items:center">' +

                AVATAR(u, 38) +

                '<div style="flex:1">' +
                '<b>' +
                ESC((u && u.name) || 'Member') +
                '</b>' +

                '<div style="font-size:.68rem;' +
                'color:var(--text-light)">' +
                DATE(p.created_at) +
                '</div>' +

                '</div>' +

                (
                    canDelete
                        ? '<button class="btn btn-danger btn-sm"' +
                          ' onclick="c26GroupDeletePost(\'' +
                          p.id +
                          '\')">' +
                          '<i class="fas fa-trash"></i>' +
                          '</button>'
                        : ''
                ) +

                '</div>' +

                (
                    p.text
                        ? '<div style="' +
                          'white-space:pre-wrap;' +
                          'margin:8px 0">' +
                          ESC(p.text) +
                          '</div>'
                        : ''
                ) +

                MEDIA(p.media_url) +

                '<div style="' +
                'border-top:1px solid var(--border);' +
                'margin-top:10px;padding-top:8px">' +

                RENDER_COMMENTS(
                    cs,
                    p.id,
                    users,
                    'c26gx_',
                    false
                ) +

                '<div style="display:flex;gap:6px;' +
                'align-items:center;margin-top:8px">' +

                '<input class="form-input"' +
                ' id="c26gx_comment_' +
                p.id +
                '"' +
                ' placeholder="Comment..."' +
                ' style="flex:1">' +

                '<button class="btn btn-secondary btn-sm"' +
                ' onclick="c26GroupAttach(\'c26gx_media_' +
                p.id +
                '\',\'c26gx_label_' +
                p.id +
                '\')">' +
                '<i class="fas fa-paperclip"></i>' +
                '</button>' +

                '<button class="btn btn-primary btn-sm"' +
                ' onclick="c26GroupComment(\'' +
                p.id +
                '\',null)">' +
                '<i class="fas fa-paper-plane"></i>' +
                '</button>' +

                '</div>' +

                '<span id="c26gx_label_' +
                p.id +
                '" style="font-size:.65rem"></span>' +

                '</div>' +

                '</div>';
        });

        box.innerHTML = html;
    }

    window.c26GroupPost = async function () {

        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var state = window._c26 || {};

        var type =
            state.currentType;

        var groupId =
            state.currentId;

        var textEl =
            document.getElementById('c26gx_posttext');

        if (!textEl) return;

        var text =
            textEl.value.trim();

        window._c26Media =
            window._c26Media || {};

        var file =
            window._c26Media.post || null;

        if (!text && !file) {
            alert('Write something or attach media.');
            return;
        }

        var mediaUrl = null;

        if (file) {
            mediaUrl =
                await UPLOAD(
                    file,
                    'community-posts'
                );

            if (!mediaUrl) return;
        }

        var result =
            await db
                .from('community_posts')
                .insert([{
                    group_type: type,
                    group_id: groupId,
                    user_id: user.id,
                    text: text,
                    media_url: mediaUrl
                }]);

        if (result.error) {
            alert(result.error.message);
            return;
        }

        window._c26Media.post = null;

        if (typeof window.c26Tab === 'function') {
            window.c26Tab('feed');
        }
    };


    /* =========================================================
       REPLACE C26 FEED TAB
       ========================================================= */

    window.c26Tab = function (tab) {

        if (tab === 'feed') {
            var tabs = [
                'feed',
                'members',
                'leadership',
                'meetings'
            ];

            tabs.forEach(function (x) {

                var b =
                    document.getElementById('c26t-' + x);

                if (b) {
                    b.classList.toggle(
                        'active',
                        x === tab
                    );
                }

                var p =
                    document.getElementById('c26-' + x);

                if (p) {
                    p.style.display =
                        x === tab
                            ? 'block'
                            : 'none';
                }
            });

            LOAD_C26_FEED();
            return;
        }

        if (typeof originalC26Tab === 'function') {
            return originalC26Tab.apply(
                this,
                arguments
            );
        }
    };


    /* =========================================================
       GROUPS MAIN FEED
       EXACT ORIGINAL LOCATION:
       public/app22.js
       ggLoadFeed()
       ========================================================= */

    var originalGGSwitch =
        window.ggSwitchGroupTab;

    window.ggGroupToggleReply = function (id) {

        var el =
            document.getElementById(
                'gggx_reply_' + id
            );

        if (el) {
            el.style.display =
                el.style.display === 'none'
                    ? 'block'
                    : 'none';
        }
    };

    window.ggGroupAttach = function (key, labelId) {

        if (window.ggAttachMedia) {
            window.ggAttachMedia(
                key,
                labelId
            );
            return;
        }

        var input =
            document.createElement('input');

        input.type = 'file';
        input.accept = '*/*';

        input.onchange = function () {

            var file =
                input.files &&
                input.files[0];

            if (!file) return;

            window._ggMedia =
                window._ggMedia || {};

            window._ggMedia[key] =
                file;

            var label =
                document.getElementById(
                    labelId
                );

            if (label) {
                label.innerHTML =
                    '<i class="fas fa-check-circle"></i> ' +
                    ESC(file.name);
            }
        };

        input.click();
    };

    window.gggx_DeleteComment = async function (id) {
        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var comment = await db
            .from('community_comments')
            .select('id,user_id,post_id')
            .eq('id', id)
            .maybeSingle();

        if (comment.error) {
            alert(comment.error.message);
            return;
        }

        if (!comment.data) {
            alert('Comment no longer exists.');
            return;
        }

        if (
            !ADMIN() &&
            String(comment.data.user_id) !== String(user.id)
        ) {
            alert('You can only delete your own comment.');
            return;
        }

        if (!confirm('Delete comment/reply?')) {
            return;
        }

        var deleted = await db
            .from('community_comments')
            .delete()
            .eq('id', id);

        if (deleted.error) {
            alert(deleted.error.message);
            return;
        }

        if (typeof window.ggSwitchGroupTab === 'function') {
            window.ggSwitchGroupTab('feed');
        }
    };
    window.ggGroupDeleteComment = window.gggx_DeleteComment;

    window.ggGroupComment =
        async function (
            postId,
            parentId
        ) {

        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var inputId =
            parentId
                ? 'gggx_replytext_' + parentId
                : 'gggx_comment_' + postId;

        var mediaKey =
            parentId
                ? 'gggx_replymedia_' + parentId
                : 'gggx_media_' + postId;

        var input =
            document.getElementById(
                inputId
            );

        if (!input) return;

        var text =
            input.value.trim();

        window._ggMedia =
            window._ggMedia || {};

        var file =
            window._ggMedia[mediaKey] ||
            null;

        if (!text && !file) {
            alert(
                'Write a comment or attach media.'
            );
            return;
        }

        var mediaUrl = null;

        if (file) {
            mediaUrl =
                await UPLOAD(
                    file,
                    'group-comments'
                );

            if (!mediaUrl) return;
        }

        var payload = {
            post_id: postId,
            user_id: user.id,
            text: text,
            media_url: mediaUrl
        };

        if (parentId) {
            payload.parent_comment_id =
                parentId;
        }

        var result =
            await db
                .from('community_comments')
                .insert([payload]);

        if (result.error) {
            alert(result.error.message);
            return;
        }

        delete window._ggMedia[mediaKey];

        if (
            typeof window.ggSwitchGroupTab ===
            'function'
        ) {
            window.ggSwitchGroupTab('feed');
        }
    };

    window.ggGroupDeletePost =
        async function (id) {

        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var post =
            await db
                .from('community_posts')
                .select(
                    'id,user_id,group_type,group_id'
                )
                .eq('id', id)
                .maybeSingle();

        if (post.error) {
            alert(post.error.message);
            return;
        }

        if (!post.data) {
            alert('Post no longer exists.');
            return;
        }

        if (
            !ADMIN() &&
            String(post.data.user_id) !==
            String(user.id)
        ) {
            alert(
                'You can only delete your own post.'
            );
            return;
        }

        if (
            !confirm(
                'Delete this post and all its comments?'
            )
        ) {
            return;
        }

        var comments =
            await db
                .from('community_comments')
                .delete()
                .eq('post_id', id);

        if (comments.error) {
            alert(comments.error.message);
            return;
        }

        var deleted =
            await db
                .from('community_posts')
                .delete()
                .eq('id', id);

        if (deleted.error) {
            alert(deleted.error.message);
            return;
        }

        if (
            typeof window.ggSwitchGroupTab ===
            'function'
        ) {
            window.ggSwitchGroupTab(
                'feed'
            );
        }
    };


    async function LOAD_GROUP_FEED() {

        var box =
            document.getElementById(
                'gg-tab-feed'
            );

        if (!box) return;

        var db = DB();
        var user = USER();

        if (!db || !user) {
            box.innerHTML =
                '<div class="card">' +
                'Please log in first.' +
                '</div>';
            return;
        }

        var state =
            window._gg || {};

        var groupId =
            state.currentGroupId;

        if (!groupId) {
            box.innerHTML =
                '<div class="card">' +
                'Group information unavailable.' +
                '</div>';
            return;
        }

        box.innerHTML =
            '<div class="card">Loading feed...</div>';

        /*
         * GROUP FEED NOW USES THE SAME COMMUNITY ENGINE
         * AS PUBLIC FORUM / USHIRIKA / DEPARTMENT.
         */
        var postsResult =
            await db
                .from('community_posts')
                .select('*')
                .eq('group_type', 'group')
                .eq('group_id', groupId)
                .order('created_at', {
                    ascending: false
                })
                .limit(50);

        if (postsResult.error) {

            box.innerHTML =
                '<div class="card" style="color:#EF4444">' +
                ESC(postsResult.error.message) +
                '</div>';

            return;
        }

        var posts =
            postsResult.data || [];

        var ids =
            posts.map(function (p) {
                return p.id;
            });

        var comments = [];

        if (ids.length) {

            var cr =
                await db
                    .from('community_comments')
                    .select('*')
                    .in('post_id', ids)
                    .order('created_at', {
                        ascending: true
                    });

            if (!cr.error) {
                comments =
                    cr.data || [];
            }
        }

        var users =
            await USERS();

        var byPost = {};

        comments.forEach(function (c) {

            if (!byPost[c.post_id]) {
                byPost[c.post_id] = [];
            }

            byPost[c.post_id].push(c);
        });

        var html = '';

        html +=
            '<div class="card">' +

            '<textarea class="form-textarea"' +
            ' id="gggx_posttext"' +
            ' rows="2"' +
            ' placeholder="Post to this group..."></textarea>' +

            '<div class="media-upload"' +
            ' id="gggx_postupload"' +
            ' onclick="ggGroupAttach(\'post\',\'gggx_postupload\')">' +
            '<i class="fas fa-cloud-upload-alt"></i>' +
            '<span>Add media</span>' +
            '</div>' +

            '<button class="btn btn-primary btn-block"' +
            ' style="margin-top:8px"' +
            ' onclick="ggGroupPost()">' +
            '<i class="fas fa-paper-plane"></i> Post' +
            '</button>' +

            '</div>';

        if (!posts.length) {
            html +=
                '<div class="card" style="text-align:center;' +
                'color:var(--text-light)">' +
                'No posts yet.' +
                '</div>';
        }

        posts.forEach(function (p) {

            var u =
                users.find(function (x) {
                    return String(x.id) ===
                           String(p.user_id);
                });

            var canDelete =
                ADMIN() ||
                (
                    user &&
                    String(p.user_id) ===
                    String(user.id)
                );

            var cs =
                byPost[p.id] || [];

            html +=
                '<div class="card" style="' +
                'margin-bottom:12px;' +
                'border-radius:18px">' +

                '<div style="display:flex;gap:9px;' +
                'align-items:center">' +

                AVATAR(u, 38) +

                '<div style="flex:1">' +
                '<b>' +
                ESC((u && u.name) || 'Member') +
                '</b>' +

                '<div style="font-size:.68rem;' +
                'color:var(--text-light)">' +
                DATE(p.created_at) +
                '</div>' +

                '</div>' +

                (
                    canDelete
                        ? '<button class="btn btn-danger btn-sm"' +
                          ' onclick="ggGroupDeletePost(\'' +
                          p.id +
                          '\')">' +
                          '<i class="fas fa-trash"></i>' +
                          '</button>'
                        : ''
                ) +

                '</div>' +

                (
                    p.text
                        ? '<div style="white-space:pre-wrap;' +
                          'margin:8px 0">' +
                          ESC(p.text) +
                          '</div>'
                        : ''
                ) +

                MEDIA(p.media_url) +

                '<div style="' +
                'border-top:1px solid var(--border);' +
                'margin-top:10px;padding-top:8px">' +

                RENDER_COMMENTS(
                    cs,
                    p.id,
                    users,
                    'gggx_',
                    false
                ) +

                '<div style="display:flex;gap:6px;' +
                'align-items:center;margin-top:8px">' +

                '<input class="form-input"' +
                ' id="gggx_comment_' +
                p.id +
                '"' +
                ' placeholder="Comment..."' +
                ' style="flex:1">' +

                '<button class="btn btn-secondary btn-sm"' +
                ' onclick="ggGroupAttach(\'gggx_media_' +
                p.id +
                '\',\'gggx_label_' +
                p.id +
                '\')">' +
                '<i class="fas fa-paperclip"></i>' +
                '</button>' +

                '<button class="btn btn-primary btn-sm"' +
                ' onclick="ggGroupComment(\'' +
                p.id +
                '\',null)">' +
                '<i class="fas fa-paper-plane"></i>' +
                '</button>' +

                '</div>' +

                '<span id="gggx_label_' +
                p.id +
                '" style="font-size:.65rem"></span>' +

                '</div>' +

                '</div>';
        });

        box.innerHTML = html;
    }


    window.ggGroupPost = async function () {

        var db = DB();
        var user = USER();

        if (!db || !user) {
            alert('Please log in first.');
            return;
        }

        var state =
            window._gg || {};

        var groupId =
            state.currentGroupId;

        var textEl =
            document.getElementById(
                'gggx_posttext'
            );

        if (!textEl) return;

        var text =
            textEl.value.trim();

        window._ggMedia =
            window._ggMedia || {};

        var file =
            window._ggMedia.post ||
            null;

        if (!text && !file) {
            alert(
                'Write something or attach media.'
            );
            return;
        }

        var mediaUrl = null;

        if (file) {

            mediaUrl =
                await UPLOAD(
                    file,
                    'group-posts'
                );

            if (!mediaUrl) return;
        }

        var result =
            await db
                .from('community_posts')
                .insert([{
                    group_type: 'group',
                    group_id: groupId,
                    user_id: user.id,
                    text: text,
                    media_url: mediaUrl
                }]);

        if (result.error) {
            alert(result.error.message);
            return;
        }

        window._ggMedia.post = null;

        if (
            typeof window.ggSwitchGroupTab ===
            'function'
        ) {
            window.ggSwitchGroupTab(
                'feed'
            );
        }
    };


    /* =========================================================
       REPLACE GROUP FEED TAB
       ========================================================= */

    window.ggSwitchGroupTab = function (tab) {

        if (tab === 'feed') {

            var tabs = [
                'feed',
                'categories',
                'members',
                'meetings',
                'reports'
            ];

            tabs.forEach(function (x) {

                var b =
                    document.getElementById(
                        'gg-tabbtn-' + x
                    );

                if (b) {
                    b.classList.toggle(
                        'active',
                        x === tab
                    );
                }

                var p =
                    document.getElementById(
                        'gg-tab-' + x
                    );

                if (p) {
                    p.style.display =
                        x === tab
                            ? 'block'
                            : 'none';
                }
            });

            LOAD_GROUP_FEED();
            return;
        }

        if (typeof originalGGSwitch ===
            'function') {

            return originalGGSwitch.apply(
                this,
                arguments
            );
        }
    };


    /* =========================================================
       CATEGORY MEMBERS
       EXACT ORIGINAL LOCATION:
       public/app30.js
       h32CatMembers()
       ========================================================= */

    var originalH32CatTab =
        window.h32CatTab;

    window.h32CategoryChat =
        function (uid) {

        if (!uid) return;

        if (
            typeof window.c26OpenChat ===
            'function'
        ) {
            window.c26OpenChat(uid);
            return;
        }

        if (
            typeof window.h27ChatWith ===
            'function'
        ) {
            window.h27ChatWith(uid);
            return;
        }

        alert('Chat is not available.');
    };


    async function LOAD_CATEGORY_MEMBERS() {

        var box =
            document.getElementById(
                'h32c-members'
            );

        var cat =
            window._h32Cat;

        if (!box || !cat) return;

        var db = DB();

        if (!db) {
            box.innerHTML =
                '<div class="card">' +
                'Supabase is not ready.' +
                '</div>';
            return;
        }

        box.innerHTML =
            '<div class="card">Loading members...</div>';

        var memberResult =
            await db
                .from(
                    'church_group_category_members'
                )
                .select('*')
                .eq(
                    'category_id',
                    cat.id
                );

        if (memberResult.error) {

            box.innerHTML =
                '<div class="card" style="color:#EF4444">' +
                ESC(memberResult.error.message) +
                '</div>';

            return;
        }

        var members =
            memberResult.data || [];

        var users =
            await USERS();

        var canManage = false;

        try {

            if (
                window.isAdmin &&
                window.isAdmin()
            ) {
                canManage = true;
            }

            if (
                typeof window._h32CatCanManage ===
                'function'
            ) {
                canManage =
                    await window._h32CatCanManage(
                        cat
                    );
            }

        } catch (e) {}
       
          var html = '';

        /*
         * CHAT INBOX BUTTON
         * Placed at the top of the Category Members section
         */
        html +=
            '<div class="card" style="margin-bottom:12px">' +
            '<button class="btn btn-primary btn-block" style="font-weight:700"' +
            ' onclick="window.showSubPage ? window.showSubPage(\'messages\') : (window.switchSection && window.switchSection(\'messages\'))">' +
            '<i class="fas fa-inbox"></i> Open Chat Inbox' +
            '</button>' +
            '</div>';

        if (!members.length) {

        var html = '';

        if (!members.length) {

            html +=
                '<div class="card" style="' +
                'text-align:center;color:var(--text-light)">' +
                'No members in this category yet.' +
                '</div>';

        } else {

            members.forEach(function (m) {

                var u =
                    users.find(function (x) {
                        return String(x.id) ===
                               String(m.user_id);
                    });

                var self =
                    USER() &&
                    String(m.user_id) ===
                    String(USER().id);

                html +=
                    '<div class="card" style="' +
                    'margin-bottom:10px">' +

                    '<div style="display:flex;' +
                    'gap:10px;align-items:center">' +

                    AVATAR(u, 42) +

                    '<div style="flex:1;min-width:0">' +

                    '<div style="font-weight:800">' +
                    ESC(
                        (u && u.name) ||
                        'Member'
                    ) +
                    '</div>' +

                    (
                        u && u.email
                            ? '<div style="' +
                              'font-size:.7rem;' +
                              'color:var(--text-light);' +
                              'overflow:hidden;' +
                              'text-overflow:ellipsis">' +
                              ESC(u.email) +
                              '</div>'
                            : ''
                    ) +

                    '<div style="' +
                    'font-size:.75rem;' +
                    'color:var(--primary);' +
                    'font-weight:700">' +
                    ESC(
                        m.role ||
                        'Member'
                    ) +
                    '</div>' +

                    '</div>' +

                    /*
                     * ONE CHAT BUTTON ONLY.
                     */
                    (
                        !self
                            ? '<button class="btn btn-primary btn-sm"' +
                              ' style="white-space:nowrap"' +
                              ' onclick="h32CategoryChat(\'' +
                              m.user_id +
                              '\')">' +
                              '<i class="fas fa-comment-dots"></i> Chat' +
                              '</button>'
                            : ''
                    ) +

                    '</div>' +

                    (
                        canManage && !self
                            ? '<div style="' +
                              'display:flex;gap:8px;' +
                              'margin-top:9px">' +

                              '<select class="form-select"' +
                              ' onchange="h32CatSetRole(\'' +
                              m.user_id +
                              '\',this.value)">' +

                              '<option value="Member"' +
                              (
                                  String(m.role || '')
                                      .toLowerCase() ===
                                  'member'
                                      ? ' selected'
                                      : ''
                              ) +
                              '>Member</option>' +

                              '<option value="Teacher"' +
                              (
                                  String(m.role || '')
                                      .toLowerCase() ===
                                  'teacher'
                                      ? ' selected'
                                      : ''
                              ) +
                              '>Teacher</option>' +

                              '<option value="Leader"' +
                              (
                                  String(m.role || '')
                                      .toLowerCase() ===
                                  'leader'
                                      ? ' selected'
                                      : ''
                              ) +
                              '>Leader</option>' +

                              '<option value="Chairman"' +
                              (
                                  String(m.role || '')
                                      .toLowerCase() ===
                                  'chairman'
                                      ? ' selected'
                                      : ''
                              ) +
                              '>Chairman</option>' +

                              '<option value="Secretary"' +
                              (
                                  String(m.role || '')
                                      .toLowerCase() ===
                                  'secretary'
                                      ? ' selected'
                                      : ''
                              ) +
                              '>Secretary</option>' +

                              '<option value="Treasurer"' +
                              (
                                  String(m.role || '')
                                      .toLowerCase() ===
                                  'treasurer'
                                      ? ' selected'
                                      : ''
                              ) +
                              '>Treasurer</option>' +

                              '</select>' +

                              '<button class="btn btn-danger btn-sm"' +
                              ' onclick="h32CatRemove(\'' +
                              m.user_id +
                              '\')">' +
                              '<i class="fas fa-trash"></i>' +
                              '</button>' +

                              '</div>'
                            : ''
                    ) +

                    '</div>';
            });
        }

        box.innerHTML = html;
    }


    /*
     * Replace only the MEMBERS tab.
     * Forum / Meetings / Reports continue using their existing
     * working app30 functionality.
     */

    window.h32CatTab = function (tab) {

        if (tab === 'members') {

            var tabs = [
                'forum',
                'members',
                'meetings',
                'reports'
            ];

            tabs.forEach(function (x) {

                var b =
                    document.getElementById(
                        'h32ct-' + x
                    );

                if (b) {
                    b.classList.toggle(
                        'active',
                        x === tab
                    );
                }

                var p =
                    document.getElementById(
                        'h32c-' + x
                    );

                if (p) {
                    p.style.display =
                        x === tab
                            ? 'block'
                            : 'none';
                }
            });

            LOAD_CATEGORY_MEMBERS();
            return;
        }

        if (
            typeof originalH32CatTab ===
            'function'
        ) {
            return originalH32CatTab.apply(
                this,
                arguments
            );
        }
    };


    console.log(
        '✅ Final group functionality installed: ' +
        'Ushirika + Department + Groups + Category Members'
    );

})();
})();
