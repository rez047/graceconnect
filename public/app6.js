// app6.js — COMPLETE FIX: onboarding + registration + streak + service days + multiple pastors

// ═══════════════════════════════════════════════════════════
// 1. ONBOARDING & REGISTRATION FIXES
// ═══════════════════════════════════════════════════════════
window.nextOnboardingStep = function() {
  var steps = document.querySelectorAll('.onboarding-step');
  var dots  = document.querySelectorAll('.progress-dot');
  var step2Name = document.getElementById('ob-name');
  var step3Ush  = document.getElementById('ob-ushirika');

  var currentIdx = -1;
  steps.forEach(function(s, i){ if (s.classList.contains('active')) currentIdx = i; });

  if (currentIdx === 1) {
    if (!step2Name || !step2Name.value.trim()) { alert('Please enter your name'); return; }
  }
  if (currentIdx === 2) {
    if (!step3Ush || !step3Ush.value) { alert('Please select your ushirika'); return; }
  }

  steps.forEach(function(s){ s.classList.remove('active'); });
  dots.forEach(function(d){ d.classList.remove('active'); });

  if (currentIdx + 1 < steps.length) {
    steps[currentIdx + 1].classList.add('active');
    if (dots[currentIdx + 1]) dots[currentIdx + 1].classList.add('active');
  }
};

window.showApp = function() {
  var pub = document.getElementById('publicLanding');
  if (pub) pub.classList.add('hidden');
  var dec = document.getElementById('decisionOverlay'); if (dec) dec.style.display = 'none';
  var onb = document.getElementById('onboardingOverlay'); if (onb) onb.classList.remove('show');
  var log = document.getElementById('loginOverlay'); if (log) log.classList.remove('show');
  var header = document.querySelector('.app-header'); if (header) header.style.display = 'flex';
  var nav = document.querySelector('.bottom-nav'); if (nav) nav.style.display = 'flex';
  var main = document.querySelector('.main-content'); if (main) main.style.display = 'block';
  if (typeof loadAll === 'function') { try { loadAll(); } catch(e){} }
  if (typeof refreshRole === 'function') refreshRole();
};

window.completeOnboarding = async function() {
  var name     = (document.getElementById('ob-name')     || {}).value || '';
  var email    = (document.getElementById('ob-email')    || {}).value || '';
  var password = (document.getElementById('ob-password') || {}).value || '';
  var phone    = (document.getElementById('ob-phone')    || {}).value || '';
  var ush      = (document.getElementById('ob-ushirika') || {}).value || '';
  var pic      = window._pm && window._pm.profilePic;

  if (!name.trim() || !email.trim() || !password) {
    alert('Name, email and password are required');
    return;
  }

  try {
    var r = await sb.auth.signUp({
      email: email.trim(), password: password,
      options: { data: { name: name.trim() } }
    });
    if (r.error) throw r.error;
    if (!r.data || !r.data.user) throw new Error('No user returned');

    var uid = r.data.user.id;
    var profileRow = { id: uid, name: name.trim(), role: 'member', phone: phone.trim() || null };
    if (ush) profileRow.ushirika_id = ush;
    profileRow.streak_days = [];
    profileRow.streak_current = 0;
    profileRow.streak_longest = 0;

    if (pic) {
      try {
        var url = await uploadMediaFile(pic);
        profileRow.profile_pic = url;
        delete window._pm.profilePic;
      } catch(e){}
    }

    await sb.from('profiles').upsert(profileRow, { onConflict: 'id' });

    // Brevo verification (silent)
    var token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try {
      await sb.from('verification_tokens').insert([{ user_id: uid, email: email.trim(), token: token }]);
      fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email.trim(), name: name.trim(), token: token })
      }).catch(function(){});
    } catch(e){}

    var onb = document.getElementById('onboardingOverlay');
    if (onb) onb.classList.remove('show');
    localStorage.setItem('onboarded', 'true');

    alert('🎉 Welcome, ' + name + '! Your account is ready.');
    showApp();

  } catch (e) {
    console.error('completeOnboarding error:', e);
    alert('Sign up failed: ' + (e.message || e));
  }
};

