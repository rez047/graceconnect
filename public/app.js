// ═══════════════════════════════════════════════════════════════
// app.js — Real Supabase Read/Write Layer for GraceConnect
// Your index.html stays UNTOUCHED. This file layers on top.
// ═══════════════════════════════════════════════════════════════
(function(){
"use strict";

// ─── STATE ───
var user=null, profile=null;
var depts=[], ushirikasData=[], titlesData=[], usersData=[];
var forumPostsData=[], deptPostsData=[], deptMembersData=[];
var eventsData=[], causesData=[], officialsData=[], plansData=[];
var pendingData=[], notifsData=[], messagesData=[];
var currentDeptId=null, currentChatUserId=null, chatSub=null;

// ─── HELPERS ───
function esc(s){return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function ini(n){if(!n)return'?';return n.split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2).toUpperCase();}
function ago(ts){if(!ts)return'';var s=(Date.now()-new Date(ts).getTime())/1000;if(s<60)return'just now';if(s<3600)return Math.floor(s/60)+'m ago';if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago';}
function fdate(ts){return ts?new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';}
function ftime(ts){return ts?new Date(ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'';}
function isAdmin(){return profile&&(profile.role==='admin'||profile.role==='superadmin');}
function toast(m){alert(m);} // uses native alert like original file

// ─── get inputs from a modal by position ───
function modalInputs(id){
  var m=document.getElementById(id);if(!m)return null;
  return{el:m,inputs:m.querySelectorAll('.form-input'),textareas:m.querySelectorAll('.form-textarea'),selects:m.querySelectorAll('.form-select'),btn:m.querySelector('.btn-block:last-of-type')};
}

// ─── DYNAMIC CONTAINERS ───
// We inject a <div> inside existing sections to hold real data
// Static demo content gets hidden
function dynContainer(parentId, dynId){
  var p=document.getElementById(parentId);if(!p)return null;
  var d=document.getElementById(dynId);
  if(!d){d=document.createElement('div');d.id=dynId;p.appendChild(d);}
  return d;
}
function hideStatic(parentId, selector){
  var p=document.getElementById(parentId);if(!p)return;
  p.querySelectorAll(selector).forEach(function(el){el.style.display='none';});
}

// ═══════════════════════════════
//  LOADERS (read from Supabase)
// ═══════════════════════════════

function loadAll(){
  return Promise.all([
    loadDepts(),loadUshirikas(),loadTitles(),loadUsers(),
    loadForumPosts(),loadEvents(),loadCauses(),
    loadOfficials(),loadPlans(),loadPending(),loadNotifs()
  ]).then(function(){
    loadMyDepts();
    loadChatInbox();
  }).catch(function(e){console.log('loadAll error:',e);});
}

function loadPublicData(){
  return Promise.all([loadDepts(),loadUshirikas(),loadEvents(),loadCauses()]).catch(function(){});
}

// ── DEPARTMENTS ──
function loadDepts(){
  return sb.from('departments').select('*').order('name').then(function(r){
    depts=r.data||[];renderDepts();renderDeptPicker();
  });
}

function renderDepts(){
  var c=dynContainer('ushirika-departments','dyn-depts');if(!c)return;
  hideStatic('ushirika-departments','.dept-card');
  if(!depts.length){c.innerHTML='<div style="text-align:center;padding:30px;color:#94A3B8"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>No departments yet. Admins can create one above.</div>';return;}
  var banners=['','alt1','alt2','alt3','alt4'];
  var h='<div class="section-title" style="font-size:1.05rem">🏛️ All Church Departments</div>';
  depts.forEach(function(d,i){
    var bc=d.color_theme||banners[i%5];
    h+='<div class="dept-card" onclick="window._gcOpenDept(\''+d.id+'\')">'
      +'<div class="dept-banner '+bc+'">'
      +'<div class="dept-icon"><i class="fas '+(d.icon||'fa-users')+'"></i></div>'
      +'<div><div class="dept-name">'+esc(d.name)+'</div>'
      +'<div class="dept-desc">'+esc(d.description||'')+'</div></div></div>'
      +'<div class="dept-body"><div class="dept-stats">'
      +'<span><i class="fas fa-users"></i> '+(d.member_count||0)+' members</span>'
      +'</div></div></div>';
  });
  c.innerHTML=h;
}

function renderDeptPicker(){
  // Update the dept picker modal with real departments
  var picker=document.querySelector('#deptPickerModal .user-picker');
  if(!picker||!depts.length)return;
  var h='';
  depts.forEach(function(d){
    h+='<div class="user-pick-item" onclick="selectUser(this);this.dataset.deptId=\''+d.id+'\'">'
      +'<div class="post-avatar dept" style="width:36px;height:36px;font-size:0.85rem"><i class="fas '+(d.icon||'fa-users')+'"></i></div>'
      +'<div style="flex:1"><div style="font-weight:600;font-size:0.85rem">'+esc(d.name)+'</div>'
      +'<div style="font-size:0.68rem;color:var(--text-light)">'+(d.member_count||0)+' members</div></div></div>';
  });
  picker.innerHTML=h;
}

// ── MY DEPARTMENTS ──
function loadMyDepts(){
  if(!user)return;
  sb.from('department_members').select('role, departments(*)').eq('user_id',user.id).then(function(r){
    renderMyDepts(r.data||[]);
  });
}

function renderMyDepts(md){
  var scroll=document.querySelector('.my-depts-scroll');if(!scroll)return;
  var count=document.querySelector('.my-depts-count');
  // Hide existing static minis
  scroll.querySelectorAll('.my-dept-mini').forEach(function(el){el.style.display='none';});
  
  var h='';
  var alts=['','alt1','alt2','alt3','alt4'];
  md.forEach(function(m,i){
    var d=m.departments||{};
    h+='<div class="my-dept-mini '+((d.color_theme)||alts[i%5])+'" onclick="window._gcOpenDept(\''+d.id+'\')" style="display:flex!important;flex-direction:column">'
      +'<div class="my-dept-mini-icon"><i class="fas '+(d.icon||'fa-users')+'"></i></div>'
      +'<div class="my-dept-mini-name">'+esc(d.name||'Dept')+'</div>'
      +'<div class="my-dept-mini-role"><span class="my-dept-mini-role-badge">'+esc(m.role||'member')+'</span></div>'
      +'</div>';
  });
  // Keep the "Join Another" card
  var joinCard=scroll.querySelector('.my-dept-join-more');
  // Insert before joinCard
  if(joinCard){
    joinCard.insertAdjacentHTML('beforebegin',h);
  }else{
    scroll.insertAdjacentHTML('beforeend',h);
  }
  if(count)count.textContent=(md.length)+' serving';
  
  // Update profile modal departments
  var profileChips=document.querySelector('#profileModal .chip-dept');
  if(profileChips){
    var pc=profileChips.parentElement;
    pc.innerHTML=md.map(function(m){var d=m.departments||{};return '<span class="chip chip-dept"><i class="fas '+(d.icon||'fa-users')+'"></i> '+esc(d.name)+'</span>';}).join('');
  }
}

// ── USHIRIKAS ──
function loadUshirikas(){
  return sb.from('ushirikas').select('*').order('name').then(function(r){
    ushirikasData=r.data||[];renderUshirikas();renderUshirikaSelect();
  });
}

function renderUshirikas(){
  var c=dynContainer('ushirika-groups','dyn-ushirikas');if(!c)return;
  hideStatic('ushirika-groups','.ushirika-card');
  if(!ushirikasData.length){c.innerHTML='<div style="text-align:center;padding:20px;color:#94A3B8">No ushirikas yet.</div>';return;}
  var h='';
  ushirikasData.forEach(function(u){
    h+='<div class="ushirika-card">'
      +'<div class="ushirika-icon"><i class="fas fa-church"></i></div>'
      +'<div class="ushirika-info"><div class="ushirika-name">'+esc(u.name)+'</div>'
      +'<div class="ushirika-detail">📍 '+esc(u.location||'N/A')+' • '+esc(u.meeting_day||'')+'</div>'
      +'<div class="ushirika-members">👥 '+esc(u.venue||'')+'</div></div></div>';
  });
  c.innerHTML=h;
}

function renderUshirikaSelect(){
  var sel=document.getElementById('ob-ushirika');if(!sel)return;
  var h='<option value="">-- Select Ushirika --</option>';
  ushirikasData.forEach(function(u){
    h+='<option value="'+u.id+'">'+esc(u.name)+'</option>';
  });
  sel.innerHTML=h;
}

// ── TITLES ──
function loadTitles(){
  return sb.from('titles').select('*').order('name').then(function(r){
    titlesData=r.data||[];renderTitles();
  });
}

function renderTitles(){
  var list=document.getElementById('titleList');if(!list)return;
  // Remove existing static items
  list.querySelectorAll('.title-item').forEach(function(el){el.remove();});
  if(!titlesData.length)return;
  var h='';
  titlesData.forEach(function(t){
    h+='<div class="title-item">'
      +'<div class="title-item-icon"><i class="fas fa-tag"></i></div>'
      +'<div class="title-item-name">'+esc(t.name)+'</div>'
      +'<span class="chip chip-purple">'+esc(t.category||'')+'</span>'
      +'<button class="title-item-delete" onclick="window._gcDeleteTitle(\''+t.id+'\')"><i class="fas fa-times"></i></button>'
      +'</div>';
  });
  list.insertAdjacentHTML('beforeend',h);
}

// ── USERS ──
function loadUsers(){
  return sb.from('profiles').select('id,name,role,email,phone').order('name').then(function(r){
    usersData=r.data||[];renderUserPickers();renderLeaders();
  });
}

function renderUserPickers(){
  // Update all user pickers in modals with real users
  var pickers=['#addOfficialModal .user-picker','#addLeaderModal .user-picker','#addDeptMemberModal .user-picker','#newChatModal .user-picker'];
  pickers.forEach(function(sel){
    var p=document.querySelector(sel);if(!p)return;
    var h='';
    usersData.forEach(function(u){
      if(user&&u.id===user.id)return;
      h+='<div class="user-pick-item" onclick="selectUser(this);this.dataset.userId=\''+u.id+'\'">'
        +'<div class="post-avatar" style="width:32px;height:32px;font-size:0.7rem">'+ini(u.name)+'</div>'
        +'<div style="flex:1"><div style="font-weight:600;font-size:0.82rem">'+esc(u.name)+'</div>'
        +'<div style="font-size:0.68rem;color:var(--text-light)">'+esc(u.role||'member')+'</div></div></div>';
    });
    p.innerHTML=h||'<div style="text-align:center;padding:15px;color:#94A3B8">No other members yet.</div>';
  });
  
  // Update official assign-to dropdown
  var ot=document.querySelector('#addOfficialModal .form-select');
  if(ot&&(ushirikasData.length||depts.length)){
    // Find the second select (assign to)
    var sels=document.querySelectorAll('#addOfficialModal .form-select');
    if(sels.length>=2){
      var h='<optgroup label="Ushirikas">';
      ushirikasData.forEach(function(u){h+='<option value="ush_'+u.id+'">'+esc(u.name)+'</option>';});
      h+='</optgroup><optgroup label="Departments">';
      depts.forEach(function(d){h+='<option value="dept_'+d.id+'">'+esc(d.name)+'</option>';});
      h+='</optgroup>';
      sels[1].innerHTML=h;
    }
    // Third select = title
    if(sels.length>=3&&titlesData.length){
      var th='';titlesData.forEach(function(t){th+='<option>'+esc(t.name)+'</option>';});
      sels[2].innerHTML=th;
    }
  }
}

function renderLeaders(){
  // Replace the static leaders in discover section
  var discMain=document.getElementById('discover-main');if(!discMain)return;
  var c=dynContainer('discover-main','dyn-leaders');if(!c)return;
  // Hide static official-cards
  discMain.querySelectorAll('.official-card').forEach(function(el){el.style.display='none';});
  
  var leaders=usersData.filter(function(u){return u.role==='admin'||u.role==='superadmin';});
  if(!leaders.length){c.innerHTML='<div style="text-align:center;padding:20px;color:#94A3B8">No leaders added yet.</div>';return;}
  var h='';
  leaders.forEach(function(u){
    h+='<div class="official-card">'
      +'<div class="official-avatar">'+ini(u.name)+'</div>'
      +'<div style="flex:1"><div class="official-name">'+esc(u.name)+'</div>'
      +'<div class="official-role">'+esc(u.role)+'</div>'
      +'<div class="official-contact">📞 '+esc(u.phone||'N/A')+'</div></div>'
      +'<button class="btn btn-sm btn-chat" onclick="window._gcOpenChat(\''+u.id+'\')"><i class="fas fa-comment"></i></button>'
      +'</div>';
  });
  c.innerHTML='<div class="section-title" style="font-size:1.05rem">👨‍ Servants of God</div>'+h;
}

// ── FORUM POSTS ──
function loadForumPosts(){
  return sb.from('posts').select('*, profiles(name,role)').is('department_id',null).is('ushirika_id',null).order('created_at',{ascending:false}).limit(50).then(function(r){
    forumPostsData=r.data||[];renderForumPosts();
  });
}

function renderForumPosts(){
  var c=dynContainer('ushirika-forum','dyn-forum');if(!c)return;
  hideStatic('ushirika-forum','.post,.card:not(:first-child)');
  if(!forumPostsData.length){c.innerHTML='<div style="text-align:center;padding:30px;color:#94A3B8"><i class="fas fa-comments" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>No posts yet. Be the first!</div>';return;}
  c.innerHTML=forumPostsData.map(function(p){return postHTML(p,false);}).join('');
}

function postHTML(p,isDept){
  var pr=p.profiles||{};
  var mine=user&&p.author_id===user.id;
  var liked=user&&p.liked_by&&p.liked_by.indexOf(user.id)>-1;
  var canDel=mine||isAdmin();
  return '<div class="post">'
    +'<div class="post-header">'
    +'<div class="post-avatar'+(pr.role==='admin'?' admin':'')+'">'+ini(pr.name)+'</div>'
    +'<div><div class="post-name">'+esc(pr.name||'Unknown')+'</div>'
    +'<div class="post-role">'+((pr.role==='admin'||pr.role==='superadmin')?'🟢 '+pr.role:'Member')+'</div></div>'
    +'<div class="post-time">'+ago(p.created_at)+'</div>'
    +(canDel?'<button class="post-delete" onclick="window._gcDeletePost(\''+p.id+'\','+isDept+')"><i class="fas fa-trash"></i></button>':'')
    +'</div>'
    +'<div class="post-body">'+esc(p.content||'')+'</div>'
    +(p.media_urls&&p.media_urls.length?'<div class="post-media"><img src="'+p.media_urls[0]+'" style="max-width:100%;border-radius:8px"></div>':'')
    +'<div class="post-actions">'
    +'<button class="post-action'+(liked?' liked':'')+'" onclick="window._gcLike(\''+p.id+'\','+isDept+')"><i class="fas fa-heart"></i> '+(p.likes||0)+'</button>'
    +'</div></div>';
}

// ── DEPT POSTS & MEMBERS ──
function loadDeptPosts(id){
  return sb.from('posts').select('*, profiles(name,role)').eq('department_id',id).order('created_at',{ascending:false}).then(function(r){
    deptPostsData=r.data||[];renderDeptPosts();
  });
}

function renderDeptPosts(){
  var c=document.getElementById('mainDept-feed');if(!c)return;
  var dynDiv=dynContainer('mainDept-feed','dyn-dept-posts');if(!dynDiv)return;
  // Hide static posts
  c.querySelectorAll('.post').forEach(function(el){el.style.display='none';});
  if(!deptPostsData.length){dynDiv.innerHTML='<div style="text-align:center;padding:30px;color:#94A3B8">No posts yet.</div>';return;}
  dynDiv.innerHTML=deptPostsData.map(function(p){return postHTML(p,true);}).join('');
}

function loadDeptMembers(id){
  return sb.from('department_members').select('*, profiles(name,email,role)').eq('department_id',id).order('role').then(function(r){
    deptMembersData=r.data||[];renderDeptMembers();renderDeptLeaders();
  });
}

function renderDeptMembers(){
  var c=document.getElementById('mainDept-members');if(!c)return;
  var dynDiv=dynContainer('mainDept-members','dyn-dept-members');if(!dynDiv)return;
  c.querySelectorAll('.member-item,.official-card').forEach(function(el){el.style.display='none';});
  if(!deptMembersData.length){dynDiv.innerHTML='<div style="text-align:center;padding:20px;color:#94A3B8">No members yet.</div>';return;}
  var h='';
  deptMembersData.forEach(function(m){
    var p=m.profiles||{};
    h+='<div class="member-item" style="display:flex!important">'
      +'<div class="official-avatar">'+ini(p.name)+'</div>'
      +'<div style="flex:1"><div style="font-weight:700;font-size:.85rem">'+esc(p.name||'Unknown')+'</div>'
      +'<div><span class="dept-role-badge '+m.role+'">'+esc(m.role)+'</span></div></div>'
      +'<button class="btn btn-sm btn-chat" onclick="window._gcOpenChat(\''+m.user_id+'\')"><i class="fas fa-comment"></i></button>'
      +'</div>';
  });
  dynDiv.innerHTML=h;
}

function renderDeptLeaders(){
  var c=document.getElementById('mainDept-roles');if(!c)return;
  var dynDiv=dynContainer('mainDept-roles','dyn-dept-leaders');if(!dynDiv)return;
  c.querySelectorAll('.member-item,.official-card').forEach(function(el){el.style.display='none';});
  var leaders=deptMembersData.filter(function(m){return['leader','chairman','secretary','treasurer'].indexOf(m.role)>-1;});
  if(!leaders.length){dynDiv.innerHTML='<div style="text-align:center;padding:20px;color:#94A3B8">No leaders assigned yet.</div>';return;}
  var h='';
  leaders.forEach(function(m){
    var p=m.profiles||{};
    h+='<div class="member-item" style="display:flex!important">'
      +'<div class="official-avatar" style="background:var(--gradient-warm)">'+ini(p.name)+'</div>'
      +'<div style="flex:1"><div style="font-weight:700;font-size:.85rem">'+esc(p.name)+'</div></div>'
      +'<span class="dept-role-badge '+m.role+'">'+esc(m.role)+'</span>'
      +'</div>';
  });
  dynDiv.innerHTML=h;
}

// ── EVENTS ──
function loadEvents(){
  return sb.from('events').select('*').order('start_date',{ascending:false}).then(function(r){
    eventsData=r.data||[];renderEvents();
  });
}

function renderEvents(){
  var groups={upcoming:[],ongoing:[],completed:[]};
  eventsData.forEach(function(e){(groups[e.status]||groups.upcoming).push(e);});
  ['upcoming','ongoing','completed'].forEach(function(s){
    var c=document.getElementById('event-'+s);if(!c)return;
    var dynDiv=dynContainer('event-'+s,'dyn-events-'+s);if(!dynDiv)return;
    c.querySelectorAll('.event-card').forEach(function(el){el.style.display='none';});
    var L=groups[s];
    if(!L.length){dynDiv.innerHTML='<div style="text-align:center;padding:30px;color:#94A3B8"><i class="fas fa-calendar" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>No '+s+' events.</div>';return;}
    var h='';
    L.forEach(function(e){
      h+='<div class="event-card">'
        +'<div class="event-banner"><i class="fas fa-calendar" style="font-size:2rem"></i>'
        +'<span class="event-status status-'+s+'">'+s.charAt(0).toUpperCase()+s.slice(1)+'</span></div>'
        +'<div class="event-info"><div class="event-title">'+esc(e.title)+'</div>'
        +'<div class="event-date"><i class="far fa-calendar"></i> '+fdate(e.start_date)+(e.end_date?' → '+fdate(e.end_date):'')+'</div>'
        +(e.location?'<div class="event-date"><i class="fas fa-map-marker-alt"></i> '+esc(e.location)+'</div>':'')
        +(e.description?'<div style="font-size:.8rem;color:var(--text-light);margin-top:6px">'+esc(e.description)+'</div>':'')
        +'</div></div>';
    });
    dynDiv.innerHTML=h;
  });
}

// ── GIVING CAUSES ──
function loadCauses(){
  return sb.from('giving_causes').select('*').order('created_at',{ascending:false}).then(function(r){
    causesData=r.data||[];renderCauses();
  });
}

function renderCauses(){
  var givSec=document.getElementById('section-giving');if(!givSec)return;
  var c=dynContainer('section-giving','dyn-causes');if(!c)return;
  givSec.querySelectorAll('.giving-cause,.card-green').forEach(function(el){el.style.display='none';});
  if(!causesData.length){c.innerHTML='<div style="text-align:center;padding:30px;color:#94A3B8"><i class="fas fa-hand-holding-heart" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>No causes yet.</div>';return;}
  var h='';
  causesData.forEach(function(g){
    var pct=g.goal_amount>0?Math.min(100,Math.round((g.raised_amount/g.goal_amount)*100)):0;
    h+='<div class="card" style="margin-bottom:12px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:8px"><div><div class="card-title">💝 '+esc(g.title)+'</div>'
      +'<div class="card-subtitle">'+esc(g.description||'')+'</div></div>'
      +'<span class="chip chip-green">'+esc(g.status||'active')+'</span></div>'
      +'<div class="giving-progress"><div class="giving-progress-bar" style="width:'+pct+'%"></div></div>'
      +'<div class="giving-amounts"><span class="giving-raised">KES '+(g.raised_amount||0).toLocaleString()+'</span>'
      +'<span class="giving-goal">Goal: KES '+(g.goal_amount||0).toLocaleString()+'</span></div>'
      +'<button class="btn btn-accent btn-block" style="margin-top:10px" onclick="window._gcGive(\''+g.id+'\',\''+esc(g.title)+'\')"><i class="fas fa-hand-holding-heart"></i> Give Now</button>'
      +'</div>';
  });
  c.innerHTML=h;
}

// ── OFFICIALS ──
function loadOfficials(){
  return sb.from('ushirika_officials').select('*, profiles(name,phone,email), ushirikas(name)').then(function(r){
    officialsData=r.data||[];renderOfficials();
  });
}

function renderOfficials(){
  var c=dynContainer('ushirika-groups','dyn-officials');if(!c)return;
  // Hide static officials
  var grp=document.getElementById('ushirika-groups');
  if(grp)grp.querySelectorAll('.official-card').forEach(function(el){el.style.display='none';});
  if(!officialsData.length)return;
  var h='<div class="section-title" style="font-size:1.05rem;margin-top:18px">👔 Ushirika Officials</div>';
  officialsData.forEach(function(o){
    var p=o.profiles||{};
    h+='<div class="official-card">'
      +'<div class="official-avatar">'+ini(p.name)+'</div>'
      +'<div style="flex:1"><div class="official-name">'+esc(p.name||'Unknown')+'</div>'
      +'<div class="official-role">'+esc(o.title)+' — '+esc((o.ushirikas||{}).name||'')+'</div>'
      +'<div class="official-contact">📞 '+esc(p.phone||'N/A')+'</div></div></div>';
  });
  c.innerHTML=h;
}

// ── PLANS ──
function loadPlans(){
  return sb.from('plans').select('*').order('created_at',{ascending:false}).then(function(r){
    plansData=r.data||[];renderPlans();
  });
}

function renderPlans(){
  var c=dynContainer('ushirika-plans','dyn-plans');if(!c)return;
  hideStatic('ushirika-plans','.card');
  if(!plansData.length){c.innerHTML='<div style="text-align:center;padding:30px;color:#94A3B8">No plans yet.</div>';return;}
  var h='';
  plansData.forEach(function(p){
    h+='<div class="card" style="border-left:4px solid var(--accent)">'
      +'<span class="chip chip-green">'+esc(p.plan_type||'personal')+'</span>'
      +'<div style="font-weight:700;margin-top:6px">'+esc(p.title)+'</div>'
      +(p.meeting_date?'<div style="font-size:.75rem;color:var(--text-light);margin-top:4px">'+fdate(p.meeting_date)+'</div>':'')
      +'</div>';
  });
  c.innerHTML=h;
}

// ── PENDING REQUESTS ──
function loadPending(){
  return sb.from('pending_requests').select('*').eq('status','pending').order('created_at',{ascending:false}).then(function(r){
    pendingData=r.data||[];renderPending();
  });
}

function renderPending(){
  var panel=document.getElementById('adminPendingRequests');if(!panel)return;
  var c=dynContainer('adminPendingRequests','dyn-pending');if(!c)return;
  panel.querySelectorAll('.request-card').forEach(function(el){el.style.display='none';});
  if(!pendingData.length){c.innerHTML='<div style="font-size:.85rem;color:#94A3B8;padding:10px">No pending requests</div>';return;}
  var h='';
  pendingData.forEach(function(r){
    h+='<div class="request-card">'
      +'<div class="request-header">'
      +'<div class="post-avatar" style="width:36px;height:36px;font-size:.75rem">'+ini(r.user_name||'U')+'</div>'
      +'<div style="flex:1"><div style="font-weight:700">'+esc(r.user_name||'User')+'</div>'
      +'<div style="font-size:.72rem;color:var(--text-light)">'+esc(r.type)+': <b>'+esc(r.target_name||'')+'</b></div></div>'
      +'<span class="request-badge">Pending</span></div>'
      +'<div class="request-actions">'
      +'<button class="btn btn-accent btn-sm" onclick="window._gcApprove(\''+r.id+'\')"><i class="fas fa-check"></i> Approve</button>'
      +'<button class="btn btn-danger btn-sm" onclick="window._gcDecline(\''+r.id+'\')"><i class="fas fa-times"></i> Decline</button>'
      +'</div></div>';
  });
  c.innerHTML=h;
}

// ── NOTIFICATIONS ──
function loadNotifs(){
  if(!user)return Promise.resolve();
  return sb.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30).then(function(r){
    notifsData=r.data||[];
    var badge=document.getElementById('notifBadge');
    if(badge){
      var unread=notifsData.filter(function(n){return!n.read;}).length;
      badge.textContent=unread;badge.style.display=unread?'flex':'none';
    }
  });
}

// ── CHAT ──
function loadChatInbox(){
  if(!user)return;
  sb.from('messages').select('*').or('sender_id.eq.'+user.id+',receiver_id.eq.'+user.id).order('created_at',{ascending:false}).then(function(r){
    var msgs=r.data||[];
    var map={};
    msgs.forEach(function(m){var o=(m.sender_id===user.id)?m.receiver_id:m.sender_id;if(!map[o])map[o]=m;});
    var ids=Object.keys(map);if(!ids.length)return;
    sb.from('profiles').select('id,name,role').in('id',ids).then(function(r2){
      var us=r2.data||[];
      var chatDiv=dynContainer('discover-main','dyn-chat-inbox');
      if(!chatDiv)return;
      // Hide static chat list
      var discMain=document.getElementById('discover-main');
      if(discMain)discMain.querySelectorAll('.chat-list-item').forEach(function(el){el.style.display='none';});
      
      var h='<div class="section-title" style="font-size:1.1rem">💬 Messages</div><div class="card"><div class="chat-list">';
      us.forEach(function(u){
        var l=map[u.id];var me=l.sender_id===user.id;
        h+='<div class="chat-list-item" onclick="window._gcOpenChat(\''+u.id+'\')" style="display:flex!important">'
          +'<div class="chat-list-avatar">'+ini(u.name)+'</div>'
          +'<div class="chat-list-info"><div class="chat-list-name">'+esc(u.name)+'</div>'
          +'<div class="chat-list-preview">'+esc((me?'You: ':'')+((l.content)||'📎'))+'</div></div>'
          +'<div class="chat-list-meta">'+ago(l.created_at)+'</div></div>';
      });
      h+='</div></div>';
      chatDiv.innerHTML=h;
    });
  });
}

function loadChatMessages(){
  if(!user||!currentChatUserId)return;
  var c=document.getElementById('chatMessages');if(!c)return;
  sb.from('messages').select('*').or('and(sender_id.eq.'+user.id+',receiver_id.eq.'+currentChatUserId+'),and(sender_id.eq.'+currentChatUserId+',receiver_id.eq.'+user.id+')').order('created_at',{ascending:true}).then(function(r){
    var msgs=r.data||[];
    if(!msgs.length){c.innerHTML='<div style="text-align:center;padding:40px;color:#94A3B8">Say hi! 👋</div>';return;}
    var h='';
    msgs.forEach(function(m){
      var mine=m.sender_id===user.id;
      h+='<div class="chat-message'+(mine?' sent':'')+'">'
        +'<div class="chat-message-avatar">'+ini(mine?(profile?profile.name:'Me'):'')+'</div>'
        +'<div><div class="chat-message-bubble">'
        +'<div class="chat-message-text">'+esc(m.content||'')+'</div>'
        +(m.media_url?'<img src="'+m.media_url+'" style="max-width:100%;border-radius:8px;margin-top:6px">':'')
        +'</div><div class="chat-message-time">'+ftime(m.created_at)+'</div></div></div>';
    });
    c.innerHTML=h;
    c.scrollTop=c.scrollHeight;
  });
}

// ═══════════════════════════════════
//  ACTIONS (write to Supabase)
// ═══════════════════════════════════

// ── OPEN DEPARTMENT (override existing) ──
window._gcOpenDept=function(id){
  var d=null;for(var i=0;i<depts.length;i++){if(depts[i].id===id){d=depts[i];break;}}
  if(!d)return;
  currentDeptId=id;
  document.getElementById('mainDeptName').textContent=d.name;
  document.getElementById('mainDeptDesc').textContent=d.description||'';
  document.getElementById('mainDeptMembers').textContent=(d.member_count||0)+' members';
  document.getElementById('mainDeptIcon').innerHTML='<i class="fas '+(d.icon||'fa-users')+'"></i>';
  showSubPage('home-mainDept');
  loadDeptPosts(id);loadDeptMembers(id);
};
// Also keep original working for static cards
var origOpenDept=window.openMainDepartment;
window.openMainDepartment=function(key){
  // If it's a UUID, use new function
  if(key&&key.length>10){window._gcOpenDept(key);}
  else if(origOpenDept){origOpenDept(key);}
};

// ── OPEN CHAT (override) ──
window._gcOpenChat=function(id){
  if(!user||id===user.id)return;
  currentChatUserId=id;
  var u=null;for(var i=0;i<usersData.length;i++){if(usersData[i].id===id){u=usersData[i];break;}}
  if(!u)return;
  document.getElementById('chatAvatar').textContent=ini(u.name);
  document.getElementById('chatName').textContent=u.name;
  document.getElementById('chatStatus').textContent=esc(u.role||'Member')+' • Online';
  showSubPage('discover-chat');
  closeModalDirect();
  loadChatMessages();
  // Realtime subscription
  if(chatSub&&sb.removeChannel){sb.removeChannel(chatSub);chatSub=null;}
  if(sb.channel){
    chatSub=sb.channel('chat-'+user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},function(){
      loadChatMessages();loadChatInbox();
    }).subscribe();
  }
};

// ── SEND CHAT MESSAGE ──
window.sendChatMessage=function(){
  var input=document.getElementById('chatInput');
  var content=input.value.trim();if(!content||!user||!currentChatUserId)return;
  sb.from('messages').insert([{sender_id:user.id,receiver_id:currentChatUserId,content:content}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    input.value='';loadChatMessages();
  });
};

// ── POST ACTIONS ──
window._gcDeletePost=function(id,isDept){
  if(!confirm('Delete this post?'))return;
  sb.from('posts').delete().eq('id',id).then(function(){
    if(isDept)loadDeptPosts(currentDeptId);else loadForumPosts();
  });
};

window._gcLike=function(id,isDept){
  if(!user)return;
  var list=isDept?deptPostsData:forumPostsData;
  var p=null;for(var i=0;i<list.length;i++){if(list[i].id===id){p=list[i];break;}}
  if(!p)return;
  var liked=p.liked_by&&p.liked_by.indexOf(user.id)>-1;
  var nb=liked?p.liked_by.filter(function(x){return x!==user.id;}):((p.liked_by||[]).concat([user.id]));
  sb.from('posts').update({liked_by:nb,likes:nb.length}).eq('id',id).then(function(){
    if(isDept)loadDeptPosts(currentDeptId);else loadForumPosts();
  });
};

// ── GIVE ──
window._gcGive=function(id,title){
  document.querySelector('#giveModal .modal-title').innerHTML='💝 Give to '+esc(title);
  openModal('giveModal');
  // Store cause id
  window._gcCurrentCauseId=id;
};

// ── APPROVE / DECLINE ──
window._gcApprove=function(id){
  if(!confirm('Approve?'))return;
  var req=null;for(var i=0;i<pendingData.length;i++){if(pendingData[i].id===id){req=pendingData[i];break;}}
  sb.from('pending_requests').update({status:'approved'}).eq('id',id).then(function(){
    if(req&&req.type==='join_department'&&req.target_id){
      sb.from('department_members').insert([{department_id:req.target_id,user_id:req.user_id,role:'member'}]);
    }
    alert('✅ Approved!');loadPending();
  });
};
window._gcDecline=function(id){
  if(!confirm('Decline?'))return;
  sb.from('pending_requests').update({status:'declined'}).eq('id',id).then(function(){
    alert('Declined.');loadPending();
  });
};

// ── DELETE TITLE ──
window._gcDeleteTitle=function(id){
  if(!confirm('Delete this title?'))return;
  sb.from('titles').delete().eq('id',id).then(function(){loadTitles();});
};

// ═══════════════════════════════════
//  WIRE MODAL SUBMIT BUTTONS
// ═══════════════════════════════════

function wireBtn(modalId, fn){
  var m=document.getElementById(modalId);if(!m)return;
  var btns=m.querySelectorAll('.btn-block, .btn-warm.btn-block, .btn-accent.btn-block, .btn-dept.btn-block');
  // Get the LAST btn-block (usually the submit)
  var btn=null;
  for(var i=btns.length-1;i>=0;i--){
    if(btns[i].tagName==='BUTTON'){btn=btns[i];break;}
  }
  if(!btn)return;
  btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    fn(m);
  });
}

// ── CREATE DEPARTMENT ──
wireBtn('addDeptModal',function(m){
  if(!user){alert('Please log in first');return;}
  var ins=m.querySelectorAll('.form-input');
  var tas=m.querySelectorAll('.form-textarea');
  var sels=m.querySelectorAll('.form-select');
  var name=(ins[0]||{}).value||'';
  if(!name.trim()){alert('Department name is required');return;}
  var iconText=(sels[0]||{}).value||'';
  var iconMap={'🎵':'fa-music','🙏':'fa-hands-praying','📖':'fa-bible','🚪':'fa-door-open','🔥':'fa-fire','📹':'fa-video','👶':'fa-child','🎤':'fa-microphone','📚':'fa-book','🤝':'fa-handshake','💝':'fa-hand-holding-heart','🎭':'fa-masks-theater'};
  var icon='fa-users';for(var k in iconMap){if(iconText.indexOf(k)>-1){icon=iconMap[k];break;}}
  var colorText=(sels[1]||{}).value||'';
  var colorMap={'Orange':'alt1','Blue':'alt2','Green':'alt3','Red':'alt4'};
  var color='';for(var c in colorMap){if(colorText.indexOf(c)>-1){color=colorMap[c];break;}}
  
  sb.from('departments').insert([{name:name.trim(),description:(tas[0]||{}).value||'',icon:icon,color_theme:color,member_count:0,created_by:user.id}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Department created!');closeModalDirect();loadDepts();
  });
});

// ── CREATE USHIRIKA ──
wireBtn('addUshirikaModal',function(m){
  if(!user){alert('Please log in');return;}
  var ins=m.querySelectorAll('.form-input');
  var sels=m.querySelectorAll('.form-select');
  var name=(ins[0]||{}).value||'';
  if(!name.trim()){alert('Ushirika name is required');return;}
  sb.from('ushirikas').insert([{name:name.trim(),location:(ins[1]||{}).value||'',meeting_day:(sels[0]||{}).value||'',meeting_time:(ins[2]||{}).value||'',venue:(ins[3]||{}).value||'',created_by:user.id}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Ushirika created!');closeModalDirect();loadUshirikas();
  });
});

// ── CREATE FORUM POST ──
wireBtn('postModal',function(m){
  if(!user){alert('Please log in');return;}
  var ta=m.querySelector('.form-textarea')||m.querySelector('textarea');
  var content=(ta||{}).value||'';
  if(!content.trim()){alert('Write something first');return;}
  sb.from('posts').insert([{author_id:user.id,content:content.trim(),likes:0,liked_by:[]}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    if(ta)ta.value='';alert('✅ Posted!');closeModalDirect();loadForumPosts();
  });
});

// ── CREATE DEPT POST ──
wireBtn('deptPostModal',function(m){
  if(!user||!currentDeptId){alert('Not in a department');return;}
  var ta=m.querySelector('.form-textarea')||m.querySelector('textarea');
  var content=(ta||{}).value||'';
  if(!content.trim()){alert('Write something first');return;}
  sb.from('posts').insert([{author_id:user.id,department_id:currentDeptId,content:content.trim(),likes:0,liked_by:[]}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    if(ta)ta.value='';alert('✅ Posted!');closeModalDirect();loadDeptPosts(currentDeptId);
  });
});

// ── CREATE EVENT ──
wireBtn('eventModal',function(m){
  if(!user){alert('Please log in');return;}
  var ins=m.querySelectorAll('.form-input');
  var tas=m.querySelectorAll('.form-textarea');
  var name=(ins[0]||{}).value||'';
  if(!name.trim()){alert('Event name required');return;}
  sb.from('events').insert([{title:name.trim(),description:(tas[0]||{}).value||'',start_date:(ins[2]||{}).value||null,end_date:(ins[3]||{}).value||null,location:'',status:'upcoming',created_by:user.id}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Event created!');closeModalDirect();loadEvents();
  });
});

// ── CREATE GIVING CAUSE ──
wireBtn('givingModal',function(m){
  if(!user){alert('Please log in');return;}
  var ins=m.querySelectorAll('.form-input');
  var tas=m.querySelectorAll('.form-textarea');
  var title=(ins[0]||{}).value||'';
  var goal=parseFloat((ins[1]||{}).value)||0;
  if(!title.trim()||!goal){alert('Title and goal amount required');return;}
  sb.from('giving_causes').insert([{title:title.trim(),description:(tas[0]||{}).value||'',goal_amount:goal,raised_amount:0,currency:'KES',status:'active',created_by:user.id}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Cause launched!');closeModalDirect();loadCauses();
  });
});

// ── GIVE NOW ──
wireBtn('giveModal',function(m){
  if(!user){alert('Please log in');return;}
  var ins=m.querySelectorAll('.form-input');
  var amount=parseFloat((ins[0]||{}).value)||0;
  if(!amount||amount<=0){alert('Enter a valid amount');return;}
  var causeId=window._gcCurrentCauseId;
  if(!causeId){alert('No cause selected');return;}
  sb.from('contributions').insert([{cause_id:causeId,user_id:user.id,amount:amount,recorded_by:user.id}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    // Update cause raised amount
    var cause=null;for(var i=0;i<causesData.length;i++){if(causesData[i].id===causeId){cause=causesData[i];break;}}
    if(cause){sb.from('giving_causes').update({raised_amount:(cause.raised_amount||0)+amount}).eq('id',causeId);}
    alert('🎉 Thank you for giving!');closeModalDirect();loadCauses();
  });
});

// ── CREATE PLAN ──
wireBtn('planModal',function(m){
  if(!user){alert('Please log in');return;}
  var ins=m.querySelectorAll('.form-input');
  var sels=m.querySelectorAll('.form-select');
  var title=(ins[0]||{}).value||'';
  if(!title.trim()){alert('Title required');return;}
  sb.from('plans').insert([{title:title.trim(),plan_type:(sels[0]||{}).value||'personal',meeting_date:(ins[1]||{}).value||null,created_by:user.id}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Plan created!');closeModalDirect();loadPlans();
  });
});

// ── ADD TITLE ──
// Override the existing addCustomTitle function
var origAddTitle=window.addCustomTitle;
window.addCustomTitle=function(){
  if(!user){if(origAddTitle)origAddTitle();return;}
  var input=document.getElementById('newTitleInput');
  var name=input?input.value.trim():'';
  if(!name){alert('Enter a title name');return;}
  var catSel=document.querySelector('#manageTitlesModal .form-select');
  var cat=catSel?catSel.value:'church';
  sb.from('titles').insert([{name:name,category:cat,created_by:user.id}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    if(input)input.value='';alert('✅ Title "'+name+'" added!');loadTitles();
  });
};

// ── ADD OFFICIAL ──
wireBtn('addOfficialModal',function(m){
  if(!user){alert('Please log in');return;}
  var sel=m.querySelector('.user-pick-item.selected');
  if(!sel){alert('Please select a user');return;}
  var uid=sel.dataset.userId;if(!uid){alert('Please select a user');return;}
  var sels=m.querySelectorAll('.form-select');
  var target=(sels[1]||sels[0]||{}).value||'';
  var title=(sels[2]||sels[1]||{}).value||'Leader';
  var ushId=target.indexOf('ush_')===0?target.slice(4):(ushirikasData[0]?ushirikasData[0].id:null);
  sb.from('ushirika_officials').insert([{user_id:uid,ushirika_id:ushId,title:title,appointed_by:user.id}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Official assigned!');closeModalDirect();loadOfficials();
  });
});

// ── ADD LEADER ──
wireBtn('addLeaderModal',function(m){
  if(!user){alert('Please log in');return;}
  var sel=m.querySelector('.user-pick-item.selected');
  if(!sel){alert('Please select a user');return;}
  var uid=sel.dataset.userId;if(!uid){alert('Please select a user');return;}
  var ins=m.querySelectorAll('.form-input');
  var phone=(ins[0]||{}).value||'';
  var upd={role:'admin'};if(phone)upd.phone=phone;
  sb.from('profiles').update(upd).eq('id',uid).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Leader added!');closeModalDirect();loadUsers();
  });
});

