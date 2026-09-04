// app12.js — FINAL patch: dept role/remove by user_id, leadership refresh, meeting permissions
console.log('✝️ app12.js loading...');

// ── 1) Dept member dropdowns must use user_id (table has NO id column) ──
var _om12=window.openModal;
window.openModal=function(id){
  var r=_om12?_om12.apply(this,arguments):undefined;
  if(id==='assignDeptRoleModal'){
    var s=document.getElementById('assignRoleMember');
    if(s){s.innerHTML=(deptMembersData||[]).map(function(m){
      return '<option value="'+m.user_id+'">'+esc((m.profiles||{}).name||'Member')+' ('+esc(m.role)+')</option>';
    }).join('');}
  }
  if(id==='removeDeptMemberModal'){
    var s2=document.getElementById('removeMemberSelect');
    if(s2){s2.innerHTML=(deptMembersData||[]).map(function(m){
      return '<option value="'+m.user_id+'">'+esc((m.profiles||{}).name||'Member')+'</option>';
    }).join('');}
  }
  return r;
};

// ── 2) Assign / Remove by user_id + department_id ──
window.assignDeptRole=function(){
  if(!user||!currentDeptId||!sb)return alert('Open a dept');
  var uid=document.getElementById('assignRoleMember').value;
  if(!uid)return alert('Pick a member');
  var role=getRole9('assignRoleValue','adr9Custom');
  sb.from('department_members').update({role:role}).eq('user_id',uid).eq('department_id',currentDeptId).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role updated to '+role);closeModalDirect();
    loadDeptMembers(currentDeptId);
    if(typeof loadMyMemberships9==='function')loadMyMemberships9();
  });
};
window.removeDeptMember=function(){
  if(!user||!currentDeptId||!sb)return alert('Open a dept');
  var uid=document.getElementById('removeMemberSelect').value;
  if(!uid)return alert('Pick a member');
  if(!confirm('Remove this member from the department?'))return;
  sb.from('department_members').delete().eq('user_id',uid).eq('department_id',currentDeptId).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Removed');closeModalDirect();
    loadDeptMembers(currentDeptId);
    if(typeof loadMemberCounts9==='function')loadMemberCounts9();
    if(typeof loadMyMemberships9==='function')loadMyMemberships9();
  });
};

// ── 3) Ushirika: after assigning a role, members AND Leadership refresh (chained) ──
window.assignUshRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  var mid=document.getElementById('ushRole9Member').value;if(!mid)return alert('Pick a member');
  var role=getRole9('ushRole9Role','ushRole9Custom');
  sb.from('ushirika_members').update({role:role}).eq('id',mid).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role updated to '+role);closeModalDirect();
    loadUshMembers9(ushId); // app11 loader re-renders Members + Leadership when done
  });
};

// ── 4) Refresh lists every time the tabs are opened ──
var _sw12=window.switchUshDetailTab;
window.switchUshDetailTab=function(el,t){
  var r=_sw12?_sw12(el,t):undefined;
  if((t==='members'||t==='leadership')&&window._curUshForumId)loadUshMembers9(window._curUshForumId);
  return r;
};
var _smt12=window.switchMainDeptTab;
window.switchMainDeptTab=function(el,t){
  var r=_smt12?_smt12(el,t):undefined;
  if((t==='members'||t==='roles')&&currentDeptId)loadDeptMembers(currentDeptId);
  return r;
};

// ── 5) ONLY leader/admin can edit or delete the weekly meeting ──
window.deleteCurrentMeeting=function(){
  if(!user||!sb)return alert('Log in');
  var deptId=currentDeptId||null;
  var ushId=window._curUshForumId||null;
  var can=deptId?isDeptLeader9(deptId):(ushId?isUshLeaderOf(ushId):(leadsAnyDept()||leadsAnyUsh()));
  if(!can)return alert('🚫 Only the department/ushirika leader or an admin can edit the weekly meeting.');
  if(!window._curMeetingId)return alert('No meeting');
  if(!confirm('Delete this meeting?'))return;
  sb.from('weekly_meetings').delete().eq('id',window._curMeetingId).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    window._curMeetingId=null;alert('Deleted');
  });
};
function sweepMeetingBtns12(){
  var host=document.getElementById('home-mainDept');if(!host||!user)return;
  var can=currentDeptId?isDeptLeader9(currentDeptId):false;
  var btns=host.querySelectorAll('button');
  for(var i=0;i<btns.length;i++){
    var t=(btns[i].textContent||'').trim();
    if(/^Update$/i.test(t)||/^Delete$/i.test(t)){btns[i].style.display=can?'':'none';}
  }
}
setInterval(function(){try{sweepMeetingBtns12();}catch(e){}},2000);
console.log('✝️ app12.js active');
