// app10.js — FINAL build (ushirika full admin UI + role catalog + home fix + counters)
console.log('✝️ app10.js FINAL build loading...');

// ═══════════ HELPERS ═══════════
function ext(o,extra){var n={};for(var k in o)n[k]=o[k];for(var k2 in extra)n[k2]=extra[k2];return n;}
function slug9(s){return String(s||'member').toLowerCase().replace(/[^a-z0-9_-]+/g,'')||'member';}
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
  if(payload.ushirika_id&&payload.department_id)delete payload.ushirika_id;
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

// ═══════════ INBOX (works from any section) ═══════════
window.openChatWith=function(id){
  if(!user||id===user.id||!sb)return;
  currentChatUserId=id;
  var u=null;for(var i=0;i<usersData.length;i++){if(usersData[i].id===id){u=usersData[i];break;}}
  if(!u)return;
  var a=document.getElementById('chatAvatar');if(a)a.textContent=ini(u.name);
  var n=document.getElementById('chatName');if(n)n.textContent=u.name;
  var s=document.getElementById('chatStatus');if(s)s.textContent=esc(u.role||'Member')+' • Online';
  activateSection('section-discover','discover-chat','discover');
  closeModalDirect();
  loadChatMessages();
  if(chatSub&&sb.removeChannel){sb.removeChannel(chatSub);chatSub=null;}
  try{chatSub=sb.channel('chat-'+user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},function(){loadChatMessages();loadChatInbox();}).subscribe();}catch(e){}
};

// ═══════════ PERMISSIONS ═══════════
function isUshLeaderOf(id){
  if(isAdmin())return true;
  for(var i=0;i<officialsData.length;i++){var o=officialsData[i];if(o.user_id===user.id&&o.ushirika_id===id)return true;}
  var l=(window._myUsh||[]).filter(function(m){return m.ushirika_id===id&&String(m.role||'').toLowerCase().indexOf('leader')>-1;});
  return l.length>0;
}
function leadsAnyUsh(){
  if(isAdmin())return true;
  if((officialsData||[]).some(function(o){return o.user_id===user.id;}))return true;
  return (window._myUsh||[]).some(function(m){return String(m.role||'').toLowerCase().indexOf('leader')>-1;});
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

// ═══════════ REAL MEMBER COUNTS (depts + ushirikas) ═══════════
window._deptCounts={};window._ushCounts={};
function loadMemberCounts9(){
  if(!sb)return;
  sb.from('department_members').select('department_id').then(function(r){
    var m={};(r.data||[]).forEach(function(x){m[x.department_id]=(m[x.department_id]||0)+1;});
    window._deptCounts=m;updateCountLabels();
  });
  sb.from('ushirika_members').select('ushirika_id').then(function(r){
    var m={};(r.data||[]).forEach(function(x){m[x.ushirika_id]=(m[x.ushirika_id]||0)+1;});
    window._ushCounts=m;updateCountLabels();
  });
}
function updateCountLabels(){
  document.querySelectorAll('.dept-card').forEach(function(card){
    var id=card.dataset.deptId;if(!id)return;
    var n=window._deptCounts[id]||0;
    var els=card.querySelectorAll('div,span');
    for(var i=0;i<els.length;i++){
      if(/\d+\s*members?/i.test(els[i].innerHTML)&&els[i].querySelectorAll('div').length===0){
        els[i].innerHTML=els[i].innerHTML.replace(/\d+(\s*)members?/i,n+' members');
      }
    }
  });
  updateUshCounts();
}
function updateUshCounts(){
  document.querySelectorAll('.ushirika-card').forEach(function(card){
    var id=card.dataset.ushId;if(!id)return;
    var n=window._ushCounts[id]||0;
    var det=card.querySelector('.ushirika-detail');
    if(!det)return;
    if(/members/.test(det.innerHTML)){det.innerHTML=det.innerHTML.replace(/<b>\d+<\/b>\s*members/,'<b>'+n+'</b> members');}
    else{det.innerHTML=det.innerHTML+' • <b>'+n+'</b> members';}
  });
}

// ═══════════ USHIRIKA CARDS: tappable + counted ═══════════
function bindUshCards(){
  document.querySelectorAll('.ushirika-card').forEach(function(card){
    var nameEl=card.querySelector('.ushirika-name');var nm=nameEl?nameEl.textContent.trim():'';
    var u=null;for(var i=0;i<ushirikasData.length;i++){if(ushirikasData[i].name===nm){u=ushirikasData[i];break;}}
    if(u)card.dataset.ushId=u.id;
    if(card.dataset.boundU)return;card.dataset.boundU='1';
    if(u){card.style.cursor='pointer';card.onclick=function(ev){ev.preventDefault();ev.stopPropagation();openUshirikaForum(u.id);};}
  });
  updateUshCounts();
}

// ═══════════ HOME "MY DEPARTMENTS" FIX (real memberships) ═══════════
window.loadMyDepts=function(){
  if(!user||!sb)return;
  sb.from('department_members').select('role,department_id').eq('user_id',user.id).then(function(r){
    window._myDeptsHome=r.data||[];renderMyDeptsHome();
  });
};
function renderMyDeptsHome(){
  var s=document.getElementById('myDeptsScroll')||document.querySelector('.my-depts-scroll');
  if(!s)return;
  var c=document.getElementById('myDeptsCount')||(s.parentElement?s.parentElement.querySelector('.my-depts-count'):null);
  s.querySelectorAll('.my-dept-mini').forEach(function(e){e.remove();});
  var j=s.querySelector('.my-dept-join-more');
  var list=window._myDeptsHome||[];
  var a=['','alt1','alt2','alt3','alt4'];var h='';
  list.forEach(function(m,i){
    var d=null;for(var k=0;k<depts.length;k++){if(depts[k].id===m.department_id){d=depts[k];break;}}
    if(!d)return;
    h+='<div class="my-dept-mini '+a[i%5]+'" onclick="openDeptForum(\''+d.id+'\')"><div class="my-dept-mini-icon"><i class="fas '+(d.icon||'fa-users')+'"></i></div><div class="my-dept-mini-name">'+esc(d.name)+'</div><div class="my-dept-mini-role"><span class="my-dept-mini-role-badge">'+esc(m.role||'member')+'</span></div></div>';
  });
  if(j)j.insertAdjacentHTML('beforebegin',h);else s.insertAdjacentHTML('beforeend',h);
  if(c)c.textContent=list.length+' serving';
}

// ═══════════ ROLE CATALOG (Add Role per group) ═══════════
function loadGroupRoles9(cat,cb){if(!sb)return cb([]);sb.from('titles').select('*').eq('category',cat).order('name').then(function(r){cb(r.data||[]);});}
function ensureGroupRoleModals9(){
  if(document.getElementById('ushAddRole9Modal'))return;
  document.body.insertAdjacentHTML('beforeend',
  '<div class="modal-overlay" id="ushAddRole9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
  '<div class="modal-handle"></div><div class="modal-title">🏷️ Add Role to Ushirika <span class="admin-only">Leader/Admin</span></div>'+
  '<div class="form-group"><label class="form-label">Role name (e.g. Sound Engineer)</label><input class="form-input" id="ushRole9Name" placeholder="New role"></div>'+
  '<button class="btn btn-warm btn-block" onclick="saveUshAddRole9()">Add Role</button>'+
  '<div style="margin-top:12px"><b style="font-size:.8rem">Roles in this ushirika:</b><div id="ushRole9List"></div></div></div></div>'+
  '<div class="modal-overlay" id="deptAddRole9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
  '<div class="modal-handle"></div><div class="modal-title">🏷️ Add Role to Department <span class="admin-only">Admin</span></div>'+
  '<div class="form-group"><label class="form-label">Role name (e.g. Sound Engineer)</label><input class="form-input" id="deptRole9Name" placeholder="New role"></div>'+
  '<button class="btn btn-warm btn-block" onclick="saveDeptAddRole9()">Add Role</button>'+
  '<div style="margin-top:12px"><b style="font-size:.8rem">Roles in this department:</b><div id="deptRole9List"></div></div></div></div>');
}
window.openUshAddRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  ensureGroupRoleModals9();openModal('ushAddRole9Modal');refreshGroupRoleList9('ush:'+ushId,'ushRole9List','ush');
};
window.saveUshAddRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  var v=(document.getElementById('ushRole9Name').value||'').trim();if(!v)return alert('Type a role name');
  sb.from('titles').insert([{name:v,category:'ush:'+ushId,created_by:user.id}]).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role "'+v+'" added to this ushirika');document.getElementById('ushRole9Name').value='';
    refreshGroupRoleList9('ush:'+ushId,'ushRole9List','ush');
  });
};
window.openDeptAddRole9=function(){
  var deptId=currentDeptId;if(!isDeptLeader9(deptId))return alert('🚫 Not permitted.');
  ensureGroupRoleModals9();openModal('deptAddRole9Modal');refreshGroupRoleList9('dept:'+deptId,'deptRole9List','dept');
};
window.saveDeptAddRole9=function(){
  var deptId=currentDeptId;if(!isDeptLeader9(deptId))return alert('🚫 Not permitted.');
  var v=(document.getElementById('deptRole9Name').value||'').trim();if(!v)return alert('Type a role name');
  sb.from('titles').insert([{name:v,category:'dept:'+deptId,created_by:user.id}]).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role "'+v+'" added to this department');document.getElementById('deptRole9Name').value='';
    refreshGroupRoleList9('dept:'+deptId,'deptRole9List','dept');
  });
};
function refreshGroupRoleList9(cat,boxId,kind){
  loadGroupRoles9(cat,function(list){
    var box=document.getElementById(boxId);if(!box)return;
    box.innerHTML=list.length?list.map(function(t){
      return '<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><span class="dept-role-badge '+slug9(t.name)+'">'+esc(t.name)+'</span><button class="post-delete" onclick="delGroupRole9(\''+t.id+'\',\''+cat+'\',\''+boxId+'\',\''+kind+'\')"><i class="fas fa-trash"></i></button></div>';
    }).join(''):'<div style="color:var(--text-lighter);font-size:.8rem">No custom roles yet.</div>';
  });
}
window.delGroupRole9=function(id,cat,boxId,kind){
  if(!confirm('Delete this role?'))return;
  sb.from('titles').delete().eq('id',id).then(function(){refreshGroupRoleList9(cat,boxId,kind);});
};
function fillRoleSelect9(sel,cat){
  if(!sel)return;
  var base=Array.prototype.slice.call(sel.options).map(function(o){return o.value;});
  loadGroupRoles9(cat,function(list){
    list.forEach(function(t){if(base.indexOf(t.name)===-1){var o=document.createElement('option');o.value=t.name;o.textContent=t.name+' (group)';sel.appendChild(o);base.push(t.name);}});
  });
  (titlesData||[]).forEach(function(t){if(base.indexOf(t.name)===-1){var o=document.createElement('option');o.value=t.name;o.textContent=t.name;sel.appendChild(o);base.push(t.name);}});
}