// ── ADD DEPT MEMBER ──
wireBtn('addDeptMemberModal',function(m){
  if(!user||!currentDeptId){alert('Not in a department');return;}
  var sel=m.querySelector('.user-pick-item.selected');
  if(!sel){alert('Please select a user');return;}
  var uid=sel.dataset.userId;if(!uid){alert('Please select a user');return;}
  var roleSel=m.querySelectorAll('.form-select');
  var role=(roleSel[0]||{}).value||'Member (no role)';
  if(role.indexOf('Member')>-1)role='member';
  sb.from('department_members').insert([{department_id:currentDeptId,user_id:uid,role:role.toLowerCase()}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    // Increment count
    var dept=null;for(var i=0;i<depts.length;i++){if(depts[i].id===currentDeptId){dept=depts[i];break;}}
    if(dept)sb.from('departments').update({member_count:(dept.member_count||0)+1}).eq('id',currentDeptId);
    alert('✅ Member added!');closeModalDirect();loadDeptMembers(currentDeptId);loadDepts();
  });
});

// ── ASSIGN ROLE ──
wireBtn('assignDeptRoleModal',function(m){
  if(!currentDeptId)return;
  var sels=m.querySelectorAll('.form-select');
  // sels[0] = member name (text), sels[1] = role
  // We need the user ID - find by name match
  var memberName=(sels[0]||{}).value||'';
  var newRole=(sels[1]||{}).value||'member';
  if(newRole.indexOf('Member')>-1)newRole='member';
  var member=null;
  for(var i=0;i<deptMembersData.length;i++){
    var p=deptMembersData[i].profiles||{};
    if(p.name&&memberName.indexOf(p.name)>-1){member=deptMembersData[i];break;}
  }
  if(!member){alert('Member not found');return;}
  sb.from('department_members').update({role:newRole.toLowerCase()}).eq('department_id',currentDeptId).eq('user_id',member.user_id).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Role updated!');closeModalDirect();loadDeptMembers(currentDeptId);
  });
});

