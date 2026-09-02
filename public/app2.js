// app2.js — COMPLETE override (loads AFTER app.js, wins all conflicts)
var BOOKS=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
function bookNum(b){var i=BOOKS.indexOf(b);return i<0?1:(i+1);}
window._bibleVerses=[];window._selectedVerses=[];

// FIX: Swahili via getbible (real Swahili), others via bible-api. No silent English fallback.
function fetchChapter(trans,book,chapter){
  if(trans==='Swahili'){
    return fetch('https://api.getbible.net/v2/swahili/'+bookNum(book)+'/'+chapter+'.json')
      .then(function(r){if(!r.ok)throw new Error('Swahili fetch failed');return r.json();})
      .then(function(d){var vs=(d&&d.verses)?d.verses.map(function(v){return{verse:v.verse,text:v.text};}):[];return{reference:book+' '+chapter+' (Swahili)',verses:vs};});
  }
  var code={KJV:'kjv',NKJV:'kjv',NIV:'web',WEB:'web',ASV:'asv',YLT:'ylt',DARBY:'darby',DRA:'dra'}[trans]||'kjv';
  return fetch('https://bible-api.com/'+encodeURIComponent(book+' '+chapter)+'?translation='+code).then(function(r){return r.json();});
}

// Override Bible reader: version switching + highlight + save + share
function loadBibleChapter(){
  var trans=(document.getElementById('readerTrans')||{}).value||'KJV';
  var ref=(document.getElementById('readerRef').value||'Genesis 1').trim();
  var parts=ref.match(/^(.+?)\s+(\d+)$/);var book=parts?parts[1]:'Genesis';var ch=parts?parts[2]:1;
  var out=document.getElementById('readerOut');out.innerHTML='<div style="color:#94A3B8">Loading '+trans+'...</div>';
  fetchChapter(trans,book,ch).then(function(d){
    if(!d||!d.verses||!d.verses.length){out.innerHTML='<div style="color:#991B1B">Not found in '+trans+'. Try "John 3" or "Psalm 23".</div>';return;}
    window._bibleVerses=d.verses;window._selectedVerses=[];
    var h='<div style="font-weight:700;color:#92400E;margin-bottom:8px">'+esc(d.reference)+'</div><div style="font-size:.7rem;color:var(--text-light);margin-bottom:8px">Tap a verse to highlight.</div>';
    d.verses.forEach(function(v){h+='<div data-v="'+v.verse+'" onclick="toggleVerseHighlight(this,'+v.verse+')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px"><sup>'+v.verse+'</sup> '+esc(v.text)+'</div>';});
    h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()"><i class="fas fa-bookmark"></i> Save</button><button class="btn btn-chat btn-sm" onclick="openShareVerses()"><i class="fas fa-share"></i> Share</button></div>';
    out.innerHTML=h;
  }).catch(function(e){out.innerHTML='<div style="color:#991B1B">Could not load '+trans+': '+esc(e.message)+'</div>';});
}
function toggleVerseHighlight(el,v){el.style.background=el.style.background?'':'#FEF3C7';var i=window._selectedVerses.indexOf(v);if(i>-1)window._selectedVerses.splice(i,1);else window._selectedVerses.push(v);}
function getSelectedText(){return window._bibleVerses.filter(function(v){return window._selectedVerses.indexOf(v.verse)>-1;}).map(function(v){return v.verse+'. '+v.text;}).join(' ');}
function saveSelectedVerses(){if(!user||!sb)return alert('Log in first');var t=getSelectedText();if(!t)return alert('Highlight verses first.');sb.from('saved_verses').insert([{user_id:user.id,reference:(document.getElementById('readerRef').value||''),text:t,translation:(document.getElementById('readerTrans').value||'KJV')}]).then(function(r){if(r.error)return alert(r.error.message);alert('🔖 Saved!');});}
function openShareVerses(){var t=getSelectedText();if(!t)return alert('Highlight verses first.');
  var html='<div class="modal-overlay show" id="shareModal" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">📤 Share Verses</div><button class="btn btn-primary btn-block" style="margin-bottom:8px" onclick="shareToForum()"><i class="fas fa-users"></i> Share to Forum</button><button class="btn btn-chat btn-block" onclick="sharePrivate()"><i class="fas fa-user"></i> Send Privately</button><button class="btn btn-secondary btn-block" style="margin-top:8px" onclick="document.getElementById(\'shareModal\').remove()">Cancel</button></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);}
function shareToForum(){var t=getSelectedText();var m=document.getElementById('shareModal');if(m)m.remove();sb.from('posts').insert([{author_id:user.id,content:'📖 '+t,likes:0,liked_by:[]}]).then(function(){alert('✅ Shared to forum!');});}
function sharePrivate(){var t=getSelectedText();var m=document.getElementById('shareModal');if(m)m.remove();var others=usersData.filter(function(u){return u.id!==user.id;});
  var html='<div class="modal-overlay show" id="pickShareModal" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">Send to...</div><div class="user-picker">';
  others.forEach(function(u){html+='<div class="user-pick-item" onclick="sendVerseTo(\''+u.id+'\',\''+esc(t).replace(/'/g,"\\'")+'\')"><div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">'+ini(u.name)+'</div><div style="flex:1"><div style="font-weight:600">'+esc(u.name)+'</div></div></div>';});
  html+='</div></div></div>';document.body.insertAdjacentHTML('beforeend',html);}
function sendVerseTo(uid,txt){var m=document.getElementById('pickShareModal');if(m)m.remove();sb.from('messages').insert([{sender_id:user.id,receiver_id:uid,content:'📖 '+txt}]).then(function(){alert('✅ Sent!');});}

// FIX: Characters — Christian theological bios (for believers) + Scripture, always shows
var CHAR_BIOS={David:"Shepherd, psalmist, king. A man after God's own heart. Value: faith, courage, repentance, worship. Application: bring your whole life—strengths and failures—to God.",Moses:"Prophet who led Israel out of Egypt. Value: humility, obedience, perseverance. Application: God uses the reluctant.",Esther:"Queen 'for such a time as this.' Value: boldness, self-sacrifice. Application: stand for God's people.",Paul:"Persecutor turned apostle. Value: grace, perseverance. Application: no past is beyond redemption.",Peter:"Fisherman, denied Christ, preached at Pentecost. Value: restoration. Application: failure is not final.",Ruth:"Moabite of loyalty in the line of Christ. Value: loyalty, devotion. Application: faithful love is rewarded.",Daniel:"Exile of integrity. Value: integrity, prayer, wisdom. Application: stay faithful in a secular world.",Joseph:"Sold by brothers, raised to save. Value: forgiveness, providence. Application: God turns harm to good.",Mary:"Handmaid who said yes. Value: obedience, trust. Application: say yes to God.",Abraham:"Father of faith. Value: faith, patience. Application: trust God's promises.",Jesus:"The Son of God, perfect love, humility, obedience. Value: love, humility, sacrifice. Application: follow Him.",John:"The beloved disciple. Value: love. Application: abide in Christ.",Joshua:"'As for me and my house, we will serve the LORD.' Value: courage. Application: lead your home to serve God.",Noah:"Built the ark in a corrupt age. Value: obedience. Application: walk with God when others don't.",Solomon:"Asked for wisdom. Value: wisdom. Application: seek wisdom above wealth.",MaryMagdalene:"First witness of the resurrection. Value: devotion. Application: seek Jesus early.",Timothy:"Young leader mentored by Paul. Value: faithfulness, purity. Application: let no one despise your youth.",Caleb:"Followed the LORD wholeheartedly. Value: wholehearted faith. Application: claim your mountain.",Elijah:"Prophet of fire. Value: boldness, prayer. Application: the prayer of the righteous avails much.",Nehemiah:"Rebuilder of walls. Value: prayer + action. Application: rebuild what is broken."};
function loadCharacter(){
  var q=(document.getElementById('charSearch').value||'').trim();if(!q)return;
  var out=document.getElementById('charOut');out.innerHTML='<div style="color:#94A3B8">Searching Scripture...</div>';
  var name=q.charAt(0).toUpperCase()+q.slice(1).toLowerCase();
  // normalise common inputs
  var key=Object.keys(CHAR_BIOS).find(function(k){return k.toLowerCase()===name.toLowerCase()||name.toLowerCase().indexOf(k.toLowerCase())===0;})||null;
  var bio=key?CHAR_BIOS[key]:null;
  fetch('https://bible-api.com/search?q='+encodeURIComponent(name)+'&translation=web&limit=3').then(function(r){return r.json();}).then(function(sd){
    var verseHtml='';if(sd&&sd.verses&&sd.verses.length){verseHtml=sd.verses.map(function(v){return '<div class="verse-item" style="margin-top:8px"><div class="verse-text">"'+esc(v.text.trim())+'"</div><div class="verse-ref">— '+esc(v.book_name+' '+v.chapter+':'+v.verse)+'</div></div>';}).join('');}
    var bioText=bio||("Scripture references for "+name+" are shown below. Meditate on how God worked through this person and apply that faith today.");
    out.innerHTML='<div style="font-weight:800;font-size:1.1rem;margin-bottom:6px">'+esc(name)+'</div><div class="verse-encourage" style="margin-bottom:8px">✝️ <b>Faith & Virtues:</b> '+esc(bioText)+'</div>'+verseHtml;
  }).catch(function(){out.innerHTML='<div style="font-weight:800">'+esc(name)+'</div><div class="verse-encourage">✝️ '+esc(bio||'Not found—try another name.')+'</div>';});
}

// FIX: Ushirika-specific weekly meeting (admin OR ushirika leader picks ushirika)
function isUshirikaLeader(ushId){if(isAdmin())return true;var me=officialsData.find(function(o){return o.user_id===user.id&&o.ushirika_id===ushId;});return !!me;}
function openUshirikaMeetingEditor(){
  if(!ushirikasData.length)return alert('No ushirikas yet.');
  var html='<div class="modal-overlay show" id="ushMeetModal" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">📅 Edit Ushirika Meeting</div>'
   +'<div class="form-group"><label class="form-label">Pick Ushirika</label><select class="form-select" id="ushMeetPick" onchange="loadUshMeeting(this.value)">'+ushirikasData.map(function(u){return '<option value="'+u.id+'">'+esc(u.name)+'</option>';}).join('')+'</select></div>'
   +'<div class="form-group"><label class="form-label">Day</label><select class="form-select" id="umDay"><option>Saturday</option><option>Sunday</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option></select></div>'
   +'<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="umDate" type="date"></div>'
   +'<div class="grid-2"><div class="form-group"><label class="form-label">Start</label><input class="form-input" id="umStart" type="time"></div><div class="form-group"><label class="form-label">End</label><input class="form-input" id="umEnd" type="time"></div></div>'
   +'<div class="form-group"><label class="form-label">Venue</label><input class="form-input" id="umVenue"></div>'
   +'<div class="form-group"><label class="form-label">Theme</label><input class="form-input" id="umTheme"></div>'
   +'<button class="btn btn-primary btn-block" onclick="saveUshMeeting()">Save Meeting</button></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
  loadUshMeeting(ushirikasData[0].id);
}
function loadUshMeeting(ushId){
  if(!ushId||!sb)return;
  if(!isUshirikaLeader(ushId)){alert('Only admins or this ushirika\'s leaders can edit.');return;}
  sb.from('weekly_meetings').select('*').eq('ushirika_id',ushId).order('created_at',{ascending:false}).limit(1).then(function(r){
    var m=r.data&&r.data[0];if(!m)return;
    var g=function(id){return document.getElementById(id);};
    if(g('umDay'))g('umDay').value=m.day||'Saturday';if(g('umDate'))g('umDate').value=m.date||'';if(g('umStart'))g('umStart').value=m.start_time||'';if(g('umEnd'))g('umEnd').value=m.end_time||'';if(g('umVenue'))g('umVenue').value=m.venue||'';if(g('umTheme'))g('umTheme').value=m.theme||'';
  });
}
function saveUshMeeting(){
  var ushId=document.getElementById('ushMeetPick').value;
  if(!isUshirikaLeader(ushId))return alert('Not permitted.');
  sb.from('weekly_meetings').insert([{ushirika_id:ushId,day:document.getElementById('umDay').value,date:document.getElementById('umDate').value||null,start_time:document.getElementById('umStart').value,end_time:document.getElementById('umEnd').value,venue:document.getElementById('umVenue').value,theme:document.getElementById('umTheme').value}]).then(function(r){if(r.error)return alert(r.error.message);alert('✅ Meeting saved!');var m=document.getElementById('ushMeetModal');if(m)m.remove();});
}

// FIX: Church pin (super admin) — from device geolocation
function pinChurchLocation(){
  if(!isSuper())return alert('Super admin only.');
  if(!navigator.geolocation)return alert('Geolocation not supported.');
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude,lng=pos.coords.longitude;
    sb.from('church_settings').upsert({id:1,lat:lat,lng:lng,location:'Lat '+lat.toFixed(4)+', Lng '+lng.toFixed(4)}).then(function(){alert('📍 Pinned from device!');loadChurchSettings();});
  },function(){alert('Could not get location.');});
}

// FIX: Preachings SHOW with poster + Word docs
function loadPreachings(){if(!sb)return;sb.from('preachings').select('*').order('created_at',{ascending:false}).then(function(r){preachingsData=r.data||[];renderPreachings();var ab=document.getElementById('adminPreachBtn');if(ab)ab.style.display=isAdmin()?'block':'none';}).catch(function(){});}
function renderPreachings(){var c=document.getElementById('preachingsList');if(!c)return;
  if(!preachingsData.length){c.innerHTML='<div style="text-align:center;padding:20px;color:#94A3B8">No preachings yet.</div>';return;}
  var h='';preachingsData.forEach(function(p){
    var who=p.author_name||'Leader';
    h+='<div class="sermon-card"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="sermon-title">'+esc(p.title)+'</div><div class="sermon-meta">👤 '+esc(who)+' • '+ago(p.created_at)+'</div></div>'+(isAdmin()?'<button class="btn btn-sm btn-danger" onclick="deletePreaching(\''+p.id+'\')"><i class="fas fa-trash"></i></button>':'')+'</div>'
    +'<div class="post-body">'+esc(p.content||'')+'</div>'
    +(p.youtube_url?'<iframe class="video-embed" src="https://www.youtube.com/embed/'+extractYouTubeId(p.youtube_url)+'" allowfullscreen></iframe>':'')
    +(p.media_url?'<div class="post-media"><a href="'+p.media_url+'" target="_blank">📎 Open attachment</a></div>':'')
    +'<div class="post-actions"><button class="post-action" onclick="loadPreachingComments(\''+p.id+'\')"><i class="far fa-comment"></i> Comments</button></div><div id="pc-'+p.id+'" style="margin-top:8px"></div></div>';
  });c.innerHTML=h;}
// override postPreaching to store author_name + accept docs
function postPreaching(){if(!isAdmin()||!sb)return alert('Admin only');var t=(document.getElementById('preachTitle').value||'').trim();var x=(document.getElementById('preachText').value||'').trim();var yt=(document.getElementById('preachYouTube').value||'').trim();if(!t)return alert('Title required');var media=window._pm&&window._pm.preach;
  var doIt=function(url){return sb.from('preachings').insert([{title:t,content:x,media_url:url||null,youtube_url:yt||null,author_id:user.id,author_name:(profile?profile.name:'Leader')}]).then(function(r){if(r.error)return alert(r.error.message);alert('✅ Posted!');closeModalDirect();loadPreachings();});};
  if(media){uploadMediaFile(media).then(function(u){delete window._pm.preach;return doIt(u);}).catch(function(){return doIt(null);});}else doIt(null);}
function deletePreaching(id){if(!confirm('Delete?'))return;sb.from('preachings').delete().eq('id',id).then(function(){loadPreachings();});}
function loadPreachingComments(pid){var box=document.getElementById('pc-'+pid);if(!box||!sb)return;sb.from('preaching_comments').select('*').eq('preaching_id',pid).order('created_at').then(function(r){var list=r.data||[];var h=list.map(function(cc){return '<div style="font-size:.8rem;margin-bottom:4px"><b>'+esc(cc.author_name||'Member')+':</b> '+esc(cc.content)+'</div>';}).join('');h+='<div style="display:flex;gap:6px;margin-top:6px"><input class="form-input" id="pci-'+pid+'" placeholder="Comment..." style="margin:0"><button class="btn btn-sm btn-primary" onclick="addPreachingComment(\''+pid+'\')">Send</button></div>';box.innerHTML=h;});}
function addPreachingComment(pid){if(!user||!sb)return;var i=document.getElementById('pci-'+pid);var v=i?i.value.trim():'';if(!v)return;sb.from('preaching_comments').insert([{preaching_id:pid,user_id:user.id,author_name:(profile?profile.name:'Member'),content:v}]).then(function(){i.value='';loadPreachingComments(pid);});}

// Boot wiring: version change, ushirika meeting editor, church pin, preaching docs accept
(function(){
  var sel=document.getElementById('readerTrans');
  if(sel){sel.innerHTML='';['KJV','NKJV','NIV','WEB','ASV','YLT','DARBY','DRA','Swahili'].forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k;sel.appendChild(o);});sel.value='KJV';sel.onchange=function(){loadBibleChapter();};}
  // Ushirika meeting editor button (admin/leader)
  var gpsUsh=document.querySelector('#ushirika-groups .weekly-meeting-card .weekly-meeting-actions');
  if(gpsUsh){var b=document.createElement('button');b.className='btn btn-sm btn-secondary';b.innerHTML='<i class="fas fa-edit"></i> Edit Ushirika Meeting';b.onclick=function(){openUshirikaMeetingEditor();};gpsUsh.appendChild(b);}
  // Church pin button (super admin)
  var gps=document.querySelector('.gps-pin');
  if(gps&&isSuper()){var pb=document.createElement('button');pb.className='btn btn-sm btn-primary';pb.style.marginLeft='8px';pb.innerHTML='<i class="fas fa-location-dot"></i> Pin from device';pb.onclick=function(e){e.stopPropagation();pinChurchLocation();};gps.appendChild(pb);}
  // Preaching attach accept docs
  var pu=document.getElementById('preachMediaUpload');if(pu){pu.onclick=function(){var i=document.createElement('input');i.type='file';i.accept='image/*,video/*,audio/*,.pdf,.doc,.docx';i.onchange=function(){if(i.files&&i.files[0]){window._pm.preach=i.files[0];pu.classList.add('has-file');}};i.click();};}
})();
console.log('✝️ app2.js COMPLETE loaded (Swahili, characters, ushirika meetings, church pin, preachings show)');