// ═══════════ MEETING EDITORS ═══════════
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
      renderUshWeekMeet9(ushId);
    });
  };
  if(media){uploadMediaFile(media).then(doIt).catch(function(){doIt(null);});}else doIt(null);
};
window.loadUshMeeting=window.loadUshMeeting9;
window.saveUshMeeting=window.saveUshMeeting9;
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
function injectDeptAddRoleBtn(){
  if(!user||!isAdmin())return;
  var host=document.getElementById('home-mainDept');if(!host)return;
  var panel=host.querySelector('.admin-panel');if(!panel)return;
  if(document.getElementById('deptAddRoleBtn9'))return;
  var b=document.createElement('button');b.id='deptAddRoleBtn9';b.className='btn btn-warm btn-block btn-sm';b.style.marginTop='6px';
  b.innerHTML='<i class="fas fa-tags"></i> Add Role (role catalog)';
  b.onclick=function(){openDeptAddRole9();};
  panel.appendChild(b);
}

// ═══════════ ROLES / OFFICIALS / MEMBERS (free roles) ═══════════
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
    if(sel){addCustomOptions9(sel);
      var wrap=document.createElement('div');wrap.id='adm9Wrap';
      wrap.innerHTML='<div class="form-group"><label class="form-label">Or type ANY role (e.g. Sound Engineer)</label><input class="form-input" id="adm9Custom" placeholder="Custom role for this department"></div>'+saveRoleBtn9('adm9Custom');
      sel.closest('.form-group').insertAdjacentElement('afterend',wrap);}
  }
  var m2=document.getElementById('assignDeptRoleModal');
  if(m2&&!document.getElementById('adr9Wrap')){
    var sel2=m2.querySelector('#assignRoleValue');
    if(sel2){addCustomOptions9(sel2);if(currentDeptId)fillRoleSelect9(sel2,'dept:'+currentDeptId);
      var w2=document.createElement('div');w2.id='adr9Wrap';
      w2.innerHTML='<div class="form-group"><label class="form-label">Or type ANY role</label><input class="form-input" id="adr9Custom" placeholder="Custom role"></div>'+saveRoleBtn9('adr9Custom');
      sel2.closest('.form-group').insertAdjacentElement('afterend',w2);}
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
  if(off9Ush&&(ushirikasData||[]).length){off9Ush.innerHTML=ushirikasData.map(function(u){return '<option value="'+u.id+'">'+esc(u.name)+'</option>';}).join('');}
}
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
window.addDeptMember=function(){
  if(!user||!currentDeptId||!sb)return alert('Open a dept');
  var sel=document.querySelector('#deptMemberPicker .user-pick-item.selected');
  if(!sel)return alert('Select user');
  var uid=sel.dataset.userId;
  sb.from('department_members').select('id').eq('user_id',uid).eq('department_id',currentDeptId).limit(1).then(function(chk){
    if(chk.data&&chk.data.length)return alert('⚠️ Already a member.');
    var role=getRole9('deptMemberRole','adm9Custom');
    sb.from('department_members').insert([{user_id:uid,department_id:currentDeptId,role:role}]).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Added as '+role+'!');closeModalDirect();
      loadDeptMembers(currentDeptId);loadMemberCounts9();loadMyDepts();if(typeof loadMyMemberships9==='function')loadMyMemberships9();
    });
  });
};
window.assignDeptRole=function(){
  if(!user||!currentDeptId||!sb)return alert('Open a dept');
  var memberId=document.getElementById('assignRoleMember').value;
  if(!memberId)return alert('Pick a member');
  var role=getRole9('assignRoleValue','adr9Custom');
  sb.from('department_members').update({role:role}).eq('id',memberId).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role updated to '+role);closeModalDirect();
    loadDeptMembers(currentDeptId);if(typeof loadMyMemberships9==='function')loadMyMemberships9();
  });
};
var _om9=window.openModal;
window.openModal=function(id){
  var r=_om9?_om9.apply(this,arguments):undefined;
  if(id==='assignDeptRoleModal'){
    var s=document.getElementById('assignRoleMember');
    if(s){s.innerHTML=(deptMembersData||[]).map(function(m){return '<option value="'+m.id+'">'+esc((m.profiles||{}).name||'Member')+' ('+esc(m.role)+')</option>';}).join('');}
    var sv=document.getElementById('assignRoleValue');if(sv&&currentDeptId)fillRoleSelect9(sv,'dept:'+currentDeptId);
  }
  if(id==='removeDeptMemberModal'){
    var s2=document.getElementById('removeMemberSelect');
    if(s2){s2.innerHTML=(deptMembersData||[]).map(function(m){return '<option value="'+m.id+'">'+esc((m.profiles||{}).name||'Member')+'</option>';}).join('');}
  }
  return r;
};