window.doLogin = async function() {
  var email = (document.getElementById('login-email') || {}).value.trim();
  var pass  = (document.getElementById('login-password') || {}).value;
  if (!email || !pass) { alert('Email and password required'); return; }
  try {
    var r = await sb.auth.signInWithPassword({ email: email, password: pass });
    if (r.error) throw r.error;
    var log = document.getElementById('loginOverlay'); if (log) log.classList.remove('show');
    showApp();
  } catch (e) {
    alert('Login failed: ' + (e.message || e));
  }
};

window.startNewMember = function() {
  var dec = document.getElementById('decisionOverlay'); if (dec) dec.style.display = 'none';
  var onb = document.getElementById('onboardingOverlay');
  if (onb) {
    onb.classList.add('show');
    var steps = onb.querySelectorAll('.onboarding-step');
    var dots  = onb.querySelectorAll('.progress-dot');
    steps.forEach(function(s){ s.classList.remove('active'); });
    dots.forEach(function(d){ d.classList.remove('active'); });
    if (steps[0]) steps[0].classList.add('active');
    if (dots[0])  dots[0].classList.add('active');
  }
};

window.startExistingMember = function() {
  var dec = document.getElementById('decisionOverlay'); if (dec) dec.style.display = 'none';
  var log = document.getElementById('loginOverlay'); if (log) log.classList.add('show');
};

window.hideLogin = function() {
  var log = document.getElementById('loginOverlay'); if (log) log.classList.remove('show');
  var dec = document.getElementById('decisionOverlay'); if (dec) dec.style.display = 'flex';
};

(async function() {
  if (!window.sb) return;
  try {
    var r = await sb.auth.getSession();
    if (r.data && r.data.session) {
      showApp();
    }
  } catch(e){}
})();


// ═══════════════════════════════════════════════════════════
// 2. STREAK FIX (Only once per day, checks DB properly)
// ═══════════════════════════════════════════════════════════
window.updateStreak = function(){
  if(!user||!profile||!sb)return;
  var today=new Date(); today.setHours(0,0,0,0);
  var days=(profile.streak_days||[]).slice();
  var hasToday=days.some(function(d){return new Date(d).toDateString()===today.toDateString();});
  
  if(hasToday){
    var sc=document.getElementById('streakCount');
    if(sc)sc.textContent=(profile.streak_current||0)+' Days';
    var ps=document.getElementById('profileStreak');
    if(ps)ps.textContent=(profile.streak_current||0)+' Days';
    if(typeof highlightStreakDays === 'function') highlightStreakDays(days.map(function(x){return new Date(x);}));
    return;
  }
  
  var yesterday=new Date(today); yesterday.setDate(yesterday.getDate()-1);
  var hadYesterday=days.some(function(d){return new Date(d).toDateString()===yesterday.toDateString();});
  var newCount=hadYesterday?(profile.streak_current||0)+1:1;
  
  days.push(today.toISOString()); days=days.slice(-7);
  var longest=Math.max(profile.streak_longest||0,newCount);
  
  sb.from('profiles').update({
    streak_current:newCount, streak_longest:longest,
    streak_last_activity:new Date().toISOString(), streak_days:days
  }).eq('id',user.id).then(function(){
    profile.streak_current=newCount; profile.streak_days=days; profile.streak_longest=longest;
    var sc=document.getElementById('streakCount'); if(sc)sc.textContent=newCount+' Days';
    var ps=document.getElementById('profileStreak'); if(ps)ps.textContent=newCount+' Days';
    if(typeof highlightStreakDays === 'function') highlightStreakDays(days.map(function(x){return new Date(x);}));
    if(newCount===7&&!hadYesterday) alert('🎉 1-week streak!');
  });
};

(function(){
  var origRefresh=window.refreshRole;
  if(origRefresh){
    window.refreshRole=function(){
      return origRefresh().then(function(){
        if(user&&profile){
          var today=new Date(); today.setHours(0,0,0,0);
          var days=(profile.streak_days||[]);
          var hasToday=days.some(function(d){return new Date(d).toDateString()===today.toDateString();});
          if(!hasToday) updateStreak();
        }
      });
    };
  }
})();


