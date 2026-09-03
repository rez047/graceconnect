// app9.js — COMPREHENSIVE USHIRIKA & DEPARTMENT FORUM FIXES
// Non-destructive fixes for forum access and pending requests

// ═══════════════════════════════════════════════
// 1. USHIRIKA FORUM ACCESS - Make cards tappable
// ═══════════════════════════════════════════════
function makeUshirikaCardsTappable(){
    setTimeout(function(){
        var ushirikaMain = document.getElementById('ushirika-main');
        if(!ushirikaMain) return;
        
        // Add "My Ushirikas" section if not exists
        var myUshSection = document.getElementById('myUshirikasSection');
        if(!myUshSection && user && profile){
            myUshSection = document.createElement('div');
            myUshSection.id = 'myUshirikasSection';
            myUshSection.style.cssText = 'margin-bottom:20px';
            myUshSection.innerHTML = '<div class="section-title-app"><i class="fas fa-users"></i> My Ushirikas</div><div id="myUshirikasList" style="display:flex;gap:12px;overflow-x:auto;padding:8px"></div>';
            ushirikaMain.prepend(myUshSection);
        }
        
        // Populate my Ushirikas
        var myList = document.getElementById('myUshirikasList');
        if(myList && profile && profile.ushirika_id){
            var myUsh = ushirikasData.find(function(u){ return u.id === profile.ushirika_id; });
            if(myUsh){
                myList.innerHTML = '<div class="ushirika-card" onclick="openUshirikaForum(\'' + myUsh.id + '\')" style="cursor:pointer;min-width:200px">' +
                    '<div class="ushirika-icon"><i class="fas fa-people-group"></i></div>' +
                    '<div class="ushirika-info"><div class="ushirika-name">' + esc(myUsh.name) + '</div>' +
                    '<div class="ushirika-detail">Tap to access forum</div></div></div>';
            }
        }
        
        // Make existing Ushirika cards tappable
        var cards = document.querySelectorAll('.ushirika-card');
        cards.forEach(function(card){
            if(!card.dataset.clickBound){
                card.dataset.clickBound = 'true';
                card.style.cursor = 'pointer';
                var ushId = card.dataset.ushirikaId || (card.closest('[data-ushirika-id]') ? card.closest('[data-ushirika-id]').dataset.ushirikaId : null);
                if(ushId){
                    card.onclick = function(){ openUshirikaForum(ushId); };
                }
            }
        });
    }, 1000);
}

// Open Ushirika Forum
window.openUshirikaForum = function(ushId){
    var ush = ushirikasData.find(function(u){ return u.id === ushId; });
    if(!ush){ alert('Ushirika not found'); return; }
    
    // Check if user is member
    if(!user || (profile.ushirika_id !== ushId && !isAdmin())){
        alert('You must be a member of this Ushirika to access the forum');
        return;
    }
    
    // Navigate to forum tab
    if(window.switchSection) window.switchSection('ushirika');
    setTimeout(function(){
        var forumTab = document.querySelector('[onclick*="switchUshirikaTab"][onclick*="forum"]');
        if(forumTab) forumTab.click();
    }, 300);
    
    // Load forum posts for this Ushirika
    loadUshirikaForumPosts(ushId);
};