// ═══════════ DEPT MEMBERS/LEADERSHIP WITH INBOX ═══════════
window.renderDeptMembers=function(){
  var c=document.getElementById('mainDept-members');if(!c)return;
  var d=document.getElementById('dyn-dept-members');
  if(!d){d=document.createElement('div');d.id='dyn-dept-members';c.appendChild(d);}
  if(!deptMembersData.length){d.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-lighter)">No members yet.</div>';return;}
  var h='';deptMembersData.forEach(function(m){var p=m.profiles||{};
    h+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div class="official-avatar">'+ini(p.name)+'</div><div style="flex:1"><div style="font-weight:700">'+esc(p.name)+'</div><span class="dept-role-badge '+slug9(m.role)+'">'+esc(m.role)+'</span></div>'+(m.user_id&&m.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+m.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+'</div>';
  });
  d.innerHTML=h;
};
window.renderDeptLeaders=function(){
  var c=document.getElementById('mainDept-roles');if(!c)return;
  var d=document.getElementById('dyn-dept-leaders');
  if(!d){d=document.createElement('div');d.id='dyn-dept-leaders';c.appendChild(d);}
  var L=(deptMembersData||[]).filter(function(m){var r=String(m.role||'').toLowerCase();return r!=='member';});
  d.innerHTML=L.length?L.map(function(m){var p=m.profiles||{};
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div class="official-avatar" style="background:var(--gradient-warm)">'+ini(p.name)+'</div><div style="flex:1"><div style="font-weight:700">'+esc(p.name)+'</div></div><span class="dept-role-badge '+slug9(m.role)+'">'+esc(m.role)+'</span>'+(m.user_id&&m.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+m.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+'</div>';
  }).join(''):'<div style="text-align:center;padding:20px;color:var(--text-lighter)">No leaders yet.</div>';
};

