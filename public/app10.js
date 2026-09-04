// app9.js — FIXED build v4 (roles + officials + comments media + meetings constraint)
console.log('✝️ app9.js (fixed build v4) loading...');

/* LIVE-SCHEMA FACTS:
 - posts: media_urls | department_members: NO id col | notifications: body
 - weekly_meetings: meeting_date+media_urls, CHECK = exactly ONE of ushirika_id/department_id
 - post_comments media: try media_urls, fallback link-in-content
 - assignOfficial original bug fixed (undefined userId + null ushirika_id) */

// ═══════════ HELPERS ═══════════
function ext(o,extra){var n={};for(var k in o)n[k]=o[k];for(var k2 in extra)n[k2]=extra[k2];return n;}
function mediaOf(p){
  if(p&&p.media_url)return p.media_url;
  if(p&&p.media_urls){
    if(typeof p.media_urls==='string')return p.media_urls;
    if(Object.prototype.toString.call(p.media_urls)==='[object Array]'&&p.media_urls.length)return p.media_urls[0];
  }
  return null;
}
function mediaHTML(url){
  if(!url)return '';
  var isImg=/\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url)||!/\.([a-z0-9]+)(\?|$)/i.test(url);
  return isImg?'<div class="post-media"><img src="'+url+'"></div>':'<div class="post-media"><a href="'+url+'" target="_blank">📎 Open media</a></div>';
}
function nextDateForDay(day){
  if(!day)return null;
  var map={Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};
  var t=map[day];if(t==null)return null;
  var d=new Date();var diff=(t-d.getDay()+7)%7;d.setDate(d.getDate()+diff);
  return d.toISOString().slice(0,10);
}
function insertPostSafe(payload,done){
  var hasMedia=('media_urls' in payload)&&payload.media_urls;
  var base={};for(var k in payload){if(k!=='media_urls')base[k]=payload[k];}
  if(!hasMedia){sb.from('posts').insert([base]).then(done);return;}
  var url=payload.media_urls;
  sb.from('posts').insert([ext(base,{media_urls:url})]).then(function(r1){
    if(!r1.error)return done(r1);
    sb.from('posts').insert([ext(base,{media_urls:[url]})]).then(function(r2){
      if(!r2.error)return done(r2);
      sb.from('posts').insert([ext(base,{content:(base.content||'')+'\n📎 '+url})]).then(done);
    });
  });
}
function insertMeetingSafe(payload,done){
  if(payload.ushirika_id&&payload.department_id)delete payload.ushirika_id; // CHECK: exactly one parent
  var hasMedia=('media_urls' in payload)&&payload.media_urls;
  var base={};for(var k in payload){if(k!=='media_urls')base[k]=payload[k];}
  if(!hasMedia){sb.from('weekly_meetings').insert([base]).then(done);return;}
  var url=payload.media_urls;
  sb.from('weekly_meetings').insert([ext(base,{media_urls:url})]).then(function(r1){
    if(!r1.error)return done(r1);
    sb.from('weekly_meetings').insert([ext(base,{media_urls:[url]})]).then(done);
  });
}

// ═══════════ BACK BUTTON = IN-APP NAVIGATION ═══════════
window._noPush=false;
function gcCurrentView(){var sec=document.querySelector('.section.active');var sub=sec?sec.querySelector('.sub-page.active'):null;return{sec:sec?sec.id:null,sub:sub?sub.id:null};}
function gcPush(secId,subId){
  if(window._noPush||!secId)return;
  var c=gcCurrentView();if(c.sec===secId&&c.sub===subId)return;
  try{history.pushState({gc:{sec:secId,sub:subId}},'','#'+secId+'/'+(subId||''));}catch(e){}
}
window.addEventListener('popstate',function(e){
  var v=(e.state&&e.state.gc)||null;
  if(!v&&location.hash.length>1){var parts=location.hash.substring(1).split('/');v={sec:parts[0],sub:parts[1]||''};}
  if(!v||!v.sec)return;
  var sec=document.getElementById(v.sec);if(!sec)return;
  var subId=v.sub||((sec.querySelector('.sub-page')||{}).id)||null;
  window._noPush=true;activateSection(v.sec,subId,null);window._noPush=false;
});
try{history.replaceState({gc:gcCurrentView()},'');}catch(e){}

function activateSection(sectionId,subPageId,navMatch){
  var secs=document.querySelectorAll('.section');for(var i=0;i<secs.length;i++)secs[i].classList.remove('active');
  var sec=document.getElementById(sectionId);if(!sec)return;
  sec.classList.add('active');
  var nvs=document.querySelectorAll('.nav-item');for(var j=0;j<nvs.length;j++)nvs[j].classList.remove('active');
  if(navMatch){var nv=document.querySelector('.nav-item[onclick*="'+navMatch+'"]');if(nv)nv.classList.add('active');}
  var subs=sec.querySelectorAll('.sub-page');for(var k=0;k<subs.length;k++)subs[k].classList.remove('active');
  var t=document.getElementById(subPageId);if(t)t.classList.add('active');
  window.scrollTo(0,0);
  gcPush(sectionId,subPageId);
}
var _sw9=window.switchSection;
window.switchSection=function(n){var r=_sw9?_sw9.apply(this,arguments):undefined;var sec=document.getElementById('section-'+n);var sub=sec?sec.querySelector('.sub-page.active'):null;gcPush('section-'+n,sub?sub.id:null);return r;};
var _sp9=window.showSubPage;
window.showSubPage=function(id){var r=_sp9?_sp9.apply(this,arguments):undefined;var sec=document.querySelector('.section.active');gcPush(sec?sec.id:null,id);return r;};