// ═══════════════════════════════════════════════════════════
// 3. MULTIPLE PASTORS & SERVICE DAYS (Landing Page / Church Settings)
// ═══════════════════════════════════════════════════════════
var SERVICE_TYPES=['Main Service','Prayer','Fasting','Prayer & Fasting','Bible Study','Youth Service','Night Vigil','Outreach'];

window.loadFeatured = function(){
  if(!sb) return Promise.resolve();
  return sb.from('featured_people').select('*').order('sort').then(function(r){window._featured=r.data||[];}).catch(function(){window._featured=[];});
};

window.loadMinistries = function(){
  if(!sb) return Promise.resolve();
  return sb.from('ministries').select('*').order('created_at').then(function(r){window._ministries=r.data||[];}).catch(function(){window._ministries=[];});
};

var origRenderPublic = window.renderPublicLanding;
window.renderPublicLanding = function(){
  Promise.all([
    typeof loadChurchBranding === 'function' ? loadChurchBranding() : Promise.resolve(),
    typeof loadNewsArticles === 'function' ? loadNewsArticles() : Promise.resolve(),
    typeof loadGalleryItems === 'function' ? loadGalleryItems() : Promise.resolve(),
    typeof loadDocuments === 'function' ? loadDocuments() : Promise.resolve(),
    loadFeatured(),
    loadMinistries()
  ]).then(function(){
    if(origRenderPublic) origRenderPublic();
    
    var cb=window.churchBrandingData||{};
    
    var sig=document.querySelector('.pastor-signature');
    if(sig){
      var fp=window._featured||[];
      if(fp.length){
        sig.outerHTML='<div style="display:flex;flex-wrap:wrap;gap:12px" id="featuredPeople">'+
          fp.map(function(p){
            var pic=p.image_url?
              '<img src="'+p.image_url+'" style="width:56px;height:56px;border-radius:50%;object-fit:cover">':
              '<div class="pastor-avatar">'+ini(p.name)+'</div>';
            return '<div class="pastor-signature" style="flex:1;min-width:180px">'+
              pic+
              '<div><div class="pastor-name">'+esc(p.name)+'</div>'+
              '<div class="pastor-title">'+esc(p.role)+'</div></div></div>';
          }).join('')+
        '</div>';
      }
    }
    
    var sg=document.querySelector('.service-times-grid');
    if(sg){
      var svcs=cb.services||[];
      if(svcs.length){
        sg.innerHTML=svcs.map(function(s){
          return '<div class="service-card">'+
            '<div class="service-icon"><i class="fas fa-church"></i></div>'+
            '<div class="service-day">'+esc(s.day)+'</div>'+
            '<div class="service-time">'+esc(s.time)+'</div>'+
            '<div class="service-label">'+esc(s.type)+'</div>'+
          '</div>';
        }).join('');
      }
    }
  });
};

