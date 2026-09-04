// app19.js — PRODUCTION v2: one static dept widget + chat inbox list + Bible all-translations chain
console.log('✝️ app19.js v2 loading...');
(function(){
  function g(id){return document.getElementById(id);}
  function safeEsc(x){return (typeof esc==='function')?esc(x):String(x==null?'':x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  // ══ 1) DEPARTMENT MEETING: ONE widget, static, blue card permanently hidden ══
  function meetInner19(m,can,ctxId,updFn,delFn){
    var h='<div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
    if(!m){h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';}
    else{
      h+='<div style="font-size:.9rem;line-height:1.8">'+
        (m.meeting_date?'<div><b>📅 Date:</b> '+safeEsc(m.meeting_date)+'</div>':'')+
        (m.start_time?'<div><b>🕐 Time:</b> '+safeEsc(m.start_time)+(m.end_time?' – '+safeEsc(m.end_time):'')+'</div>':'')+
        (m.venue?'<div><b>📍 Venue:</b> '+safeEsc(m.venue)+'</div>':'')+
        (m.theme?'<div><b>🎯 Theme:</b> '+safeEsc(m.theme)+'</div>':'')+
        ((typeof mediaHTML==='function')?mediaHTML(mediaOf(m)):'')+'</div>';
    }
    if(can){
      h+='<div style="display:flex;gap:8px;margin-top:10px">'+
        '<button class="btn btn-warm btn-sm" onclick="'+updFn+'(\''+ctxId+'\')"><i class="fas fa-edit"></i> Update</button>'+
        (m?'<button class="btn btn-danger btn-sm" onclick="'+delFn+'(\''+m.id+'\',\''+ctxId+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+'</div>';
    }
    return h;
  }
  function sig19(m,can){return JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,can]);}
  function hideStrayMeetingCards(){
    var host=g('home-mainDept');if(!host)return;
    var keep=g('deptWeekMeet18');
    var cards=host.querySelectorAll('.card');
    for(var i=0;i<cards.length;i++){
      var c=cards[i];
      if(/This Week'?s Meeting/i.test(c.textContent||'')&&!(keep&&keep.contains(c)))c.style.display='none';
    }
  }
  function calmDept19(deptId,force){
    try{
      if(!sb||!deptId)return;
      var host=g('home-mainDept');if(!host)return;
      ['deptWeekMeet14','deptWeekMeet17'].forEach(function(id){var e=g(id);if(e&&e.parentNode)e.parentNode.removeChild(e);});
      var box=g('deptWeekMeet18');
      if(!box){box=document.createElement('div');box.id='deptWeekMeet18';host.insertBefore(box,host.firstChild.nextSibling||host.firstChild);}
      hideStrayMeetingCards();
      sb.from('weekly_meetings').select('*').eq('department_id',deptId).order('created_at',{ascending:false}).limit(1).then(function(r){
        var m=(r.data&&r.data[0])||null;
        var can=false;try{can=typeof isDeptLeader9==='function'&&isDeptLeader9(deptId);}catch(e){}
        var sig=sig19(m,can);
        if(!force&&box.dataset.sig19===sig)return;   // STATIC unless data changes
        box.dataset.sig19=sig;box.dataset.sig18=sig;
        if(m)window._curMeetingId=m.id;
        box.innerHTML='<div class="card" style="margin-bottom:14px">'+meetInner19(m,can,deptId,'openDeptMeetingEditor','delDeptMeet19')+'</div>';
        hideStrayMeetingCards();
      });
    }catch(e){console.warn('dept widget guard:',e);}
  }
  window.delDeptMeet19=function(mid,deptId){
    deptId=deptId||window.currentDeptId;
    if(!mid||!(typeof isDeptLeader9==='function'&&isDeptLeader9(deptId)))return alert('🚫 Leader/admin only.');
    if(!confirm('Delete this meeting?'))return;
    sb.from('weekly_meetings').delete().eq('id',mid).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Deleted');window._curMeetingId=null;calmDept19(deptId,true);
    });
  };
  var _o=window.openDeptForum;
  window.openDeptForum=function(id){var r=_o?_o.apply(this,arguments):undefined;
    setTimeout(function(){calmDept19(id,true);},700);setTimeout(function(){calmDept19(id,true);},2000);return r;};
  var _s=window.saveDeptMeeting9;
  window.saveDeptMeeting9=function(){var r=_s?_s.apply(this,arguments):undefined;
    var d=(g('dm9Pick')||{value:window.currentDeptId}).value;setTimeout(function(){calmDept19(d,true);},900);return r;};
  var _u=window.updateMeeting;
  window.updateMeeting=function(){var r=_u?_u.apply(this,arguments):undefined;
    setTimeout(function(){calmDept19(window.currentDeptId,true);},900);return r;};
  // silent guard loop: ONLY hides stray cards + first render; never rewrites visible content
  setInterval(function(){
    try{
      hideStrayMeetingCards();
      var host=g('home-mainDept');
      if(host&&host.classList.contains('active')&&window.currentDeptId){
        var keep=g('deptWeekMeet18');
        if(!keep||!keep.dataset.sig19)calmDept19(window.currentDeptId,true);
      }
    }catch(e){}
  },2000);

  // ushirika widget: same calm rule
  window.renderUshWeekMeet9=function(ushId){
    try{
      if(!sb||!ushId)return;
      var box=g('ushWeekMeet9');if(!box)return;
      sb.from('weekly_meetings').select('*').eq('ushirika_id',ushId).order('created_at',{ascending:false}).limit(1).then(function(r){
        var m=(r.data&&r.data[0])||null;
        var can=false;try{can=typeof isUshLeaderOf==='function'&&isUshLeaderOf(ushId);}catch(e){}
        var sig=sig19(m,can);
        if(box.dataset.sig19===sig)return;
        box.dataset.sig19=sig;
        box.innerHTML='<div class="card card-cool" style="margin-bottom:14px">'+meetInner19(m,can,ushId,'openUshirikaMeetingEditor','delUshMeet19')+'</div>';
      });
    }catch(e){}
  };
  window.delUshMeet19=function(mid,ushId){
    ushId=ushId||window._curUshForumId;
    if(!mid||!(typeof isUshLeaderOf==='function'&&isUshLeaderOf(ushId)))return alert('🚫 Leader/admin only.');
    if(!confirm('Delete this meeting?'))return;
    sb.from('weekly_meetings').delete().eq('id',mid).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Deleted');var b=g('ushWeekMeet9');if(b)b.dataset.sig19='';window.renderUshWeekMeet9(ushId);
    });
  };

  // ══ 2) Start New Chat → tap row or Inbox button opens private chat ══
  var _om=window.openModal;
  window.openModal=function(id){
    var r=_om?_om.apply(this,arguments):undefined;
    if(id==='newChatModal'){
      setTimeout(function(){
        var pk=g('newChatPicker');if(!pk||!user)return;
        var list=(usersData||[]).filter(function(u2){return u2.id!==user.id;});
        pk.innerHTML=list.map(function(u2){
          return '<div class="user-pick-item" onclick="openChatWith(\''+u2.id+'\')" style="cursor:pointer">'+
            '<div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">'+ini(u2.name)+'</div>'+
            '<div style="flex:1"><div style="font-weight:600">'+safeEsc(u2.name)+'</div><div style="font-size:.7rem;color:var(--text-light)">'+safeEsc(u2.role||'member')+'</div></div>'+
            '<button class="btn btn-sm btn-chat" onclick="event.stopPropagation();openChatWith(\''+u2.id+'\')"><i class="fas fa-inbox"></i> Inbox</button></div>';
        }).join('')||'<div style="text-align:center;padding:14px;color:var(--text-lighter)">No users yet.</div>';
      },300);
    }
    return r;
  };

  // ══ 3) Bible: ALL translations, 4-layer load chain (proxy → direct → CORS relays) ══
  var BOOKS19=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
  function bookNum19(b){for(var i=0;i<BOOKS19.length;i++){if(BOOKS19[i].toLowerCase()===String(b).toLowerCase())return i+1;}return 1;}
  function normVerses(d,refFallback){
    var vs=(d&&d.verses)?d.verses:[];
    return {reference:d.reference||d.name||refFallback,verses:vs.map(function(v){return{verse:v.verse,text:v.text};})};
  }
  function viaRelays(url){
    var relays=[
      'https://corsproxy.io/?url='+encodeURIComponent(url),
      'https://api.allorigins.win/raw?url='+encodeURIComponent(url)
    ];
    var p=Promise.reject(new Error('relay'));
    relays.forEach(function(rl){
      p=p.catch(function(){return fetch(rl).then(function(r){if(!r.ok)throw new Error('relay '+r.status);return r.json();});});
    });
    return p;
  }
  function fetchChapter19(trans,book,chapter){
    var isSw=(trans==='Swahili');
    var code=({KJV:'kjv',NKJV:'nkjv',NIV:'niv',WEB:'web',ASV:'asv',YLT:'ylt',DARBY:'darby',DRA:'dra'})[trans]||'kjv';
    var swUrl='https://api.getbible.net/v2/swahili/'+bookNum19(book)+'/'+chapter+'.json';
    var baUrl='https://bible-api.com/'+encodeURIComponent(book+' '+chapter)+'?translation='+code;
    // 1) own proxy
    return fetch('/api/bible?translation='+(isSw?'swahili':code)+'&book='+encodeURIComponent(book)+'&chapter='+chapter)
      .then(function(r){if(!r.ok)throw new Error('proxy '+r.status);return r.json();})
      .catch(function(){
        // 2) direct
        var direct=isSw?swUrl:baUrl;
        return fetch(direct).then(function(r){if(!r.ok)throw new Error('direct '+r.status);return r.json();})
          .catch(function(){
            // 3)+(4) public CORS relays
            return viaRelays(direct);
          });
      })
      .then(function(d){return normVerses(d,book+' '+chapter+(isSw?' (Swahili)':''));});
  }
  window.loadBibleChapter=function(){
    var trans=(g('readerTrans')||{}).value||'KJV';
    var ref=(g('readerRef')||{value:'Genesis 1'}).value.trim();
    var parts=ref.match(/^(.+?)\s+(\d+)$/);
    var book=parts?parts[1]:'Genesis';
    var ch=parts?parts[2]:1;
    var out=g('readerOut');if(!out)return;
    out.innerHTML='<div style="color:#94A3B8">Loading '+safeEsc(trans)+'...</div>';
    fetchChapter19(trans,book,ch).then(function(d){
      if(!d||!d.verses||!d.verses.length){out.innerHTML='<div style="color:#991B1B">Not found in '+safeEsc(trans)+'. Try "John 3" or "Psalm 23".</div>';return;}
      window._bibleVerses=d.verses;window._selectedVerses=[];
      var h='<div style="font-weight:700;color:#92400E;margin-bottom:8px">'+safeEsc(d.reference)+'</div><div style="font-size:.7rem;color:var(--text-light);margin-bottom:8px">Tap a verse to highlight.</div>';
      d.verses.forEach(function(v){h+='<div data-v="'+v.verse+'" onclick="toggleVerseHighlight(this,'+v.verse+')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>'+v.verse+'</sup> '+safeEsc(v.text)+'</div>';});
      h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()"><i class="fas fa-bookmark"></i> Save</button><button class="btn btn-chat btn-sm" onclick="openShareVerses()"><i class="fas fa-share"></i> Share</button></div>';
      out.innerHTML=h;
    }).catch(function(e){out.innerHTML='<div style="color:#991B1B">Could not load '+safeEsc(trans)+': '+safeEsc(e.message)+' — check connection and retry.</div>';});
  };
})();
console.log('✝️ app19.js v2 active');