// Load Ushirika Forum Posts
window.loadUshirikaForumPosts = function(ushId){
    if(!sb) return;
    sb.from('posts')
        .select('*, profiles(name,role)')
        .eq('ushirika_id', ushId)
        .order('created_at', {ascending: false})
        .then(function(r){
            var posts = r.data || [];
            var forum = document.getElementById('ushirika-forum');
            if(!forum) return;
            
            if(!posts.length){
                forum.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8">No posts yet. Start the conversation!</div>';
            } else {
                forum.innerHTML = posts.map(function(p){
                    var pr = p.profiles || {};
                    var liked = user && p.liked_by && p.liked_by.indexOf(user.id) > -1;
                    var canDel = (user && p.author_id === user.id) || isAdmin();
                    
                    return '<div class="post">' +
                        '<div class="post-header">' +
                        '<div class="post-avatar">' + ini(pr.name) + '</div>' +
                        '<div><div class="post-name">' + esc(pr.name || '') + '</div></div>' +
                        '<div class="post-time">' + ago(p.created_at) + '</div>' +
                        (canDel ? '<button class="post-delete" onclick="deleteUshPost(\'' + p.id + '\',\'' + ushId + '\')"><i class="fas fa-trash"></i></button>' : '') +
                        '</div>' +
                        '<div class="post-body">' + esc(p.content || '') + '</div>' +
                        (p.media_url ? '<div class="post-media"><img src="' + p.media_url + '"></div>' : '') +
                        '<div class="post-actions">' +
                        '<button class="post-action' + (liked ? ' liked' : '') + '" onclick="likeUshPost(\'' + p.id + '\',\'' + ushId + '\')"><i class="fas fa-heart"></i> ' + (p.likes || 0) + '</button>' +
                        '<button class="post-action" onclick="toggleUshComments(\'' + p.id + '\')"><i class="far fa-comment"></i> Comment</button>' +
                        '</div>' +
                        '<div class="comments-area" id="ush-comments-' + p.id + '" style="display:none"></div>' +
                        '</div>';
                }).join('');
            }
        });
};

// Post to Ushirika Forum
window.submitUshPost = function(ushId){
    if(!user || !sb) return alert('Log in first');
    var txt = document.getElementById('ushPostText');
    if(!txt || !txt.value.trim()) return alert('Write something');
    
    var media = window._pm && window._pm.ushForum;
    var doIt = function(url){
        sb.from('posts').insert([{
            author_id: user.id,
            ushirika_id: ushId,
            content: txt.value.trim(),
            media_url: url || null,
            likes: 0,
            liked_by: []
        }]).then(function(){
            txt.value = '';
            if(window._pm) delete window._pm.ushForum;
            closeModalDirect();
            loadUshirikaForumPosts(ushId);
            alert('Posted!');
        });
    };
    
    if(media){
        uploadMediaFile(media).then(function(u){ doIt(u); }).catch(function(){ doIt(null); });
    } else {
        doIt(null);
    }
};

// Like Ushirika Post
window.likeUshPost = function(postId, ushId){
    if(!user || !sb) return;
    sb.from('posts').select('liked_by').eq('id', postId).single().then(function(r){
        var liked = r.data.liked_by || [];
        var hasLiked = liked.indexOf(user.id) > -1;
        var newLiked = hasLiked ? liked.filter(function(id){ return id !== user.id; }) : liked.concat([user.id]);
        sb.from('posts').update({liked_by: newLiked, likes: newLiked.length}).eq('id', postId).then(function(){
            loadUshirikaForumPosts(ushId);
        });
    });
};

// Delete Ushirika Post
window.deleteUshPost = function(postId, ushId){
    if(!confirm('Delete this post?')) return;
    sb.from('posts').delete().eq('id', postId).then(function(){
        loadUshirikaForumPosts(ushId);
    });
};

// Toggle Ushirika Comments
window.toggleUshComments = function(postId){
    var c = document.getElementById('ush-comments-' + postId);
    if(!c) return;
    if(c.style.display === 'none'){
        c.style.display = 'block';
        loadUshPostComments(postId);
    } else {
        c.style.display = 'none';
    }
};

