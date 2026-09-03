// app9.js — FORUM ACCESS & PENDING REQUESTS FIX
console.log('✝️ app9.js loading...');

// ═══════════════════════════════════════════════
// 1. MAKE DEPARTMENT CARDS TAPPABLE
// ═══════════════════════════════════════════════
function makeDeptCardsTappable(){
    var cards = document.querySelectorAll('.dept-card');
    cards.forEach(function(card){
        if(card.dataset.bound) return;
        card.dataset.bound = 'true';
        card.style.cursor = 'pointer';
        
        // Extract department ID from onclick or data attribute
        var onclickAttr = card.getAttribute('onclick');
        var deptId = card.dataset.deptId;
        
        if(onclickAttr){
            var match = onclickAttr.match(/'([^']+)'/);
            if(match) deptId = match[1];
        }
        
        if(deptId){
            card.onclick = function(e){
                e.preventDefault();
                e.stopPropagation();
                openDeptForum(deptId);
            };
        }
    });
}

// Open Department Forum
window.openDeptForum = function(deptId){
    if(!user){ alert('Please log in first'); return; }
    
    var dept = depts.find(function(d){ return d.id === deptId; });
    if(!dept){ alert('Department not found'); return; }
    
    // Check if user is member
    var isMember = deptMembersData.some(function(m){ 
        return m.user_id === user.id && m.department_id === deptId; 
    });
    
    if(!isMember && !isAdmin()){
        alert('You must be a member to access the forum. Request to join first.');
        return;
    }
    
    currentDeptId = deptId;
    
    // Update department header
    var deptName = document.getElementById('mainDeptName');
    if(deptName) deptName.textContent = dept.name;
    
    var deptDesc = document.getElementById('mainDeptDesc');
    if(deptDesc) deptDesc.textContent = dept.description || '';
    
    var deptMembers = document.getElementById('mainDeptMembers');
    if(deptMembers) deptMembers.textContent = (dept.member_count || 0) + ' members';
    
    var deptIcon = document.getElementById('mainDeptIcon');
    if(deptIcon) deptIcon.innerHTML = '<i class="fas '+(dept.icon||'fa-users')+'"></i>';
    
    // Show department page
    showSubPage('home-mainDept');
    
    // Load forum posts and members
    loadDeptPosts(deptId);
    loadDeptMembers(deptId);
};

// ═══════════════════════════════════════════════
// 2. ADD "MY DEPARTMENTS" SECTION
// ═══════════════════════════════════════════════
function addMyDepartmentsSection(){
    if(!user || !profile) return;
    
    var ushirikaSection = document.getElementById('ushirika-departments');
    if(!ushirikaSection) return;
    
    // Check if section already exists
    if(document.getElementById('myDeptsSection')) return;
    
    // Get user's departments
    var myDepts = deptMembersData.filter(function(m){ 
        return m.user_id === user.id; 
    });
    
    if(myDepts.length === 0) return;
    
    var section = document.createElement('div');
    section.id = 'myDeptsSection';
    section.className = 'my-depts-section';
    section.style.marginBottom = '20px';
    
    var html = '<div class="my-depts-header">' +
        '<div class="my-depts-title"><i class="fas fa-building"></i> My Departments</div>' +
        '<div class="my-depts-count">' + myDepts.length + '</div>' +
        '</div>' +
        '<div class="my-depts-scroll">';
    
    myDepts.forEach(function(m, idx){
        var dept = depts.find(function(d){ return d.id === m.department_id; });
        if(!dept) return;
        
        var altClass = idx % 3 === 0 ? 'alt1' : (idx % 3 === 1 ? 'alt2' : 'alt3');
        
        html += '<div class="my-dept-mini ' + altClass + '" onclick="openDeptForum(\'' + dept.id + '\')">' +
            '<div class="my-dept-mini-icon"><i class="fas '+(dept.icon||'fa-users')+'"></i></div>' +
            '<div class="my-dept-mini-name">' + esc(dept.name) + '</div>' +
            '<div class="my-dept-mini-role-badge">' + esc(m.role) + '</div>' +
            '</div>';
    });
    
    html += '</div>';
    section.innerHTML = html;
    
    // Insert before the "All Church Departments" section
    ushirikaSection.insertBefore(section, ushirikaSection.firstChild);
}