// ═══════════ PERMISSIONS (multiple leaders allowed) ═══════════
function isUshLeaderOf(id){
  if(isAdmin())return true;
  for(var i=0;i<officialsData.length;i++){var o=officialsData[i];if(o.user_id===user.id&&o.ushirika_id===id)return true;}
  return false;
}
function leadsAnyUsh(){
  if(isAdmin())return true;
  for(var i=0;i<officialsData.length;i++){if(officialsData[i].user_id===user.id)return true;}
  return false;
}
function isDeptLeader9(deptId){
  if(isAdmin())return true;
  var list=window._myDepts||[];
  for(var i=0;i<list.length;i++){
    if(list[i].department_id!==deptId)continue;
    var r=String(list[i].role||'').toLowerCase();
    if(r.indexOf('leader')>-1||r==='chairman')return true;
  }
  return false;
}
function leadsAnyDept(){
  if(isAdmin())return true;
  var list=window._myDepts||[];
  for(var i=0;i<list.length;i++){var r=String(list[i].role||'').toLowerCase();if(r.indexOf('leader')>-1||r==='chairman')return true;}
  return false;
}
function ushLedByMe(){return (ushirikasData||[]).filter(function(u){return isUshLeaderOf(u.id);});}
function deptLedByMe(){return (depts||[]).filter(function(d){return isDeptLeader9(d.id);});}

// hide meeting controls from users without permission (show NOTHING)
function sweepMeetingButtons(){
  if(!user)return;
  var canUsh=leadsAnyUsh();
  var canAny=canUsh||leadsAnyDept();
  var btns=document.querySelectorAll('button');
  for(var i=0;i<btns.length;i++){
    var t=(btns[i].textContent||'').trim();
    if(/Edit Ushirika Weekly Meeting/i.test(t)||/Edit Ushirika Meeting/i.test(t)){btns[i].style.display=canUsh?'':'none';}
    else if(/^Edit Weekly Meeting$/i.test(t)){btns[i].style.display=canAny?'':'none';}
  }
  if(!canAny){
    var mb=document.querySelectorAll('.weekly-meeting-card button');
    for(var j=0;j<mb.length;j++)mb[j].style.display='none';
  }
}