// Load Ushirika Post Comments
window.loadUshPostComments = function(postId){
    var c = document.getElementById('ush-comments-' + postId);
    if(!c || !sb) return;
    sb.from('post_comments').select('*, profiles(name)').eq('post_id', postId).order('created_at').then(function(r){
        var comments = r.data || [];
        var html = comments.map(function(x){
            var mine = user && x.user_id === user.id;
            return '<div class="comment-item">' +
                '<div class="comment-header">' +
                '<span class="comment-name">' + esc((x.profiles || {}).name) + '</span>' +
                '<span class="comment-time">' + ago(x.created_at) + '</span>' +
                ((isAdmin() || mine) ? '<button class="comment-delete" onclick="deleteUshComment(\'' + x.id + '\',\'' + postId + '\')"><i class="fas fa-times"></i></button>' : '') +
                '</div>' +
                '<div class="comment-text">' + esc(x.content) + '</div>' +
                '</div>';
        }).join('');
        
        html += '<div style="display:flex;gap:6px;margin-top:8px">' +
            '<input class="form-input" id="ush-comment-' + postId + '" placeholder="Add comment..." style="margin:0">' +
            '<button class="btn btn-sm btn-primary" onclick="addUshComment(\'' + postId + '\')">Send</button>' +
            '</div>';
        
        c.innerHTML = html;
    });
};

// Add Ushirika Comment
window.addUshComment = function(postId){
    if(!user || !sb) return;
    var inp = document.getElementById('ush-comment-' + postId);
    if(!inp || !inp.value.trim()) return;
    sb.from('post_comments').insert([{
        post_id: postId,
        user_id: user.id,
        content: inp.value.trim()
    }]).then(function(){
        inp.value = '';
        loadUshPostComments(postId);
    });
};

// Delete Ushirika Comment
window.deleteUshComment = function(commentId, postId){
    sb.from('post_comments').delete().eq('id', commentId).then(function(){
        loadUshPostComments(postId);
    });
};

// ═══════════════════════════════════════════════
// 2. DEPARTMENT FORUM & PENDING REQUESTS FIX
// ═══════════════════════════════════════════════

// Fix Pending Requests Display
function fixPendingRequests(){
    setTimeout(function(){
        var adminPanel = document.getElementById('adminPendingRequests');
        if(!adminPanel || !pendingData) return;
        
        var container = document.getElementById('dyn-pending');
        if(!container){
            container = document.createElement('div');
            container.id = 'dyn-pending';
            adminPanel.appendChild(container);
        }
        
        if(pendingData.length){
            container.innerHTML = pendingData.map(function(r){
                return '<div class="card" style="border-left:4px solid var(--primary)">' +
                    '<div style="font-weight:700;margin-bottom:8px">' + esc(r.user_name || 'User') + ' wants to join</div>' +
                    '<div style="font-size:.85rem;color:var(--text-light);margin-bottom:12px">Department: ' + esc(r.target_name || 'Unknown') + '</div>' +
                    '<div style="display:flex;gap:8px">' +
                    '<button class="btn btn-accent btn-sm" onclick="approvePending(\'' + r.id + '\')"><i class="fas fa-check"></i> Approve</button>' +
                    '<button class="btn btn-danger btn-sm" onclick="declinePending(\'' + r.id + '\')"><i class="fas fa-times"></i> Decline</button>' +
                    '</div></div>';
            }).join('');
        } else {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8">No pending requests</div>';
        }
    }, 1500);
}

// Approve Pending Request
window.approvePending = function(requestId){
    if(!sb || !isAdmin()) return;
    sb.from('pending_requests')
        .update({status: 'approved'})
        .eq('id', requestId)
        .then(function(){
            // Get the request details
            sb.from('pending_requests').select('*').eq('id', requestId).single().then(function(r){
                if(r.data && r.data.user_id && r.data.target_id){
                    // Add user to department
                    sb.from('department_members').insert([{
                        user_id: r.data.user_id,
                        department_id: r.data.target_id,
                        role: 'member'
                    }]).then(function(){
                        alert('✅ Request approved! User added to department.');
                        loadPending();
                        loadMyDepts();
                    });
                }
            });
        });
};

// Decline Pending Request
window.declinePending = function(requestId){
    if(!sb || !isAdmin()) return;
    if(!confirm('Decline this request?')) return;
    sb.from('pending_requests')
        .update({status: 'declined'})
        .eq('id', requestId)
        .then(function(){
            alert('Request declined');
            loadPending();
        });
};

