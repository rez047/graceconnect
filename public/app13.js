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

// ── 4) Department "This Week's Meeting" widget — filtered by department ──
function refreshDeptMeetingWidget13(){
  var host=document.getElementById('home-mainDept');
  if(!host||!currentDeptId||!sb)return;
  if(!host.classList.contains('active'))return;
  var card=null,cards=host.querySelectorAll('.card');
  for(var i=0;i<cards.length;i++){if(/This Week's Meeting/i.test(cards[i].textContent)){card=cards[i];break;}}
  if(!card)return;
  sb.from('weekly_meetings').select('*').eq('department_id',currentDeptId).order('created_at',{ascending:false}).limit(1).then(function(r){
    var m=r.data&&r.data[0];
    var inner='<div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
    if(!m){inner+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';}
    else{
      window._curMeetingId=m.id;
      inner+='<div style="font-size:.9rem;line-height:1.8">'+
        (m.meeting_date?'<div><b>📅 Date:</b> '+esc(m.meeting_date)+'</div>':'')+
        (m.start_time?'<div><b>🕐 Time:</b> '+esc(m.start_time)+(m.end_time?' – '+esc(m.end_time):'')+'</div>':'')+
        (m.venue?'<div><b>📍 Venue:</b> '+esc(m.venue)+'</div>':'')+
        (m.theme?'<div><b>🎯 Theme:</b> '+esc(m.theme)+'</div>':'')+
        mediaHTML(mediaOf(m))+'</div>';
    }
    inner+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-warm btn-sm" onclick="updateMeeting()"><i class="fas fa-edit"></i> Update</button><button class="btn btn-danger btn-sm" onclick="deleteCurrentMeeting()"><i class="fas fa-trash"></i> Delete</button></div>';
    card.innerHTML=inner;
    if(typeof sweepMeetingBtns12==='function')sweepMeetingBtns12();
  });
}
// hook the widget into every relevant action
var _odf13=window.openDeptForum;
window.openDeptForum=function(id){var r=_odf13?_odf13(id):undefined;setTimeout(refreshDeptMeetingWidget13,900);setTimeout(refreshDeptMeetingWidget13,2200);return r;};
var _sdm13=window.saveDeptMeeting9;
window.saveDeptMeeting9=function(){var r=_sdm13?_sdm13.apply(this,arguments):undefined;setTimeout(refreshDeptMeetingWidget13,1200);return r;};
var _um13=window.updateMeeting;
window.updateMeeting=function(){var r=_um13?_um13.apply(this,arguments):undefined;setTimeout(refreshDeptMeetingWidget13,1200);return r;};
var _dcm13=window.deleteCurrentMeeting;
window.deleteCurrentMeeting=function(){var r=_dcm13?_dcm13.apply(this,arguments):undefined;setTimeout(refreshDeptMeetingWidget13,1200);return r;};
setInterval(function(){try{refreshDeptMeetingWidget13();}catch(e){}},3000);
console.log('✝️ app13.js active');