// ═══════════ USHIRIKA MEETING EDITOR (leader/admin ONLY + media) ═══════════
function ensureUshMeetModal9(){
  if(document.getElementById('ushMeetModal9'))return;
  document.body.insertAdjacentHTML('beforeend',
  '<div class="modal-overlay" id="ushMeetModal9" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
  '<div class="modal-handle"></div><div class="modal-title">📅 Edit Ushirika Weekly Meeting <span class="admin-only">Leader/Admin</span></div>'+
  '<div class="form-group"><label class="form-label">Pick Ushirika</label><select class="form-select" id="um9Pick" onchange="loadUshMeeting9(this.value)"></select></div>'+
  '<div class="form-group"><label class="form-label">Day</label><select class="form-select" id="um9Day"><option>Saturday</option><option>Sunday</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option></select></div>'+
  '<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="um9Date" type="date"></div>'+
  '<div class="grid-2"><div class="form-group"><label class="form-label">Start</label><input class="form-input" id="um9Start" type="time"></div><div class="form-group"><label class="form-label">End</label><input class="form-input" id="um9End" type="time"></div></div>'+
  '<div class="form-group"><label class="form-label">Venue</label><input class="form-input" id="um9Venue"></div>'+
  '<div class="form-group"><label class="form-label">Theme</label><input class="form-input" id="um9Theme"></div>'+
  '<div class="media-upload" id="um9Upload" onclick="attachMediaTo(\'ushMeet9\')"><i class="fas fa-cloud-upload-alt"></i><span>Reference media (optional)</span></div>'+
  '<div id="um9MediaLink"></div>'+
  '<button class="btn btn-primary btn-block" onclick="saveUshMeeting9()">Save Meeting</button>'+
  '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
}
window.openUshirikaMeetingEditor=function(){
  if(!user)return alert('Log in first');
  var led=ushLedByMe();
  if(!led.length)return alert('🚫 You are not permitted to edit ushirika weekly meetings.');
  ensureUshMeetModal9();
  document.getElementById('um9Pick').innerHTML=led.map(function(u){return '<option value="'+u.id+'">'+esc(u.name)+'</option>';}).join('');
  window._curUshMeetId=led[0].id;
  openModal('ushMeetModal9');
  loadUshMeeting9(led[0].id);
};
window.loadUshMeeting9=function(ushId){
  if(!ushId||!sb)return;
  if(!isUshLeaderOf(ushId)){closeModalDirect();return alert('🚫 You are not permitted for this ushirika.');}
  sb.from('weekly_meetings').select('*').eq('ushirika_id',ushId).order('created_at',{ascending:false}).limit(1).then(function(r){
    var m=r.data&&r.data[0];var g=function(id){return document.getElementById(id);};
    if(!m){if(g('um9MediaLink'))g('um9MediaLink').innerHTML='';return;}
    if(m.meeting_date&&g('um9Date'))g('um9Date').value=m.meeting_date;
    if(g('um9Start'))g('um9Start').value=m.start_time||'';if(g('um9End'))g('um9End').value=m.end_time||'';
    if(g('um9Venue'))g('um9Venue').value=m.venue||'';if(g('um9Theme'))g('um9Theme').value=m.theme||'';
    if(g('um9MediaLink'))g('um9MediaLink').innerHTML=mediaHTML(mediaOf(m));
  });
};
window.saveUshMeeting9=function(){
  var ushId=document.getElementById('um9Pick').value;
  if(!isUshLeaderOf(ushId))return alert('🚫 You are not permitted to edit this ushirika\'s meeting.');
  var media=window._pm&&window._pm.ushMeet9;
  var doIt=function(url){
    var payload={ushirika_id:ushId,
      meeting_date:document.getElementById('um9Date').value||nextDateForDay(document.getElementById('um9Day').value),
      start_time:document.getElementById('um9Start').value,end_time:document.getElementById('um9End').value,
      venue:document.getElementById('um9Venue').value,theme:document.getElementById('um9Theme').value};
    if(url)payload.media_urls=url;
    insertMeetingSafe(payload,function(r){
      if(r&&r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Meeting saved!');delete window._pm.ushMeet9;closeModalDirect();
    });
  };
  if(media){uploadMediaFile(media).then(doIt).catch(function(){doIt(null);});}else doIt(null);
};
window.loadUshMeeting=window.loadUshMeeting9;
window.saveUshMeeting=window.saveUshMeeting9;

// ═══════════ DEPARTMENT MEETING EDITOR (leader/admin ONLY + media) ═══════════
function ensureDeptMeetModal9(){
  if(document.getElementById('deptMeetModal9'))return;
  document.body.insertAdjacentHTML('beforeend',
  '<div class="modal-overlay" id="deptMeetModal9" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
  '<div class="modal-handle"></div><div class="modal-title">📅 Edit Department Weekly Meeting <span class="admin-only">Leader/Admin</span></div>'+
  '<div class="form-group"><label class="form-label">Pick Department</label><select class="form-select" id="dm9Pick" onchange="loadDeptMeeting9(this.value)"></select></div>'+
  '<div class="form-group"><label class="form-label">Day</label><select class="form-select" id="dm9Day"><option>Saturday</option><option>Sunday</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option></select></div>'+
  '<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="dm9Date" type="date"></div>'+
  '<div class="grid-2"><div class="form-group"><label class="form-label">Start</label><input class="form-input" id="dm9Start" type="time"></div><div class="form-group"><label class="form-label">End</label><input class="form-input" id="dm9End" type="time"></div></div>'+
  '<div class="form-group"><label class="form-label">Venue</label><input class="form-input" id="dm9Venue"></div>'+
  '<div class="form-group"><label class="form-label">Theme</label><input class="form-input" id="dm9Theme"></div>'+
  '<div class="media-upload" id="dm9Upload" onclick="attachMediaTo(\'deptMeet9\')"><i class="fas fa-cloud-upload-alt"></i><span>Reference media (optional)</span></div>'+
  '<div id="dm9MediaLink"></div>'+
  '<button class="btn btn-primary btn-block" onclick="saveDeptMeeting9()">Save Meeting</button>'+
  '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
}
window.openDeptMeetingEditor=function(deptId){
  if(!user)return alert('Log in first');
  var led=deptLedByMe();
  if(!led.length)return alert('🚫 You are not permitted to edit department weekly meetings.');
  if(deptId){led=led.filter(function(d){return d.id===deptId;});if(!led.length)return alert('🚫 You are not permitted for this department.');}
  ensureDeptMeetModal9();
  document.getElementById('dm9Pick').innerHTML=led.map(function(d){return '<option value="'+d.id+'">'+esc(d.name)+'</option>';}).join('');
  window._curDeptMeetId=led[0].id;
  openModal('deptMeetModal9');
  loadDeptMeeting9(led[0].id);
};
window.loadDeptMeeting9=function(deptId){
  if(!deptId||!sb)return;
  if(!isDeptLeader9(deptId)){closeModalDirect();return alert('🚫 You are not permitted for this department.');}
  sb.from('weekly_meetings').select('*').eq('department_id',deptId).order('created_at',{ascending:false}).limit(1).then(function(r){
    var m=r.data&&r.data[0];var g=function(id){return document.getElementById(id);};
    if(!m){if(g('dm9MediaLink'))g('dm9MediaLink').innerHTML='';return;}
    if(m.meeting_date&&g('dm9Date'))g('dm9Date').value=m.meeting_date;
    if(g('dm9Start'))g('dm9Start').value=m.start_time||'';if(g('dm9End'))g('dm9End').value=m.end_time||'';
    if(g('dm9Venue'))g('dm9Venue').value=m.venue||'';if(g('dm9Theme'))g('dm9Theme').value=m.theme||'';
    if(g('dm9MediaLink'))g('dm9MediaLink').innerHTML=mediaHTML(mediaOf(m));
  });
};
window.saveDeptMeeting9=function(){
  var deptId=document.getElementById('dm9Pick').value;
  if(!isDeptLeader9(deptId))return alert('🚫 You are not permitted to edit this department\'s meeting.');
  var media=window._pm&&window._pm.deptMeet9;
  var doIt=function(url){
    var payload={department_id:deptId,
      meeting_date:document.getElementById('dm9Date').value||nextDateForDay(document.getElementById('dm9Day').value),
      start_time:document.getElementById('dm9Start').value,end_time:document.getElementById('dm9End').value,
      venue:document.getElementById('dm9Venue').value,theme:document.getElementById('dm9Theme').value};
    if(url)payload.media_urls=url;
    insertMeetingSafe(payload,function(r){
      if(r&&r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Meeting saved!');delete window._pm.deptMeet9;closeModalDirect();
    });
  };
  if(media){uploadMediaFile(media).then(doIt).catch(function(){doIt(null);});}else doIt(null);
};
// old "Update" button fixed: attaches current dept/ushirika (satisfies CHECK constraint)
window.updateMeeting=function(){
  if(!user||!sb)return alert('Log in');
  var deptId=currentDeptId||null;
  var ushId=window._curUshForumId||null;
  if(!deptId&&!ushId){
    if(leadsAnyDept())deptId=deptLedByMe()[0].id;
    else if(leadsAnyUsh())ushId=ushLedByMe()[0].id;
  }
  if(!deptId&&!ushId)return alert('Open a department or ushirika first.');
  var can=deptId?isDeptLeader9(deptId):isUshLeaderOf(ushId);
  if(!can)return alert('🚫 You are not permitted to edit weekly meetings.');
  var payload={meeting_date:document.getElementById('meetingDate').value||nextDateForDay(document.getElementById('meetingDay').value),
    start_time:document.getElementById('meetingStart').value,end_time:document.getElementById('meetingEnd').value,
    venue:document.getElementById('meetingVenue').value,theme:document.getElementById('meetingTheme').value};
  if(deptId)payload.department_id=deptId;else payload.ushirika_id=ushId;
  insertMeetingSafe(payload,function(r){
    if(r&&r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Updated!');closeModalDirect();
    if(deptId)loadDeptMeeting9(deptId);
  });
};
function injectDeptTabMeetBtn(){
  var host=document.getElementById('ushirika-departments');if(!host||!user)return;
  var old=document.getElementById('deptTabMeetBtn9');
  var led=deptLedByMe();
  if(!led.length){if(old)old.remove();return;}
  if(old)return;
  var b=document.createElement('button');b.id='deptTabMeetBtn9';b.className='btn btn-warm btn-block';b.style.marginBottom='12px';
  b.innerHTML='<i class="fas fa-calendar-alt"></i> Edit Department Weekly Meeting (Leader/Admin)';
  b.onclick=function(){openDeptMeetingEditor();};
  host.insertBefore(b,host.firstChild);
}

// ═══════════ FREE ROLES + OFFICIALS FIX (admin assigns any role, any ushirika/dept) ═══════════
function addCustomOptions9(sel){
  if(!sel)return;
  var have={};for(var i=0;i<sel.options.length;i++)have[sel.options[i].value.toLowerCase()]=1;
  (titlesData||[]).forEach(function(t){
    var n=t.name;if(!have[String(n).toLowerCase()]){
      var o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);have[String(n).toLowerCase()]=1;
    }
  });
}
function saveRoleBtn9(inputId){
  return '<button class="btn btn-secondary-alt btn-sm" style="margin-top:6px" onclick="saveReusableRole9(\''+inputId+'\')"><i class="fas fa-save"></i> Save role for reuse</button>';
}
window.saveReusableRole9=function(inputId){
  if(!isAdmin())return alert('Admin only');
  var v=(document.getElementById(inputId).value||'').trim();if(!v)return alert('Type a role first');
  sb.from('titles').insert([{name:v,category:'general',created_by:user.id}]).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role "'+v+'" saved for reuse');if(typeof loadTitles==='function')loadTitles();
  });
};
function getRole9(selId,customId){
  var c=(document.getElementById(customId)||{value:''}).value;
  if(c&&c.trim())return c.trim();
  return document.getElementById(selId).value;
}
function enhanceRoleModals(){
  if(!user)return;
  var m1=document.getElementById('addDeptMemberModal');
  if(m1&&!document.getElementById('adm9Wrap')){
    var sel=m1.querySelector('#deptMemberRole');
    if(sel){
      addCustomOptions9(sel);
      var wrap=document.createElement('div');wrap.id='adm9Wrap';
      wrap.innerHTML='<div class="form-group"><label class="form-label">Or type ANY role (e.g. Sound Engineer)</label><input class="form-input" id="adm9Custom" placeholder="Custom role for this department"></div>'+saveRoleBtn9('adm9Custom');
      sel.closest('.form-group').insertAdjacentElement('afterend',wrap);
    }
  }
  var m2=document.getElementById('assignDeptRoleModal');
  if(m2&&!document.getElementById('adr9Wrap')){
    var sel2=m2.querySelector('#assignRoleValue');
    if(sel2){
      addCustomOptions9(sel2);
      var w2=document.createElement('div');w2.id='adr9Wrap';
      w2.innerHTML='<div class="form-group"><label class="form-label">Or type ANY role</label><input class="form-input" id="adr9Custom" placeholder="Custom role"></div>'+saveRoleBtn9('adr9Custom');
      sel2.closest('.form-group').insertAdjacentElement('afterend',w2);
    }
  }
  var m3=document.getElementById('addOfficialModal');
  if(m3&&!document.getElementById('off9Wrap')){
    addCustomOptions9(m3.querySelector('#officialTitle'));
    var w3=document.createElement('div');w3.id='off9Wrap';
    w3.innerHTML='<div class="form-group"><label class="form-label">Assign to Ushirika *</label><select class="form-select" id="off9Ush"></select></div>'+
      '<div class="form-group"><label class="form-label">Or custom title</label><input class="form-input" id="off9Custom" placeholder="e.g. Ushirika Sound Engineer"></div>'+saveRoleBtn9('off9Custom');
    m3.querySelector('#officialTitle').closest('.form-group').insertAdjacentElement('afterend',w3);
  }
  var off9Ush=document.getElementById('off9Ush');
  if(off9Ush&&(ushirikasData||[]).length){
    off9Ush.innerHTML=ushirikasData.map(function(u){return '<option value="'+u.id+'">'+esc(u.name)+'</option>';}).join('');
  }
}
// FIXED: correct user_id + real ushirika_id + any title
window.assignOfficial=function(){
  if(!user||!sb)return alert('Log in');
  var sel=document.querySelector('#officialUserPicker .user-pick-item.selected');
  if(!sel)return alert('Select user');
  var uid=sel.dataset.userId;
  var ushId=(document.getElementById('off9Ush')||{value:''}).value;
  if(!ushId)return alert('Pick a ushirika');
  var custom=(document.getElementById('off9Custom')||{value:''}).value;
  var title=(custom&&custom.trim())?custom.trim():document.getElementById('officialTitle').value;
  sb.from('ushirika_officials').insert([{user_id:uid,ushirika_id:ushId,title:title,created_by:user.id}]).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ '+title+' assigned!');closeModalDirect();
    if(typeof loadOfficials==='function')loadOfficials();
  });
};
// FIXED: custom roles on add/assign department member
window.addDeptMember=function(){
  if(!user||!currentDeptId||!sb)return alert('Open a dept');
  var sel=document.querySelector('#deptMemberPicker .user-pick-item.selected');
  if(!sel)return alert('Select user');
  var uid=sel.dataset.userId;
  var role=getRole9('deptMemberRole','adm9Custom');
  sb.from('department_members').insert([{user_id:uid,department_id:currentDeptId,role:role}]).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Added as '+role+'!');closeModalDirect();
    loadDeptMembers(currentDeptId);if(typeof loadMyMemberships9==='function')loadMyMemberships9();
  });
};
window.assignDeptRole=function(){
  if(!user||!currentDeptId||!sb)return alert('Open a dept');
  var memberId=document.getElementById('assignRoleMember').value;
  var role=getRole9('assignRoleValue','adr9Custom');
  sb.from('department_members').update({role:role}).eq('id',memberId).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role updated to '+role);closeModalDirect();
    loadDeptMembers(currentDeptId);if(typeof loadMyMemberships9==='function')loadMyMemberships9();
  });
};

