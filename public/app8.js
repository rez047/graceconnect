// app8.js — COMPREHENSIVE NON-DESTRUCTIVE FIXES (GraceConnect)
// This file dynamically injects missing UI and fixes auth logic without touching core files.

// ═══════════════════════════════════════════════
// 1. FIX PENDING DEPARTMENT REQUESTS FOR ADMIN
// ═══════════════════════════════════════════════
function renderPendingFixed(){
    var p = document.getElementById('adminPendingRequests');
    if(!p || !pendingData) return;
    var c = document.getElementById('dyn-pending');
    if(!c){ c = document.createElement('div'); c.id='dyn-pending'; p.appendChild(c); }
    
    if(pendingData.length){
        c.innerHTML = pendingData.map(function(r){
            var targetName = r.target_name || (r.departments ? r.departments.name : 'Department');
            return '<div class="request-card"><b>'+esc(r.user_name||'User')+'</b> requested to join <b>'+esc(targetName)+'</b>' +
                   '<div class="request-actions" style="margin-top:8px;display:flex;gap:8px">' +
                   '<button class="btn btn-accent btn-sm" onclick="window._gcApprove(\''+r.id+'\')">Approve</button>' +
                   '<button class="btn btn-danger btn-sm" onclick="window._gcDecline(\''+r.id+'\')">Decline</button>' +
                   '</div></div>';
        }).join('');
        p.style.display = 'block';
    } else {
        c.innerHTML = '<div style="text-align:center;padding:15px;color:#94A3B8">No pending requests</div>';
    }
}
window.renderPending = renderPendingFixed;

// ═══════════════════════════════════════════════
// 2. USHIRIKA & DEPARTMENT TAPPING (Forum Navigation)
// ═══════════════════════════════════════════════
function addUshirikaClickHandlers(){
    setTimeout(function(){
        var cards = document.querySelectorAll('.ushirika-card');
        cards.forEach(function(card){
            if(card.dataset.bound) return;
            card.dataset.bound = "true";
            card.addEventListener('click', function(){
                if(window.switchSection) window.switchSection('ushirika');
            });
        });
    }, 1000);
}

// ═══════════════════════════════════════════════
// 3. USHIRIKA LEADER DASHBOARD: EDIT WEEKLY MEETING
// ═══════════════════════════════════════════════
function injectUshirikaEditBtn(){
    setTimeout(function(){
        var ushMain = document.getElementById('ushirika-main');
        if(ushMain && !document.getElementById('ushEditMeetingBtn')){
            var btn = document.createElement('button');
            btn.id = 'ushEditMeetingBtn';
            btn.className = 'btn btn-warm btn-block';
            btn.style.marginBottom = '12px';
            btn.innerHTML = '<i class="fas fa-calendar-alt"></i> Edit Ushirika Weekly Meeting';
            btn.onclick = function(){ if(window.openUshirikaMeetingEditor) window.openUshirikaMeetingEditor(); };
            ushMain.prepend(btn);
        }
    }, 1500);
}

// ═══════════════════════════════════════════════
// 4. AUTH UI STATE (Hide Header/Nav on Landing Page)
// ═══════════════════════════════════════════════
function handleAuthUI(isLoggedIn){
    var header = document.querySelector('.app-header'); // Member & Notif Icons
    var nav = document.querySelector('.bottom-nav'); // Home, Ushirika, Discover, etc.
    var fab = document.querySelector('.fab');
    var mainContent = document.querySelector('.main-content');
    var publicLanding = document.getElementById('publicLanding') || document.querySelector('.public-landing');
    
    if(isLoggedIn){
        if(header) header.style.display = '';
        if(nav) nav.style.display = '';
        if(fab) fab.style.display = '';
        if(mainContent) mainContent.style.display = '';
        if(publicLanding) publicLanding.classList.add('hidden');
    } else {
        if(header) header.style.display = 'none';
        if(nav) nav.style.display = 'none';
        if(fab) fab.style.display = 'none';
        if(mainContent) mainContent.style.display = 'none';
        if(publicLanding) publicLanding.classList.remove('hidden');
    }
}

