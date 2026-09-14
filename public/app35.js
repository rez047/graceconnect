/* ============================================================
   GRACECONNECT — APP35.JS
   Persistent Preaching Lives + Nested Discussion + Media
   + Devotional section fallback + Dedicated Notifications
   ADDITIVE PATCH — keeps existing app33/app34 functionality
   ============================================================ */
(function(){
  'use strict';

  var LIVE_TABLE='preaching_lives';
  var COMMENT_TABLE='preaching_comments';
  var client=null, activeLive=null, commentChannel=null;

  function db(){
    try{
      if(typeof window.sb==='function'){
        var c=window.sb();
        if(c&&c.from)return c;
      }
      if(window.sb&&window.sb.from)return window.sb;
      if(window.supabaseClient&&window.supabaseClient.from)return window.supabaseClient;
    }catch(e){}
    return null;
  }

  function esc35(v){
    if(typeof window.esc==='function')return window.esc(v);
    return String(v==null?'':v).replace(/[&<>"]/g,function(c){
      return {
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;'
      }[c]||c;
    });
  }

  function admin35(){
    try{
      return typeof window.isAdmin==='function'&&window.isAdmin();
    }catch(e){
      return false;
    }
  }

  function toast35(m,t){
    try{
      if(window.showToast)return window.showToast(m,t||'info');
      if(window.toast)return window.toast(m,t||'info');
    }catch(e){}
    console.log(m);
  }

  function uid35(){
    return db().auth.getUser().then(function(r){
      return r.data&&r.data.user?r.data.user.id:null;
    });
  }

  function now35(){
    return new Date().toISOString();
  }

  /* -------------------- STYLES -------------------- */

  function style35(){
    if(document.getElementById('gc35-style'))return;

    var s=document.createElement('style');
    s.id='gc35-style';

    s.textContent=''
      +'.gc35-history{margin:14px 0}'
      +'.gc35-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:15px;margin-bottom:10px;box-shadow:0 3px 12px rgba(15,23,42,.06)}'
      +'.gc35-live{border:2px solid #ef4444;background:linear-gradient(135deg,#fff,#fff7f7)}'
      +'.gc35-badge{display:inline-flex;padding:4px 8px;border-radius:20px;font-size:.68rem;font-weight:800;background:#fee2e2;color:#b91c1c}'
      +'.gc35-meta{font-size:.76rem;color:#64748b;margin-top:5px}'
      +'.gc35-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}'
      +'.gc35-btn{border:0;border-radius:9px;padding:8px 11px;cursor:pointer;font-weight:700}'
      +'.gc35-primary{background:#4f46e5;color:#fff}'
      +'.gc35-danger{background:#fee2e2;color:#b91c1c}'
      +'.gc35-muted{background:#eef2f7;color:#334155}'
      +'.gc35-comments{margin-top:15px;border-top:1px solid #e2e8f0;padding-top:12px}'
      +'.gc35-comment{padding:10px 0}'
      +'.gc35-reply{margin-left:22px;border-left:2px solid #e2e8f0;padding-left:12px}'
      +'.gc35-comment-head{display:flex;gap:8px;align-items:center}'
      +'.gc35-avatar{width:30px;height:30px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#1d4ed8}'
      +'.gc35-body{font-size:.88rem;line-height:1.55;margin:5px 0 0 38px}'
      +'.gc35-small{font-size:.7rem;color:#94a3b8}'
      +'.gc35-media{max-width:100%;max-height:260px;border-radius:10px;margin:7px 0 0 38px}'
      +'.gc35-composer{margin-top:12px;background:#f8fafc;border-radius:12px;padding:10px}'
      +'.gc35-composer textarea{width:100%;min-height:70px;border:1px solid #e2e8f0;border-radius:9px;padding:9px;resize:vertical}'
      +'.gc35-devocard{background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;border-radius:16px;padding:18px;box-shadow:0 8px 24px rgba(37,99,235,.18);margin-bottom:15px}'
      +'.gc35-notif{display:flex;gap:12px;padding:13px 2px;border-bottom:1px solid #e2e8f0;cursor:pointer}'
      +'.gc35-notif.unread{background:#eff6ff;border-radius:10px;padding-left:10px;padding-right:10px}'
      +'.gc35-notif-icon{width:38px;height:38px;border-radius:50%;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;flex:none}'
      +'.gc35-empty{text-align:center;color:#94a3b8;padding:25px}'
      +'.gc35-file{font-size:.75rem;color:#475569}';

    document.head.appendChild(s);
  }

  /* -------------------- PERSISTENT LIVE -------------------- */

  async function startPersistentLive(){
    var c=db();

    if(!c){
      toast35('Supabase is not ready','error');
      return;
    }

    if(!admin35()){
      toast35('Admin access required','error');
      return;
    }

    var title=(document.getElementById('liveTitle')||{}).value||'';
    var youtube=(document.getElementById('liveYouTube')||{}).value||'';

    title=title.trim();
    youtube=youtube.trim();

    if(!title){
      toast35('Enter a live title','error');
      return;
    }

    var u=await c.auth.getUser();
    var me=u.data&&u.data.user;

    if(!me){
      toast35('Please sign in','error');
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

    var r=await c.from(LIVE_TABLE)
      .insert([row])
      .select('*')
      .single();

    if(r.error){
      toast35(
        'Could not start saved live: '+r.error.message,
        'error'
      );
      return;
    }

    activeLive=r.data;
    window.gc35ActiveLiveId=activeLive.id;

    try{
      localStorage.setItem(
        'gc35_live_id',
        activeLive.id
      );
    }catch(e){}

    var m=document.getElementById('liveModal');

    if(m)m.classList.remove('show');

    if(typeof window.renderLiveSession==='function'){
      try{
        window.renderLiveSession({
          id:activeLive.id,
          title:activeLive.title,
          youtube_url:activeLive.youtube_url
        });
      }catch(e){}
    }

    renderLiveBox();
    loadHistory();
    subscribeComments();

    toast35('Live started and saved','success');
  }

  async function endPersistentLive(){
    var c=db();

    if(!c||!admin35())return;

    var id=activeLive&&activeLive.id;

    if(!id){
      try{
        id=localStorage.getItem('gc35_live_id');
      }catch(e){}
    }

    if(!id){
      toast35(
        'No saved live is currently active',
        'error'
      );
      return;
    }

    var r=await c.from(LIVE_TABLE)
      .update({
        status:'completed',
        ended_at:now35(),
        updated_at:now35()
      })
      .eq('id',id);

    if(r.error){
      toast35(
        'Could not save ended live: '+r.error.message,
        'error'
      );
      return;
    }

    activeLive=null;
    window.gc35ActiveLiveId=null;

    try{
      localStorage.removeItem('gc35_live_id');
    }catch(e){}

    renderLiveBox();
    loadHistory();
    unsubscribeComments();

    toast35(
      'Live ended and saved to preaching history',
      'success'
    );
  }

  async function loadActiveLive(){
    var c=db();

    if(!c)return;

    var r=await c.from(LIVE_TABLE)
      .select('*')
      .eq('status','live')
      .order('started_at',{ascending:false})
      .limit(1);

    if(!r.error&&r.data&&r.data[0]){
      activeLive=r.data[0];
      window.gc35ActiveLiveId=activeLive.id;
      renderLiveBox();
      subscribeComments();
    }else{
      activeLive=null;
      renderLiveBox();
    }
  }

  function renderLiveBox(){
    var box=document.getElementById('sermonLiveBox');

    if(!box)return;

    if(!activeLive){
      box.innerHTML=
        '<div style="text-align:center;padding:20px;color:var(--text-lighter)">No live sermon right now.</div>';
      return;
    }

    var yt=activeLive.youtube_url||'';
    var embed='';

    var m=yt.match(
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
      +'<span class="gc35-badge">🔴 LIVE</span>'
      +'<h3 style="margin-top:8px">'+esc35(activeLive.title)+'</h3>'
      +'<div class="gc35-meta">Started '
      +new Date(activeLive.started_at).toLocaleString()
      +'</div>'
      +embed
      +(admin35()
        ?'<div class="gc35-actions"><button class="gc35-btn gc35-danger" onclick="gc35EndLive()">End & Save Live</button></div>'
        :'')
      +'</div>';
  }

  /* -------------------- HISTORY -------------------- */

  async function loadHistory(){
    var host=document.getElementById('preachingsList');

    if(!host)return;

    var c=db();

    if(!c)return;

    var r=await c.from(LIVE_TABLE)
      .select('*')
      .eq('status','completed')
      .order('ended_at',{ascending:false})
      .limit(100);

    if(r.error){
      host.innerHTML=
        '<div class="gc35-empty">Saved preaching history is unavailable until the preaching tables are created.</div>';
      return;
    }

    var rows=r.data||[];

    var h=
      '<div class="gc35-history">'
      +'<h3 style="margin:8px 0 12px">📜 Previous Live Preachings</h3>';

    if(!rows.length){
      h+='<div class="gc35-empty">No completed live preachings yet.</div>';
    }

    rows.forEach(function(x){

      h+=
        '<div class="gc35-card">'
        +'<div style="font-weight:800">🎤 '+esc35(x.title)+'</div>'
        +'<div class="gc35-meta">'
        +new Date(x.started_at).toLocaleString()
        +(x.ended_at
          ?' · '+Math.max(
            1,
            Math.round(
              (new Date(x.ended_at)-new Date(x.started_at))/60000
            )
          )+' min'
          :'')
        +'</div>'
        +'<div class="gc35-actions">'
        +'<button class="gc35-btn gc35-primary" onclick="gc35OpenHistory(\''+
          String(x.id).replace(/'/g,'')
          +'\')">Open Discussion</button>'
        +(admin35()
          ?'<button class="gc35-btn gc35-muted" onclick="gc35EditLive(\''+
            String(x.id).replace(/'/g,'')
            +'\')">Edit</button>'
          +'<button class="gc35-btn gc35-danger" onclick="gc35DeleteLive(\''+
            String(x.id).replace(/'/g,'')
            +'\')">Delete</button>'
          :'')
        +'</div>'
        +'</div>';
    });

    h+='</div>';

    host.innerHTML=h;
  }

  async function gc35OpenHistory(id){
    var c=db();

    if(!c)return;

    var r=await c.from(LIVE_TABLE)
      .select('*')
      .eq('id',id)
      .single();

    if(r.error||!r.data){
      toast35('Preaching not found','error');
      return;
    }

    activeLive=r.data;

    renderHistoryModal(r.data);
    loadComments(id);
    subscribeComments(id);
  }

  function renderHistoryModal(x){

    var old=document.getElementById('gc35-history-modal');

    if(old)old.remove();

    var b=document.createElement('div');

    b.id='gc35-history-modal';
    b.className='modal-overlay show';

    b.innerHTML=
      '<div class="modal" style="max-height:92vh;overflow:auto">'
      +'<div class="modal-handle"></div>'
      +'<div class="modal-title">🎤 '+esc35(x.title)+'</div>'
      +'<div class="gc35-meta">'
      +new Date(x.started_at).toLocaleString()
      +' · Saved preaching'
      +'</div>'
      +(x.youtube_url
        ?'<div style="margin-top:12px">'
        +'<a href="'+esc35(x.youtube_url)+'" target="_blank" rel="noopener" class="btn btn-primary btn-block">▶ Open Video / Live Recording</a>'
        +'</div>'
        :'')
      +'<div id="gc35-comments" class="gc35-comments">'
      +'<div class="gc35-empty">Loading discussion…</div>'
      +'</div>'
      +'<button class="btn btn-secondary btn-block" style="margin-top:12px" onclick="document.getElementById(\'gc35-history-modal\').remove()">Close</button>'
      +'</div>';

    document.body.appendChild(b);
  }

  async function gc35EditLive(id){

    var c=db();

    var r=await c.from(LIVE_TABLE)
      .select('*')
      .eq('id',id)
      .single();

    if(r.error){
      return toast35(r.error.message,'error');
    }

    var title=prompt(
      'Edit preaching title:',
      r.data.title
    );

    if(title===null)return;

    var url=prompt(
      'Edit recording/YouTube URL:',
      r.data.youtube_url||''
    );

    var u=await c.from(LIVE_TABLE)
      .update({
        title:title.trim(),
        youtube_url:url.trim()||null,
        updated_at:now35()
      })
      .eq('id',id);

    if(u.error){
      toast35(u.error.message,'error');
    }else{
      toast35(
        'Preaching updated',
        'success'
      );
      loadHistory();
    }
  }

  async function gc35DeleteLive(id){

    if(!confirm(
      'Delete this saved preaching and its discussion?'
    ))return;

    var c=db();

    if(!c)return;

    await c.from(COMMENT_TABLE)
      .delete()
      .eq('preaching_id',id);

    var r=await c.from(LIVE_TABLE)
      .delete()
      .eq('id',id);

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

      var m=document.getElementById(
        'gc35-history-modal'
      );

      if(m)m.remove();

      loadHistory();
    }
  }

  /* -------------------- COMMENTS -------------------- */

  async function loadComments(id){

    var out=document.getElementById(
      'gc35-comments'
    );

    if(!out)return;

    var c=db();

    if(!c)return;

    var r=await c.from(COMMENT_TABLE)
      .select('*')
      .eq('preaching_id',id)
      .order('created_at',{ascending:true});

    if(r.error){
      out.innerHTML=
        '<div class="gc35-empty">Discussion unavailable.</div>';
      return;
    }

    var comments=r.data||[];
    var ids=[];

    comments.forEach(function(x){
      if(x.user_id)ids.push(x.user_id);
    });

    var prof={};

    if(ids.length){

      var p=await c.from('profiles')
        .select('id,name,full_name,avatar_url')
        .in(
          'id',
          Array.from(new Set(ids))
        );

      (p.data||[]).forEach(function(x){
        prof[x.id]=x;
      });
    }

    var roots=comments.filter(function(x){
      return !x.parent_id;
    });

    var by={};

    comments.forEach(function(x){
      (
        by[x.parent_id||'root']||
        (by[x.parent_id||'root']=[])
      ).push(x);
    });

    function one(x,level){

      var p=prof[x.user_id]||{};
      var name=
        p.name||
        p.full_name||
        'Member';

      var media=x.media_url
        ?(
          '<div>'+
          (
            /\.(mp4|webm|mov)$/i.test(
              x.media_url
            )
            ?
            '<video controls class="gc35-media" src="'+
            esc35(x.media_url)+
            '"></video>'
            :
            '<img class="gc35-media" src="'+
            esc35(x.media_url)+
            '" alt="Attached media">'
          )
          +'</div>'
        )
        :'';

      var children=by[x.id]||[];

      return (
        '<div class="gc35-comment '+
        (level?'gc35-reply':'')+
        '">'
        +'<div class="gc35-comment-head">'
        +'<div class="gc35-avatar">'+
          esc35(
            (name||'?')
              .slice(0,2)
              .toUpperCase()
          )+
          '</div>'
        +'<div>'
        +'<b>'+esc35(name)+'</b>'
        +'<div class="gc35-small">'+
          new Date(
            x.created_at
          ).toLocaleString()+
          '</div>'
        +'</div>'
        +'</div>'
        +'<div class="gc35-body">'+
          esc35(x.body||'')+
          '</div>'
        +media
        +'<div style="margin-left:38px;margin-top:5px">'
        +'<button class="gc35-btn gc35-muted" onclick="gc35Reply(\''+
          String(x.id).replace(/'/g,'')+
          '\')">Reply</button>'
        +(user&&user.id===x.user_id
          ?'<button class="gc35-btn gc35-danger" onclick="gc35DeleteComment(\''+
            String(x.id).replace(/'/g,'')+
            '\')">Delete</button>'
          :'')
        +'</div>'
        +children.map(function(y){
          return one(y,level+1);
        }).join('')
        +'</div>'
      );
    }

    var h=
      '<div style="font-weight:800;margin-bottom:8px">💬 Discussion</div>'+
      roots.map(function(x){
        return one(x,0);
      }).join('');

    h+=
      '<div class="gc35-composer">'
      +'<textarea id="gc35-comment-text" placeholder="Share your thoughts..."></textarea>'
      +'<input id="gc35-comment-file" type="file" accept="image/*,video/*" style="margin-top:7px">'
      +'<div class="gc35-actions">'
      +'<button class="gc35-btn gc35-primary" onclick="gc35PostComment(\''+
        String(id).replace(/'/g,'')+
        '\',null)">Post Comment</button>'
      +'</div>'
      +'</div>';

    out.innerHTML=h;
  }

  /* -------------------- MEDIA UPLOAD -------------------- */

  async function upload35(file){

    if(!file)return null;

    var c=db();

    var u=await c.auth.getUser();

    var me=u.data&&u.data.user;

    if(!me)return null;

    var ext=
      (
        file.name
          .split('.')
          .pop()||
        'bin'
      ).toLowerCase();

    var path=
      'preaching/'+
      me.id+'/'+
      Date.now()+
      '.'+
      ext;

    var r=await c.storage
      .from('media')
      .upload(
        path,
        file,
        {upsert:false}
      );

    if(r.error)throw r.error;

    return c.storage
      .from('media')
      .getPublicUrl(path)
      .data.publicUrl;
  }

  async function gc35PostComment(id,parent){

    var c=db();

    if(!c)return;

    var u=await c.auth.getUser();

    var me=u.data&&u.data.user;

    if(!me){
      toast35(
        'Please sign in to comment',
        'error'
      );
      return;
    }

    var ta=document.getElementById(
      'gc35-comment-text'
    );

    var body=(ta&&ta.value||'').trim();

    var file=document.getElementById(
      'gc35-comment-file'
    );

    if(
      !body&&
      !file?.files?.[0]
    )return;

    try{

      var media=
        file&&
        file.files&&
        file.files[0]
        ?await upload35(file.files[0])
        :null;

      var r=await c.from(COMMENT_TABLE)
        .insert([{
          preaching_id:id,
          user_id:me.id,
          parent_id:parent||null,
          body:body,
          media_url:media,
          created_at:now35(),
          updated_at:now35()
        }]);

      if(r.error)throw r.error;

      loadComments(id);

      toast35(
        'Comment posted',
        'success'
      );

    }catch(e){

      toast35(
        'Comment failed: '+e.message,
        'error'
      );
    }
  }

  async function gc35Reply(parent){

    var body=prompt(
      'Write your reply:'
    );

    if(body===null||!body.trim())return;

    var c=db();

    var u=await c.auth.getUser();

    var me=u.data&&u.data.user;

    if(!me)return;

    var r=await c.from(COMMENT_TABLE)
      .insert([{
        preaching_id:activeLive.id,
        user_id:me.id,
        parent_id:parent,
        body:body.trim(),
        media_url:null,
        created_at:now35(),
        updated_at:now35()
      }]);

    if(r.error){
      toast35(
        r.error.message,
        'error'
      );
    }else{
      loadComments(
        activeLive.id
      );
    }
  }

  async function gc35DeleteComment(id){

    if(!confirm(
      'Delete this comment?'
    ))return;

    var c=db();

    var r=await c.from(COMMENT_TABLE)
      .delete()
      .eq('id',id);

    if(r.error){
      toast35(
        r.error.message,
        'error'
      );
    }else{
      loadComments(
        activeLive.id
      );
    }
  }

  /* -------------------- REALTIME COMMENTS -------------------- */

  function subscribeComments(id){

    var c=db();

    id=id||(activeLive&&activeLive.id);

    if(
      !c||
      !id||
      !c.channel
    )return;

    if(commentChannel)return;

    try{

      commentChannel=
        c.channel(
          'gc35-comments-'+id
        )
        .on(
          'postgres_changes',
          {
            event:'*',
            schema:'public',
            table:COMMENT_TABLE,
            filter:
              'preaching_id=eq.'+id
          },
          function(){
            loadComments(id);
          }
        )
        .subscribe();

    }catch(e){}
  }

  function unsubscribeComments(){

    if(commentChannel){

      try{
        db().removeChannel(
          commentChannel
        );
      }catch(e){}

      commentChannel=null;
    }
  }

  /* -------------------- DEVOTIONAL -------------------- */

  function ensureDevotional(){

    var host=document.getElementById(
      'home-devotional'
    );

    if(!host)return;

    if(
      document.getElementById(
        'devotionalCard'
      )
    )return;

    var card=document.createElement(
      'div'
    );

    card.id=
      'gc35-devotional-placeholder';

    card.className=
      'gc35-devocard';

    card.innerHTML=
      '<div style="font-weight:800;font-size:1.05rem">🙏 Daily Devotional</div>'
      +'<div id="gc35-devo-title" style="font-weight:800;margin-top:10px">Loading today’s devotional…</div>'
      +'<div id="gc35-devo-verse" style="margin-top:8px;opacity:.9"></div>'
      +'<div id="gc35-devo-body" style="margin-top:10px;line-height:1.6"></div>';

    host.appendChild(card);

    loadDevotional35();
  }

  async function loadDevotional35(){

    var c=db();
    var today=
      new Date()
        .toISOString()
        .slice(0,10);

    var d=null;

    if(c){

      var r=await c.from(
        'devotionals'
      )
      .select('*')
      .eq('active',true)
      .eq('date',today)
      .order(
        'updated_at',
        {ascending:false}
      )
      .limit(1);

      if(
        !r.error&&
        r.data&&
        r.data[0]
      ){
        d=r.data[0];
      }
    }

    if(!d){

      try{

        var j=await fetch(
          'https://www.christhimself.com/api/v1/devotionals/'
          +String(
            new Date().getMonth()+1
          ).padStart(2,'0')
          +'-'
          +String(
            new Date().getDate()
          ).padStart(2,'0')
          +'.json'
        ).then(function(r){
          return r.json();
        });

        var am=
          (j.periods||[]).find(
            function(x){
              return x.period==='am';
            }
          )||
          j.periods&&
          j.periods[0];

        var x=
          am&&
          am.languages&&
          am.languages.en;

        d={
          title:
            x&&x.theme||
            'Today’s Devotional',

          body:
            x&&x.summary||
            '',

          verse:
            (x&&x.verses||[])
              .map(function(v){
                return v.reference||
                  v.text||
                  '';
              })
              .join(' · ')
        };

      }catch(e){

        d={
          title:'Today’s Devotional',
          body:
            'Spend time in prayer, Scripture and reflection today.',
          verse:''
        };
      }
    }

    var t=document.getElementById(
      'gc35-devo-title'
    );

    var v=document.getElementById(
      'gc35-devo-verse'
    );

    var b=document.getElementById(
      'gc35-devo-body'
    );

    if(t)
      t.textContent=
        d.title||
        'Today’s Devotional';

    if(v)
      v.textContent=
        d.verse
          ?'📖 '+d.verse
          :'';

    if(b)
      b.textContent=
        d.body||
        '';
  }

  /* -------------------- DEDICATED NOTIFICATIONS -------------------- */

  function openNotifications35(){

    if(
      typeof window.switchSection===
      'function'
    ){
      window.switchSection('home');
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

    var host=document.getElementById(
      'home-notifications'
    );

    if(!host)return;

    var c=db();

    if(!c)return;

    var u=await c.auth.getUser();

    var me=
      u.data&&
      u.data.user;

    if(!me)return;

    var r=await c.from(
      'notifications'
    )
    .select('*')
    .eq('user_id',me.id)
    .order(
      'created_at',
      {ascending:false}
    )
    .limit(100);

    if(r.error)return;

    var rows=r.data||[];

    var h=
      '<button class="back-btn" onclick="showSubPage(\'home-main\')">'
      +'<i class="fas fa-arrow-left"></i> Back'
      +'</button>'
      +'<div class="section-title-app">🔔 Notifications</div>'
      +'<div style="text-align:right;margin-bottom:8px">'
      +'<button class="gc35-btn gc35-muted" onclick="gc35MarkAllRead()">Mark all as read</button>'
      +'</div>';

    if(!rows.length){

      h+=
        '<div class="gc35-empty">You have no notifications.</div>';
    }

    rows.forEach(function(n){

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

      h+=
        '<div class="gc35-notif '+
        (n.is_read?'':'unread')+
        '" onclick="gc35OpenNotification(\''+
        String(n.id).replace(/'/g,'')+
        '\',\''+
        String(n.type||'').replace(/'/g,'')+
        '\',\''+
        String(target).replace(/'/g,'')+
        '\')">'
        +'<div class="gc35-notif-icon">'+
          (n.is_read?'✓':'●')+
          '</div>'
        +'<div style="flex:1">'
        +'<b>'+esc35(title)+'</b>'
        +'<div style="font-size:.84rem;margin-top:3px">'+
          esc35(body)+
          '</div>'
        +'<div class="gc35-small" style="margin-top:4px">'+
          (
            n.created_at
            ?new Date(
              n.created_at
            ).toLocaleString()
            :''
          )+
          '</div>'
        +'</div>'
        +'</div>';
    });

    host.innerHTML=h;
  }

  async function gc35MarkAllRead(){

    var c=db();

    var u=await c.auth.getUser();

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
      /preach|live|sermon/i.test(type)&&
      target
    ){
      gc35OpenHistory(
        target
      );
    }else{
      renderNotifications35();
    }
  }

  /* -------------------- INSTALL -------------------- */

  function install35(){

    style35();

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

    var bells=
      document.querySelectorAll(
        '.header-btn'
      );

    bells.forEach(function(b){

      if(
        b.querySelector(
          '.fa-bell'
        )
      ){
        b.onclick=
          openNotifications35;
      }

    });

    ensureDevotional();
    loadHistory();
    loadActiveLive();

    if(window.__gc35Timer)
      clearInterval(
        window.__gc35Timer
      );

    window.__gc35Timer=
      setInterval(
        function(){
          loadActiveLive();
          loadHistory();
          ensureDevotional();
        },
        30000
      );
  }

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

})();