// ═══════════ COMMENTS WITH OPTIONAL MEDIA (all users, all forums) ═══════════
window.loadPostComments=function(postId){
  var c=document.getElementById('comments-'+postId);if(!c||!sb)return;
  sb.from('post_comments').select('*, profiles(name)').eq('post_id',postId).order('created_at').then(function(r){
    var list=r.data||[];
    var h=list.map(function(x){
      var mine=user&&x.user_id===user.id;
      return '<div class="comment-item"><div class="comment-header"><span class="comment-name">'+esc((x.profiles||{}).name)+(x.is_anonymous?' <span class="anon-badge">Anonymous</span>':'')+'</span><span class="comment-time">'+ago(x.created_at)+'</span>'+(isAdmin()||mine?'<button class="comment-delete" onclick="deletePostComment(\''+x.id+'\',\''+postId+'\')"><i class="fas fa-times"></i></button>':'')+'</div><div class="comment-text">'+esc(x.content)+'</div>'+mediaHTML(mediaOf(x))+'</div>';
    }).join('');
    h+='<div style="margin-top:8px"><div class="media-upload" style="padding:8px;margin-bottom:6px" onclick="attachMediaTo(\'cmt'+postId+'\')"><i class="fas fa-paperclip"></i><span>Attach media to comment (optional)</span></div>'+
       '<div style="display:flex;gap:6px"><input class="form-input" id="pcc-'+postId+'" placeholder="Comment..." style="margin:0"><button class="btn btn-sm btn-primary" onclick="addPostComment(\''+postId+'\')">Send</button></div></div>';
    c.innerHTML=h;
  }).catch(function(){});
};
window.addPostComment=function(postId){
  if(!user||!sb)return alert('Log in');
  var inp=document.getElementById('pcc-'+postId);
  var v=inp?inp.value.trim():'';if(!v)return;
  var media=window._pm&&window._pm['cmt'+postId];
  var after=function(){inp.value='';delete window._pm['cmt'+postId];setTimeout(function(){loadPostComments(postId);},300);};
  var doIt=function(url){
    var payload={post_id:postId,user_id:user.id,content:v,is_anonymous:false};
    if(url)payload.media_urls=url;
    sb.from('post_comments').insert([payload]).then(function(r){
      if(r.error&&/media_urls/.test(r.error.message)&&url){
        sb.from('post_comments').insert([{post_id:postId,user_id:user.id,content:v+'\n📎 '+url,is_anonymous:false}]).then(after);
        return;
      }
      if(r.error)return alert('⚠️ '+r.error.message);
      after();
    });
  };
  if(media){uploadMediaFile(media).then(doIt).catch(function(){doIt(null);});}else doIt(null);
};

