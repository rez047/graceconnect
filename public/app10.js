// app9.js — FIXED build: forum access + pending requests (replaces old app9.js completely)
console.log('✝️ app9.js (fixed build) loading...');

/* ROOT CAUSES FIXED:
 1) requestJoinDept inserted column "user_name" which does NOT exist in pending_requests
    -> Supabase rejected every request silently (app still showed "Sent!").
 2) Dept forum used showSubPage() while Ushirika section was active -> BLANK PAGE.
 3) Membership checked unloaded in-memory arrays -> false "must be a member" alerts.
 Now: real DB checks + explicit section activation. Nothing removed. */

// ═══════════ HELPERS ═══════════
function activateSection(sectionId, subPageId, navMatch){
  var secs=document.querySelectorAll('.section');for(var i=0;i<secs.length;i++)secs[i].classList.remove('active');
  var sec=document.getElementById(sectionId);if(!sec)return;
  sec.classList.add('active');
  var nvs=document.querySelectorAll('.nav-item');for(var j=0;j<nvs.length;j++)nvs[j].classList.remove('active');
  if(navMatch){var nv=document.querySelector('.nav-item[onclick*="'+navMatch+'"]');if(nv)nv.classList.add('active');}
  var subs=sec.querySelectorAll('.sub-page');for(var k=0;k<subs.length;k++)subs[k].classList.remove('active');
  var t=document.getElementById(subPageId);if(t)t.classList.add('active');
  window.scrollTo(0,0);
}

// ═══════════ FIX 1: DEPARTMENT JOIN REQUEST (only existing columns) ═══════════
window.requestJoinDept=function(){
  if(!user||!sb)return alert('Log in');
  var sel=document.querySelector('#deptPickerList .user-pick-item.selected');
  if(!sel)return alert('Select a department');
  var deptId=sel.dataset.deptId;
  var dept=null;for(var i=0;i<depts.length;i++){if(depts[i].id===deptId){dept=depts[i];break;}}
  sb.from('pending_requests').insert([{
    user_id:user.id,
    type:'join_department',
    target_id:deptId,
    target_name:dept?dept.name:'',
    status:'pending'
  }]).then(function(r){
    if(r.error){alert('⚠️ '+r.error.message);return;}
    alert('✅ Request sent!');closeModalDirect();
    if(typeof loadPending==='function')loadPending();
  });
};

// ═══════════ FIX 2: PENDING REQUESTS RENDER + APPROVE ═══════════
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
    return sb.from('department_members').insert([{user_id:req.user_id,department_id:req.target_id,role:'member'}]).then(function(){
      sb.from('notifications').insert([{user_id:req.user_id,title:'Department Request Approved',message:'You joined '+ (req.target_name||'the department') +' — open its forum now!'}]).then(function(){});
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

// ═══════════ FIX 3: DEPARTMENT FORUM (no blank page, real DB membership) ═══════════
window.openDeptForum=function(deptId){
  if(!user)return alert('Please log in first');
  var dept=null;for(var i=0;i<depts.length;i++){if(depts[i].id===deptId){dept=depts[i];break;}}
  if(!dept)return alert('Department not found');
  sb.from('department_members').select('id,role').eq('user_id',user.id).eq('department_id',deptId).limit(1).then(function(r){
    var isMember=r.data&&r.data.length>0;
    if(!isMember&&!isAdmin())return alert('You must be a member to access the forum. Request to join first.');
    currentDeptId=deptId;
    var n=document.getElementById('mainDeptName');if(n)n.textContent=dept.name;
    var d=document.getElementById('mainDeptDesc');if(d)d.textContent=dept.description||'';
    var m=document.getElementById('mainDeptMembers');if(m)m.textContent=(dept.member_count||0)+' members';
    var ic=document.getElementById('mainDeptIcon');if(ic)ic.innerHTML='<i class="fas '+(dept.icon||'fa-users')+'"></i>';
    activateSection('section-home','home-mainDept','home');   // ← fixes BLANK PAGE
    loadDeptPosts(deptId);loadDeptMembers(deptId);
  });
};
window._gcOpenDept=window.openDeptForum; // old card onclicks now use the fixed path

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

// ═══════════ FIX 4: USHIRIKA FORUM PAGE (tap joined ushirika) ═══════════
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
        (p.media_url?'<div class="post-media"><img src="'+p.media_url+'"></div>':'')+
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
    sb.from('posts').insert([{author_id:user.id,ushirika_id:ushId,content:txt.value.trim(),media_url:url||null,likes:0,liked_by:[]}]).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
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

// ═══════════ FIX 5: "MY USHIRIKAS" + "MY DEPARTMENTS" (tap = forum) ═══════════
window.loadMyMemberships9=function(){
  if(!user||!sb)return;
  sb.from('ushirika_members').select('*').eq('user_id',user.id).then(function(r){window._myUsh=r.data||[];renderMyUshirikas();});
  sb.from('department_members').select('*').eq('user_id',user.id).then(function(r){window._myDepts=r.data||[];renderMyDepts();});
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
setInterval(function(){bindDeptCards();ensureUshForumPage();},2000);
setInterval(function(){if(user)loadMyMemberships9();if(isAdmin()&&typeof loadPending==='function')loadPending();},10000);
if(user)setTimeout(loadMyMemberships9,1500);

var _origLoadAll=window.loadAll;
window.loadAll=function(){
  var p=_origLoadAll?_origLoadAll():Promise.resolve();
  setTimeout(loadMyMemberships9,1200);
  return p;
};
console.log('✝️ app9.js FIXED build active');
