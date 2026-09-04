// app11.js — targeted fixes: titles-constraint-safe role catalog + ushirika member names/chat
console.log('✝️ app11.js targeted fixes loading...');

// ── 1) Group role catalog WITHIN titles_category_check ──
// store as category 'ushirika'/'department' with name = "<groupId>::<RoleName>"
window.saveUshAddRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  var v=(document.getElementById('ushRole9Name').value||'').trim();if(!v)return alert('Type a role name');
  sb.from('titles').insert([{name:ushId+'::'+v,category:'ushirika',created_by:user.id}]).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role "'+v+'" added to this ushirika');
    document.getElementById('ushRole9Name').value='';
    refreshGroupRoleList9('ushirika','ushRole9List','ush');
  });
};
window.saveDeptAddRole9=function(){
  var deptId=currentDeptId;if(!isDeptLeader9(deptId))return alert('🚫 Not permitted.');
  var v=(document.getElementById('deptRole9Name').value||'').trim();if(!v)return alert('Type a role name');
  sb.from('titles').insert([{name:deptId+'::'+v,category:'department',created_by:user.id}]).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role "'+v+'" added to this department');
    document.getElementById('deptRole9Name').value='';
    refreshGroupRoleList9('department','deptRole9List','dept');
  });
};
window.refreshGroupRoleList9=function(cat,boxId,kind){
  var gid=(kind==='ush')?window._curUshForumId:currentDeptId;
  sb.from('titles').select('*').eq('category',cat).then(function(r){
    var list=(r.data||[]).filter(function(t){return t.name.indexOf(gid+'::')===0;});
    var box=document.getElementById(boxId);if(!box)return;
    box.innerHTML=list.length?list.map(function(t){
      var nm=t.name.split('::')[1]||t.name;
      return '<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><span class="dept-role-badge '+slug9(nm)+'">'+esc(nm)+'</span><button class="post-delete" onclick="delGroupRole9(\''+t.id+'\',\''+cat+'\',\''+boxId+'\',\''+kind+'\')"><i class="fas fa-trash"></i></button></div>';
    }).join(''):'<div style="color:var(--text-lighter);font-size:.8rem">No custom roles yet.</div>';
  });
};
window.fillRoleSelect9=function(sel,cat){
  if(!sel)return;
  var gid=cat.split(':')[1]||'';
  var kind=(cat.indexOf('ush')===0)?'ushirika':'department';
  var have={};for(var i=0;i<sel.options.length;i++)have[sel.options[i].value.toLowerCase()]=1;
  sb.from('titles').select('*').eq('category',kind).then(function(r){
    (r.data||[]).forEach(function(t){
      if(t.name.indexOf(gid+'::')!==0)return;
      var nm=t.name.split('::')[1];
      if(nm&&!have[nm.toLowerCase()]){var o=document.createElement('option');o.value=nm;o.textContent=nm+' (group)';sel.appendChild(o);have[nm.toLowerCase()]=1;}
    });
  });
  (titlesData||[]).forEach(function(t){
    var n=String(t.name);if(n.indexOf('::')>-1)return;
    if(!have[n.toLowerCase()]){var o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);have[n.toLowerCase()]=1;}
  });
};
window.addCustomOptions9=function(sel){
  if(!sel)return;
  var have={};for(var i=0;i<sel.options.length;i++)have[sel.options[i].value.toLowerCase()]=1;
  (titlesData||[]).forEach(function(t){
    var n=String(t.name);if(n.indexOf('::')>-1)return;
    if(!have[n.toLowerCase()]){var o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);have[n.toLowerCase()]=1;}
  });
};
window.saveReusableRole9=function(inputId){
  if(!isAdmin())return alert('Admin only');
  var v=(document.getElementById(inputId).value||'').trim();if(!v)return alert('Type a role first');
  sb.from('titles').insert([{name:v,category:'church',created_by:user.id}]).then(function(r){
    if(r.error)return alert('⚠️ '+r.error.message);
    alert('✅ Role "'+v+'" saved for reuse');if(typeof loadTitles==='function')loadTitles();
  });
};