// ── REMOVE MEMBER ──
wireBtn('removeDeptMemberModal',function(m){
  if(!currentDeptId)return;
  var sel=m.querySelector('.form-select');
  var memberName=(sel||{}).value||'';
  var member=null;
  for(var i=0;i<deptMembersData.length;i++){
    var p=deptMembersData[i].profiles||{};
    if(p.name&&memberName.indexOf(p.name)>-1){member=deptMembersData[i];break;}
  }
  if(!member){alert('Member not found');return;}
  if(!confirm('Remove '+((member.profiles||{}).name||'')+'?'))return;
  sb.from('department_members').delete().eq('department_id',currentDeptId).eq('user_id',member.user_id).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    var dept=null;for(var i=0;i<depts.length;i++){if(depts[i].id===currentDeptId){dept=depts[i];break;}}
    if(dept)sb.from('departments').update({member_count:Math.max(0,(dept.member_count||0)-1)}).eq('id',currentDeptId);
    alert('✅ Removed!');closeModalDirect();loadDeptMembers(currentDeptId);loadDepts();
  });
});

// ── REQUEST JOIN DEPT (override) ──
var origJoin=window.requestJoinDept;
window.requestJoinDept=function(){
  if(!user){if(origJoin)origJoin();return;}
  var sel=document.querySelector('#deptPickerModal .user-pick-item.selected');
  if(!sel){alert('Please select a department');return;}
  var deptId=sel.dataset.deptId;
  var dept=null;for(var i=0;i<depts.length;i++){if(depts[i].id===deptId){dept=depts[i];break;}}
  if(!dept){alert('Department not found');return;}
  sb.from('pending_requests').insert([{user_id:user.id,user_name:profile?profile.name:'',type:'join_department',target_id:dept.id,target_name:dept.name,status:'pending'}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Request sent to admin!');closeModalDirect();
  });
};