// ═══════════ USHIRIKA DETAIL PAGE (full admin UI like departments) ═══════════
function ensureUshDetailPage(){
  if(document.getElementById('ush-detail-page'))return;
  var sec=document.getElementById('section-ushirika');if(!sec)return;
  var div=document.createElement('div');div.id='ush-detail-page';div.className='sub-page';
  div.innerHTML=
   '<button class="back-btn" onclick="closeUshForum()"><i class="fas fa-arrow-left"></i> Back</button>'+
   '<div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px"><div class="dept-icon" id="ushDetailIcon"><i class="fas fa-people-group"></i></div><div><div style="font-weight:800;font-size:1.2rem" id="ushDetailName">Ushirika</div><div id="ushDetailMeta" style="font-size:.8rem;opacity:.9"></div></div></div>'+
   '<div id="ushWeekMeet9"></div>'+
   '<div class="admin-panel" id="ushAdminControls9" style="display:none"><div class="admin-panel-title">Ushirika Controls (Leader/Admin)</div><div class="grid-2">'+
   '<button class="btn btn-warm btn-block btn-sm" onclick="openUshAddRole9()"><i class="fas fa-tags"></i> Add Role</button>'+
   '<button class="btn btn-warm btn-block btn-sm" onclick="openUshAdd9()"><i class="fas fa-user-plus"></i> Add Member</button>'+
   '<button class="btn btn-warm btn-block btn-sm" onclick="openUshRole9()"><i class="fas fa-tag"></i> Role</button>'+
   '<button class="btn btn-warm btn-block btn-sm" onclick="openUshRemove9()"><i class="fas fa-user-minus"></i> Remove</button></div></div>'+
   '<div class="tabs"><div class="tab active" onclick="switchUshDetailTab(this,\'feed\')">Feed</div><div class="tab" onclick="switchUshDetailTab(this,\'members\')">Members</div><div class="tab" onclick="switchUshDetailTab(this,\'leadership\')">Leadership</div></div>'+
   '<div id="ushd-feed"><div class="card"><div class="form-group"><textarea class="form-textarea" id="ushPostText" placeholder="Share with your ushirika..."></textarea></div>'+
   '<div class="media-upload" id="ushForumUpload" onclick="attachMediaTo(\'ushForum\')"><i class="fas fa-cloud-upload-alt"></i><span>Add media (optional)</span></div>'+
   '<button class="btn btn-primary btn-block" onclick="submitUshPost()"><i class="fas fa-paper-plane"></i> Post</button></div><div id="ushForumPosts"></div></div>'+
   '<div id="ushd-members" style="display:none"><div id="ushMembers9"></div></div>'+
   '<div id="ushd-leadership" style="display:none"><div id="ushLeaders9"></div></div>';
  sec.appendChild(div);
}
window.switchUshDetailTab=function(el,t){
  var tabs=el.parentElement.querySelectorAll('.tab');for(var i=0;i<tabs.length;i++)tabs[i].classList.remove('active');
  el.classList.add('active');
  ['feed','members','leadership'].forEach(function(x){var e=document.getElementById('ushd-'+x);if(e)e.style.display=(x===t)?'block':'none';});
};
window.closeUshForum=function(){activateSection('section-ushirika','ushirika-main','ushirika');};
window.openUshirikaForum=function(ushId){
  if(!user)return alert('Please log in first');
  var u=null;for(var i=0;i<ushirikasData.length;i++){if(ushirikasData[i].id===ushId){u=ushirikasData[i];break;}}
  if(!u)return alert('Ushirika not found');
  var proceed=function(){
    window._curUshForumId=ushId;
    ensureUshDetailPage();
    activateSection('section-ushirika','ush-detail-page','ushirika');
    var n=document.getElementById('ushDetailName');if(n)n.textContent=u.name;
    var meta=document.getElementById('ushDetailMeta');if(meta)meta.textContent=(window._ushCounts[ushId]||0)+' members • '+(u.location||'');
    var ac=document.getElementById('ushAdminControls9');if(ac)ac.style.display=(isUshLeaderOf(ushId))?'':'none';
    renderUshWeekMeet9(ushId);
    loadUshForumPosts(ushId);
    loadUshMembers9(ushId);
  };
  sb.from('ushirika_members').select('*').eq('user_id',user.id).eq('ushirika_id',ushId).limit(1).then(function(r){
    var member=r.data&&r.data.length>0;
    if(!member&&!isAdmin()){
      if(confirm('You are not a member of '+u.name+' yet. Join now?')){
        sb.from('ushirika_members').insert([{user_id:user.id,ushirika_id:ushId,role:'member'}]).then(function(ir){
          if(ir.error)return alert('⚠️ '+ir.error.message);
          alert('✅ Joined '+u.name+'!');
          loadMemberCounts9();if(typeof loadMyMemberships9==='function')loadMyMemberships9();
          proceed();
        });
      }
      return;
    }
    proceed();
  });
};
function renderUshWeekMeet9(ushId){
  var box=document.getElementById('ushWeekMeet9');if(!box)return;
  sb.from('weekly_meetings').select('*').eq('ushirika_id',ushId).order('created_at',{ascending:false}).limit(1).then(function(r){
    var m=r.data&&r.data[0];
    var html='<div class="card card-cool" style="margin-bottom:14px"><div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
    if(!m){html+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';}
    else{
      html+='<div style="font-size:.9rem;line-height:1.8">'+
        (m.meeting_date?'<div><b>📅 Date:</b> '+esc(m.meeting_date)+'</div>':'')+
        (m.start_time?'<div><b>🕐 Time:</b> '+esc(m.start_time)+(m.end_time?' – '+esc(m.end_time):'')+'</div>':'')+
        (m.venue?'<div><b>📍 Venue:</b> '+esc(m.venue)+'</div>':'')+
        (m.theme?'<div><b>🎯 Theme:</b> '+esc(m.theme)+'</div>':'')+
        mediaHTML(mediaOf(m))+'</div>';
    }
    if(isUshLeaderOf(ushId))html+='<button class="btn btn-warm btn-sm" style="margin-top:8px" onclick="openUshirikaMeetingEditor()"><i class="fas fa-edit"></i> Update</button>';
    html+='</div>';
    box.innerHTML=html;
  });
}
function loadUshMembers9(ushId){
  if(!sb)return;
  sb.from('ushirika_members').select('*, profiles(name,role)').eq('ushirika_id',ushId).then(function(r){
    window._ushMembers9=r.data||[];
    var box=document.getElementById('ushMembers9');if(!box)return;
    if(!window._ushMembers9.length){box.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-lighter)">No members yet.</div>';return;}
    box.innerHTML=window._ushMembers9.map(function(m){var p=m.profiles||{};
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div class="official-avatar">'+ini(p.name)+'</div><div style="flex:1"><div style="font-weight:700">'+esc(p.name)+'</div><span class="dept-role-badge '+slug9(m.role)+'">'+esc(m.role||'member')+'</span></div>'+(m.user_id&&m.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+m.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+'</div>';
    }).join('');
    var lb=document.getElementById('ushLeaders9');
    if(lb)renderUshLeaders9();
  });
}
function renderUshLeaders9(){
  var box=document.getElementById('ushLeaders9');if(!box)return;
  var officials=(officialsData||[]).filter(function(o){return o.ushirika_id===window._curUshForumId;});
  var leadMembers=(window._ushMembers9||[]).filter(function(m){return String(m.role||'').toLowerCase()!=='member';});
  var html='';
  officials.forEach(function(o){var p=o.profiles||{};
    html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div class="official-avatar" style="background:var(--gradient-warm)">'+ini(p.name)+'</div><div style="flex:1"><div class="official-name">'+esc(p.name)+'</div><div class="official-role">'+esc(o.title)+'</div></div>'+(o.user_id&&o.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+o.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+'</div>';
  });
  leadMembers.forEach(function(m){var p=m.profiles||{};
    html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div class="official-avatar" style="background:var(--gradient-warm)">'+ini(p.name)+'</div><div style="flex:1"><div style="font-weight:700">'+esc(p.name)+'</div></div><span class="dept-role-badge '+slug9(m.role)+'">'+esc(m.role)+'</span>'+(m.user_id&&m.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+m.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+'</div>';
  });
  box.innerHTML=html||'<div style="text-align:center;padding:20px;color:var(--text-lighter)">No leadership yet.</div>';
}
// Ushirika admin modals
function ensureUshModals9(){
  if(document.getElementById('ushAdd9Modal'))return;
  document.body.insertAdjacentHTML('beforeend',
  '<div class="modal-overlay" id="ushAdd9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
  '<div class="modal-handle"></div><div class="modal-title">👤 Add Ushirika Member <span class="admin-only">Leader/Admin</span></div>'+
  '<div class="user-picker" id="ushAdd9Picker"></div>'+
  '<div class="form-group"><label class="form-label">Role</label><select class="form-select" id="ushAdd9Role"><option>member</option><option>leader</option><option>chairman</option><option>secretary</option><option>treasurer</option></select></div>'+
  '<div class="form-group"><label class="form-label">Or type ANY role</label><input class="form-input" id="ushAdd9Custom" placeholder="Custom role"></div>'+
  '<button class="btn btn-warm btn-block" onclick="addUshMember9()">Add</button></div></div>'+
  '<div class="modal-overlay" id="ushRole9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
  '<div class="modal-handle"></div><div class="modal-title">🏷️ Assign Role to Member <span class="admin-only">Leader/Admin</span></div>'+
  '<div class="form-group"><label class="form-label">Member</label><select class="form-select" id="ushRole9Member"></select></div>'+
  '<div class="form-group"><label class="form-label">Role</label><select class="form-select" id="ushRole9Role"><option>member</option><option>leader</option><option>chairman</option><option>secretary</option><option>treasurer</option></select></div>'+
  '<div class="form-group"><label class="form-label">Or type ANY role</label><input class="form-input" id="ushRole9Custom" placeholder="Custom role"></div>'+
  '<button class="btn btn-warm btn-block" onclick="assignUshRole9()">Assign</button></div></div>'+
  '<div class="modal-overlay" id="ushRemove9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
  '<div class="modal-handle"></div><div class="modal-title">🚫 Remove Ushirika Member <span class="admin-only">Leader/Admin</span></div>'+
  '<div class="form-group"><label class="form-label">Member</label><select class="form-select" id="ushRemove9Member"></select></div>'+
  '<button class="btn btn-danger btn-block" onclick="removeUshMember9()">Remove</button></div></div>');
  addCustomOptions9(document.getElementById('ushAdd9Role'));
  addCustomOptions9(document.getElementById('ushRole9Role'));
}
window.openUshAdd9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  ensureUshModals9();
  fillRoleSelect9(document.getElementById('ushAdd9Role'),'ush:'+ushId);
  var pk=document.getElementById('ushAdd9Picker');
  pk.innerHTML=(usersData||[]).map(function(u){return '<div class="user-pick-item" onclick="selectUser(this)" data-user-id="'+u.id+'"><div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">'+ini(u.name)+'</div><div style="flex:1"><div style="font-weight:600">'+esc(u.name)+'</div></div></div>';}).join('');
  openModal('ushAdd9Modal');
};
window.addUshMember9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  var sel=document.querySelector('#ushAdd9Picker .user-pick-item.selected');
  if(!sel)return alert('Select user');
  sb.from('ushirika_members').select('id').eq('user_id',sel.dataset.userId).eq('ushirika_id',ushId).limit(1).then(function(chk){
    if(chk.data&&chk.data.length)return alert('⚠️ Already a member.');
    var role=getRole9('ushAdd9Role','ushAdd9Custom');
    sb.from('ushirika_members').insert([{user_id:sel.dataset.userId,ushirika_id:ushId,role:role}]).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Added as '+role+'!');closeModalDirect();
      loadUshMembers9(ushId);loadMemberCounts9();if(typeof loadMyMemberships9==='function')loadMyMemberships9();
    });
  });
};
window.openUshRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  ensureUshModals9();
  fillRoleSelect9(document.getElementById('ushRole9Role'),'ush:'+ushId);
  document.getElementById('ushRole9Member').innerHTML=(window._ushMembers9||[]).map(function(m){return '<option value="'+m.id+'">'+esc((m.profiles||{}).name||'Member')+' ('+esc(m.role||'member')+')</option>';}).join('');
  openModal('ushRole9Modal');
};
window.assignUshRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  var mid=document.getElementById('ushRole9Member').value;if(!mid)return alert('Pick a member');
  var role=getRole9('ushRole9Role','ushRole9Custom');
  sb.from('ushirika_members').update({role:role}).eq('id',mid).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role updated to '+role);closeModalDirect();
    loadUshMembers9(ushId);renderUshLeaders9();if(typeof loadMyMemberships9==='function')loadMyMemberships9();
  });
};
window.openUshRemove9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  ensureUshModals9();
  document.getElementById('ushRemove9Member').innerHTML=(window._ushMembers9||[]).map(function(m){return '<option value="'+m.id+'">'+esc((m.profiles||{}).name||'Member')+'</option>';}).join('');
  openModal('ushRemove9Modal');
};
window.removeUshMember9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  var mid=document.getElementById('ushRemove9Member').value;if(!mid)return alert('Pick a member');
  sb.from('ushirika_members').delete().eq('id',mid).then(function(){
    alert('✅ Removed');closeModalDirect();
    loadUshMembers9(ushId);loadMemberCounts9();if(typeof loadMyMemberships9==='function')loadMyMemberships9();
  });
};