// ── 2) Ushirika members: names + Inbox WITHOUT FK embed ──
window.loadUshMembers9=function(ushId){
  if(!sb)return;
  sb.from('ushirika_members').select('*').eq('ushirika_id',ushId).then(function(r){
    window._ushMembers9=r.data||[];
    var ids=window._ushMembers9.map(function(m){return m.user_id;});
    var render=function(pm){
      window._ushMemberNames=pm;
      var box=document.getElementById('ushMembers9');if(!box)return;
      if(!window._ushMembers9.length){box.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-lighter)">No members yet.</div>';return;}
      box.innerHTML=window._ushMembers9.map(function(m){
        var nm=(pm[m.user_id]||{}).name||'Member';
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'+
          '<div class="official-avatar">'+ini(nm)+'</div>'+
          '<div style="flex:1"><div style="font-weight:700">'+esc(nm)+'</div><span class="dept-role-badge '+slug9(m.role)+'">'+esc(m.role||'member')+'</span></div>'+
          (m.user_id&&m.user_id!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+m.user_id+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+
          '</div>';
      }).join('');
      if(document.getElementById('ushLeaders9'))renderUshLeaders9();
    };
    if(ids.length){
      sb.from('profiles').select('id,name,role').in('id',ids).then(function(pr){
        var pm={};(pr.data||[]).forEach(function(p){pm[p.id]=p;});render(pm);
      });
    } else render({});
  });
};
window.renderUshLeaders9=function(){
  var box=document.getElementById('ushLeaders9');if(!box)return;
  var rows=(window._ushMembers9||[]).filter(function(m){return String(m.role||'').toLowerCase()!=='member';});
  var officials=(officialsData||[]).filter(function(o){return o.ushirika_id===window._curUshForumId;});
  var ids=rows.map(function(m){return m.user_id;}).concat(officials.map(function(o){return o.user_id;}));
  var row9=function(nm,role,uid,warm){
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'+
      '<div class="official-avatar"'+(warm?' style="background:var(--gradient-warm)"':'')+'>'+ini(nm)+'</div>'+
      '<div style="flex:1"><div style="font-weight:700">'+esc(nm)+'</div></div>'+
      '<span class="dept-role-badge '+slug9(role)+'">'+esc(role)+'</span>'+
      (uid&&uid!==user.id?'<button class="btn btn-sm btn-chat" onclick="openChatWith(\''+uid+'\')"><i class="fas fa-inbox"></i> Inbox</button>':'')+
      '</div>';
  };
  var build=function(pm){
    var html='';
    officials.forEach(function(o){html+=row9((pm[o.user_id]||{}).name||'Official',o.title,o.user_id,true);});
    rows.forEach(function(m){html+=row9((pm[m.user_id]||{}).name||'Member',m.role,m.user_id,true);});
    box.innerHTML=html||'<div style="text-align:center;padding:20px;color:var(--text-lighter)">No leadership yet.</div>';
  };
  if(ids.length){sb.from('profiles').select('id,name').in('id',ids).then(function(pr){var pm={};(pr.data||[]).forEach(function(p){pm[p.id]=p;});build(pm);});}
  else build({});
};
window.openUshRole9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  ensureUshModals9();
  fillRoleSelect9(document.getElementById('ushRole9Role'),'ush:'+ushId);
  var pm=window._ushMemberNames||{};
  document.getElementById('ushRole9Member').innerHTML=(window._ushMembers9||[]).map(function(m){
    return '<option value="'+m.id+'">'+esc((pm[m.user_id]||{}).name||'Member')+' ('+esc(m.role||'member')+')</option>';
  }).join('');
  openModal('ushRole9Modal');
};
window.openUshRemove9=function(){
  var ushId=window._curUshForumId;if(!isUshLeaderOf(ushId))return alert('🚫 Not permitted.');
  ensureUshModals9();
  var pm=window._ushMemberNames||{};
  document.getElementById('ushRemove9Member').innerHTML=(window._ushMembers9||[]).map(function(m){
    return '<option value="'+m.id+'">'+esc((pm[m.user_id]||{}).name||'Member')+'</option>';
  }).join('');
  openModal('ushRemove9Modal');
};
console.log('✝️ app11.js active');
