// app19.js — FINAL: bulletproof Swahili Bible (with offline cache) + ONE calm meeting widget
console.log('✝️ app19.js loading...');
(function(){
function g(id){return document.getElementById(id);}
function esc19(x){ if(typeof esc==='function')return esc(x); return String(x==null?'':x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

/* ═══════════ 1) BIBLE: proxy -> direct -> OFFLINE CACHE (safe JSON only, no HTML relays) ═══════════ */
var BOOKS19=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
function bookNum19(b){ if(/^\d+$/.test(String(b))){var n=parseInt(b,10);if(n>=1&&n<=66)return n;} for(var i=0;i<BOOKS19.length;i++){if(BOOKS19[i].toLowerCase()===String(b).toLowerCase())return i+1;} return 1; }
function safeJSON19(url){
  return fetch(url).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.text().then(function(t){
      var s=(t||'').trim();
      if(!s||s.charAt(0)!=='{'&&s.charAt(0)!=='[')throw new Error('source sent HTML');
      try{return JSON.parse(s);}catch(e){throw new Error('broken JSON');}
    });
  });
}
function bibleURLs19(trans,book,ch){
  var isSw=(trans==='Swahili');
  var code=({KJV:'kjv',NKJV:'kjv',NIV:'web',WEB:'web',ASV:'asv',YLT:'ylt',DARBY:'darby',DRA:'dra'})[trans]||'kjv';
  var n=bookNum19(book), u=['/api/bible?translation='+(isSw?'swahili':code)+'&book='+encodeURIComponent(book)+'&chapter='+ch];
  u.push(isSw ? 'https://api.getbible.net/v2/swahili/'+n+'/'+ch+'.json'
              : 'https://bible-api.com/'+encodeURIComponent(book+' '+ch)+'?translation='+code);
  return u;
}
function paint19(out,d,offline){
  window._bibleVerses=d.verses;window._selectedVerses=[];
  var h='<div style="font-weight:700;color:#92400E;margin-bottom:8px">'+esc19(d.reference)+(offline?' <span class="chip chip-green">offline copy</span>':'')+'</div>';
  d.verses.forEach(function(v){h+='<div data-v="'+v.verse+'" onclick="toggleVerseHighlight(this,'+v.verse+')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>'+v.verse+'</sup> '+esc19(v.text)+'</div>';});
  h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()"><i class="fas fa-bookmark"></i> Save</button><button class="btn btn-chat btn-sm" onclick="openShareVerses()"><i class="fas fa-share"></i> Share</button></div>';
  out.innerHTML=h;
}
window.loadBibleChapter=function(){
  var trans=(g('readerTrans')||{}).value||'KJV';
  var ref=(g('readerRef')||{value:'Genesis 1'}).value.trim()||'Genesis 1';
  var p=ref.match(/^(.+?)\s+(\d+)$/);var book=p?p[1]:'Genesis';var ch=p?p[2]:1;
  var out=g('readerOut');if(!out)return;
  out.innerHTML='<div style="color:#94A3B8">Loading '+esc19(trans)+'…</div>';
  var key='gc_bible_'+trans+'_'+bookNum19(book)+'_'+ch;
  var chain=Promise.reject(new Error('start'));
  bibleURLs19(trans,book,ch).forEach(function(u){
    chain=chain.catch(function(){return safeJSON19(u).then(function(d){var vs=(d&&d.verses)?d.verses:[];if(!vs.length)throw new Error('empty');return{reference:d.reference||d.name||(book+' '+ch),verses:vs.map(function(v){return{verse:v.verse,text:v.text};})};});});
  });
  chain.then(function(d){ try{localStorage.setItem(key,JSON.stringify(d));}catch(e){} paint19(out,d,false); })
  .catch(function(){
    var cached=null;try{cached=JSON.parse(localStorage.getItem(key)||'null');}catch(e){}
    if(cached&&cached.verses&&cached.verses.length){paint19(out,cached,true);return;}
    out.innerHTML='<div style="color:#991B1B">Could not load '+esc19(trans)+' '+esc19(book+' '+ch)+'.<br><button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="loadBibleChapter()"><i class="fas fa-rotate-right"></i> Retry</button></div>';
  });
};

/* ═══════════ 2) ONE CALM MEETING WIDGET (redraw ONLY on real change) ═══════════ */
// kill app14's writer completely (its 3s interval calls this global)
window.renderDeptWeekMeet14=function(){};
(function(){['deptWeekMeet14','deptWeekMeet17','deptWeekMeet18'].forEach(function(id){var b=g(id);if(b)b.remove();});})();

function meetSig19(m,can){return JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,!!can]);}
function deptId19(){return window.currentDeptId||null;}
function ensureMeetBox19(){
  var host=g('home-mainDept');if(!host)return null;
  var box=g('meet19Box');
  if(!box){
    box=document.createElement('div');box.id='meet19Box'; // NOT class "card" -> legacy loops can't find it
    var edit=g('deptEditMeetBtn');
    if(edit&&edit.parentNode===host)edit.insertAdjacentElement('afterend',box);
    else host.insertBefore(box,host.firstChild);
  }
  return box;
}
function hideLegacyMeetUI19(){
  var host=g('home-mainDept');if(!host)return;
  var nodes=host.querySelectorAll('.card,.weekly-meeting-card,#deptWeekMeet14,#deptWeekMeet17,#deptWeekMeet18');
  for(var i=0;i<nodes.length;i++){
    var n=nodes[i];if(n.id==='meet19Box')continue;
    if(/This Week'?s Meeting/i.test(n.textContent||''))n.style.display='none'; // blueish + old white cards gone
  }
}
window.deleteMeeting19=function(mid){
  var d=deptId19();if(!mid||!(typeof isDeptLeader9==='function'&&isDeptLeader9(d)))return alert('🚫 Leader/admin only.');
  if(!confirm('Delete this meeting?'))return;
  sb.from('weekly_meetings').delete().eq('id',mid).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Deleted');loadDeptMeeting19(true);
  });
};
function loadDeptMeeting19(force){
  var d=deptId19();if(!sb||!d)return;
  var host=g('home-mainDept');if(!host||!host.classList.contains('active'))return;
  sb.from('weekly_meetings').select('*').eq('department_id',d).order('created_at',{ascending:false}).limit(1).then(function(r){
    var m=(r.data&&r.data[0])||null;
    var can=false;try{can=typeof isDeptLeader9==='function'&&isDeptLeader9(d);}catch(e){}
    var box=ensureMeetBox19();if(!box)return;
    var sig=meetSig19(m,can);
    if(!force&&box.dataset.sig19===sig){hideLegacyMeetUI19();return;} // unchanged -> DO NOT redraw (no flicker)
    box.dataset.sig19=sig;
    if(m)window._curMeetingId=m.id;
    var h='<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.08)">';
    h+='<div style="font-family:\'Playfair Display\',serif;font-size:1.05rem;font-weight:700;margin-bottom:8px"><i class="fas fa-calendar-day" style="color:var(--primary)"></i> This Week\'s Meeting</div>';
    if(!m){h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';}
    else{h+='<div style="font-size:.9rem;line-height:1.8">'+
      (m.meeting_date?'<div><b>📅 Date:</b> '+esc19(m.meeting_date)+'</div>':'')+
      (m.start_time?'<div><b>🕐 Time:</b> '+esc19(m.start_time)+(m.end_time?' – '+esc19(m.end_time):'')+'</div>':'')+
      (m.venue?'<div><b>📍 Venue:</b> '+esc19(m.venue)+'</div>':'')+
      (m.theme?'<div><b>🎯 Theme:</b> '+esc19(m.theme)+'</div>':'')+
      ((typeof mediaHTML==='function')?mediaHTML(mediaOf(m)):'')+'</div>';}
    if(can){h+='<div style="display:flex;gap:8px;margin-top:10px">'+
      '<button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\''+d+'\')"><i class="fas fa-edit"></i> Update</button>'+
      (m?'<button class="btn btn-danger btn-sm" onclick="deleteMeeting19(\''+m.id+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+'</div>';}
    box.innerHTML=h+'</div>';
    hideLegacyMeetUI19();
  });
}
window.refreshMeetings19=function(){loadDeptMeeting19(true);};

// refresh ONLY on events: open dept / save / update / delete
var _o19=window.openDeptForum;
window.openDeptForum=function(id){var r=_o19?_o19.apply(this,arguments):undefined;setTimeout(function(){hideLegacyMeetUI19();loadDeptMeeting19(true);},800);return r;};
var _s19=window.saveDeptMeeting9;
window.saveDeptMeeting9=function(){var r=_s19?_s19.apply(this,arguments):undefined;setTimeout(function(){loadDeptMeeting19(true);},1000);return r;};
var _u19=window.updateMeeting;
window.updateMeeting=function(){var r=_u19?_u19.apply(this,arguments):undefined;setTimeout(function(){loadDeptMeeting19(true);},1000);return r;};
var _d19=window.deleteCurrentMeeting;
window.deleteCurrentMeeting=function(){var r=_d19?_d19.apply(this,arguments):undefined;setTimeout(function(){loadDeptMeeting19(true);},1000);return r;};

// live cross-device updates (new meeting / update / delete from ANY phone) — no polling
if(window.sb&&sb.channel){try{
  sb.channel('wm19').on('postgres_changes',{event:'*',schema:'public',table:'weekly_meetings'},function(){loadDeptMeeting19(false);}).subscribe();
}catch(e){}}
// safety net: gentle 5-min revalidate, redraws ONLY if signature changed
setInterval(function(){try{loadDeptMeeting19(false);}catch(e){}},300000);
// keep legacy cards hidden (DOM-only, never touches our box -> zero flicker)
setInterval(function(){try{hideLegacyMeetUI19();}catch(e){}},4000);

/* ═══════════ 3) SCALE GUARDS: throttle the 10s polls ═══════════ */
var _lm=window.loadMyMemberships9,_lmT=0;
window.loadMyMemberships9=function(){var n=Date.now();if(n-_lmT<20000)return undefined;_lmT=n;return _lm?_lm.apply(this,arguments):undefined;};
var _lp=window.loadPending,_lpT=0;
window.loadPending=function(){var n=Date.now();if(n-_lpT<60000)return undefined;_lpT=n;return _lp?_lp.apply(this,arguments):undefined;};

setTimeout(function(){hideLegacyMeetUI19();loadDeptMeeting19(true);},1200);
console.log('✝️ app19.js active (calm meetings + offline Bible)');
})();
