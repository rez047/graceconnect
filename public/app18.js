// appfinal.js — the ONLY override file. Static dept widget + Swahili + roles + chat inbox.
console.log('✝️ appfinal.js loading...');
(function(){
  function g(id){return document.getElementById(id);}
  function sEsc(x){return (typeof esc==='function')?esc(x):String(x==null?'':x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  // 1) CSS kill: legacy blue card + old widget boxes can NEVER show again
  var st=document.createElement('style');
  st.textContent='#home-mainDept .card-cool{display:none!important}#deptWeekMeet14,#deptWeekMeet17,#deptWeekMeet18,#deptWeekMeet20{display:none!important}';
  document.head.appendChild(st);

  // 2) ONE static department meeting widget
  function boxF(){var host=g('home-mainDept');if(!host)return null;var b=g('deptWeekFinal');if(!b){b=document.createElement('div');b.id='deptWeekFinal';host.insertBefore(b,host.firstChild);}return b;}
  function renderF(deptId,force){
    try{
      if(!window.sb||!deptId)return;
      var b=boxF();if(!b)return;
      sb.from('weekly_meetings').select('*').eq('department_id',deptId).order('created_at',{ascending:false}).limit(1).then(function(r){
        var m=(r.data&&r.data[0])||null;
        var can=false;try{can=typeof isDeptLeader9==='function'&&isDeptLeader9(deptId);}catch(e){}
        var sig=JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,can]);
        if(!force&&b.dataset.sig===sig)return; // STATIC: redraw only on real change
        b.dataset.sig=sig;
        var h='<div class="card" style="margin-bottom:14px"><div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
        if(!m)h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';
        else{window._curMeetingId=m.id;
          h+='<div style="font-size:.9rem;line-height:1.8">'+
          (m.meeting_date?'<div><b>📅 Date:</b> '+sEsc(m.meeting_date)+'</div>':'')+
          (m.start_time?'<div><b>🕐 Time:</b> '+sEsc(m.start_time)+(m.end_time?' – '+sEsc(m.end_time):'')+'</div>':'')+
          (m.venue?'<div><b>📍 Venue:</b> '+sEsc(m.venue)+'</div>':'')+
          (m.theme?'<div><b>🎯 Theme:</b> '+sEsc(m.theme)+'</div>':'')+
          ((typeof mediaHTML==='function')?mediaHTML(mediaOf(m)):'')+'</div>';}
        if(can)h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\''+deptId+'\')"><i class="fas fa-edit"></i> Update</button>'+(m?'<button class="btn btn-danger btn-sm" onclick="delDeptMeetFinal(\''+m.id+'\',\''+deptId+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+'</div>';
        b.innerHTML=h+'</div>';
      });
    }catch(e){}
  }
  window.delDeptMeetFinal=function(mid,deptId){deptId=deptId||window.currentDeptId;if(!(typeof isDeptLeader9==='function'&&isDeptLeader9(deptId)))return alert('🚫 Leader/admin only.');if(!confirm('Delete this meeting?'))return;sb.from('weekly_meetings').delete().eq('id',mid).then(function(){var b=g('deptWeekFinal');if(b)b.dataset.sig='';renderF(deptId,true);});};
  var _o=window.openDeptForum;window.openDeptForum=function(id){var r=_o?_o.apply(this,arguments):undefined;setTimeout(function(){renderF(id,true);},600);setTimeout(function(){renderF(id,true);},1800);return r;};
  var _s=window.saveDeptMeeting9;window.saveDeptMeeting9=function(){var r=_s?_s.apply(this,arguments):undefined;var d=(g('dm9Pick')||{}).value||window.currentDeptId;setTimeout(function(){renderF(d,true);},900);return r;};
  var _u=window.updateMeeting;window.updateMeeting=function(){var r=_u?_u.apply(this,arguments):undefined;setTimeout(function(){renderF(window.currentDeptId,true);},900);return r;};

  // ushirika widget: same calm rule
  window.renderUshWeekMeet9=function(ushId){
    try{
      if(!window.sb||!ushId)return;
      var box=g('ushWeekMeet9');if(!box)return;
      sb.from('weekly_meetings').select('*').eq('ushirika_id',ushId).order('created_at',{ascending:false}).limit(1).then(function(r){
        var m=(r.data&&r.data[0])||null;
        var can=false;try{can=typeof isUshLeaderOf==='function'&&isUshLeaderOf(ushId);}catch(e){}
        var sig=JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,can]);
        if(box.dataset.sig===sig)return;
        box.dataset.sig=sig;
        var h='<div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
        if(!m)h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';
        else h+='<div style="font-size:.9rem;line-height:1.8">'+(m.meeting_date?'<div><b>📅 Date:</b> '+sEsc(m.meeting_date)+'</div>':'')+(m.start_time?'<div><b>🕐 Time:</b> '+sEsc(m.start_time)+(m.end_time?' – '+sEsc(m.end_time):'')+'</div>':'')+(m.venue?'<div><b>📍 Venue:</b> '+sEsc(m.venue)+'</div>':'')+(m.theme?'<div><b>🎯 Theme:</b> '+sEsc(m.theme)+'</div>':'')+((typeof mediaHTML==='function')?mediaHTML(mediaOf(m)):'')+'</div>';
        if(can)h+='<button class="btn btn-warm btn-sm" style="margin-top:8px" onclick="openUshirikaMeetingEditor()"><i class="fas fa-edit"></i> Update</button>';
        box.innerHTML='<div class="card card-cool" style="margin-bottom:14px">'+h+'</div>';
      });
    }catch(e){}
  };

  // 3) Ushirika role assign (delete+insert, server fallback) — proven in app18
  window.openUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!(typeof isUshLeaderOf==='function'&&isUshLeaderOf(ushId)))return alert('🚫 Not permitted.');
    if(!g('ushRole9Modal')){
      document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="ushRole9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
      '<div class="modal-handle"></div><div class="modal-title">🏷️ Assign Role to Member <span class="admin-only">Leader/Admin</span></div>'+
      '<div class="form-group"><label class="form-label">Member</label><select class="form-select" id="ushRole9Member"></select></div>'+
      '<div class="form-group"><label class="form-label">Role</label><select class="form-select" id="ushRole9Role"><option>member</option><option>leader</option><option>chairman</option><option>secretary</option><option>treasurer</option></select></div>'+
      '<div class="form-group"><label class="form-label">Or type ANY role</label><input class="form-input" id="ushRole9Custom" placeholder="e.g. Sound Engineer"></div>'+
      '<button class="btn btn-warm btn-block" onclick="assignUshRole9()">Assign</button>'+
      '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
    }
    sb.from('ushirika_members').select('*').eq('ushirika_id',ushId).then(function(r){
      var rows=r.data||[];window._ushRoleRowsF=rows;
      var ids=rows.map(function(x){return x.user_id;}).filter(Boolean);
      var fill=function(pm){
        var sel=g('ushRole9Member');
        sel.innerHTML=rows.length?rows.map(function(m,i){return '<option value="'+i+'">'+sEsc((pm[m.user_id]||{}).name||'Member')+' ('+sEsc(m.role||'member')+')</option>';}).join(''):'<option value="">No members yet</option>';
        var c=g('ushRole9Custom');if(c)c.value='';
        openModal('ushRole9Modal');
      };
      if(!ids.length)return fill({});
      sb.from('profiles').select('id,name').in('id',ids).then(function(pr){var pm={};(pr.data||[]).forEach(function(p){pm[p.id]=p;});fill(pm);});
    });
  };
  window.assignUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!(typeof isUshLeaderOf==='function'&&isUshLeaderOf(ushId)))return alert('🚫 Not permitted.');
    var sel=g('ushRole9Member');
    var row=(window._ushRoleRowsF||[])[parseInt(sel.value,10)];
    if(!row)return alert('Pick a member');
    var custom=(g('ushRole9Custom')||{value:''}).value.trim();
    var role=custom||g('ushRole9Role').value;
    if(!role)return alert('Pick or type a role');
    var uid=row.user_id;
    function refresh(){
      if(typeof loadUshMembers9==='function')loadUshMembers9(ushId);
      if(typeof renderUshLeaders9==='function')renderUshLeaders9();
      if(typeof loadMyMemberships9==='function')loadMyMemberships9();
    }
    function success(){
      (window._ushMembers9||[]).forEach(function(m){if(m.user_id===uid)m.role=role;});
      (window._myUsh||[]).forEach(function(m){if(m.ushirika_id===ushId&&m.user_id===uid)m.role=role;});
      alert('✅ Role updated to '+role);closeModalDirect();refresh();setTimeout(refresh,1000);
    }
    function serverFallback(){
      sb.auth.getSession().then(function(s){
        var tok=s&&s.session?s.session.access_token:'';
        fetch('/api/set-role',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({userId:uid,ushirikaId:ushId,role:role})})
        .then(function(r){return r.json();}).then(function(j){if(j&&j.ok)success();else alert('⚠️ '+(j&&j.error?j.error:'Server error'));})
        .catch(function(e){alert('⚠️ '+e.message);});
      });
    }
    sb.from('ushirika_members').delete().eq('user_id',uid).eq('ushirika_id',ushId).then(function(dr){
      if(dr.error)return serverFallback();
      sb.from('ushirika_members').insert([{user_id:uid,ushirika_id:ushId,role:role}]).then(function(ir){
        if(ir.error)return serverFallback();
        sb.from('ushirika_members').select('role').eq('user_id',uid).eq('ushirika_id',ushId).then(function(vr){
          var rows=vr.data||[];
          if(rows.length===1&&String(rows[0].role)===String(role))success();else serverFallback();
        });
      });
    });
  };

  // 4) Start New Chat → rows open private chat + Inbox button
  var _om=window.openModal;
  window.openModal=function(id){
    var r=_om?_om.apply(this,arguments):undefined;
    if(id==='newChatModal'){
      setTimeout(function(){
        var pk=g('newChatPicker');if(!pk||!window.user)return;
        var list=(window.usersData||[]).filter(function(u2){return u2.id!==user.id;});
        pk.innerHTML=list.map(function(u2){
          return '<div class="user-pick-item" onclick="openChatWith(\''+u2.id+'\')" style="cursor:pointer">'+
            '<div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">'+ini(u2.name)+'</div>'+
            '<div style="flex:1"><div style="font-weight:600">'+sEsc(u2.name)+'</div><div style="font-size:.7rem;color:var(--text-light)">'+sEsc(u2.role||'member')+'</div></div>'+
            '<button class="btn btn-sm btn-chat" onclick="event.stopPropagation();openChatWith(\''+u2.id+'\')"><i class="fas fa-inbox"></i> Inbox</button></div>';
        }).join('')||'<div style="text-align:center;padding:14px;color:var(--text-lighter)">No users yet.</div>';
      },300);
    }
    return r;
  };

  // 5) Bible ALL translations: own proxy (cache-busted, JSON-validated) → direct → relays
  var BOOKSF=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
  function bnF(b){for(var i=0;i<BOOKSF.length;i++){if(BOOKSF[i].toLowerCase()===String(b).toLowerCase())return i+1;}return 1;}
  function jfetch(url){
    return fetch(url+(url.indexOf('?')>-1?'&':'?')+'_='+Date.now(),{cache:'no-store'}).then(function(r){
      if(!r.ok)throw new Error('http '+r.status);
      var ct=(r.headers.get('content-type')||'');
      if(ct.indexOf('json')<0)throw new Error('not json');
      return r.json();
    });
  }
  function fetchF(trans,book,chapter){
    var isSw=(trans==='Swahili');
    var code=({KJV:'kjv',NKJV:'nkjv',NIV:'niv',WEB:'web',ASV:'asv',YLT:'ylt',DARBY:'darby',DRA:'dra'})[trans]||'kjv';
    var proxy='/api/bible?translation='+(isSw?'swahili':code)+'&book='+encodeURIComponent(book)+'&chapter='+chapter;
    var direct=isSw?('https://api.getbible.net/v2/swahili/'+bnF(book)+'/'+chapter+'.json'):('https://bible-api.com/'+encodeURIComponent(book+' '+chapter)+'?translation='+code);
    return jfetch(proxy)
      .catch(function(){return jfetch(direct);})
      .catch(function(){return jfetch('https://corsproxy.io/?url='+encodeURIComponent(direct));})
      .catch(function(){return jfetch('https://api.allorigins.win/raw?url='+encodeURIComponent(direct));})
      .then(function(d){return{reference:d.reference||d.name||book+' '+chapter,verses:(d.verses||[]).map(function(v){return{verse:v.verse,text:v.text};})};});
  }
  window.loadBibleChapter=function(){
    var trans=(g('readerTrans')||{}).value||'KJV';
    var ref=(g('readerRef')||{value:'Genesis 1'}).value.trim();
    var p=ref.match(/^(.+?)\s+(\d+)$/);var book=p?p[1]:'Genesis';var ch=p?p[2]:1;
    var out=g('readerOut');if(!out)return;
    out.innerHTML='<div style="color:#94A3B8">Loading '+sEsc(trans)+'...</div>';
    fetchF(trans,book,ch).then(function(d){
      if(!d||!d.verses||!d.verses.length){out.innerHTML='<div style="color:#991B1B">Not found. Try "John 3".</div>';return;}
      window._bibleVerses=d.verses;window._selectedVerses=[];
      var h='<div style="font-weight:700;color:#92400E;margin-bottom:8px">'+sEsc(d.reference)+'</div>';
      d.verses.forEach(function(v){h+='<div onclick="toggleVerseHighlight(this,'+v.verse+')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>'+v.verse+'</sup> '+sEsc(v.text)+'</div>';});
      h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()"><i class="fas fa-bookmark"></i> Save</button><button class="btn btn-chat btn-sm" onclick="openShareVerses()"><i class="fas fa-share"></i> Share</button></div>';
      out.innerHTML=h;
    }).catch(function(e){out.innerHTML='<div style="color:#991B1B">Could not load '+sEsc(trans)+': '+sEsc(e.message)+'</div>';});
  };
})();
console.log('✝️ appfinal.js active');
