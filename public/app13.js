// app13.js — FINAL: verified role updates (user_id keyed) + dept meeting widget fix
console.log('✝️ app13.js loading...');

// ── 1) Ushirika Role/Remove selects keyed by user_id (not row id) ──
window.openUshRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  ensureUshModals9();
  fillRoleSelect9(document.getElementById('ushRole9Role'),'ush:'+ushId);
  var pm=window._ushMemberNames||{};
  document.getElementById('ushRole9Member').innerHTML=(window._ushMembers9||[]).map(function(m){
    return '<option value="'+m.user_id+'">'+esc((pm[m.user_id]||{}).name||'Member')+' ('+esc(m.role||'member')+')</option>';
  }).join('');
  openModal('ushRole9Modal');
};
window.openUshRemove9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  ensureUshModals9();
  var pm=window._ushMemberNames||{};
  document.getElementById('ushRemove9Member').innerHTML=(window._ushMembers9||[]).map(function(m){
    return '<option value="'+m.user_id+'">'+esc((pm[m.user_id]||{}).name||'Member')+'</option>';
  }).join('');
  openModal('ushRemove9Modal');
};

// ── 2) VERIFIED role update (user_id + ushirika_id), then refresh everything ──
window.assignUshRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  var uid=document.getElementById('ushRole9Member').value;
  if(!uid)return alert('Pick a member');
  var role=getRole9('ushRole9Role','ushRole9Custom');
  sb.from('ushirika_members').update({role:role})
    .eq('user_id',uid).eq('ushirika_id',ushId)
    .select().then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      if(!r.data||!r.data.length)return alert('⚠️ No rows updated — member not found in this ushirika.');
      alert('✅ Role updated to '+role);closeModalDirect();
      loadUshMembers9(ushId); // re-renders Members badges + Leadership tab
      if(typeof loadMyMemberships9==='function')loadMyMemberships9();
    });
};
window.removeUshMember9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  var uid=document.getElementById('ushRemove9Member').value;
  if(!uid)return alert('Pick a member');
  if(!confirm('Remove this member from the ushirika?'))return;
  sb.from('ushirika_members').delete().eq('user_id',uid).eq('ushirika_id',ushId).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Removed');closeModalDirect();
    loadUshMembers9(ushId);
    if(typeof loadMemberCounts9==='function')loadMemberCounts9();
    if(typeof loadMyMemberships9==='function')loadMyMemberships9();
  });
};

// ── 3) Ushirika leader (by role) can open the meeting editor ──
var _oume13=window.openUshirikaMeetingEditor;
window.openUshirikaMeetingEditor=function(){
  if(!user)return alert('Log in first');
  sb.from('ushirika_members').select('*').eq('user_id',user.id).then(function(r){
    window._myUsh=r.data||[];
    _oume13();
  });
};
console.log('✝️ app13.js active');
