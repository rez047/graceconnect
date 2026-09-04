// app18.js — FINAL: guaranteed role change (client → server fallback) + single calm meeting widgets
console.log('✝️ app18.js loading...');
(function(){
  function g(id){return document.getElementById(id);}
  function safeEsc(x){return (typeof esc==='function')?esc(x):String(x==null?'':x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  // ══ ROLE ASSIGN: client delete+insert → verify → fallback /api/set-role ══
  window.openUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
    if(!g('ushRole9Modal')){
      document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="ushRole9Modal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()">'+
      '<div class="modal-handle"></div><div class="modal-title">🏷️ Assign Role to Member <span class="admin-only">Leader/Admin</span></div>'+
      '<div class="form-group"><label class="form-label">Member</label><select class="form-select" id="ushRole9Member"></select></div>'+
      '<div class="form-group"><label class="form-label">Role</label><select class="form-select" id="ushRole9Role"><option>member</option><option>leader</option><option>chairman</option><option>secretary</option><option>treasurer</option></select></div>'+
      '<div class="form-group"><label class="form-label">Or type ANY role</label><input class="form-input" id="ushRole9Custom" placeholder="e.g. Sound Engineer"></div>'+
      '<button class="btn btn-warm btn-block" onclick="assignUshRole9()">Assign</button>'+
      '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button></div></div>');
    }
    sb.from('ushirika_members').select('*').eq('ushirika_id',ushId).then(function(r){
      var rows=r.data||[];window._ushRoleRows18=rows;
      var ids=rows.map(function(x){return x.user_id;}).filter(Boolean);
      var fill=function(pm){
        var sel=g('ushRole9Member');
        if(!rows.length){sel.innerHTML='<option value="">No members yet</option>';}
        else sel.innerHTML=rows.map(function(m,i){return '<option value="'+i+'">'+safeEsc((pm[m.user_id]||{}).name||'Member')+' ('+safeEsc(m.role||'member')+')</option>';}).join('');
        var c=g('ushRole9Custom');if(c)c.value='';
        openModal('ushRole9Modal');
      };
      if(!ids.length)return fill({});
      sb.from('profiles').select('id,name').in('id',ids).then(function(pr){var pm={};(pr.data||[]).forEach(function(p){pm[p.id]=p;});fill(pm);});
    });
  };

  window.assignUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
    var sel=g('ushRole9Member');
    var row=(window._ushRoleRows18||[])[parseInt(sel.value,10)];
    if(!row)return alert('Pick a member');
    var custom=(g('ushRole9Custom')||{value:''}).value.trim();
    var role=custom||g('ushRole9Role').value;
    if(!role)return alert('Pick or type a role');
    var uid=row.user_id;

    function refresh(){
      if(typeof loadUshMembers9==='function')loadUshMembers9(ushId);
      if(typeof renderUshLeaders9==='function')renderUshLeaders9();
      if(typeof loadMyMemberships9==='function')loadMyMemberships9();
    }
    function success(){
      (window._ushMembers9||[]).forEach(function(m){if(m.user_id===uid)m.role=role;});
      (window._ushRoleRows18||[]).forEach(function(m){if(m.user_id===uid)m.role=role;});
      (window._myUsh||[]).forEach(function(m){if(m.ushirika_id===ushId&&m.user_id===uid)m.role=role;});
      alert('✅ Role updated to '+role);closeModalDirect();refresh();setTimeout(refresh,1000);
    }
    function serverFallback(){
      sb.auth.getSession().then(function(s){
        var tok=s&&s.session?s.session.access_token:'';
        fetch('/api/set-role',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},
          body:JSON.stringify({userId:uid,ushirikaId:ushId,role:role})})
        .then(function(r){return r.json();})
        .then(function(j){ if(j&&j.ok)success(); else alert('⚠️ '+(j&&j.error?j.error:'Server error')); })
        .catch(function(e){alert('⚠️ '+e.message);});
      });
    }
    // 1) client delete+insert, 2) guaranteed server fallback
    sb.from('ushirika_members').delete().eq('user_id',uid).eq('ushirika_id',ushId).then(function(dr){
      if(dr.error)return serverFallback();
      sb.from('ushirika_members').insert([{user_id:uid,ushirika_id:ushId,role:role}]).then(function(ir){
        if(ir.error)return serverFallback();
        sb.from('ushirika_members').select('role').eq('user_id',uid).eq('ushirika_id',ushId).then(function(vr){
          var rows=vr.data||[];
          if(rows.length===1&&String(rows[0].role)===String(role))success();
          else serverFallback();
        });
      });
    });
  };

  // ══ SINGLE CALM MEETING WIDGETS (redraw ONLY on change) ══
  function meetSig(m,can){return JSON.stringify([m&&m.id,m&&m.meeting_date,m&&m.start_time,m&&m.end_time,m&&m.venue,m&&m.theme,can]);}
  function meetHTML(m,can,upd,del){
    var h='<div class="card card-cool" style="margin-bottom:14px"><div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';
    if(!m){h+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';}
    else{
      h+='<div style="font-size:.9rem;line-height:1.8">'+
        (m.meeting_date?'<div><b>📅 Date:</b> '+safeEsc(m.meeting_date)+'</div>':'')+
        (m.start_time?'<div><b>🕐 Time:</b> '+safeEsc(m.start_time)+(m.end_time?' – '+safeEsc(m.end_time):'')+'</div>':'')+
        (m.venue?'<div><b>📍 Venue:</b> '+safeEsc(m.venue)+'</div>':'')+
        (m.theme?'<div><b>🎯 Theme:</b> '+safeEsc(m.theme)+'</div>':'')+
        ((typeof mediaHTML==='function')?mediaHTML(mediaOf(m)):'')+'</div>';
    }
    if(can){
      h+='<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-warm btn-sm" onclick="'+upd+'()"><i class="fas fa-edit"></i> Update</button>'+
        (m?'<button class="btn btn-danger btn-sm" onclick="'+del+'(\''+m.id+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+'</div>';
    }
    return h+'</div>';
  }
  function hideDupes(host,keepId){
    if(!host)return;
    var keep=g(keepId);
    var d14=g('deptWeekMeet14');if(d14)d14.style.display='none';
    var cards=host.querySelectorAll('.card');
    for(var i=0;i<cards.length;i++){
      var c=cards[i];
      if(/This Week'?s Meeting/i.test(c.textContent||'')&&!(keep&&keep.contains(c)))c.style.display='none';
    }
  }
  function calmUsh(ushId){
    if(!sb||!ushId)return;
    var box=g('ushWeekMeet9');if(!box)return;
    sb.from('weekly_meetings').select('*').eq('ushirika_id',ushId).order('created_at',{ascending:false}).limit(1).then(function(r){
      var m=(r.data&&r.data[0])||null;
      var can=false;try{can=isUshLeaderOf(ushId);}catch(e){}
      var sig=meetSig(m,can);
      if(box.dataset.sig18===sig)return;           // ← unchanged = no redraw
      box.dataset.sig18=sig;
      box.innerHTML=meetHTML(m,can,'openUshirikaMeetingEditor','delUshMeet18');
    });
  }
  function calmDept(deptId){
    if(!sb||!deptId)return;
    var host=g('home-mainDept');if(!host)return;
    var box=g('deptWeekMeet17');
    if(!box){box=document.createElement('div');box.id='deptWeekMeet17';host.insertBefore(box,host.firstChild.nextSibling||host.firstChild);}
    sb.from('weekly_meetings').select('*').eq('department_id',deptId).order('created_at',{ascending:false}).limit(1).then(function(r){
      var m=(r.data&&r.data[0])||null;
      var can=false;try{can=isDeptLeader9(deptId);}catch(e){}
      var sig=meetSig(m,can);
      if(box.dataset.sig18===sig)return;           // ← unchanged = no redraw
      box.dataset.sig18=sig;
      if(m)window._curMeetingId=m.id;
      box.innerHTML=meetHTML(m,can,"openDeptMeetingEditor18","delDeptMeet18");
      hideDupes(host,'deptWeekMeet17');
    });
  }
  window.openDeptMeetingEditor18=function(id){if(typeof openDeptMeetingEditor==='function')openDeptMeetingEditor(id||window.currentDeptId);};
  window.delUshMeet18=function(mid){
    var ushId=window._curUshForumId;
    if(!mid||!(typeof isUshLeaderOf==='function'&&isUshLeaderOf(ushId)))return alert('🚫 Leader/admin only.');
    if(!confirm('Delete this meeting?'))return;
    sb.from('weekly_meetings').delete().eq('id',mid).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Deleted');var b=g('ushWeekMeet9');if(b)b.dataset.sig18='';calmUsh(ushId);
    });
  };
  window.delDeptMeet18=function(mid){
    var deptId=window.currentDeptId;
    if(!mid||!(typeof isDeptLeader9==='function'&&isDeptLeader9(deptId)))return alert('🚫 Leader/admin only.');
    if(!confirm('Delete this meeting?'))return;
    sb.from('weekly_meetings').delete().eq('id',mid).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Deleted');var b=g('deptWeekMeet17');if(b)b.dataset.sig18='';calmDept(deptId);
    });
  };
  // hook renders to EVENTS ONLY (open/save/delete) — no intervals, no flicker
  var _o1=window.openUshirikaForum;
  window.openUshirikaForum=function(id){var r=_o1?_o1.apply(this,arguments):undefined;setTimeout(function(){calmUsh(id);},700);return r;};
  var _o2=window.openDeptForum;
  window.openDeptForum=function(id){var r=_o2?_o2.apply(this,arguments):undefined;setTimeout(function(){calmDept(id);},700);return r;};
  var _s1=window.saveUshMeeting9;
  window.saveUshMeeting9=function(){var r=_s1?_s1.apply(this,arguments):undefined;setTimeout(function(){var b=g('ushWeekMeet9');if(b)b.dataset.sig18='';calmUsh((g('um9Pick')||{value:window._curUshForumId}).value);},900);return r;};
  var _s2=window.saveDeptMeeting9;
  window.saveDeptMeeting9=function(){var r=_s2?_s2.apply(this,arguments):undefined;setTimeout(function(){var b=g('deptWeekMeet17');if(b)b.dataset.sig18='';calmDept((g('dm9Pick')||{value:window.currentDeptId}).value);},900);return r;};
  var _u=window.updateMeeting;
  window.updateMeeting=function(){var r=_u?_u.apply(this,arguments):undefined;setTimeout(function(){var a=g('ushWeekMeet9');if(a)a.dataset.sig18='';var b=g('deptWeekMeet17');if(b)b.dataset.sig18='';calmUsh(window._curUshForumId);calmDept(window.currentDeptId);},900);return r;};
  // keep duplicates hidden (light DOM-only sweep, no network)
  setInterval(function(){try{hideDupes(g('home-mainDept'),'deptWeekMeet17');}catch(e){}},2500);
})();
console.log('✝️ app18.js active');
