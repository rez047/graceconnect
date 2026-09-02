// app2.js — NEW FEATURES (loads AFTER app.js). Uses globals sb, user, isAdmin from app.js.
var BOOKS=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
var TRANS_MAP={KJV:{api:'bibleapi',code:'kjv'},NKJV:{api:'bibleapi',code:'kjv'},NIV:{api:'bibleapi',code:'web'},WEB:{api:'bibleapi',code:'web'},ASV:{api:'bibleapi',code:'asv'},YLT:{api:'bibleapi',code:'ylt'},DARBY:{api:'bibleapi',code:'darby'},DRA:{api:'bibleapi',code:'dra'},Swahili:{api:'getbible',code:'swahili'}};
window._bibleVerses=[];window._selectedVerses=[];

function bookNum(book){var i=BOOKS.indexOf(book);return i<0?1:(i+1);}
function fetchChapter(trans,book,chapter){
  var t=TRANS_MAP[trans]||TRANS_MAP.KJV;
  if(t.api==='getbible'){
    return fetch('https://api.getbible.net/v2/'+t.code+'/'+bookNum(book)+'/'+chapter+'.json').then(function(r){return r.json();}).then(function(d){
      var vs=(d&&d.verses)?d.verses.map(function(v){return{verse:v.verse,text:v.text};}):[];
      return{reference:book+' '+chapter,verses:vs};});
  }
  return fetch('https://bible-api.com/'+encodeURIComponent(book+' '+chapter)+'?translation='+t.code).then(function(r){return r.json();});
}

// Override Bible reader: more versions + highlight + save + share
function loadBibleChapter(){
  var trans=(document.getElementById('readerTrans')||{}).value||'KJV';
  var ref=(document.getElementById('readerRef').value||'Genesis 1').trim();
  var parts=ref.match(/^(.+?)\s+(\d+)$/);var book=parts?parts[1]:'Genesis';var ch=parts?parts[2]:1;
  var out=document.getElementById('readerOut');out.innerHTML='<div style="color:#94A3B8">Loading...</div>';
  fetchChapter(trans,book,ch).then(function(d){
    if(!d||!d.verses||!d.verses.length){out.innerHTML='<div style="color:#991B1B">Not found. Try "John 3" or "Psalm 23".</div>';return;}
    window._bibleVerses=d.verses;window._selectedVerses=[];
    var h='<div style="font-weight:700;color:#92400E;margin-bottom:8px">'+esc(d.reference)+' ('+trans+')</div>';
    h+='<div style="font-size:.7rem;color:var(--text-light);margin-bottom:8px">Tap a verse to highlight it.</div>';
    d.verses.forEach(function(v){h+='<div class="verse-line" data-v="'+v.verse+'" onclick="toggleVerseHighlight(this,'+v.verse+')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>'+v.verse+'</sup> '+esc(v.text)+'</div>';});
    h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()"><i class="fas fa-bookmark"></i> Save Selected</button><button class="btn btn-chat btn-sm" onclick="openShareVerses()"><i class="fas fa-share"></i> Share</button></div>';
    out.innerHTML=h;
  }).catch(function(){out.innerHTML='<div style="color:#991B1B">Could not load.</div>';});
}
function toggleVerseHighlight(el,v){el.style.background=el.style.background?'':'#FEF3C7';var i=window._selectedVerses.indexOf(v);if(i>-1)window._selectedVerses.splice(i,1);else window._selectedVerses.push(v);}
function getSelectedText(){return window._bibleVerses.filter(function(v){return window._selectedVerses.indexOf(v.verse)>-1;}).map(function(v){return v.verse+'. '+v.text;}).join(' ');}
function saveSelectedVerses(){if(!user||!sb)return alert('Log in first');var txt=getSelectedText();if(!txt)return alert('Highlight verses first (tap verses).');
  var trans=(document.getElementById('readerTrans')||{}).value||'KJV';
  sb.from('saved_verses').insert([{user_id:user.id,reference:(document.getElementById('readerRef').value||''),text:txt,translation:trans}]).then(function(r){if(r.error)return alert(r.error.message);alert('🔖 Saved for later!');});}