window.openLandingEditor = function(){
  if(!isSuper()) return alert('Super admin only');
  var DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  var html='<div class="modal-overlay show" id="landingEditor" onclick="if(event.target===this)this.remove()">'+
    '<div class="modal" onclick="event.stopPropagation()">'+
    '<div class="modal-handle"></div>'+
    '<div class="modal-title">⚙️ Edit Landing <span class="admin-only">Super</span></div>'+
    
    '<h4 style="margin:10px 0 6px">Featured People (Welcome section)</h4>'+
    '<div id="feList"></div>'+
    '<button class="btn btn-primary btn-sm" onclick="addFeaturedPicker()">+ Add Person</button>'+
    '<div id="fePicker" style="display:none" class="user-picker"></div>'+
    
    '<h4 style="margin:14px 0 6px">Church Photo (beside welcome)</h4>'+
    '<div class="media-upload" onclick="uploadChurchPhotoLanding()"><i class="fas fa-image"></i><span>Upload church photo</span></div>'+
    
    '<h4 style="margin:14px 0 6px">Services (day / time / type)</h4>'+
    '<div id="svcList"></div>'+
    '<div class="grid-2">'+
      '<select class="form-select" id="svcDay">'+
        DAYS.map(function(d){return '<option value="'+d+'">'+d+'</option>';}).join('')+
      '</select>'+
      '<input class="form-input" id="svcTime" placeholder="Time e.g. 9:00 AM - 12:00 PM">'+
    '</div>'+
    '<input class="form-input" id="svcType" list="svcTypes" placeholder="Service type">'+
    '<datalist id="svcTypes">'+
      SERVICE_TYPES.map(function(t){return '<option value="'+t+'">';}).join('')+
    '</datalist>'+
    '<button class="btn btn-primary btn-sm" onclick="addServiceRow()">+ Add Service</button>'+
    
    '<h4 style="margin:14px 0 6px">Ministries (story + media)</h4>'+
    '<div id="minList"></div>'+
    '<input class="form-input" id="minName" placeholder="Ministry name" style="margin-bottom:6px">'+
    '<textarea class="form-textarea" id="minStory" placeholder="The story behind it..." rows="3"></textarea>'+
    '<div class="media-upload" onclick="if(typeof attachMediaTo===\'function\')attachMediaTo(\'minMedia\')"><i class="fas fa-cloud-upload-alt"></i><span>Ministry media (optional)</span></div>'+
    '<button class="btn btn-primary btn-sm" onclick="addMinistry()">+ Add Ministry</button>'+
    
    '<button class="btn btn-secondary-alt btn-block" style="margin-top:14px" onclick="document.getElementById(\'landingEditor\').remove()">Close</button>'+
    '</div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
  refreshLandingEditorLists();
};

window.refreshLandingEditorLists = function(){
  var fl=document.getElementById('feList');
  if(fl) fl.innerHTML=(window._featured||[]).map(function(p){
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b>'+esc(p.name)+'</b> <span style="color:var(--text-light)">('+esc(p.role)+')</span><button class="post-delete" onclick="delFeatured(\''+p.id+'\')"><i class="fas fa-trash"></i></button></div>';
  }).join('')||'<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
  
  var sv=document.getElementById('svcList');
  var cb=window.churchBrandingData||{};
  var svcs=cb.services||[];
  if(sv) sv.innerHTML=svcs.map(function(s,i){
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+esc(s.day)+' • '+esc(s.time)+' • '+esc(s.type)+'<button class="post-delete" onclick="delService('+i+')"><i class="fas fa-trash"></i></button></div>';
  }).join('')||'<div style="color:var(--text-lighter);font-size:.8rem">None.</div>';
  
  var ml=document.getElementById('minList');
  if(ml) ml.innerHTML=(window._ministries||[]).map(function(m){
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b>'+esc(m.name)+'</b><button class="post-delete" onclick="delMinistry(\''+m.id+'\')"><i class="fas fa-trash"></i></button></div>';
  }).join('')||'<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
};

window.addFeaturedPicker = function(){
  var pk=document.getElementById('fePicker');
  pk.style.display=pk.style.display==='none'?'block':'none';
  sb.from('profiles').select('id,name,role,profile_pic').order('name').then(function(r){
    pk.innerHTML=(r.data||[]).map(function(u){
      return '<div class="user-pick-item" onclick="addFeatured(\''+u.id+'\')"><div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">'+ini(u.name)+'</div><div style="flex:1"><div style="font-weight:600">'+esc(u.name)+'</div><div style="font-size:.7rem;color:var(--text-light)">'+esc(u.role)+'</div></div></div>';
    }).join('');
  });
};

window.addFeatured = function(uid){
  sb.from('profiles').select('*').eq('id',uid).single().then(function(r){
    var p=r.data||{};
    return sb.from('featured_people').insert([{user_id:uid,name:p.name,role:p.role,image_url:p.profile_pic||null}]);
  }).then(function(){
    alert('✅ Added');
    loadFeatured().then(refreshLandingEditorLists);
  });
};

window.delFeatured = function(id){
  sb.from('featured_people').delete().eq('id',id).then(function(){
    loadFeatured().then(refreshLandingEditorLists);
  });
};