// ═══════════════════════════════════════════════
// 3. MAKE USHIRIKA CARDS TAPPABLE
// ═══════════════════════════════════════════════
function makeUshirikaCardsTappable(){
    var cards = document.querySelectorAll('.ushirika-card');
    cards.forEach(function(card){
        if(card.dataset.bound) return;
        card.dataset.bound = 'true';
        card.style.cursor = 'pointer';
        
        // Extract ushirika ID
        var onclickAttr = card.getAttribute('onclick');
        var ushId = card.dataset.ushirikaId;
        
        if(onclickAttr){
            var match = onclickAttr.match(/'([^']+)'/);
            if(match) ushId = match[1];
        }
        
        if(ushId){
            card.onclick = function(e){
                e.preventDefault();
                e.stopPropagation();
                openUshirikaForum(ushId);
            };
        }
    });
}

// Open Ushirika Forum
window.openUshirikaForum = function(ushId){
    if(!user){ alert('Please log in first'); return; }
    
    var ush = ushirikasData.find(function(u){ return u.id === ushId; });
    if(!ush){ alert('Ushirika not found'); return; }
    
    // Check if user is member
    if(profile.ushirika_id !== ushId && !isAdmin()){
        alert('You are not a member of this Ushirika');
        return;
    }
    
    // Switch to ushirika section and forum tab
    switchSection('ushirika');
    
    setTimeout(function(){
        var forumTab = document.querySelector('[onclick*="switchUshirikaTab"][onclick*="forum"]');
        if(forumTab) forumTab.click();
        
        // Load forum posts
        loadForumPosts();
    }, 300);
};

// ═══════════════════════════════════════════════
// 4. ADD "MY USHIRIKAS" SECTION
// ═══════════════════════════════════════════════
function addMyUshirikasSection(){
    if(!user || !profile || !profile.ushirika_id) return;
    
    var ushirikaMain = document.getElementById('ushirika-main');
    if(!ushirikaMain) return;
    
    // Check if section already exists
    if(document.getElementById('myUshSection')) return;
    
    var myUsh = ushirikasData.find(function(u){ return u.id === profile.ushirika_id; });
    if(!myUsh) return;
    
    var section = document.createElement('div');
    section.id = 'myUshSection';
    section.style.marginBottom = '20px';
    
    var html = '<div class="my-depts-section">' +
        '<div class="my-depts-header">' +
        '<div class="my-depts-title"><i class="fas fa-people-group"></i> My Ushirika</div>' +
        '</div>' +
        '<div class="ushirika-card" onclick="openUshirikaForum(\'' + myUsh.id + '\')" style="cursor:pointer">' +
        '<div class="ushirika-icon"><i class="fas fa-people-group"></i></div>' +
        '<div class="ushirika-info">' +
        '<div class="ushirika-name">' + esc(myUsh.name) + '</div>' +
        '<div class="ushirika-detail">' + esc(myUsh.location || '') + ' • ' + esc(myUsh.meeting_day || '') + '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    
    section.innerHTML = html;
    ushirikaMain.insertBefore(section, ushirikaMain.firstChild);
}