function openShareVerses(){var txt=getSelectedText();if(!txt)return alert('Highlight verses first (tap verses).');
  var html='<div class="modal-overlay show" id="shareModal" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">📤 Share Verses</div>'
   +'<button class="btn btn-primary btn-block" style="margin-bottom:8px" onclick="shareToForum()"><i class="fas fa-users"></i> Share to Forum</button>'
   +'<button class="btn btn-chat btn-block" onclick="sharePrivate()"><i class="fas fa-user"></i> Send Privately</button>'
   +'<button class="btn btn-secondary btn-block" style="margin-top:8px" onclick="document.getElementById(\'shareModal\').remove()">Cancel</button></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);}
function shareToForum(){var txt=getSelectedText();var m=document.getElementById('shareModal');if(m)m.remove();
  sb.from('posts').insert([{author_id:user.id,content:'📖 '+txt,likes:0,liked_by:[]}]).then(function(){alert('✅ Shared to forum!');});}
function sharePrivate(){var txt=getSelectedText();var leaders=usersData.filter(function(u){return u.id!==user.id;});
  var m=document.getElementById('shareModal');if(m)m.remove();
  var html='<div class="modal-overlay show" id="pickShareModal" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">Send to...</div><div class="user-picker">';
  leaders.forEach(function(u){html+='<div class="user-pick-item" onclick="sendVerseTo(\''+u.id+'\',\''+esc(txt).replace(/'/g,"\\'")+'\')"><div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">'+ini(u.name)+'</div><div style="flex:1"><div style="font-weight:600">'+esc(u.name)+'</div></div></div>';});
  html+='</div></div></div>';document.body.insertAdjacentHTML('beforeend',html);}
function sendVerseTo(uid,txt){var m=document.getElementById('pickShareModal');if(m)m.remove();sb.from('messages').insert([{sender_id:user.id,receiver_id:uid,content:'📖 '+txt}]).then(function(){alert('✅ Sent!');});}

// Christian-literature character bios (faith, virtues, application) + Scripture (no Wikipedia)
var CHAR_BIOS={David:"Shepherd, psalmist, and king of Israel. A man after God's own heart whose faith carried him from the sheepfold to the throne. Virtues: faith, courage, repentance, worship. Application: bring your whole life—strengths and failures—to God.",Moses:"Prophet and deliverer who led Israel out of Egypt. Virtues: humility, obedience, perseverance. Application: God uses the reluctant and the weak to do the mighty.",Esther:"Queen who risked her life 'for such a time as this.' Virtues: boldness, self-sacrifice, trust. Application: stand for God's people even when it costs you.",Paul:"Persecutor transformed into apostle to the nations. Virtues: grace, perseverance, zeal. Application: no past is beyond redemption.",Peter:"Fisherman who denied Christ yet preached at Pentecost. Virtues: devotion, restoration. Application: failure is not final with Jesus.",Ruth:"Moabite whose loyalty led her into the line of Christ. Virtues: loyalty, devotion, humility. Application: faithful love is rewarded.",Daniel:"Exile who kept integrity under pressure. Virtues: integrity, prayer, wisdom. Application: stay faithful to God in a secular world.",Joseph:"Sold by brothers, raised to save many. Virtues: forgiveness, providence. Application: what others mean for harm, God means for good.",Mary:"Handmaid of the Lord who said yes. Virtues: obedience, trust. Application: say yes to God's plan.",Abraham:"Father of faith who believed against impossibility. Virtues: faith, patience. Application: trust God's promises.",Jesus:"The Son of God, perfect in love, humility, and obedience. Virtues: love, humility, sacrifice. Application: follow Him in all things.",John:"The beloved disciple. Virtues: love. Application: abide in Christ's love.",Joshua:"Successor to Moses, 'as for me and my house, we will serve the LORD.' Virtues: courage, faithfulness. Application: lead your household to serve God.",Noah:"Built the ark in a corrupt generation. Virtues: obedience, faith. Application: walk with God when others don't."};
function loadCharacter(){var q=(document.getElementById('charSearch').value||'').trim();if(!q)return;var out=document.getElementById('charOut');out.innerHTML='<div style="color:#94A3B8">Searching Scripture...</div>';
  var name=q.charAt(0).toUpperCase()+q.slice(1);
  var bio=CHAR_BIOS[name]||null;
  // Scripture-based: search verses mentioning the name (Christian source = the Bible)
  fetch('https://bible-api.com/search?q='+encodeURIComponent(name)+'&translation=web&limit=3').then(function(r){return r.json();}).then(function(sd){
    var verseHtml='';if(sd&&sd.verses){verseHtml=sd.verses.map(function(v){return '<div class="verse-item" style="margin-top:8px"><div class="verse-text">"'+esc(v.text.trim())+'"</div><div class="verse-ref">— '+esc(v.book_name+' '+v.chapter+':'+v.verse)+'</div></div>';}).join('');}
    var bioText=bio||("Scripture references for "+name+" are shown below. Meditate on how God worked through this person.");
    out.innerHTML='<div style="font-weight:800;font-size:1.1rem;margin-bottom:6px">'+esc(name)+'</div><div class="verse-encourage" style="margin-bottom:8px">✝️ <b>Faith & Virtues:</b> '+esc(bioText)+'</div>'+verseHtml;
  }).catch(function(){out.innerHTML='<div style="font-weight:800">'+esc(name)+'</div><div class="verse-encourage">✝️ '+esc(bio||'Not found.')+'</div>';});}

// Events: admin edit
function editEvent(id){var e=null;eventsData.forEach(function(x){if(x.id===id)e=x;});if(!e)return;
  var html='<div class="modal-overlay show" id="editEventModal" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">✏️ Edit Event</div>'
   +'<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="eeName" value="'+esc(e.title)+'"></div>'
   +'<div class="form-group"><label class="form-label">Theme</label><input class="form-input" id="eeTheme" value="'+esc(e.theme||e.description||'')+'"></div>'
   +'<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="eeStatus"><option value="upcoming"'+(e.status==='upcoming'?' selected':'')+'>Upcoming</option><option value="ongoing"'+(e.status==='ongoing'?' selected':'')+'>Ongoing</option><option value="completed"'+(e.status==='completed'?' selected':'')+'>Completed</option></select></div>'
   +'<button class="btn btn-primary btn-block" onclick="saveEventEdit(\''+id+'\')">Save</button></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);}
function saveEventEdit(id){var t=document.getElementById('eeName').value.trim();var th=document.getElementById('eeTheme').value.trim();var st=document.getElementById('eeStatus').value;
  sb.from('events').update({title:t,theme:th,description:th,status:st}).eq('id',id).then(function(){var m=document.getElementById('editEventModal');if(m)m.remove();alert('✅ Updated!');loadEvents();});}

// Church details: pin from device geolocation
function pinChurchLocation(){
  if(!navigator.geolocation)return alert('Geolocation not supported.');
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude,lng=pos.coords.longitude;
    sb.from('church_settings').upsert({id:1,lat:lat,lng:lng,location:'Lat '+lat.toFixed(4)+', Lng '+lng.toFixed(4)}).then(function(){alert('📍 Location pinned from your device!');loadChurchSettings();});
  },function(){alert('Could not get location.');});}

// Boot: enhance Bible reader translations + church pin button + event edit buttons
(function(){
  var sel=document.getElementById('readerTrans');
  if(sel){sel.innerHTML='';for(var k in TRANS_MAP){var o=document.createElement('option');o.value=k;o.textContent=k;sel.appendChild(o);}sel.value='KJV';}
  // Church pin button
  var gps=document.querySelector('.gps-pin');
  if(gps&&isSuper()){var b=document.createElement('button');b.className='btn btn-sm btn-primary';b.style.marginLeft='8px';b.innerHTML='<i class="fas fa-location-dot"></i> Pin from device';b.onclick=function(e){e.stopPropagation();pinChurchLocation();};gps.appendChild(b);}
  // Event edit buttons (admin)
  var origRender=window.renderEvents;
  window.renderEvents=function(){origRender();if(!isAdmin())return;['upcoming','ongoing','completed'].forEach(function(s){var d=document.getElementById('event-'+s);if(!d)return;d.querySelectorAll('.event-card').forEach(function(card,i){var list=(s==='upcoming'?eventsData.filter(function(e){return (e.status||'upcoming')==='upcoming';}):s==='ongoing'?eventsData.filter(function(e){return e.status==='ongoing';}):eventsData.filter(function(e){return e.status==='completed';}));var e=list[i];if(!e)return;var eb=document.createElement('button');eb.className='btn btn-sm btn-secondary';eb.style.marginTop='8px';eb.innerHTML='<i class="fas fa-edit"></i> Edit';eb.onclick=function(){editEvent(e.id);};card.querySelector('.event-info').appendChild(eb);});});};
})();
console.log('✝️ app2.js loaded (Bible versions, highlight/save/share, Christian bios, event edit, GPS pin)');
