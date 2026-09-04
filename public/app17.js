// app17.js — FINAL: ONE static meeting widget + Bible that always works (Swahili, YLT, all)
(function(){
  function g(id){return document.getElementById(id);}
  function E(x){return (typeof esc==='function')?esc(x):String(x==null?'':x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* ══ 1) THE ONLY department meeting widget — renders ONCE, static until data changes ══ */
  function sig(m,can){return JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,!!can]);}
  function hideStray(){
    var host=g('home-mainDept');if(!host)return;
    var keep=g('deptWeekMeet20');
    var cards=host.querySelectorAll('.card');
    for(var i=0;i<cards.length;i++){
      var c=cards[i];
      if(/This Week'?s Meeting/i.test(c.textContent||'')&&!(keep&&keep.contains(c)))c.style.display='none';
    }
  }
  function render(deptId,force){
    if(!window.sb||!deptId)return;
    var host=g('home-mainDept');if(!host)return;
    var b=g('deptWeekMeet20');
    if(!b){b=document.createElement('div');b.id='deptWeekMeet20';host.insertBefore(b,host.firstChild);}
    sb.from('weekly_meetings').select('*').eq('department_id',deptId).order('created_at',{ascending:false}).limit(1).then(function(r){
      var m=(r.data&&r.data[0])||null;
      var can=false;try{can=typeof isDeptLeader9==='function'&&isDeptLeader9(deptId);}catch(e){}
      var s=sig(m,can);
      if(!force&&b.dataset.sig===s){hideStray();return;}   // ← STATIC: no redraw if nothing changed
      b.dataset.sig=s;
      if(m)window._curMeetingId=m.id;
      var h='<div class="card" style="margin-bottom:14px"><div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
      if(!m)h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';
      else h+='<div style="font-size:.9rem;line-height:1.8">'+
        (m.meeting_date?'<div><b>📅 Date:</b> '+E(m.meeting_date)+'</div>':'')+
        (m.start_time?'<div><b>🕐 Time:</b> '+E(m.start_time)+(m.end_time?' – '+E(m.end_time):'')+'</div>':'')+
        (m.venue?'<div><b>📍 Venue:</b> '+E(m.venue)+'</div>':'')+
        (m.theme?'<div><b>🎯 Theme:</b> '+E(m.theme)+'</div>':'')+
        ((typeof mediaHTML==='function')?mediaHTML(mediaOf(m)):'')+'</div>';
      if(can)h+='<div style="display:flex;gap:8px;margin-top:10px">'+
        '<button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\''+deptId+'\')"><i class="fas fa-edit"></i> Update</button>'+
        (m?'<button class="btn btn-danger btn-sm" onclick="delDeptMeet20(\''+m.id+'\',\''+deptId+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+'</div>';
      b.innerHTML=h+'</div>';
      hideStray();
    });
  }
  window.delDeptMeet20=function(mid,deptId){
    deptId=deptId||window.currentDeptId;
    if(!(typeof isDeptLeader9==='function'&&isDeptLeader9(deptId)))return alert('🚫 Leader/admin only.');
    if(!confirm('Delete this meeting?'))return;
    sb.from('weekly_meetings').delete().eq('id',mid).then(function(){render(deptId,true);});
  };
  var o=window.openDeptForum;
  window.openDeptForum=function(id){var r=o?o.apply(this,arguments):undefined;setTimeout(function(){render(id,false);},600);return r;}; // ONCE
  var s=window.saveDeptMeeting9;
  window.saveDeptMeeting9=function(){var r=s?s.apply(this,arguments):undefined;setTimeout(function(){render((g('dm9Pick')||{}).value||window.currentDeptId,true);},900);return r;};
  var u=window.updateMeeting;
  window.updateMeeting=function(){var r=u?u.apply(this,arguments):undefined;setTimeout(function(){render(window.currentDeptId,true);},900);return r;};
  setInterval(hideStray,3000); // DOM-only guard; never rewrites our card

  /* ══ 2) BIBLE: proxy → direct → offline cache. Safe JSON only (HTML can never crash it) ══ */
  var BOOKS=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
  function bn(b){if(/^\d+$/.test(String(b))){var n=+b;if(n>0&&n<67)return n;}for(var i=0;i<BOOKS.length;i++)if(BOOKS[i].toLowerCase()===String(b).toLowerCase())return i+1;return 1;}
  function safeJSON(url){
    return fetch(url).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      return r.text().then(function(t){t=(t||'').trim();if(!t||(t.charAt(0)!=='{'&&t.charAt(0)!=='['))throw new Error('HTML');return JSON.parse(t);});
    });
  }
  function paint(out,d,tag){
    window._bibleVerses=d.verses;window._selectedVerses=[];
    var h='<div style="font-weight:700;color:#92400E;margin-bottom:8px">'+E(d.reference)+E(tag||'')+'</div>';
    d.verses.forEach(function(v){h+='<div data-v="'+v.verse+'" onclick="toggleVerseHighlight(this,'+v.verse+')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>'+v.verse+'</sup> '+E(v.text)+'</div>';});
    h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()"><i class="fas fa-bookmark"></i> Save</button><button class="btn btn-chat btn-sm" onclick="openShareVerses()"><i class="fas fa-share"></i> Share</button></div>';
    out.innerHTML=h;
  }
  window.loadBibleChapter=function(){
    var trans=(g('readerTrans')||{}).value||'KJV';
    var ref=(g('readerRef')||{value:'Genesis 1'}).value.trim()||'Genesis 1';
    var p=ref.match(/^(.+?)\s+(\d+)$/);var book=p?p[1]:'Genesis';var ch=p?p[2]:1;
    var out=g('readerOut');if(!out)return;
    out.innerHTML='<div style="color:#94A3B8">Loading '+E(trans)+'…</div>';
    var isSw=(trans==='Swahili');
    var code=({KJV:'kjv',NKJV:'kjv',NIV:'web',WEB:'web',ASV:'asv',YLT:'ylt',DARBY:'darby',DRA:'dra'})[trans]||'kjv';
    var key='gc_bible_'+trans+'_'+bn(book)+'_'+ch;
    var urls=['/api/bible?translation='+(isSw?'swahili':code)+'&book='+encodeURIComponent(book)+'&chapter='+ch];
    urls.push(isSw?'https://api.getbible.net/v2/swahili/'+bn(book)+'/'+ch+'.json'
                  :'https://bible-api.com/'+encodeURIComponent(book+' '+ch)+'?translation='+code);
    var chain=Promise.reject(new Error('start'));
    urls.forEach(function(u){chain=chain.catch(function(){return safeJSON(u);});});
    chain.then(function(d){
      var vs=(d&&d.verses)?d.verses:[];if(!vs.length)throw new Error('empty');
      var data={reference:d.reference||d.name||(book+' '+ch),verses:vs.map(function(v){return{verse:v.verse,text:v.text};})};
      try{localStorage.setItem(key,JSON.stringify(data));}catch(e){}
      paint(out,data,'');
    }).catch(function(){
      var c=null;try{c=JSON.parse(localStorage.getItem(key)||'null');}catch(e){}
      if(c&&c.verses&&c.verses.length)return paint(out,c,' (offline)');
      out.innerHTML='<div style="color:#991B1B">Could not load '+E(trans)+'. <button class="btn btn-primary btn-sm" onclick="loadBibleChapter()"><i class="fas fa-rotate-right"></i> Retry</button></div>';
    });
  };
})();
console.log('✝️ app17.js final active');
