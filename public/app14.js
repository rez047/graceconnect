// app14.js — final close-out patch: department meeting render + robust ushirika role assignment
console.log('✝️ app14.js loading...');

(function(){
  function q(id){return document.getElementById(id);}
  function safeEsc(x){return (typeof esc==='function')?esc(x):String(x||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function safeIni(x){return (typeof ini==='function')?ini(x):String(x||'?').trim().slice(0,2).toUpperCase();}
  function safeSlug(x){return (typeof slug9==='function')?slug9(x):String(x||'member').toLowerCase().replace(/[^a-z0-9_-]+/g,'')||'member';}
  function safeMediaOf(p){
    if(typeof mediaOf==='function')return mediaOf(p);
    if(p&&p.media_url)return p.media_url;
    if(p&&p.media_urls){
      if(typeof p.media_urls==='string')return p.media_urls;
      if(Array.isArray(p.media_urls)&&p.media_urls.length)return p.media_urls[0];
    }
    return null;
  }
  function safeMediaHTML(u){
    if(typeof mediaHTML==='function')return mediaHTML(u);
    if(!u)return '';
    return '<div class="post-media"><a target="_blank" href="'+safeEsc(u)+'">📎 Open media</a></div>';
  }

  // ═════════════════════════════════════
  // 1) DEPARTMENT WEEKLY MEETING — SAME LOGIC AS USHIRIKA
  // ═════════════════════════════════════

  function removeOldDeptMeetingCards14(){
    var host=q('home-mainDept');
    if(!host)return;
    var cards=host.querySelectorAll('.card');
    cards.forEach(function(card){
      if(card.closest('#deptWeekMeet14'))return;
      var txt=card.textContent||'';
      if(/This Week'?s Meeting/i.test(txt)){
        card.style.display='none';
      }
    });
  }

  function ensureDeptWeekBox14(){
    var host=q('home-mainDept');
    if(!host)return null;

    removeOldDeptMeetingCards14();

    var box=q('deptWeekMeet14');
    if(box)return box;

    box=document.createElement('div');
    box.id='deptWeekMeet14';

    // Put it near the top, after any leader edit button if present.
    var after=q('deptEditMeetBtn');
    if(after && after.parentNode===host){
      after.insertAdjacentElement('afterend',box);
    }else{
      host.insertBefore(box,host.firstChild);
    }
    return box;
  }

  window.renderDeptWeekMeet14=function(deptId){
    deptId=deptId||window.currentDeptId;
    if(!sb||!deptId)return;

    var box=ensureDeptWeekBox14();
    if(!box)return;

    box.innerHTML=
      '<div class="card card-cool" style="margin-bottom:14px">'+
      '<div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>'+
      '<div style="text-align:center;padding:14px;color:var(--text-lighter)">Loading meeting...</div>'+
      '</div>';

    sb.from('weekly_meetings')
      .select('*')
      .eq('department_id',deptId)
      .order('created_at',{ascending:false})
      .limit(1)
      .then(function(r){
        if(r.error){
          box.innerHTML=
            '<div class="card card-cool" style="margin-bottom:14px">'+
            '<div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>'+
            '<div style="color:#991B1B">'+safeEsc(r.error.message)+'</div>'+
            '</div>';
          return;
        }

        var m=r.data&&r.data[0];
        var canEdit=false;
        try{canEdit=typeof isDeptLeader9==='function' && isDeptLeader9(deptId);}catch(e){canEdit=false;}

        var html='<div class="card card-cool" style="margin-bottom:14px">'+
          '<div class="section-title-app" style="margin-bottom:6px"><i class="fas fa-calendar-day"></i> This Week\'s Meeting</div>';

        if(!m){
          html+='<div style="text-align:center;padding:14px;color:var(--text-lighter)">No meeting scheduled yet</div>';
        }else{
          window._curMeetingId=m.id;
          html+='<div style="font-size:.9rem;line-height:1.8">'+
            (m.meeting_date?'<div><b>📅 Date:</b> '+safeEsc(m.meeting_date)+'</div>':'')+
            (m.start_time?'<div><b>🕐 Time:</b> '+safeEsc(m.start_time)+(m.end_time?' – '+safeEsc(m.end_time):'')+'</div>':'')+
            (m.venue?'<div><b>📍 Venue:</b> '+safeEsc(m.venue)+'</div>':'')+
            (m.theme?'<div><b>🎯 Theme:</b> '+safeEsc(m.theme)+'</div>':'')+
            safeMediaHTML(safeMediaOf(m))+
          '</div>';
        }

        if(canEdit){
          html+='<div style="display:flex;gap:8px;margin-top:10px">'+
            '<button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\''+deptId+'\')"><i class="fas fa-edit"></i> Update</button>'+
            (m?'<button class="btn btn-danger btn-sm" onclick="deleteDeptMeeting14(\''+m.id+'\',\''+deptId+'\')"><i class="fas fa-trash"></i> Delete</button>':'')+
          '</div>';
        }

        html+='</div>';
        box.innerHTML=html;
        removeOldDeptMeetingCards14();
      });
  };

  window.deleteDeptMeeting14=function(mid,deptId){
    deptId=deptId||window.currentDeptId;
    if(!mid||!deptId)return alert('No meeting selected');
    if(typeof isDeptLeader9==='function'&&!isDeptLeader9(deptId))return alert('🚫 Only department leader/admin can delete this meeting.');
    if(!confirm('Delete this department meeting?'))return;
    sb.from('weekly_meetings').delete().eq('id',mid).then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);
      alert('✅ Deleted');
      window._curMeetingId=null;
      renderDeptWeekMeet14(deptId);
    });
  };

  // Hook department opening.
  var _openDept14=window.openDeptForum;
  window.openDeptForum=function(deptId){
    var r=_openDept14?_openDept14.apply(this,arguments):undefined;
    setTimeout(function(){renderDeptWeekMeet14(deptId);},700);
    setTimeout(function(){renderDeptWeekMeet14(deptId);},1600);
    setTimeout(function(){renderDeptWeekMeet14(deptId);},3000);
    return r;
  };

  // Hook save/update so department meeting appears immediately after editing.
  var _saveDept14=window.saveDeptMeeting9;
  window.saveDeptMeeting9=function(){
    var deptId=(q('dm9Pick')&&q('dm9Pick').value)||window.currentDeptId;
    var r=_saveDept14?_saveDept14.apply(this,arguments):undefined;
    setTimeout(function(){renderDeptWeekMeet14(deptId);},900);
    setTimeout(function(){renderDeptWeekMeet14(deptId);},2000);
    return r;
  };

  var _updateMeeting14=window.updateMeeting;
  window.updateMeeting=function(){
    var deptId=window.currentDeptId;
    var r=_updateMeeting14?_updateMeeting14.apply(this,arguments):undefined;
    if(deptId){
      setTimeout(function(){renderDeptWeekMeet14(deptId);},900);
      setTimeout(function(){renderDeptWeekMeet14(deptId);},2000);
    }
    return r;
  };

  // ═════════════════════════════════════
  // 2) USHIRIKA ROLE ASSIGNMENT — ROBUST + VERIFIED
  // ═════════════════════════════════════

  function ensureUshRoleModal14(){
    if(q('ushRole9Modal'))return;

    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="ushRole9Modal" onclick="if(event.target===this)closeModalDirect()">'+
        '<div class="modal" onclick="event.stopPropagation()">'+
          '<div class="modal-handle"></div>'+
          '<div class="modal-title">🏷️ Assign Role to Member <span class="admin-only">Leader/Admin</span></div>'+
          '<div class="form-group">'+
            '<label class="form-label">Member</label>'+
            '<select class="form-select" id="ushRole9Member"></select>'+
          '</div>'+
          '<div class="form-group">'+
            '<label class="form-label">Role</label>'+
            '<select class="form-select" id="ushRole9Role">'+
              '<option value="member">member</option>'+
              '<option value="leader">leader</option>'+
              '<option value="chairman">chairman</option>'+
              '<option value="secretary">secretary</option>'+
              '<option value="treasurer">treasurer</option>'+
            '</select>'+
          '</div>'+
          '<div class="form-group">'+
            '<label class="form-label">Or type ANY role</label>'+
            '<input class="form-input" id="ushRole9Custom" placeholder="e.g. Sound Engineer">'+
          '</div>'+
          '<button class="btn btn-warm btn-block" onclick="assignUshRole9()">Assign</button>'+
        '</div>'+
      '</div>'
    );
  }

  function getUshRole14(){
    var custom=(q('ushRole9Custom')&&q('ushRole9Custom').value||'').trim();
    if(custom)return custom;
    return (q('ushRole9Role')&&q('ushRole9Role').value)||'member';
  }

  function fetchUshMembers14(ushId,cb){
    sb.from('ushirika_members').select('*').eq('ushirika_id',ushId).then(function(r){
      var members=r.data||[];
      window._ushMembers9=members;

      var ids=members.map(function(m){return m.user_id;}).filter(Boolean);
      if(!ids.length){
        window._ushMemberNames={};
        cb(members,{});
        return;
      }

      sb.from('profiles').select('id,name,role').in('id',ids).then(function(pr){
        var names={};
        (pr.data||[]).forEach(function(p){names[p.id]=p;});
        window._ushMemberNames=names;
        cb(members,names);
      });
    });
  }

  function fillUshRoleOptions14(ushId){
    var sel=q('ushRole9Role');
    if(!sel)return;

    var base=['member','leader','chairman','secretary','treasurer'];
    sel.innerHTML=base.map(function(x){return '<option value="'+safeEsc(x)+'">'+safeEsc(x)+'</option>';}).join('');

    // Group-specific roles saved as "<ushId>::Role" inside category "ushirika"
    if(sb){
      sb.from('titles').select('*').eq('category','ushirika').then(function(r){
        var have={};
        for(var i=0;i<sel.options.length;i++)have[String(sel.options[i].value).toLowerCase()]=1;

        (r.data||[]).forEach(function(t){
          var name=String(t.name||'');
          var role=null;

          if(name.indexOf(ushId+'::')===0){
            role=name.split('::').slice(1).join('::');
          }else if(name.indexOf('::')<0){
            role=name;
          }

          if(role&&!have[role.toLowerCase()]){
            var o=document.createElement('option');
            o.value=role;
            o.textContent=role;
            sel.appendChild(o);
            have[role.toLowerCase()]=1;
          }
        });
      });
    }
  }

  function renderUshMembersAndLeaders14(){
    var ushId=window._curUshForumId;
    if(!ushId||!sb)return;

    fetchUshMembers14(ushId,function(members,names){
      // Members tab
      var mb=q('ushMembers9');
      if(mb){
        if(!members.length){
          mb.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-lighter)">No members yet.</div>';
        }else{
          mb.innerHTML=members.map(function(m){
            var nm=(names[m.user_id]||{}).name||'Member';
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'+
              '<div class="official-avatar">'+safeIni(nm)+'</div>'+
              '<div style="flex:1">'+
                '<div style="font-weight:700">'+safeEsc(nm)+'</div>'+
                '<span class="dept-role-badge '+safeSlug(m.role)+'">'+safeEsc(m.role||'member')+'</span>'+
              '</div>'+
              (m.user_id&&user&&m.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+m.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+
            '</div>';
          }).join('');
        }
      }

      // Leadership tab = everyone whose role is not "member" + officials
      var lb=q('ushLeaders9');
      if(lb){
        var html='';
        var roleRows=members.filter(function(m){return String(m.role||'member').toLowerCase()!=='member';});

        roleRows.forEach(function(m){
          var nm=(names[m.user_id]||{}).name||'Member';
          html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'+
            '<div class="official-avatar" style="background:var(--gradient-warm)">'+safeIni(nm)+'</div>'+
            '<div style="flex:1"><div style="font-weight:700">'+safeEsc(nm)+'</div></div>'+
            '<span class="dept-role-badge '+safeSlug(m.role)+'">'+safeEsc(m.role)+'</span>'+
            (m.user_id&&user&&m.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+m.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+
          '</div>';
        });

        // Also include official records if they exist.
        var officials=(window.officialsData||[]).filter(function(o){return o.ushirika_id===ushId;});
        var officialIds=officials.map(function(o){return o.user_id;}).filter(Boolean);

        if(officialIds.length){
          sb.from('profiles').select('id,name').in('id',officialIds).then(function(pr){
            var op={};
            (pr.data||[]).forEach(function(p){op[p.id]=p;});

            officials.forEach(function(o){
              var nm=(op[o.user_id]||{}).name||'Official';
              html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'+
                '<div class="official-avatar" style="background:var(--gradient-warm)">'+safeIni(nm)+'</div>'+
                '<div style="flex:1"><div style="font-weight:700">'+safeEsc(nm)+'</div></div>'+
                '<span class="dept-role-badge '+safeSlug(o.title)+'">'+safeEsc(o.title||'Official')+'</span>'+
                (o.user_id&&user&&o.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+o.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+
              '</div>';
            });

            lb.innerHTML=html||'<div style="text-align:center;padding:20px;color:var(--text-lighter)">No leadership yet.</div>';
          });
        }else{
          lb.innerHTML=html||'<div style="text-align:center;padding:20px;color:var(--text-lighter)">No leadership yet.</div>';
        }
      }
    });
  }

  window.loadUshMembers9=function(ushId){
    window._curUshForumId=ushId||window._curUshForumId;
    renderUshMembersAndLeaders14();
  };

  window.renderUshLeaders9=function(){
    renderUshMembersAndLeaders14();
  };

  window.openUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(typeof isUshLeaderOf==='function'&&!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');

    ensureUshRoleModal14();

    fetchUshMembers14(ushId,function(members,names){
      var sel=q('ushRole9Member');
      if(!sel)return;

      sel.innerHTML=members.map(function(m){
        var nm=(names[m.user_id]||{}).name||'Member';
        // Store BOTH row-id and user-id. This avoids the previous mismatch permanently.
        return '<option value="'+safeEsc(m.user_id)+'" data-row-id="'+safeEsc(m.id||'')+'" data-user-id="'+safeEsc(m.user_id||'')+'">'+
          safeEsc(nm)+' ('+safeEsc(m.role||'member')+')'+
        '</option>';
      }).join('');

      fillUshRoleOptions14(ushId);

      var custom=q('ushRole9Custom');
      if(custom)custom.value='';

      if(typeof openModal==='function')openModal('ushRole9Modal');
      else q('ushRole9Modal').classList.add('show');
    });
  };

  window.assignUshRole9=function(){
    var ushId=window._curUshForumId;
    if(!ushId)return alert('Open a ushirika first.');
    if(typeof isUshLeaderOf==='function'&&!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');

    var sel=q('ushRole9Member');
    if(!sel||!sel.value)return alert('Pick a member');

    var opt=sel.options[sel.selectedIndex];
    var uid=(opt&&opt.getAttribute('data-user-id'))||sel.value;
    var rowId=(opt&&opt.getAttribute('data-row-id'))||'';
    var role=getUshRole14();

    if(!uid)return alert('Pick a valid member');
    if(!role)return alert('Pick or type a role');

    var updatePromise;
    if(rowId){
      updatePromise=sb.from('ushirika_members').update({role:role}).eq('id',rowId);
    }else{
      updatePromise=sb.from('ushirika_members').update({role:role}).eq('user_id',uid).eq('ushirika_id',ushId);
    }

    updatePromise.then(function(r){
      if(r.error)return alert('⚠️ '+r.error.message);

      // Verify from DB, but do NOT falsely fail if update() returns no rows.
      var verify=rowId
        ? sb.from('ushirika_members').select('*').eq('id',rowId).limit(1)
        : sb.from('ushirika_members').select('*').eq('user_id',uid).eq('ushirika_id',ushId).limit(1);

      verify.then(function(v){
        if(v.error)return alert('⚠️ '+v.error.message);

        var row=v.data&&v.data[0];
        if(!row){
          return alert('⚠️ Member row not found after update.');
        }

        if(String(row.role)!==String(role)){
          return alert('⚠️ Role was not saved. Current DB role is "'+row.role+'".');
        }

        // Update local state immediately so Leadership updates even before refetch finishes.
        (window._ushMembers9||[]).forEach(function(m){
          if((rowId&&m.id===rowId)||m.user_id===uid)m.role=role;
        });

        alert('✅ Role updated to '+role);
        if(typeof closeModalDirect==='function')closeModalDirect();

        renderUshMembersAndLeaders14();

        setTimeout(function(){renderUshMembersAndLeaders14();},800);
        setTimeout(function(){renderUshMembersAndLeaders14();},1800);

        if(typeof loadMyMemberships9==='function')loadMyMemberships9();
      });
    });
  };

  // Refresh leadership whenever tab is tapped.
  var _switchUshTab14=window.switchUshDetailTab;
  window.switchUshDetailTab=function(el,t){
    var r=_switchUshTab14?_switchUshTab14.apply(this,arguments):undefined;
    if((t==='members'||t==='leadership')&&window._curUshForumId){
      renderUshMembersAndLeaders14();
      setTimeout(renderUshMembersAndLeaders14,800);
    }
    return r;
  };



})();
console.log('✝️ app14.js active');