function injectLoginBtn(){
    var heroBtns = document.querySelector('.hero-buttons');
    if(heroBtns && !document.getElementById('memberLoginBtn')){
        var btn = document.createElement('button');
        btn.id = 'memberLoginBtn';
        btn.className = 'btn btn-secondary-alt btn-lg';
        btn.style.marginTop = '16px';
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Already a Member? Log In';
        btn.onclick = function(){
            if(window.startExistingMember) window.startExistingMember();
            else if(window.showDecisionOverlay) window.showDecisionOverlay();
            else {
                var loginOv = document.getElementById('loginOverlay');
                if(loginOv) loginOv.classList.add('show');
            }
        };
        heroBtns.appendChild(btn);
    }
}

// Override boot/logout to handle visibility correctly
var origBoot8 = window.boot;
window.boot = function(){
    injectLoginBtn();
    if(origBoot8) origBoot8();
    if(window.sb){
        sb.auth.getSession().then(function(r){ handleAuthUI(!!(r.data && r.data.session)); });
        sb.auth.onAuthStateChange(function(evt, session){ handleAuthUI(!!session); });
    }
};

var origDoLogout = window.doLogout;
window.doLogout = function(){
    if(window.sb) sb.auth.signOut();
    localStorage.removeItem('onboarded');
    handleAuthUI(false);
    injectLoginBtn();
};

// ═══════════════════════════════════════════════
// 5. ARTICLES & TESTIMONIALS (Before Latest News)
// ═══════════════════════════════════════════════
function injectArticlesSection(){
    var newsSection = document.getElementById('news');
    if(newsSection && !document.getElementById('articlesTestimonials')){
        var sec = document.createElement('section');
        sec.id = 'articlesTestimonials';
        sec.className = 'content-section bg-light';
        sec.innerHTML = '<div class="container">' +
            '<div class="section-header"><h2 class="section-title">Articles & Testimonials</h2>' +
            (window.isSuper && window.isSuper() ? '<button class="btn btn-warm btn-sm" onclick="openModal(\'articleTestModal\')"><i class="fas fa-plus"></i> Add</button>' : '') +
            '</div>' +
            '<div class="news-grid" id="articlesGrid"><div style="text-align:center;padding:20px;color:var(--text-lighter)">No articles or testimonials yet.</div></div>' +
            '</div>';
        newsSection.parentNode.insertBefore(sec, newsSection);
    }
}

function injectArticleModal(){
    if(!document.getElementById('articleTestModal')){
        document.body.insertAdjacentHTML('beforeend',
        '<div class="modal-overlay" id="articleTestModal" onclick="if(event.target===this)closeModalDirect()">' +
          '<div class="modal" onclick="event.stopPropagation()">' +
            '<div class="modal-handle"></div>' +
            '<div class="modal-title">📖 Add Article / Testimonial</div>' +
            '<div class="form-group"><label class="form-label">Title</label><input class="form-input" id="atTitle"></div>' +
            '<div class="form-group"><label class="form-label">Content</label><textarea class="form-textarea" id="atContent" rows="4"></textarea></div>' +
            '<div class="form-group"><label class="form-label">Category</label><select class="form-select" id="atCategory"><option value="article">Article</option><option value="testimonial">Testimonial</option></select></div>' +
            '<div class="form-group"><label class="form-label">Media (Optional)</label><div class="media-upload" onclick="if(window.attachMediaTo) attachMediaTo(\'atMedia\')"><i class="fas fa-image"></i><span>Upload media</span></div></div>' +
            '<button class="btn btn-primary btn-block" onclick="saveArticleTest()">Publish</button>' +
            '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button>' +
          '</div>' +
        '</div>');
    }
}

window.saveArticleTest = function(){
    if(!window.sb || !window.isSuper || !window.isSuper()) return;
    var title = document.getElementById('atTitle').value.trim();
    var content = document.getElementById('atContent').value.trim();
    if(!title) return alert('Title required');
    var media = window._pm && window._pm.atMedia;
    var doIt = function(url){
        window.sb.from('news_articles').insert([{
            title: title, excerpt: content, content: content, 
            category: document.getElementById('atCategory').value,
            image_url: url || null, author_name: window.profile ? window.profile.name : 'Admin'
        }]).then(function(){
            alert('✅ Published!'); closeModalDirect();
            if(window.renderPublicLanding) window.renderPublicLanding();
        });
    };
    if(media){
        window.uploadMediaFile(media).then(function(u){ delete window._pm.atMedia; return doIt(u); }).catch(function(){ return doIt(null); });
    } else doIt(null);
};

