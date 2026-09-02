// app5.js — LANDING PAGE LIVE DATA + SUPER ADMIN EDITOR (loads last, overrides renderPublicLanding)

var SERVICE_TYPES=['Main Service','Prayer','Fasting','Prayer & Fasting','Bible Study','Youth Service','Night Vigil','Outreach'];

function loadFeatured(){return sb.from('featured_people').select('*').order('sort').then(function(r){window._featured=r.data||[];}).catch(function(){window._featured=[];});}
function loadMinistries(){return sb.from('ministries').select('*').order('created_at').then(function(r){window._ministries=r.data||[];}).catch(function(){window._ministries=[];});}

// OVERRIDE landing render to show REAL data (works for logged-out visitors too)
window.renderPublicLanding=function(){
  Promise.all([loadChurchBranding(),loadNewsArticles(),loadGalleryItems(),loadDocuments(),loadFeatured(),loadMinistries()]).then(function(){
    var cb=window.churchBrandingData||{};
    // Names / tagline / welcome
    if(cb.church_name){var cn=document.getElementById('churchName');if(cn)cn.textContent=cb.church_name;var fc=document.getElementById('footerChurchName');if(fc)fc.textContent=cb.church_name;}
    if(cb.tagline){var tg=document.getElementById('churchTagline');if(tg)tg.textContent=cb.tagline;}
    if(cb.welcome_message){var wm=document.getElementById('welcomeMessage');if(wm)wm.textContent=cb.welcome_message;}
    // Church photo beside welcome
    var img=document.getElementById('pastorImage');var ph=document.getElementById('pastorPlaceholder');
    if(cb.church_photo_url&&img){img.src=cb.church_photo_url;img.style.display='block';if(ph)ph.style.display='none';}
    // Featured people (real users, name + role + picture)
    var sig=document.querySelector('.pastor-signature');
    if(sig){
      var fp=window._featured||[];
      if(fp.length){
        sig.outerHTML='<div style="display:flex;flex-wrap:wrap;gap:12px" id="featuredPeople">'+fp.map(function(p){
          var pic=p.image_url?'<img src="'+p.image_url+'" style="width:56px;height:56px;border-radius:50%;object-fit:cover">':'<div class="pastor-avatar">'+ini(p.name)+'</div>';
          return '<div class="pastor-signature" style="flex:1;min-width:180px">'+pic+'<div><div class="pastor-name">'+esc(p.name)+'</div><div class="pastor-title">'+esc(p.role)+'</div></div></div>';
        }).join('')+'</div>';
      }
    }
    // Services (editable days/times/types)
    var sg=document.querySelector('.service-times-grid');
    if(sg&&cb.services&&cb.services.length){
      sg.innerHTML=cb.services.map(function(s){return '<div class="service-card"><div class="service-icon"><i class="fas fa-church"></i></div><div class="service-day">'+esc(s.day)+'</div><div class="service-time">'+esc(s.time)+'</div><div class="service-label">'+esc(s.type)+'</div></div>';}).join('');
    }
    // Ministries (with story + media)
    var mg=document.getElementById('ministriesGrid');
    if(mg){
      var mins=window._ministries||[];
      mg.innerHTML=mins.length?mins.map(function(m){return '<div class="ministry-card" onclick="openMinistryStory(\''+m.id+'\')">'+(m.media_url?'<img src="'+m.media_url+'" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:10px">':'<div class="ministry-icon">'+(m.icon||'🏛️')+'</div>')+'<div class="ministry-name">'+esc(m.name)+'</div><div class="ministry-desc">'+esc((m.story||'').slice(0,80))+'...</div></div>';}).join(''):'<div style="grid-column:1/-1;text-align:center;color:var(--text-lighter);padding:30px">No ministries yet.</div>';
    }
    // Events preview: show upcoming + ongoing + completed to invite visitors
    var eg=document.getElementById('eventsPreviewGrid');
    if(eg){
      var ev=(window._eventsPreviewAll||[]);
      eg.innerHTML=ev.length?ev.map(function(e){return '<div class="event-preview-card"><div class="event-preview-date">📅 '+fdate(e.start_date)+' • '+esc(e.status)+'</div><div class="event-preview-title">'+esc(e.title)+'</div><div class="event-preview-desc">'+esc(e.description||'')+'</div></div>';}).join(''):'<div style="grid-column:1/-1;text-align:center;color:var(--text-lighter);padding:30px">No events yet.</div>';
    }
    // News / gallery / docs (from app3)
    if(window.renderDiscoverUploads)window.renderDiscoverUploads();
    // Super admin edit button
    if(isSuper()&&!document.getElementById('editLandingBtn')){
      var b=document.createElement('button');b.id='editLandingBtn';b.className='btn btn-warm';b.style.margin='10px auto';b.style.display='block';b.innerHTML='<i class="fas fa-edit"></i> Edit Landing (Super Admin)';b.onclick=openLandingEditor;
      var hero=document.querySelector('.hero-content');if(hero)hero.appendChild(b);
    }
  });
};
// Load ALL events for the public preview
function loadAllEventsForLanding(){return sb.from('events').select('*').order('start_date',{ascending:false}).then(function(r){window._eventsPreviewAll=r.data||[];}).catch(function(){window._eventsPreviewAll=[];});}
// hook into loadPublicData so events preview is populated
(function(){var orig=window.loadPublicData;window.loadPublicData=function(){return Promise.all([orig(),loadAllEventsForLanding()]);};})();