// ═══════════ USHIRIKA FORUM POSTS ═══════════
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

// ═══════════ COMMENTS WITH MEDIA ═══════════
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

// ═══════════ DEPT JOIN / PENDING / FORUM ═══════════
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
  sb.from('department_members').select('id').eq('user_id',req.user_id).eq('department_id',req.target_id).limit(1).then(function(chk){
    if(chk.data&&chk.data.length){
      sb.from('pending_requests').update({status:'approved'}).eq('id',id).then(function(){alert('✅ Already a member — request closed.');loadPending();});
      return;
    }
    sb.from('pending_requests').update({status:'approved'}).eq('id',id).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      sb.from('department_members').insert([{user_id:req.user_id,department_id:req.target_id,role:'member'}]).then(function(ins){
        if(ins&&ins.error)return alert('⚠️ '+ins.error.message);
        sb.from('notifications').insert([{user_id:req.user_id,title:'Department Request Approved',body:'You joined '+(req.target_name||'the department')+' — open its forum now!'}]).then(function(){});
        alert('✅ Approved! Member added.');loadPending();loadMemberCounts9();loadMyDepts();
      });
    });
  });
};
window.declinePendingRequest=function(id){
  if(!sb||!isAdmin())return;
  if(!confirm('Decline this request?'))return;
  sb.from('pending_requests').update({status:'declined'}).eq('id',id).then(function(){alert('Declined');loadPending();});
};
window.openDeptForum=function(deptId){
  if(!user)return alert('Please log in first');
  var dept=null;for(var i=0;i<depts.length;i++){if(depts[i].id===deptId){dept=depts[i];break;}}
  if(!dept)return alert('Department not found');
  sb.from('department_members').select('user_id,department_id,role').eq('user_id',user.id).eq('department_id',deptId).limit(1).then(function(r){
    var isMember=(r.data&&r.data.length>0)||(window._myDepts||[]).some(function(m){return m.department_id===deptId;});
    if(!isMember&&!isAdmin()){
      if(confirm('You are not a member of '+dept.name+' yet. Send a request to join?')){
        sb.from('pending_requests').insert([{user_id:user.id,type:'join_department',target_id:deptId,target_name:dept.name,status:'pending'}]).then(function(rr){
          alert(rr.error?('⚠️ '+rr.error.message):'✅ Request sent! Awaiting admin approval.');
        });
      }
      return;
    }
    currentDeptId=deptId;
    var n=document.getElementById('mainDeptName');if(n)n.textContent=dept.name;
    var d=document.getElementById('mainDeptDesc');if(d)d.textContent=dept.description||'';
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
    loadDeptPosts(deptId);
    loadDeptMembers(deptId).then(function(){
      var m=document.getElementById('mainDeptMembers');if(m)m.textContent=(deptMembersData.length)+' members';
    });
  });
};
window._gcOpenDept=window.openDeptForum;
function bindDeptCards(){
  var cards=document.querySelectorAll('.dept-card');
  cards.forEach(function(card){
    if(card.dataset.bound9)return;card.dataset.bound9='1';
    var id=card.dataset.deptId;
    if(!id){var oc=card.getAttribute('onclick')||'';var mm=oc.match(/'([0-9a-fA-F-]{36})'/);if(mm)id=mm[1];}
    if(!id){var txt=card.textContent||'';var dd=depts.find(function(x){return txt.indexOf(x.name)>-1;});if(dd)id=dd.id;}
    if(id){card.dataset.deptId=id;card.style.cursor='pointer';card.onclick=function(ev){ev.preventDefault();ev.stopPropagation();openDeptForum(id);};}
  });
  updateCountLabels();
}

// ═══════════ MAIN + DEPT POSTS ═══════════
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