// Make Department Cards Tappable
function makeDeptCardsTappable(){
    setTimeout(function(){
        var cards = document.querySelectorAll('.dept-card');
        cards.forEach(function(card){
            if(!card.dataset.clickBound){
                card.dataset.clickBound = 'true';
                card.style.cursor = 'pointer';
                var deptId = card.dataset.deptId || card.getAttribute('onclick')?.match(/'(.*?)'/)?.[1];
                if(deptId){
                    card.onclick = function(){ openDeptForum(deptId); };
                }
            }
        });
    }, 1000);
}

// Open Department Forum
window.openDeptForum = function(deptId){
    var dept = depts.find(function(d){ return d.id === deptId; });
    if(!dept){ alert('Department not found'); return; }
    
    // Check if user is member
    var isMember = deptMembersData.some(function(m){ return m.user_id === user.id && m.department_id === deptId; });
    if(!isMember && !isAdmin()){
        alert('You must be a member of this department to access the forum');
        return;
    }
    
    currentDeptId = deptId;
    
    // Update department header
    var deptName = document.getElementById('mainDeptName');
    if(deptName) deptName.textContent = dept.name;
    
    // Show department page
    showSubPage('home-mainDept');
    
    // Load forum posts
    loadDeptPosts(deptId);
    loadDeptMembers(deptId);
};

// ═══════════════════════════════════════════════
// 3. WEEKLY MEETING EDITING FOR LEADERS
// ═══════════════════════════════════════════════

// Check if user is department leader
function isDeptLeader(deptId){
    if(isAdmin()) return true;
    return deptMembersData.some(function(m){
        return m.user_id === user.id && m.department_id === deptId && 
               ['leader', 'chairman', 'secretary', 'treasurer'].indexOf(m.role) > -1;
    });
}

// Add Edit Meeting Button to Department
function addDeptMeetingEditBtn(){
    setTimeout(function(){
        var deptPage = document.getElementById('home-mainDept');
        if(!deptPage || !currentDeptId) return;
        
        var editBtn = document.getElementById('deptEditMeetingBtn');
        if(!editBtn && isDeptLeader(currentDeptId)){
            editBtn = document.createElement('button');
            editBtn.id = 'deptEditMeetingBtn';
            editBtn.className = 'btn btn-warm btn-block';
            editBtn.style.marginBottom = '12px';
            editBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Edit Weekly Meeting';
            editBtn.onclick = function(){ openDeptMeetingEditor(currentDeptId); };
            deptPage.insertBefore(editBtn, deptPage.firstChild);
        }
    }, 2000);
}

// Open Department Meeting Editor
window.openDeptMeetingEditor = function(deptId){
    if(!isDeptLeader(deptId)){
        alert('Only department leaders can edit meetings');
        return;
    }
    
    // Load existing meeting
    if(sb){
        sb.from('weekly_meetings')
            .select('*')
            .eq('department_id', deptId)
            .order('created_at', {ascending: false})
            .limit(1)
            .then(function(r){
                var meeting = r.data && r.data[0];
                openModal('deptMeetingModal');
                
                if(meeting){
                    document.getElementById('deptMeetDay').value = meeting.day || 'Saturday';
                    document.getElementById('deptMeetDate').value = meeting.date || '';
                    document.getElementById('deptMeetStart').value = meeting.start_time || '';
                    document.getElementById('deptMeetEnd').value = meeting.end_time || '';
                    document.getElementById('deptMeetVenue').value = meeting.venue || '';
                    document.getElementById('deptMeetTheme').value = meeting.theme || '';
                }
            });
    }
};