window.uploadChurchPhotoLanding = function(){
  var i=document.createElement('input');
  i.type='file';i.accept='image/*';
  i.onchange=function(){
    if(i.files&&i.files[0]) uploadMediaFile(i.files[0]).then(function(url){
      return sb.from('church_settings').upsert({id:1,church_photo_url:url});
    }).then(function(){
      alert('✅ Church photo saved');
      if(typeof loadChurchBranding === 'function') loadChurchBranding();
    });
  };
  i.click();
};

window.addServiceRow = function(){
  var cb=window.churchBrandingData||{};
  var svcs=(cb.services||[]).slice();
  svcs.push({
    day:document.getElementById('svcDay').value,
    time:document.getElementById('svcTime').value,
    type:document.getElementById('svcType').value||'Main Service'
  });
  sb.from('church_settings').upsert({id:1,services:svcs}).then(function(){
    alert('✅ Service added');
    if(typeof loadChurchBranding === 'function') loadChurchBranding().then(refreshLandingEditorLists);
  });
};

window.delService = function(i){
  var cb=window.churchBrandingData||{};
  var svcs=(cb.services||[]).slice();
  svcs.splice(i,1);
  sb.from('church_settings').upsert({id:1,services:svcs}).then(function(){
    if(typeof loadChurchBranding === 'function') loadChurchBranding().then(refreshLandingEditorLists);
  });
};

window.addMinistry = function(){
  var n=document.getElementById('minName').value.trim();
  if(!n) return alert('Name required');
  var story=document.getElementById('minStory').value;
  var media=window._pm&&window._pm.minMedia;
  var doIt=function(url){
    return sb.from('ministries').insert([{name:n,story:story,media_url:url||null}]).then(function(){
      alert('✅ Ministry added');
      loadMinistries().then(refreshLandingEditorLists);
    });
  };
  if(media){
    uploadMediaFile(media).then(function(u){delete window._pm.minMedia;return doIt(u);}).catch(function(){return doIt(null);});
  } else doIt(null);
};

window.delMinistry = function(id){
  sb.from('ministries').delete().eq('id',id).then(function(){
    loadMinistries().then(refreshLandingEditorLists);
  });
};
// ══════════ FIX: onboarding ushirika dropdown (anon read + "Other" failsafe) ══════════
window.loadUshirikasForOnboarding = function(){
  if(!window.sb) return;
  sb.from('ushirikas').select('*').order('name').then(function(r){
    var sel=document.getElementById('ob-ushirika'); if(!sel) return;
    var h='<option value="">-- Select Ushirika --</option>';
    (r.data||[]).forEach(function(u){ h+='<option value="'+u.id+'">'+esc(u.name)+'</option>'; });
    h+='<option value="other">Other / Not listed (failsafe)</option>';
    sel.innerHTML=h;
  }).catch(function(){});
};
loadUshirikasForOnboarding(); // run immediately, even logged-out

// ══════════ FIX: completeOnboarding handles "other" (no bad FK) ══════════
window.completeOnboarding = async function(){
  var name=(document.getElementById('ob-name')||{}).value||'';
  var email=(document.getElementById('ob-email')||{}).value||'';
  var pass=(document.getElementById('ob-password')||{}).value||'';
  var phone=(document.getElementById('ob-phone')||{}).value||'';
  var ush=(document.getElementById('ob-ushirika')||{}).value||'';
  if(!name.trim()||!email.trim()||!pass){alert('Name, email and password are required');return;}
  try{
    var r=await sb.auth.signUp({email:email.trim(),password:pass,options:{data:{name:name.trim()}}});
    if(r.error)throw r.error; if(!r.data||!r.data.user)throw new Error('No user');
    var uid=r.data.user.id;
    var row={id:uid,name:name.trim(),role:'member',phone:phone.trim()||null,streak_days:[],streak_current:0,streak_longest:0};
    if(ush && ush!=='other') row.ushirika_id=ush;
    if(ush==='other') row.ushirika_other='Other (not listed)';
    await sb.from('profiles').upsert(row,{onConflict:'id'});
    var onb=document.getElementById('onboardingOverlay'); if(onb)onb.classList.remove('show');
    localStorage.setItem('onboarded','true');
    alert('🎉 Welcome, '+name+'!');
    showApp();
  }catch(e){ alert('Sign up failed: '+(e.message||e)); }
};