// ═══════════ MY USHIRIKAS + MY DEPARTMENTS (ushirika tab) ═══════════
window.loadMyMemberships9=function(){
  if(!user||!sb)return;
  sb.from('ushirika_members').select('*').eq('user_id',user.id).then(function(r){window._myUsh=r.data||[];renderMyUshirikas();});
  sb.from('department_members').select('user_id,department_id,role').eq('user_id',user.id).then(function(r){window._myDepts=r.data||[];renderMyDepts();renderMyDeptsHome();});
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
setInterval(function(){
  try{
    bindDeptCards();bindUshCards();ensureUshDetailPage();injectDeptTabMeetBtn();injectDeptAddRoleBtn();
    sweepMeetingButtons();enhanceRoleModals();
  }catch(e){console.warn('app10 guard:',e);}
},2000);
setInterval(function(){
  try{
    if(user){loadMyMemberships9();loadMemberCounts9();loadMyDepts();}
    if(isAdmin()&&typeof loadPending==='function')loadPending();
  }catch(e){}
},10000);
if(user){setTimeout(function(){loadMyMemberships9();loadMemberCounts9();loadMyDepts();},1500);}
var _origLoadAll=window.loadAll;
window.loadAll=function(){
  var p=_origLoadAll?_origLoadAll():Promise.resolve();
  setTimeout(function(){loadMyMemberships9();loadMemberCounts9();loadMyDepts();},1200);
  return p;
};
console.log('✝️ app10.js FINAL build active');

// ═══════════ app15-append: FINAL ushirika role assignment (self-contained, verified) ═══════════
(function(){
  window._ushRoleRows15=[];

  function fetchRows15(ushId,cb){
    sb.from('ushirika_members').select('*').eq('ushirika_id',ushId).then(function(r){
      var rows=r.data||[];
      var ids=rows.map(function(x){return x.user_id;}).filter(Boolean);
      if(!ids.length){window._ushRoleRows15=rows;cb(rows,{});return;}
      sb.from('profiles').select('id,name').in('id',ids).then(function(pr){
        var pm={};(pr.data||[]).forEach(function(p){pm[p.id]=p;});
        window._ushRoleRows15=rows;cb(rows,pm);
      });
    });
  }

  function ensureModal15(){
    if(document.getElementById('ushRole9Modal'))return;
    document.body.insertAdjacentHTML('beforeend',
    '<div class="modal-overlay" id="ushRole9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
    '<div class="modal-handle"></div><div class="modal-title">🏷️ Assign Role to Member <span class="admin-only">Leader/Admin</span></div>'+
    '<div class="form-group"><label class="form-label">Member</label><select class="form-select" id="ushRole9Member"></select></div>'+
    '<div class="form-group"><label class="form-label">Role</label><select class="form-select" id="ushRole9Role">'+
    '<option value="member">member</option><option value="leader">leader</option><option value="chairman">chairman</option>'+
    '<option value="secretary">secretary</option><option value="treasurer">treasurer</option></select></div>'+
    '<div class="form-group"><label class="form-label">Or type ANY role</label><input class="form-input" id="ushRole9Custom" placeholder="e.g. Sound Engineer"></div>'+
    '<button class="btn btn-warm btn-block" onclick="assignUshRole9()">Assign</button>'+
    '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
  }

  function fillRoles15(ushId){
    var sel=document.getElementById('ushRole9Role');if(!sel)return;
    var have={};for(var i=0;i<sel.options.length;i++)have[String(sel.options[i].value).toLowerCase()]=1;
    sb.from('titles').select('*').eq('category','ushirika').then(function(r){
      (r.data||[]).forEach(function(t){
        var nm=String(t.name||'');var role=null;
        if(nm.indexOf(ushId+'::')===0)role=nm.split('::').slice(1).join('::');
        else if(nm.indexOf('::')<0)role=nm;
        if(role&&!have[role.toLowerCase()]){var o=document.createElement('option');o.value=role;o.textContent=role;sel.appendChild(o);have[role.toLowerCase()]=1;}
      });
    });
  }

  window.openUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
    ensureModal15();
    fetchRows15(ushId,function(rows,pm){
      var sel=document.getElementById('ushRole9Member');
      if(!rows.length){sel.innerHTML='<option value="">No members yet</option>';}
      else sel.innerHTML=rows.map(function(m,i){
        return '<option value="'+i+'">'+esc((pm[m.user_id]||{}).name||'Member')+' ('+esc(m.role||'member')+')</option>';
      }).join('');
      fillRoles15(ushId);
      var c=document.getElementById('ushRole9Custom');if(c)c.value='';
      openModal('ushRole9Modal');
    });
  };

  window.assignUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
    var sel=document.getElementById('ushRole9Member');
    var row=window._ushRoleRows15[parseInt(sel.value,10)];
    if(!row||!row.id)return alert('Pick a member');
    var custom=(document.getElementById('ushRole9Custom')||{value:''}).value.trim();
    var role=custom||document.getElementById('ushRole9Role').value;
    if(!role)return alert('Pick or type a role');

    sb.from('ushirika_members').update({role:role}).eq('id',row.id).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      // VERIFY from DB so we never show a fake success again
      sb.from('ushirika_members').select('role').eq('id',row.id).single().then(function(v){
        if(v.error)return alert('⚠️ '+v.error.message);
        if(String(v.data.role)!==String(role))return alert('⚠️ Database still says "'+v.data.role+'". Update was blocked server-side.');
        // update local caches so badges/leadership change instantly
        (window._ushMembers9||[]).forEach(function(m){if(m.id===row.id)m.role=role;});
        (window._ushRoleRows15||[]).forEach(function(m){if(m.id===row.id)m.role=role;});
        (window._myUsh||[]).forEach(function(m){if(m.ushirika_id===ushId&&m.user_id===row.user_id)m.role=role;});
        alert('✅ Role updated to '+role);
        closeModalDirect();
        if(typeof loadUshMembers9==='function')loadUshMembers9(ushId);
        if(typeof renderUshLeaders9==='function')renderUshLeaders9();
        if(typeof loadMyMemberships9==='function')loadMyMemberships9();
        setTimeout(function(){if(typeof loadUshMembers9==='function')loadUshMembers9(ushId);},1200);
      });
    });
  };

  // role-based ushirika leaders (e.g. "Ushirika Leader") can edit weekly meetings
  var _isl15=window.isUshLeaderOf;
  window.isUshLeaderOf=function(id){
    try{if(_isl15&&_isl15(id))return true;}catch(e){}
    var lists=(window._myUsh||[]).concat(window._ushMembers9||[]);
    for(var i=0;i<lists.length;i++){
      var m=lists[i];
      if(m&&m.ushirika_id===id&&String(m.role||'').toLowerCase().indexOf('leader')>-1)return true;
    }
    return false;
  };
  var _lau15=window.leadsAnyUsh;
  window.leadsAnyUsh=function(){
    try{if(_lau15&&_lau15())return true;}catch(e){}
    var l=window._myUsh||[];
    for(var i=0;i<l.length;i++){if(String(l[i].role||'').toLowerCase().indexOf('leader')>-1)return true;}
    return false;
  };
})();
console.log('✝️ app15-append active (ushirika role assignment final)');


