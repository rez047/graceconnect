// app20.js — KILL SWITCH: blue card CSS-killed, one static dept widget, Swahili via /api/bible
(function(){
  // 1) CSS kill — the blue legacy card can NEVER show again, no JS can re-show it
  var st=document.createElement('style');
  st.textContent='#home-mainDept .card-cool{display:none!important}#deptWeekMeet14,#deptWeekMeet17,#deptWeekMeet18{display:none!important}';
  document.head.appendChild(st);

  // 2) ONE white widget, redraw ONLY when data changes
  function box20(){var host=document.getElementById('home-mainDept');if(!host)return null;var b=document.getElementById('deptWeekMeet20');if(!b){b=document.createElement('div');b.id='deptWeekMeet20';host.insertBefore(b,host.firstChild);}return b;}
  function render20(deptId,force){
    try{
      if(!window.sb||!deptId)return;
      var b=box20();if(!b)return;
      sb.from('weekly_meetings').select('*').eq('department_id',deptId).order('created_at',{ascending:false}).limit(1).then(function(r){
        var m=(r.data&&r.data[0])||null;
        var can=false;try{can=isDeptLeader9(deptId);}catch(e){}
        var sig=JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,can]);
        if(!force&&b.dataset.sig===sig)return;   // STATIC
        b.dataset.sig=sig;
        var h='<div class="card" style="margin-bottom:14px"><div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
        if(!m)h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';
        else{window._curMeetingId=m.id;
          h+='<div style="font-size:.9rem;line-height:1.8">'+
          (m.meeting_date?'<div><b>📅 Date:</b> '+esc(m.meeting_date)+'</div>':'')+
          (m.start_time?'<div><b>🕐 Time:</b> '+esc(m.start_time)+(m.end_time?' – '+esc(m.end_time):'')+'</div>':'')+
          (m.venue?'<div><b>📍 Venue:</b> '+esc(m.venue)+'</div>':'')+
          (m.theme?'<div><b>🎯 Theme:</b> '+esc(m.theme)+'</div>':'')+
          mediaHTML(mediaOf(m))+'</div>';}
        if(can)h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\''+deptId+'\')"><i class="fas fa-edit"></i> Update</button>'+(m?'<button class="btn btn-danger btn-sm" onclick="delDeptMeet20(\''+m.id+'\',\''+deptId+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+'</div>';
        b.innerHTML=h+'</div>';
      });
    }catch(e){}
  }
  window.delDeptMeet20=function(mid,deptId){deptId=deptId||currentDeptId;if(!(typeof isDeptLeader9==='function'&&isDeptLeader9(deptId)))return alert('🚫 Leader/admin only.');if(!confirm('Delete this meeting?'))return;sb.from('weekly_meetings').delete().eq('id',mid).then(function(){var b=document.getElementById('deptWeekMeet20');if(b)b.dataset.sig='';render20(deptId,true);});};
  var o20=window.openDeptForum;window.openDeptForum=function(id){var r=o20?o20.apply(this,arguments):undefined;setTimeout(function(){render20(id,true);},600);setTimeout(function(){render20(id,true);},1800);return r;};
  var s20=window.saveDeptMeeting9;window.saveDeptMeeting9=function(){var r=s20?s20.apply(this,arguments):undefined;var d=(document.getElementById('dm9Pick')||{}).value||currentDeptId;setTimeout(function(){render20(d,true);},900);return r;};
  var u20=window.updateMeeting;window.updateMeeting=function(){var r=u20?u20.apply(this,arguments):undefined;setTimeout(function(){render20(currentDeptId,true);},900);return r;};

  // 3) Bible: own proxy first (works on every network), relays as backup
  var BOOKS20=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
  function bn20(b){for(var i=0;i<BOOKS20.length;i++){if(BOOKS20[i].toLowerCase()===String(b).toLowerCase())return i+1;}return 1;}
  function fetch20(trans,book,chapter){
    var isSw=(trans==='Swahili');
    var code=({KJV:'kjv',NKJV:'nkjv',NIV:'niv',WEB:'web',ASV:'asv',YLT:'ylt',DARBY:'darby',DRA:'dra'})[trans]||'kjv';
    var proxy='/api/bible?translation='+(isSw?'swahili':code)+'&book='+encodeURIComponent(book)+'&chapter='+chapter;
    var swUrl='https://api.getbible.net/v2/swahili/'+bn20(book)+'/'+chapter+'.json';
    var baUrl='https://bible-api.com/'+encodeURIComponent(book+' '+chapter)+'?translation='+code;
    var direct=isSw?swUrl:baUrl;
    function norm(d){return{reference:d.reference||d.name||book+' '+chapter,verses:(d.verses||[]).map(function(v){return{verse:v.verse,text:v.text};})};}
    return fetch(proxy).then(function(r){if(!r.ok)throw 0;return r.json();})
      .catch(function(){return fetch(direct).then(function(r){if(!r.ok)throw 0;return r.json();});})
      .catch(function(){return fetch('https://corsproxy.io/?url='+encodeURIComponent(direct)).then(function(r){if(!r.ok)throw 0;return r.json();});})
      .catch(function(){return fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(direct)).then(function(r){if(!r.ok)throw 0;return r.json();});})
      .then(norm);
  }
  window.loadBibleChapter=function(){
    var trans=(document.getElementById('readerTrans')||{}).value||'KJV';
    var ref=(document.getElementById('readerRef')||{value:'Genesis 1'}).value.trim();
    var p=ref.match(/^(.+?)\s+(\d+)$/);var book=p?p[1]:'Genesis';var ch=p?p[2]:1;
    var out=document.getElementById('readerOut');if(!out)return;
    out.innerHTML='<div style="color:#94A3B8">Loading '+esc(trans)+'...</div>';
    fetch20(trans,book,ch).then(function(d){
      if(!d||!d.verses||!d.verses.length){out.innerHTML='<div style="color:#991B1B">Not found. Try "John 3".</div>';return;}
      window._bibleVerses=d.verses;window._selectedVerses=[];
      var h='<div style="font-weight:700;color:#92400E;margin-bottom:8px">'+esc(d.reference)+'</div>';
      d.verses.forEach(function(v){h+='<div onclick="toggleVerseHighlight(this,'+v.verse+')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>'+v.verse+'</sup> '+esc(v.text)+'</div>';});
      h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()"><i class="fas fa-bookmark"></i> Save</button><button class="btn btn-chat btn-sm" onclick="openShareVerses()"><i class="fas fa-share"></i> Share</button></div>';
      out.innerHTML=h;
    }).catch(function(){out.innerHTML='<div style="color:#991B1B">Could not load '+esc(trans)+'. Verify Step 1: /api/bible must return JSON (open /api/bible?translation=swahili&book=John&chapter=3).</div>';});
  };
})();
console.log('✝️ app20.js kill-switch active');