// ── UPDATE WEEKLY MEETING ──
wireBtn('updateWeeklyMeetingModal',function(m){
  if(!user){alert('Please log in');return;}
  var ins=m.querySelectorAll('.form-input');
  var sels=m.querySelectorAll('.form-select');
  var tas=m.querySelectorAll('.form-textarea');
  sb.from('weekly_meetings').insert([{
    department_id:currentDeptId||null,
    meeting_day:(sels[0]||{}).value||'Saturday',
    meeting_date:(ins[0]||{}).value||null,
    start_time:(ins[1]||{}).value||null,
    end_time:(ins[2]||{}).value||null,
    venue:(ins[3]||{}).value||'',
    theme:(ins[4]||{}).value||'',
    notes:(tas[0]||{}).value||'',
    updated_by:user.id
  }]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('✅ Meeting updated!');closeModalDirect();
  });
});

// ── ASK QUESTION ──
wireBtn('askModal',function(m){
  if(!user){alert('Please log in');return;}
  var ta=m.querySelector('.form-textarea')||m.querySelector('textarea');
  var sel=m.querySelector('.form-select');
  var q=(ta||{}).value||'';
  if(!q.trim()){alert('Write your question');return;}
  sb.from('questions').insert([{user_id:user.id,category:(sel||{}).value||'',question:q.trim(),status:'pending'}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    if(ta)ta.value='';alert('✅ Question submitted!');closeModalDirect();
  });
});