// ═══════════ DEPARTMENT JOIN REQUEST ═══════════
window.requestJoinDept=function(){
  if(!user||!sb)return alert('Log in');
  var sel=document.querySelector('#deptPickerList .user-pick-item.selected');
  if(!sel)return alert('Select a department');
  var deptId=sel.dataset.deptId;
  var dept=null;for(var i=0;i<depts.length;i++){if(depts[i].id===deptId){dept=depts[i];break;}}
  sb.from('pending_requests').insert([{user_id:user.id,type:'join_department',target_id:deptId,target_name:dept?dept.name:'',status:'pending'}]).then(function(r){
    if(r.error){alert('⚠️ '+r.error.message);return;}
    alert('✅ Request sent!');closeModalDirect();
    if(typeof loadPending==='function')loadPending();
  });
};

// ═══════════ PENDING REQUESTS + APPROVE ═══════════
window.renderPending=function(){
  var p=document.getElementById('adminPendingRequests');if(!p)return;
  if(isAdmin())p.style.display='block';
  var c=document.getElementById('dyn-pending');
  if(!c){c=document.createElement('div');c.id='dyn-pending';p.appendChild(c);}
  if(!pendingData||!pendingData.length){c.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-lighter)">No pending requests</div>';return;}
  c.innerHTML=pendingData.map(function(r){
    var uname=r.user_name||'';
    if(!uname&&window.usersData){var u=usersData.find(function(x){return x.id===r.user_id;});if(u)uname=u.name;}
    return '<div class="card" style="border-left:4px solid var(--primary)">'+
      '<div style="font-weight:700;margin-bottom:6px">'+esc(uname||'A member')+' wants to join</div>'+
      '<div style="font-size:.85rem;color:var(--text-light);margin-bottom:10px"><i class="fas fa-building"></i> '+esc(r.target_name||'Department')+'</div>'+
      '<div style="display:flex;gap:8px">'+
      '<button class="btn btn-accent btn-sm" onclick="approvePendingRequest(\''+r.id+'\')"><i class="fas fa-check"></i> Approve</button>'+
      '<button class="btn btn-danger btn-sm" onclick="declinePendingRequest(\''+r.id+'\')"><i class="fas fa-times"></i> Decline</button>'+
      '</div></div>';
  }).join('');
};
window.approvePendingRequest=function(id){
  if(!sb||!isAdmin())return alert('Admin only');
  var req=null;for(var i=0;i<pendingData.length;i++){if(pendingData[i].id===id){req=pendingData[i];break;}}
  if(!req)return alert('Request not found');
  sb.from('pending_requests').update({status:'approved'}).eq('id',id).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    return sb.from('department_members').insert([{user_id:req.user_id,department_id:req.target_id,role:'member'}]).then(function(ins){
      if(ins&&ins.error)return alert('⚠️ '+ins.error.message);
      sb.from('notifications').insert([{user_id:req.user_id,title:'Department Request Approved',body:'You joined '+(req.target_name||'the department')+' — open its forum now!'}]).then(function(){});
      alert('✅ Approved! Member added to department.');
      loadPending();if(typeof loadMyMemberships9==='function')loadMyMemberships9();
    });
  });
};
window.declinePendingRequest=function(id){
  if(!sb||!isAdmin())return;
  if(!confirm('Decline this request?'))return;
  sb.from('pending_requests').update({status:'declined'}).eq('id',id).then(function(){alert('Declined');loadPending();});
};