function renderArticlesTest(){
    var grid = document.getElementById('articlesGrid');
    if(!grid || !window.newsArticlesData) return;
    var items = window.newsArticlesData.filter(function(n){ return n.category === 'article' || n.category === 'testimonial'; });
    if(!items.length){ grid.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-lighter)">No articles or testimonials yet.</div>'; return; }
    grid.innerHTML = items.map(function(n){
        return '<div class="news-card" onclick="openNewsArticle(\''+n.id+'\')"><div class="news-card-image">'+(n.image_url?'<img src="'+n.image_url+'" alt="'+esc(n.title)+'">':'<i class="fas fa-book-open"></i>')+'</div><div class="news-card-content"><span class="news-card-category">'+esc(n.category)+'</span><div class="news-card-title">'+esc(n.title)+'</div><div class="news-card-excerpt">'+esc(n.excerpt||'')+'</div></div></div>';
    }).join('');
}

// Hook into Discover rendering to populate Articles
var origRenderDiscover = window.renderDiscoverUploads;
window.renderDiscoverUploads = function(){ if(origRenderDiscover) origRenderDiscover(); setTimeout(renderArticlesTest, 500); };

// ═══════════════════════════════════════════════
// 6 & 7. LOCATIONS, BRANCHES & SOCIALS (Bottom of Landing Page)
// ═══════════════════════════════════════════════
function injectLocationsAndSocials(){
    var footer = document.querySelector('.site-footer');
    if(footer && !document.getElementById('locationsBranches')){
        var locSec = document.createElement('section');
        locSec.id = 'locationsBranches';
        locSec.className = 'content-section';
        locSec.innerHTML = '<div class="container"><div class="section-header"><h2 class="section-title text-center">Where We Are Located & Our Branches</h2></div><div id="branchesGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:30px"><div class="card" style="text-align:center"><h3>Main Campus</h3><p>Grace Community Church<br>Main Street, City Center</p></div><div class="card" style="text-align:center"><h3>North Branch</h3><p>Grace Chapel North<br>123 Faith Avenue</p></div></div></div>';
        footer.parentNode.insertBefore(locSec, footer);

        var socSec = document.createElement('section');
        socSec.id = 'socialsSection';
        socSec.className = 'content-section bg-light';
        socSec.innerHTML = '<div class="container" style="text-align:center"><h2 class="section-title text-center">Connect With Us</h2><p class="section-subtitle">Follow our journey on social media</p><div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-top:20px"><a href="#" target="_blank" style="width:50px;height:50px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;text-decoration:none;transition:transform .3s"><i class="fab fa-facebook-f"></i></a><a href="#" target="_blank" style="width:50px;height:50px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;text-decoration:none;transition:transform .3s"><i class="fab fa-instagram"></i></a><a href="#" target="_blank" style="width:50px;height:50px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;text-decoration:none;transition:transform .3s"><i class="fab fa-youtube"></i></a><a href="#" target="_blank" style="width:50px;height:50px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;text-decoration:none;transition:transform .3s"><i class="fab fa-twitter"></i></a><a href="#" target="_blank" style="width:50px;height:50px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;text-decoration:none;transition:transform .3s"><i class="fab fa-whatsapp"></i></a></div></div>';
        footer.parentNode.insertBefore(socSec, footer);
        
        setTimeout(function(){
            var links = socSec.querySelectorAll('a');
            links.forEach(function(l){ l.onmouseover = function(){ this.style.transform='scale(1.1)'; }; l.onmouseout = function(){ this.style.transform='scale(1)'; }; });
        }, 500);
    }
}

// ═══════════════════════════════════════════════
// INITIALIZATION LOOP
// ═══════════════════════════════════════════════
setInterval(function(){
    injectLoginBtn();
    injectUshirikaEditBtn();
    addUshirikaClickHandlers();
    injectArticlesSection();
    injectArticleModal();
    injectLocationsAndSocials();
}, 2000);

// Run Auth Check Immediately on Load
(function(){
    if(window.sb){
        sb.auth.getSession().then(function(r){ handleAuthUI(!!(r.data && r.data.session)); });
        sb.auth.onAuthStateChange(function(evt, session){ handleAuthUI(!!session); });
    } else {
        handleAuthUI(false);
    }
})();

console.log('✝️ app8.js loaded (All fixes applied safely)');