// ── PRAYER REQUEST ──
wireBtn('prayerModal',function(m){
  if(!user){alert('Please log in');return;}
  var ta=m.querySelector('.form-textarea')||m.querySelector('textarea');
  var content=(ta||{}).value||'';
  if(!content.trim()){alert('Write your prayer request');return;}
  var anonToggle=m.querySelector('.toggle');
  var isAnon=anonToggle&&anonToggle.classList.contains('on');
  sb.from('prayers').insert([{user_id:user.id,content:content.trim(),is_anonymous:isAnon,status:'active'}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    if(ta)ta.value='';alert('🙏 Prayer request submitted!');closeModalDirect();
  });
});

// ── INVITE ADMIN ──
wireBtn('inviteAdminModal',function(m){
  if(!user){alert('Please log in');return;}
  var ins=m.querySelectorAll('.form-input');
  var email=(ins[0]||{}).value||'';
  if(!email.trim()){alert('Email required');return;}
  sb.from('admin_invites').insert([{email:email.trim(),role:(m.querySelector('.form-select')||{}).value||'',invited_by:user.id,status:'pending'}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    alert('📨 Invite saved!');closeModalDirect();
  });
});

// ═══════════════════════════════════
//  PROFILE UPDATE ON LOGIN
// ═══════════════════════════════════
function updateProfileUI(){
  if(!profile)return;
  var avatar=document.querySelector('#profileModal .post-avatar');
  if(avatar)avatar.textContent=ini(profile.name);
  var nameEl=document.querySelector('#profileModal div[style*="font-size:1.05rem"]');
  if(nameEl)nameEl.textContent=profile.name||'User';
  var metaEl=document.querySelector('#profileModal div[style*="font-size:0.8rem"]');
  if(metaEl)metaEl.textContent=(profile.role||'member')+' • GraceConnect';
  // Update new-post avatars
  document.querySelectorAll('.new-post-box .post-avatar, #forumPostAvatar, #newPostAvatar').forEach(function(el){
    el.textContent=ini(profile.name);
  });
}