// ═══════════ DEPARTMENT FORUM ═══════════
window.openDeptForum=function(deptId){
  if(!user)return alert('Please log in first');
  var dept=null;for(var i=0;i<depts.length;i++){if(depts[i].id===deptId){dept=depts[i];break;}}
  if(!dept)return alert('Department not found');
  sb.from('department_members').select('user_id,department_id,role').eq('user_id',user.id).eq('department_id',deptId).limit(1).then(function(r){
    var isMember=(r.data&&r.data.length>0)||(window._myDepts||[]).some(function(m){return m.department_id===deptId;});
    if(!isMember&&!isAdmin()){
      if(confirm('You are not a member of '+dept.name+' yet. Send a request to join now?')){
        sb.from('pending_requests').insert([{user_id:user.id,type:'join_department',target_id:deptId,target_name:dept.name,status:'pending'}]).then(function(rr){
          alert(rr.error?('⚠️ '+rr.error.message):'✅ Request sent! Awaiting admin approval.');
        });
      }
      return;
    }
    currentDeptId=deptId;
    var n=document.getElementById('mainDeptName');if(n)n.textContent=dept.name;
    var d=document.getElementById('mainDeptDesc');if(d)d.textContent=dept.description||'';
    var m=document.getElementById('mainDeptMembers');if(m)m.textContent=(dept.member_count||0)+' members';
    var ic=document.getElementById('mainDeptIcon');if(ic)ic.innerHTML='<i class="fas '+(dept.icon||'fa-users')+'"></i>';
    activateSection('section-home','home-mainDept','home');
    var oldB=document.getElementById('deptEditMeetBtn');if(oldB)oldB.remove();
    if(isDeptLeader9(deptId)){
      var host=document.getElementById('home-mainDept');
      var b=document.createElement('button');b.id='deptEditMeetBtn';b.className='btn btn-warm btn-block';b.style.marginBottom='12px';
      b.innerHTML='<i class="fas fa-calendar-alt"></i> Edit Weekly Meeting (Leader/Admin)';
      b.onclick=function(){openDeptMeetingEditor(deptId);};
      if(host)host.insertBefore(b,host.firstChild);
    }
    loadDeptPosts(deptId);loadDeptMembers(deptId);
  });
};
window._gcOpenDept=window.openDeptForum;
function bindDeptCards(){
  var cards=document.querySelectorAll('.dept-card');
  cards.forEach(function(card){
    if(card.dataset.bound9)return;card.dataset.bound9='1';
    var id=card.dataset.deptId;
    if(!id){var oc=card.getAttribute('onclick')||'';var mm=oc.match(/['"]([0-9a-fA-F-]{36})['"]/);if(mm)id=mm[1];}
    if(!id){var txt=card.textContent||'';var dd=depts.find(function(x){return txt.indexOf(x.name)>-1;});if(dd)id=dd.id;}
    if(id){card.style.cursor='pointer';card.onclick=function(ev){ev.preventDefault();ev.stopPropagation();openDeptForum(id);};}
  });
}

// ═══════════ USHIRIKA FORUM ═══════════
function ensureUshForumPage(){
  if(document.getElementById('ush-forum-page'))return;
  var sec=document.getElementById('section-ushirika');if(!sec)return;
  var div=document.createElement('div');div.id='ush-forum-page';div.className='sub-page';
  div.innerHTML='<button class="back-btn" onclick="closeUshForum()"><i class="fas fa-arrow-left"></i> Back</button>'+
    '<div class="section-title-app" id="ushForumTitle">💬 Ushirika Forum</div>'+
    '<div class="card"><div class="form-group"><textarea class="form-textarea" id="ushPostText" placeholder="Share with your ushirika..."></textarea></div>'+
    '<div class="media-upload" id="ushForumUpload" onclick="attachMediaTo(\'ushForum\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media (optional)</span></div>'+
    '<button class="btn btn-primary btn-block" onclick="submitUshPost()"><i class="fas fa-paper-plane"></i> Post</button></div>'+
    '<div id="ushForumPosts"></div>';
  sec.appendChild(div);
}
window.closeUshForum=function(){activateSection('section-ushirika','ushirika-main','ushirika');};
window.openUshirikaForum=function(ushId){
  if(!user)return alert('Please log in first');
  var u=null;for(var i=0;i<ushirikasData.length;i++){if(ushirikasData[i].id===ushId){u=ushirikasData[i];break;}}
  if(!u)return alert('Ushirika not found');
  sb.from('ushirika_members').select('id').eq('user_id',user.id).eq('ushirika_id',ushId).limit(1).then(function(r){
    var member=r.data&&r.data.length>0;
    if(!member&&!isAdmin())return alert('You are not a member of this Ushirika. Join first.');
    window._curUshForumId=ushId;
    ensureUshForumPage();
    activateSection('section-ushirika','ush-forum-page','ushirika');
    var t=document.getElementById('ushForumTitle');if(t)t.textContent='💬 '+u.name+' — Forum';
    loadUshForumPosts(ushId);
  });
};
window.loadUshForumPosts=function(ushId){
  if(!sb)return;var box=document.getElementById('ushForumPosts');if(!box)return;
  box.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-lighter)">Loading...</div>';
  sb.from('posts').select('*, profiles(name,role)').eq('ushirika_id',ushId).order('created_at',{ascending:false}).limit(50).then(function(r){
    if(r.error){box.innerHTML='<div style="color:#991B1B">'+esc(r.error.message)+'</div>';return;}
    var posts=r.data||[];
    if(!posts.length){box.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-lighter)">No posts yet. Start the conversation! 🎉</div>';return;}
    box.innerHTML=posts.map(function(p){
      var pr=p.profiles||{};
      var liked=user&&p.liked_by&&p.liked_by.indexOf(user.id)>-1;
      var canDel=(user&&p.author_id===user.id)||isAdmin();
      return '<div class="post"><div class="post-header"><div class="post-avatar">'+ini(pr.name)+'</div><div><div class="post-name">'+esc(pr.name||'Member')+'</div></div><div class="post-time">'+ago(p.created_at)+'</div>'+(canDel?'<button class="post-delete" onclick="ushDeletePost(\''+p.id+'\')"><i class="fas fa-trash"></i></button>':'')+'</div>'+
        '<div class="post-body">'+esc(p.content||'')+'</div>'+
        mediaHTML(mediaOf(p))+
        '<div class="post-actions"><button class="post-action'+(liked?' liked':'')+'" onclick="ushLike(\''+p.id+'\')"><i class="fas fa-heart"></i> '+(p.likes||0)+'</button>'+
        '<button class="post-action" onclick="toggleComments(\''+p.id+'\')"><i class="far fa-comment"></i> Comment</button></div>'+
        '<div class="comments-area" id="comments-'+p.id+'" style="display:none"></div></div>';
    }).join('');
  });
};
window.submitUshPost=function(){
  var ushId=window._curUshForumId;if(!user||!sb||!ushId)return alert('Open a ushirika forum first');
  var txt=document.getElementById('ushPostText');if(!txt||!txt.value.trim())return alert('Write something');
  var media=window._pm&&window._pm.ushForum;
  var doIt=function(url){
    var payload={author_id:user.id,ushirika_id:ushId,content:txt.value.trim(),likes:0,liked_by:[]};
    if(url)payload.media_urls=url;
    insertPostSafe(payload,function(r){
      if(r&&r.error)return alert('⚠️ '+r.error.message);
      txt.value='';delete window._pm.ushForum;
      var up=document.getElementById('ushForumUpload');if(up)up.classList.remove('has-file');
      loadUshForumPosts(ushId);
    });
  };
  if(media){uploadMediaFile(media).then(function(u){doIt(u);}).catch(function(){doIt(null);});}else doIt(null);
};
window.ushLike=function(pid){
  if(!user||!sb)return;
  sb.from('posts').select('liked_by').eq('id',pid).single().then(function(r){
    if(r.error)return;var lb=r.data.liked_by||[];
    var has=lb.indexOf(user.id)>-1;
    var nb=has?lb.filter(function(x){return x!==user.id;}):lb.concat([user.id]);
    sb.from('posts').update({liked_by:nb,likes:nb.length}).eq('id',pid).then(function(){loadUshForumPosts(window._curUshForumId);});
  });
};
window.ushDeletePost=function(pid){if(!confirm('Delete this post?'))return;sb.from('posts').delete().eq('id',pid).then(function(){loadUshForumPosts(window._curUshForumId);});};

// ═══════════ MAIN + DEPT FORUM POSTS ═══════════
window.submitPost=function(){
  if(!user||!sb)return alert('Log in');
  var txt=document.getElementById('postText');var t=txt?txt.value.trim():'';if(!t)return alert('Write something');
  var media=window._pm&&window._pm.forum;
  var finish=function(url){
    var payload={author_id:user.id,content:t,likes:0,liked_by:[]};if(url)payload.media_urls=url;
    insertPostSafe(payload,function(r){
      if(r&&r.error)return alert('⚠️ '+r.error.message);
      txt.value='';delete window._pm.forum;closeModalDirect();
      if(typeof loadForumPosts==='function')loadForumPosts();
    });
  };
  if(media){uploadMediaFile(media).then(finish).catch(function(){finish(null);});}else finish(null);
};
window.submitDeptPost=function(){
  if(!user||!currentDeptId||!sb)return alert('Open a dept');
  var txt=document.getElementById('deptPostText');var t=txt?txt.value.trim():'';if(!t)return alert('Write something');
  var media=window._pm&&window._pm.dept;
  var finish=function(url){
    var payload={author_id:user.id,department_id:currentDeptId,content:t,likes:0,liked_by:[]};if(url)payload.media_urls=url;
    insertPostSafe(payload,function(r){
      if(r&&r.error)return alert('⚠️ '+r.error.message);
      txt.value='';delete window._pm.dept;closeModalDirect();
      loadDeptPosts(currentDeptId);
    });
  };
  if(media){uploadMediaFile(media).then(finish).catch(function(){finish(null);});}else finish(null);
};
window.postHTML=function(p,isDept){
  var pr=p.profiles||{};var mine=user&&p.author_id===user.id;
  var liked=user&&p.liked_by&&p.liked_by.indexOf(user.id)>-1;var canDel=mine||isAdmin();
  return '<div class="post"><div class="post-header"><div class="post-avatar'+(pr.role==='admin'?' admin':'')+'">'+ini(pr.name)+'</div><div><div class="post-name">'+esc(pr.name||'')+'</div></div><div class="post-time">'+ago(p.created_at)+'</div>'+(canDel?'<button class="post-delete" onclick="window._gcDeletePost(\''+p.id+'\','+isDept+')"><i class="fas fa-trash"></i></button>':'')+'</div><div class="post-body">'+esc(p.content||'')+'</div>'+mediaHTML(mediaOf(p))+'<div class="post-actions"><button class="post-action'+(liked?' liked':'')+'" onclick="window._gcLike(\''+p.id+'\','+isDept+')"><i class="fas fa-heart"></i> '+(p.likes||0)+'</button><button class="post-action" onclick="toggleComments(\''+p.id+'\')"><i class="far fa-comment"></i> Comment</button></div><div class="comments-area" id="comments-'+p.id+'" style="display:none"></div></div>';
};

// ═══════════ MY USHIRIKAS + MY DEPARTMENTS ═══════════
window.loadMyMemberships9=function(){
  if(!user||!sb)return;
  sb.from('ushirika_members').select('*').eq('user_id',user.id).then(function(r){window._myUsh=r.data||[];renderMyUshirikas();});
  sb.from('department_members').select('user_id,department_id,role').eq('user_id',user.id).then(function(r){window._myDepts=r.data||[];renderMyDepts();});
  var oldSec=document.getElementById('myUshirikasSection');
  if(oldSec){var lst=document.getElementById('myUshirikasList');if(!lst||!lst.innerHTML.trim())oldSec.style.display='none';}
};
function renderMyUshirikas(){
  var host=document.getElementById('ushirika-groups');if(!host||!user)return;
  var list=window._myUsh||[];
  var old=document.getElementById('myUshWrap');
  var sig=JSON.stringify(list.map(function(m){return m.ushirika_id;}));
  if(old&&old.dataset.sig===sig)return;
  if(old)old.remove();
  if(!list.length)return;
  var html='<div id="myUshWrap" data-sig="'+esc(sig)+'" style="margin-top:16px"><div class="section-title-app" style="font-size:1.05rem">🤝 My Ushirikas — tap to open forum</div>';
  list.forEach(function(m){
    var u=null;for(var i=0;i<ushirikasData.length;i++){if(ushirikasData[i].id===m.ushirika_id){u=ushirikasData[i];break;}}
    if(!u)return;
    html+='<div class="ushirika-card" onclick="openUshirikaForum(\''+u.id+'\')"><div class="ushirika-icon"><i class="fas fa-people-group"></i></div><div class="ushirika-info"><div class="ushirika-name">'+esc(u.name)+'</div><div class="ushirika-detail">'+esc(m.role||'member')+' • Tap for forum</div></div><i class="fas fa-chevron-right" style="color:var(--text-lighter)"></i></div>';
  });
  html+='</div>';
  host.insertAdjacentHTML('beforeend',html);
}
function renderMyDepts(){
  var host=document.getElementById('ushirika-departments');if(!host||!user)return;
  var list=window._myDepts||[];
  var old=document.getElementById('myDeptWrap');
  var sig=JSON.stringify(list.map(function(m){return m.department_id;}));
  if(old&&old.dataset.sig===sig)return;
  if(old)old.remove();
  if(!list.length)return;
  var html='<div id="myDeptWrap" data-sig="'+esc(sig)+'" style="margin-bottom:16px"><div class="section-title-app" style="font-size:1.05rem">🏢 My Departments — tap to open forum</div>';
  list.forEach(function(m){
    var d=null;for(var i=0;i<depts.length;i++){if(depts[i].id===m.department_id){d=depts[i];break;}}
    if(!d)return;
    html+='<div class="ushirika-card" onclick="openDeptForum(\''+d.id+'\')"><div class="ushirika-icon" style="background:var(--gradient-dept)"><i class="fas fa-building"></i></div><div class="ushirika-info"><div class="ushirika-name">'+esc(d.name)+'</div><div class="ushirika-detail">'+esc(m.role||'member')+' • Tap for forum</div></div><i class="fas fa-chevron-right" style="color:var(--text-lighter)"></i></div>';
  });
  html+='</div>';
  var deptsBox=document.getElementById('dyn-depts');
  if(deptsBox)deptsBox.insertAdjacentHTML('afterend',html);
  else host.insertAdjacentHTML('beforeend',html);
}

// ═══════════ LOOPS & HOOKS ═══════════
setInterval(function(){bindDeptCards();ensureUshForumPage();injectDeptTabMeetBtn();sweepMeetingButtons();enhanceRoleModals();},2000);
setInterval(function(){if(user)loadMyMemberships9();if(isAdmin()&&typeof loadPending==='function')loadPending();},10000);
if(user)setTimeout(loadMyMemberships9,1500);
var _origLoadAll=window.loadAll;
window.loadAll=function(){
  var p=_origLoadAll?_origLoadAll():Promise.resolve();
  setTimeout(loadMyMemberships9,1200);
  return p;
};
console.log('✝️ app9.js FIXED build v4 active (roles + officials + comments media + meetings constraint)');