function openMinistryStory(id){var m=(window._ministries||[]).find(function(x){return x.id===id;});if(!m)return;
  var html=(m.media_url?'<img src="'+m.media_url+'" style="max-width:100%;border-radius:var(--radius);margin-bottom:12px">':'')+'<h2 style="font-family:Playfair Display,serif;margin-bottom:8px">'+esc(m.name)+'</h2><div style="line-height:1.8;white-space:pre-wrap">'+esc(m.story||'')+'</div>';
  document.getElementById('articleContent').innerHTML=html;openModal('articleModal');}

// ═══════ SUPER ADMIN LANDING EDITOR (injected modal) ═══════
function openLandingEditor(){
  var html='<div class="modal-overlay show" id="landingEditor" onclick="if(event.target===this)this.remove()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">⚙️ Edit Landing <span class="admin-only">Super</span></div>'
   +'<h4 style="margin:10px 0 6px">Featured People (Welcome section)</h4><div id="feList"></div>'
   +'<button class="btn btn-primary btn-sm" onclick="addFeaturedPicker()">+ Add Person</button><div id="fePicker" style="display:none" class="user-picker" ></div>'
   +'<h4 style="margin:14px 0 6px">Church Photo (beside welcome)</h4><div class="media-upload" onclick="uploadChurchPhotoLanding()"><i class="fas fa-image"></i><span>Upload church photo</span></div>'
   +'<h4 style="margin:14px 0 6px">Services (day / time / type)</h4><div id="svcList"></div>'
   +'<div class="grid-2"><input class="form-input" id="svcDay" placeholder="Day e.g. Sunday"><input class="form-input" id="svcTime" placeholder="Time e.g. 9AM-12PM"></div>'
   +'<input class="form-input" id="svcType" list="svcTypes" placeholder="Service type (or type new)"><datalist id="svcTypes">'+SERVICE_TYPES.map(function(t){return '<option value="'+t+'">';}).join('')+'</datalist>'
   +'<button class="btn btn-primary btn-sm" onclick="addServiceRow()">+ Add Service</button>'
   +'<h4 style="margin:14px 0 6px">Ministries (story + media)</h4><div id="minList"></div>'
   +'<input class="form-input" id="minName" placeholder="Ministry name" style="margin-bottom:6px">'
   +'<textarea class="form-textarea" id="minStory" placeholder="The story behind it..." rows="3"></textarea>'
   +'<div class="media-upload" onclick="attachMediaTo(\'minMedia\')"><i class="fas fa-cloud-upload-alt"></i><span>Ministry media (optional)</span></div>'
   +'<button class="btn btn-primary btn-sm" onclick="addMinistry()">+ Add Ministry</button>'
   +'<button class="btn btn-secondary-alt btn-block" style="margin-top:14px" onclick="document.getElementById(\'landingEditor\').remove()">Close</button></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
  refreshLandingEditorLists();
}
function refreshLandingEditorLists(){
  var fl=document.getElementById('feList');if(fl)fl.innerHTML=(window._featured||[]).map(function(p){return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b>'+esc(p.name)+'</b> <span style="color:var(--text-light)">('+esc(p.role)+')</span><button class="post-delete" onclick="delFeatured(\''+p.id+'\')"><i class="fas fa-trash"></i></button></div>';}).join('')||'<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
  var sv=document.getElementById('svcList');var cb=window.churchBrandingData||{};var svcs=cb.services||[];
  if(sv)sv.innerHTML=svcs.map(function(s,i){return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+esc(s.day)+' • '+esc(s.time)+' • '+esc(s.type)+'<button class="post-delete" onclick="delService('+i+')"><i class="fas fa-trash"></i></button></div>';}).join('')||'<div style="color:var(--text-lighter);font-size:.8rem">None.</div>';
  var ml=document.getElementById('minList');if(ml)ml.innerHTML=(window._ministries||[]).map(function(m){return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b>'+esc(m.name)+'</b><button class="post-delete" onclick="delMinistry(\''+m.id+'\')"><i class="fas fa-trash"></i></button></div>';}).join('')||'<div style="color:var(--text-lighter);font-size:.8rem">None yet.</div>';
}
function addFeaturedPicker(){
  var pk=document.getElementById('fePicker');pk.style.display=pk.style.display==='none'?'block':'none';
  sb.from('profiles').select('id,name,role,profile_pic').order('name').then(function(r){
    pk.innerHTML=(r.data||[]).map(function(u){return '<div class="user-pick-item" onclick="addFeatured(\''+u.id+'\')"><div class="post-avatar" style="width:32px;height:32px;font-size:.7rem">'+ini(u.name)+'</div><div style="flex:1"><div style="font-weight:600">'+esc(u.name)+'</div><div style="font-size:.7rem;color:var(--text-light)">'+esc(u.role)+'</div></div></div>';}).join('');
  });
}
function addFeatured(uid){
  var u=(usersData||[]).find(function(x){return x.id===uid;});
  sb.from('profiles').select('*').eq('id',uid).single().then(function(r){var p=r.data||{};
    return sb.from('featured_people').insert([{user_id:uid,name:p.name,role:p.role,image_url:p.profile_pic||null}]);
  }).then(function(){alert('✅ Added');loadFeatured().then(refreshLandingEditorLists);});
}
function delFeatured(id){sb.from('featured_people').delete().eq('id',id).then(function(){loadFeatured().then(refreshLandingEditorLists);});}
function uploadChurchPhotoLanding(){var i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=function(){if(i.files&&i.files[0])uploadMediaFile(i.files[0]).then(function(url){return sb.from('church_settings').upsert({id:1,church_photo_url:url});}).then(function(){alert('✅ Church photo saved');loadChurchBranding();});};i.click();}
function addServiceRow(){var cb=window.churchBrandingData||{};var svcs=(cb.services||[]).slice();svcs.push({day:document.getElementById('svcDay').value,time:document.getElementById('svcTime').value,type:document.getElementById('svcType').value||'Main Service'});
  sb.from('church_settings').upsert({id:1,services:svcs}).then(function(){alert('✅ Service added');loadChurchBranding().then(refreshLandingEditorLists);});}
function delService(i){var cb=window.churchBrandingData||{};var svcs=(cb.services||[]).slice();svcs.splice(i,1);sb.from('church_settings').upsert({id:1,services:svcs}).then(function(){loadChurchBranding().then(refreshLandingEditorLists);});}
function addMinistry(){var n=document.getElementById('minName').value.trim();if(!n)return alert('Name required');var story=document.getElementById('minStory').value;var media=window._pm&&window._pm.minMedia;
  var doIt=function(url){return sb.from('ministries').insert([{name:n,story:story,media_url:url||null}]).then(function(){alert('✅ Ministry added');loadMinistries().then(refreshLandingEditorLists);});};
  if(media){uploadMediaFile(media).then(function(u){delete window._pm.minMedia;return doIt(u);}).catch(function(){return doIt(null);});}else doIt(null);}
function delMinistry(id){sb.from('ministries').delete().eq('id',id).then(function(){loadMinistries().then(refreshLandingEditorLists);});}

console.log('✝️ app5.js loaded (landing live data + super admin editor)');