// ═══════════════════════════════════
//  BOOT
// ═══════════════════════════════════
function boot(){
  sb.auth.onAuthStateChange(function(event,session){
    if(event==='SIGNED_IN'&&session){
      user=session.user;
      sb.from('profiles').select('*').eq('id',user.id).single().then(function(r){
        profile=r.data;
        updateProfileUI();
        loadAll();
      });
    } else if(event==='SIGNED_OUT'){
      user=null;profile=null;
    }
  });
  
  // Check existing session
  sb.auth.getSession().then(function(r){
    if(r.data&&r.data.session){
      user=r.data.session.user;
      sb.from('profiles').select('*').eq('id',user.id).single().then(function(pr){
        profile=pr.data;
        updateProfileUI();
        loadAll();
      });
    } else {
      loadPublicData();
    }
  }).catch(function(){loadPublicData();});
}

// Override sendChatMessage to use real data
var origSendChat=window.sendChatMessage;
window.sendChatMessage=function(){
  if(!user||!currentChatUserId){
    if(origSendChat)origSendChat();return;
  }
  var input=document.getElementById('chatInput');
  var content=input.value.trim();if(!content)return;
  sb.from('messages').insert([{sender_id:user.id,receiver_id:currentChatUserId,content:content}]).then(function(r){
    if(r.error){alert('Failed: '+r.error.message);return;}
    input.value='';loadChatMessages();
  });
};

boot();
console.log('✝️ GraceConnect app.js (data layer) loaded!');
})();