// ═══════════ app16-append: role assign bypass + non-flickering dept widget ═══════════
(function(){

  // ── ROLE ASSIGN: UPDATE → verify → fallback DELETE+INSERT → verify ──
  window.assignUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
    var sel=document.getElementById('ushRole9Member');
    var row=(window._ushRoleRows15||[])[parseInt(sel.value,10)];
    if(!row||!row.id)return alert('Pick a member');
    var custom=(document.getElementById('ushRole9Custom')||{value:''}).value.trim();
    var role=custom||document.getElementById('ushRole9Role').value;
    if(!role)return alert('Pick or type a role');

    function caches(){
      (window._ushMembers9||[]).forEach(function(m){if(m.id===row.id||m.user_id===row.user_id)m.role=role;});
      (window._ushRoleRows15||[]).forEach(function(m){if(m.id===row.id)m.role=role;});
      (window._myUsh||[]).forEach(function(m){if(m.ushirika_id===ushId&&m.user_id===row.user_id)m.role=role;});
    }
    function refresh(){
      if(typeof loadUshMembers9==='function')loadUshMembers9(ushId);
      if(typeof renderUshLeaders9==='function')renderUshLeaders9();
      if(typeof loadMyMemberships9==='function')loadMyMemberships9();
    }
    function done(ok,msg){
      if(ok){caches();alert('✅ Role updated to '+role);closeModalDirect();refresh();setTimeout(refresh,1000);}
      else alert(msg||'⚠️ Role change was blocked by the server. Run the Supabase security SQL or check table policies.');
    }
    function verifyById(cb){
      sb.from('ushirika_members').select('role').eq('id',row.id).limit(1).then(function(v){
        cb(v.data&&v.data.length&&String(v.data[0].role)===String(role));
      });
    }

    // 1) normal UPDATE
    sb.from('ushirika_members').update({role:role}).eq('id',row.id).then(function(r){
      if(r.error)return done(false,'⚠️ '+r.error.message);
      verifyById(function(ok){
        if(ok)return done(true);
        // 2) bypass: DELETE + INSERT with new role
        sb.from('ushirika_members').delete().eq('id',row.id).then(function(dr){
          if(dr.error)return done(false,'⚠️ '+dr.error.message);
          sb.from('ushirika_members').insert([{user_id:row.user_id,ushirika_id:row.ushirika_id,role:role}]).then(function(ir){
            if(ir.error)return done(false,'⚠️ '+ir.error.message);
            sb.from('ushirika_members').select('role').eq('user_id',row.user_id).eq('ushirika_id',row.ushirika_id).limit(1).then(function(vr){
              done(vr.data&&vr.data.length&&String(vr.data[0].role)===String(role));
            });
          });
        });
      });
    });
  };

  // ── NON-FLICKERING weekly-meeting widget (change-detection) ──
  function buildMeetHTML16(m,canEdit,delFn){
    var h='<div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
    if(!m){h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';}
    else{
      h+='<div style="font-size:.9rem;line-height:1.8">'+
        (m.meeting_date?'<div><b>📅 Date:</b> '+esc(m.meeting_date)+'</div>':'')+
        (m.start_time?'<div><b>🕐 Time:</b> '+esc(m.start_time)+(m.end_time?' – '+esc(m.end_time):'')+'</div>':'')+
        (m.venue?'<div><b>📍 Venue:</b> '+esc(m.venue)+'</div>':'')+
        (m.theme?'<div><b>🎯 Theme:</b> '+esc(m.theme)+'</div>':'')+
        mediaHTML(mediaOf(m))+'</div>';
    }
    if(canEdit){
      h+='<div style="display:flex;gap:8px;margin-top:10px">'+
        '<button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\''+(window.currentDeptId||'')+'\')"><i class="fas fa-edit"></i> Update</button>'+
        (m?'<button class="btn btn-danger btn-sm" onclick="'+delFn+'(\''+m.id+'\',\''+(window.currentDeptId||'')+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+
        '</div>';
    }
    return h;
  }

  // redeclare BOTH possible names so any interval/wrapper uses the calm version
  function calmRender(deptId,boxId,delFn){
    deptId=deptId||window.currentDeptId;
    if(!sb||!deptId)return;
    var box=document.getElementById(boxId);if(!box)return;
    sb.from('weekly_meetings').select('*').eq('department_id',deptId).order('created_at',{ascending:false}).limit(1).then(function(r){
      var m=r.data&&r.data[0]||null;
      var canEdit=false;try{canEdit=typeof isDeptLeader9==='function'&&isDeptLeader9(deptId);}catch(e){}
      var sig=JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,canEdit]);
      if(box.dataset.sig16===sig)return;           // ← no change, no redraw, no flicker
      box.dataset.sig16=sig;
      if(m)window._curMeetingId=m.id;
      box.innerHTML='<div class="card card-cool" style="margin-bottom:14px">'+buildMeetHTML16(m,canEdit,delFn)+'</div>';
    });
  }
  window.renderDeptWeekMeet14=function(deptId){calmRender(deptId,'deptWeekMeet14','deleteDeptMeeting14');};
  window.refreshDeptMeetingWidget13=function(){calmRender(window.currentDeptId,'deptWeekMeet14','deleteDeptMeeting14');};

  // ensure the calm widget box exists on the dept page (once)
  var _odf16=window.openDeptForum;
  window.openDeptForum=function(deptId){
    var r=_odf16?_odf16.apply(this,arguments):undefined;
    setTimeout(function(){
      var host=document.getElementById('home-mainDept');if(!host)return;
      var box=document.getElementById('deptWeekMeet14');
      if(!box){box=document.createElement('div');box.id='deptWeekMeet14';host.insertBefore(box,host.firstChild.nextSibling||host.firstChild);}
      calmRender(deptId,'deptWeekMeet14','deleteDeptMeeting14');
    },800);
    return r;
  };
  var _sdm16=window.saveDeptMeeting9;
  window.saveDeptMeeting9=function(){
    var deptId=(document.getElementById('dm9Pick')||{value:null}).value||window.currentDeptId;
    var r=_sdm16?_sdm16.apply(this,arguments):undefined;
    setTimeout(function(){var b=document.getElementById('deptWeekMeet14');if(b)b.dataset.sig16='';calmRender(deptId,'deptWeekMeet14','deleteDeptMeeting14');},1000);
    return r;
  };
  var _um16=window.updateMeeting;
  window.updateMeeting=function(){
    var r=_um16?_um16.apply(this,arguments):undefined;
    setTimeout(function(){var b=document.getElementById('deptWeekMeet14');if(b)b.dataset.sig16='';calmRender(window.currentDeptId,'deptWeekMeet14','deleteDeptMeeting14');},1000);
    return r;
  };
})();
console.log('✝️ app16-append active (role bypass + calm dept widget)');