// ══════════ FIX: join ANY ushirika after login, NO approval, multiple allowed ══════════
window.joinUshirika = function(id){
  if(!user) return alert('Log in first');
  sb.from('ushirika_members').insert([{user_id:user.id,ushirika_id:id,role:'member'}])
    .then(function(r){
      if(r.error && r.error.code==='23505') return alert('You already joined this ushirika.');
      if(r.error) return alert(r.error.message);
      alert('✅ Joined!'); loadMyUshirikas();
    });
};
window.leaveUshirika = function(id){
  if(!confirm('Leave this ushirika?'))return;
  sb.from('ushirika_members').delete().eq('user_id',user.id).eq('ushirika_id',id).then(function(){loadMyUshirikas();});
};
window.loadMyUshirikas = function(){
  if(!user)return;
  sb.from('ushirika_members').select('*, ushirikas(name)').eq('user_id',user.id).then(function(r){
    window._myUshirikas=r.data||[]; renderMyUshirikas();
  });
};
function renderMyUshirikas(){
  var box=document.getElementById('myUshirikasBox'); if(!box)return;
  var list=window._myUshirikas||[];
  if(!list.length){box.innerHTML='<div style="color:var(--text-lighter);font-size:.8rem">You have not joined any ushirika yet.</div>';return;}
  box.innerHTML=list.map(function(m){
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b>'+esc((m.ushirikas||{}).name)+'</b><span style="color:var(--text-light);font-size:.75rem">('+esc(m.role)+')</span><button class="post-delete" onclick="leaveUshirika(\''+m.ushirika_id+'\')"><i class="fas fa-sign-out-alt"></i></button></div>';
  }).join('');
}
window.openJoinUshirika = function(){
  sb.from('ushirikas').select('*').order('name').then(function(r){
    var h='<div class="modal-overlay show" id="joinUshModal" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">➕ Join a Ushirika</div>'
      +'<div style="margin-bottom:10px" id="myUshirikasBox"></div>'
      +'<div class="user-picker">';
    (r.data||[]).forEach(function(u){
      h+='<div class="user-pick-item" onclick="joinUshirika(\''+u.id+'\');this.classList.add(\'selected\')"><div class="ushirika-icon" style="width:36px;height:36px;font-size:.9rem"><i class="fas fa-church"></i></div><div style="flex:1"><div style="font-weight:600">'+esc(u.name)+'</div><div style="font-size:.7rem;color:var(--text-light)">'+esc(u.location||'')+'</div></div><i class="fas fa-plus" style="color:var(--primary)"></i></div>';
    });
    h+='</div><button class="btn btn-secondary-alt btn-block" style="margin-top:12px" onclick="document.getElementById(\'joinUshModal\').remove()">Close</button></div></div>';
    document.body.insertAdjacentHTML('beforeend',h);
    loadMyUshirikas();
  });
};

// Inject a "Join Ushirika" button into the Ushirika section
(function(){
  var sec=document.getElementById('section-ushirika');
  if(sec && !document.getElementById('joinUshBtn')){
    var b=document.createElement('button');
    b.id='joinUshBtn'; b.className='btn btn-primary btn-block'; b.style.marginBottom='14px';
    b.innerHTML='<i class="fas fa-plus"></i> Join a Ushirika';
    b.onclick=openJoinUshirika;
    var first=sec.querySelector('.admin-panel')||sec.querySelector('.tabs');
    if(first) sec.querySelector('.sub-page').insertBefore(b, first);
  }
})();

// Hook: after login/showApp, load my ushirikas
(function(){
  var origShow=window.showApp;
  window.showApp=function(){ if(origShow)origShow(); loadMyUshirikas(); };
})();

console.log('✝️ app6.js COMPLETE — Registration + Streak + Service Days + Multiple Pastors all fixed');