// Save Department Meeting
window.saveDeptMeeting = function(){
    if(!user || !sb || !currentDeptId) return;
    if(!isDeptLeader(currentDeptId)){
        alert('Only department leaders can edit meetings');
        return;
    }
    
    sb.from('weekly_meetings').insert([{
        department_id: currentDeptId,
        day: document.getElementById('deptMeetDay').value,
        date: document.getElementById('deptMeetDate').value || null,
        start_time: document.getElementById('deptMeetStart').value,
        end_time: document.getElementById('deptMeetEnd').value,
        venue: document.getElementById('deptMeetVenue').value,
        theme: document.getElementById('deptMeetTheme').value,
        created_by: user.id
    }]).then(function(){
        alert('✅ Meeting updated!');
        closeModalDirect();
    });
};

// Add Department Meeting Modal to HTML
function addDeptMeetingModal(){
    if(!document.getElementById('deptMeetingModal')){
        document.body.insertAdjacentHTML('beforeend',
        '<div class="modal-overlay" id="deptMeetingModal" onclick="if(event.target===this)closeModalDirect()">' +
          '<div class="modal" onclick="event.stopPropagation()">' +
            '<div class="modal-handle"></div>' +
            '<div class="modal-title">📅 Edit Department Weekly Meeting</div>' +
            '<div class="form-group"><label class="form-label">Day</label>' +
            '<select class="form-select" id="deptMeetDay">' +
            '<option>Saturday</option><option>Sunday</option><option>Monday</option>' +
            '<option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>' +
            '</select></div>' +
            '<div class="form-group"><label class="form-label">Date</label><input class="form-input" id="deptMeetDate" type="date"></div>' +
            '<div class="grid-2">' +
            '<div class="form-group"><label class="form-label">Start Time</label><input class="form-input" id="deptMeetStart" type="time"></div>' +
            '<div class="form-group"><label class="form-label">End Time</label><input class="form-input" id="deptMeetEnd" type="time"></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Venue</label><input class="form-input" id="deptMeetVenue"></div>' +
            '<div class="form-group"><label class="form-label">Theme</label><input class="form-input" id="deptMeetTheme"></div>' +
            '<button class="btn btn-primary btn-block" onclick="saveDeptMeeting()">Save Meeting</button>' +
            '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="closeModalDirect()">Cancel</button>' +
          '</div>' +
        '</div>');
    }
}

// ═══════════════════════════════════════════════
// 4. USHIRIKA LEADER MEETING EDIT (Enhanced)
// ═══════════════════════════════════════════════

function addUshMeetingEditBtn(){
    setTimeout(function(){
        var ushPage = document.getElementById('ushirika-main');
        if(!ushPage) return;
        
        var editBtn = document.getElementById('ushEditMeetingBtn');
        if(!editBtn && profile && profile.ushirika_id){
            // Check if user is Ushirika leader
            var isLeader = officialsData.some(function(o){
                return o.user_id === user.id && o.ushirika_id === profile.ushirika_id &&
                       ['leader', 'chairman', 'secretary', 'treasurer'].indexOf(o.title.toLowerCase()) > -1;
            });
            
            if(isLeader || isAdmin()){
                editBtn = document.createElement('button');
                editBtn.id = 'ushEditMeetingBtn';
                editBtn.className = 'btn btn-warm btn-block';
                editBtn.style.marginBottom = '12px';
                editBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Edit Ushirika Weekly Meeting';
                editBtn.onclick = function(){ 
                    if(window.openUshirikaMeetingEditor) window.openUshirikaMeetingEditor();
                };
                ushPage.insertBefore(editBtn, ushPage.firstChild);
            }
        }
    }, 1500);
}

// ═══════════════════════════════════════════════
// INITIALIZATION LOOP
// ═══════════════════════════════════════════════
setInterval(function(){
    makeUshirikaCardsTappable();
    makeDeptCardsTappable();
    fixPendingRequests();
    addUshMeetingEditBtn();
    addDeptMeetingEditBtn();
    addDeptMeetingModal();
}, 2000);

console.log('✝️ app9.js loaded - Forum access & meeting editing fixes applied');