// ═══════════ app17-append: BULLETPROOF role assign (delete+insert) + calm dept widget ═══════════
(function(){
  window._ushRoleRows17=[];

  function rows17(ushId,cb){
    sb.from('ushirika_members').select('*').eq('ushirika_id',ushId).then(function(r){
      var rows=r.data||[];window._ushRoleRows17=rows;
      var ids=rows.map(function(x){return x.user_id;}).filter(Boolean);
      if(!ids.length)return cb(rows,{});
      sb.from('profiles').select('id,name').in('id',ids).then(function(pr){
        var pm={};(pr.data||[]).forEach(function(p){pm[p.id]=p;});cb(rows,pm);
      });
    });
  }

  function ensureModal17(){
    if(document.getElementById('ushRole9Modal'))return;
    document.body.insertAdjacentHTML('beforeend',
    '<div class="modal-overlay" id="ushRole9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
    '<div class="modal-handle"></div><div class="modal-title">🏷️ Assign Role to Member <span class="admin-only">Leader/Admin</span></div>'+
    '<div class="form-group"><label class="form-label">Member</label><select class="form-select" id="ushRole9Member"></select></div>'+
    '<div class="form-group"><label class="form-label">Role</label><select class="form-select" id="ushRole9Role">'+
    '<option value="member">member</option><option value="leader">leader</option><option value="chairman">chairman</option>'+
    '<option value="secretary">secretary</option><option value="treasurer">treasurer</option></select></div>'+
    '<div class="form-group"><label class="form-label">Or type ANY role</label><input class="form-input" id="ushRole9Custom" placeholder="e.g. Sound Engineer"></div>'+
    '<button class="btn btn-warm btn-block" onclick="assignUshRole9()">Assign</button>'+
    '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
  }

  window.openUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
    ensureModal17();
    rows17(ushId,function(rows,pm){
      var sel=document.getElementById('ushRole9Member');
      sel.innerHTML=rows.length?rows.map(function(m,i){
        return '<option value="'+i+'">'+esc((pm[m.user_id]||{}).name||'Member')+' ('+esc(m.role||'member')+')</option>';
      }).join(''):'<option value="">No members yet</option>';
      var c=document.getElementById('ushRole9Custom');if(c)c.value='';
      openModal('ushRole9Modal');
    });
  };

  // NO UPDATE ANYMORE: delete pair rows, insert single row with new role, verify.
  window.assignUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
    var sel=document.getElementById('ushRole9Member');
    var row=window._ushRoleRows17[parseInt(sel.value,10)];
    if(!row)return alert('Pick a member');
    var custom=(document.getElementById('ushRole9Custom')||{value:''}).value.trim();
    var role=custom||document.getElementById('ushRole9Role').value;
    if(!role)return alert('Pick or type a role');
    var uid=row.user_id;

    function refresh(){
      if(typeof loadUshMembers9==='function')loadUshMembers9(ushId);
      if(typeof renderUshLeaders9==='function')renderUshLeaders9();
      if(typeof loadMyMemberships9==='function')loadMyMemberships9();
    }

    sb.from('ushirika_members').delete().eq('user_id',uid).eq('ushirika_id',ushId).then(function(dr){
      if(dr.error)return alert('⚠️ Delete failed: '+dr.error.message);
      sb.from('ushirika_members').insert([{user_id:uid,ushirika_id:ushId,role:role}]).then(function(ir){
        if(ir.error)return alert('⚠️ Insert failed: '+ir.error.message);
        sb.from('ushirika_members').select('role').eq('user_id',uid).eq('ushirika_id',ushId).then(function(vr){
          var rows=vr.data||[];
          if(rows.length===1&&String(rows[0].role)===String(role)){
            (window._ushMembers9||[]).forEach(function(m){if(m.user_id===uid)m.role=role;});
            (window._ushRoleRows17||[]).forEach(function(m){if(m.user_id===uid)m.role=role;});
            (window._myUsh||[]).forEach(function(m){if(m.ushirika_id===ushId&&m.user_id===uid)m.role=role;});
            alert('✅ Role updated to '+role);
            closeModalDirect();refresh();setTimeout(refresh,1000);
          }else{
            alert('⚠️ Verification found '+rows.length+' row(s): '+(rows.map(function(x){return x.role;}).join(', ')||'none'));
          }
        });
      });
    });
  };

  // role-based ushirika leaders can edit meetings
  var _isl17=window.isUshLeaderOf;
  window.isUshLeaderOf=function(id){
    try{if(_isl17&&_isl17(id))return true;}catch(e){}
    var lists=(window._myUsh||[]).concat(window._ushMembers9||[],window._ushRoleRows17||[]);
    for(var i=0;i<lists.length;i++){var m=lists[i];if(m&&m.ushirika_id===id&&String(m.role||'').toLowerCase().indexOf('leader')>-1)return true;}
    return false;
  };
  var _lau17=window.leadsAnyUsh;
  window.leadsAnyUsh=function(){
    try{if(_lau17&&_lau17())return true;}catch(e){}
    var l=window._myUsh||[];
    for(var i=0;i<l.length;i++){if(String(l[i].role||'').toLowerCase().indexOf('leader')>-1)return true;}
    return false;
  };

  // ── CALM department weekly-meeting widget (redraw ONLY on change) ──
  function calmRender17(deptId){
    deptId=deptId||window.currentDeptId;
    if(!sb||!deptId)return;
    var host=document.getElementById('home-mainDept');if(!host)return;
    var box=document.getElementById('deptWeekMeet17');
    if(!box){box=document.createElement('div');box.id='deptWeekMeet17';host.insertBefore(box,host.firstChild.nextSibling||host.firstChild);}
    sb.from('weekly_meetings').select('*').eq('department_id',deptId).order('created_at',{ascending:false}).limit(1).then(function(r){
      var m=(r.data&&r.data[0])||null;
      var canEdit=false;try{canEdit=typeof isDeptLeader9==='function'&&isDeptLeader9(deptId);}catch(e){}
      var sig=JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,canEdit]);
      if(box.dataset.sig17===sig)return;              // ← unchanged → do nothing → no flicker
      box.dataset.sig17=sig;
      if(m)window._curMeetingId=m.id;
      var h='<div class="card card-cool" style="margin-bottom:14px"><div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
      if(!m){h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';}
      else{
        h+='<div style="font-size:.9rem;line-height:1.8">'+
          (m.meeting_date?'<div><b>📅 Date:</b> '+esc(m.meeting_date)+'</div>':'')+
          (m.start_time?'<div><b>🕐 Time:</b> '+esc(m.start_time)+(m.end_time?' – '+esc(m.end_time):'')+'</div>':'')+
          (m.venue?'<div><b>📍 Venue:</b> '+esc(m.venue)+'</div>':'')+
          (m.theme?'<div><b>🎯 Theme:</b> '+esc(m.theme)+'</div>':'')+
          mediaHTML(mediaOf(m))+'</div>';
      }
      if(canEdit){
        h+='<div style="display:flex;gap:8px;margin-top:10px">'+
          '<button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\''+deptId+'\')"><i class="fas fa-edit"></i> Update</button>'+
          (m?'<button class="btn btn-danger btn-sm" onclick="deleteDeptMeeting17(\''+m.id+'\',\''+deptId+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+
          '</div>';
      }
      h+='</div>';
      box.innerHTML=h;
      // hide any older flickering widgets
      var olds=host.querySelectorAll('#deptWeekMeet14,#ushWeekMeet9');
      for(var i=0;i<olds.length;i++){if(olds[i].id!=='deptWeekMeet17')olds[i].style.display='none';}
      var cards=host.querySelectorAll('.card');
      for(var j=0;j<cards.length;j++){var t=cards[j].textContent||'';if(/This Week'?s Meeting/i.test(t)&&!box.contains(cards[j]))cards[j].style.display='none';}
    });
  }
  window.deleteDeptMeeting17=function(mid,deptId){
    deptId=deptId||window.currentDeptId;
    if(!mid||!deptId)return alert('No meeting');
    if(!(typeof isDeptLeader9==='function'&&isDeptLeader9(deptId)))return alert('🚫 Leader/admin only.');
    if(!confirm('Delete this meeting?'))return;
    sb.from('weekly_meetings').delete().eq('id',mid).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Deleted');window._curMeetingId=null;
      var b=document.getElementById('deptWeekMeet17');if(b)b.dataset.sig17='';
      calmRender17(deptId);
    });
  };
  var _odf17=window.openDeptForum;
  window.openDeptForum=function(id){
    var r=_odf17?_odf17.apply(this,arguments):undefined;
    setTimeout(function(){calmRender17(id);},800);
    return r;
  };
  var _sdm17=window.saveDeptMeeting9;
  window.saveDeptMeeting9=function(){
    var deptId=(document.getElementById('dm9Pick')||{value:null}).value||window.currentDeptId;
    var r=_sdm17?_sdm17.apply(this,arguments):undefined;
    setTimeout(function(){var b=document.getElementById('deptWeekMeet17');if(b)b.dataset.sig17='';calmRender17(deptId);},1000);
    return r;
  };
  var _um17=window.updateMeeting;
  window.updateMeeting=function(){
    var r=_um17?_um17.apply(this,arguments):undefined;
    setTimeout(function(){var b=document.getElementById('deptWeekMeet17');if(b)b.dataset.sig17='';calmRender17(window.currentDeptId);},1000);
    return r;
  };
  setInterval(function(){try{
    var host=document.getElementById('home-mainDept');
    if(host&&host.classList.contains('active'))calmRender17(window.currentDeptId);
  }catch(e){}},5000);
})();
console.log('✝️ app17-append active (delete+insert roles + calm dept widget)');