// ═══════════════════════════════════════════════
// 5. FIX PENDING REQUESTS DISPLAY
// ═══════════════════════════════════════════════
function fixPendingRequestsDisplay(){
    var adminPanel = document.getElementById('adminPendingRequests');
    if(!adminPanel) return;
    
    // Ensure the panel is visible for admins
    if(isAdmin()){
        adminPanel.style.display = 'block';
    }
    
    var container = document.getElementById('dyn-pending');
    if(!container){
        container = document.createElement('div');
        container.id = 'dyn-pending';
        adminPanel.appendChild(container);
    }
    
    if(!pendingData || !pendingData.length){
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-lighter)">No pending requests</div>';
        return;
    }
    
    container.innerHTML = pendingData.map(function(r){
        var targetName = r.target_name || 'Unknown';
        var userName = r.user_name || 'User';
        
        return '<div class="card" style="border-left:4px solid var(--primary);margin-bottom:12px">' +
            '<div style="font-weight:700;margin-bottom:6px">' + esc(userName) + ' wants to join</div>' +
            '<div style="font-size:.85rem;color:var(--text-light);margin-bottom:12px">' +
            '<i class="fas fa-building"></i> ' + esc(targetName) +
            '</div>' +
            '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-accent btn-sm" onclick="approvePendingRequest(\'' + r.id + '\')">' +
            '<i class="fas fa-check"></i> Approve</button>' +
            '<button class="btn btn-danger btn-sm" onclick="declinePendingRequest(\'' + r.id + '\')">' +
            '<i class="fas fa-times"></i> Decline</button>' +
            '</div></div>';
    }).join('');
}

// Approve Pending Request (Enhanced)
window.approvePendingRequest = function(requestId){
    if(!sb || !isAdmin()){ alert('Admin only'); return; }
    
    var request = pendingData.find(function(r){ return r.id === requestId; });
    if(!request){ alert('Request not found'); return; }
    
    // Update request status
    sb.from('pending_requests')
        .update({status: 'approved'})
        .eq('id', requestId)
        .then(function(){
            // Add user to department
            return sb.from('department_members').insert([{
                user_id: request.user_id,
                department_id: request.target_id,
                role: 'member'
            }]);
        })
        .then(function(){
            alert('✅ Request approved! User added to department.');
            loadPending();
            loadDeptMembers(request.target_id);
            loadMyDepts();
        })
        .catch(function(e){
            alert('Error: ' + e.message);
        });
};

// Decline Pending Request (Enhanced)
window.declinePendingRequest = function(requestId){
    if(!sb || !isAdmin()){ alert('Admin only'); return; }
    if(!confirm('Decline this request?')) return;
    
    sb.from('pending_requests')
        .update({status: 'declined'})
        .eq('id', requestId)
        .then(function(){
            alert('Request declined');
            loadPending();
        })
        .catch(function(e){
            alert('Error: ' + e.message);
        });
};

// ═══════════════════════════════════════════════
// 6. ENHANCE RENDER FUNCTIONS
// ═══════════════════════════════════════════════

// Override renderDepts to add click handlers
var origRenderDepts = window.renderDepts;
window.renderDepts = function(){
    if(origRenderDepts) origRenderDepts();
    setTimeout(makeDeptCardsTappable, 500);
    setTimeout(addMyDepartmentsSection, 600);
};

// Override renderUshirikas to add click handlers
var origRenderUshirikas = window.renderUshirikas;
window.renderUshirikas = function(){
    if(origRenderUshirikas) origRenderUshirikas();
    setTimeout(makeUshirikaCardsTappable, 500);
    setTimeout(addMyUshirikasSection, 600);
};

// Override renderPending to ensure proper display
var origRenderPending = window.renderPending;
window.renderPending = function(){
    if(origRenderPending) origRenderPending();
    setTimeout(fixPendingRequestsDisplay, 500);
};

// ═══════════════════════════════════════════════
// 7. CONTINUOUS INITIALIZATION
// ═══════════════════════════════════════════════
var initInterval = setInterval(function(){
    makeDeptCardsTappable();
    makeUshirikaCardsTappable();
    addMyDepartmentsSection();
    addMyUshirikasSection();
    fixPendingRequestsDisplay();
}, 2000);

// Stop after 30 seconds to avoid performance issues
setTimeout(function(){
    clearInterval(initInterval);
}, 30000);

console.log('✝️ app9.js loaded - Forum access & pending requests fixed');
