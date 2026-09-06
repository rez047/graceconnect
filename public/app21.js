// public/app21.js
(function() {
    console.log('✝️ app21.js loaded — Groups, Timers, and Secretary Minutes');

    // Utility Fallbacks
    if (!window.attachMediaTo) {
        window.attachMediaTo = function(key) {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '*/*';
            input.onchange = function(e) {
                if (e.target.files && e.target.files[0]) {
                    window._pm = window._pm || {};
                    window._pm[key] = e.target.files[0];
                    const uploadDiv = document.getElementById(key + 'MediaUpload') || document.getElementById(key + 'Upload');
                    if (uploadDiv) {
                        uploadDiv.classList.add('has-file');
                        uploadDiv.innerHTML = '<i class="fas fa-check-circle"></i> <span>' + e.target.files[0].name + '</span>';
                    }
                }
            };
            input.click();
        };
    }

    if (!window.uploadMediaFile) {
        window.uploadMediaFile = async function(file) {
            if (!window.sb || !file) return null;
            const fileName = `${Date.now()}_${file.name}`;
            const { data, error } = await sb.storage.from('media').upload(fileName, file);
            if (error) return null;
            const { data: urlData } = sb.storage.from('media').getPublicUrl(fileName);
            return urlData.publicUrl;
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 1. SERVICE TIMERS (Directly below each service card)
    // ═══════════════════════════════════════════════════════════
    function initServiceTimers() {
        const timeEls = document.querySelectorAll('.service-time');
        timeEls.forEach(el => {
            if (el.parentNode.querySelector('.service-countdown')) return;
            const timerDiv = document.createElement('div');
            timerDiv.className = 'service-countdown';
            timerDiv.style.cssText = 'margin-top: 8px; font-size: 0.9rem; font-weight: 700; color: var(--primary); padding: 6px; background: rgba(79,70,229,0.1); border-radius: 8px; text-align: center;';
            timerDiv.innerHTML = 'Calculating...';
            el.after(timerDiv);
        });
    }

    function updateTimers() {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        document.querySelectorAll('.service-time').forEach(el => {
            const timerDiv = el.parentNode.querySelector('.service-countdown');
            if (!timerDiv) return;
            
            const timeText = el.textContent.trim();
            const dayEl = el.previousElementSibling;
            if (!dayEl || !dayEl.classList.contains('service-day')) return;
            
            const dayName = dayEl.textContent.trim();
            const targetDay = days.indexOf(dayName);
            if (targetDay === -1) return;

            const match = timeText.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return;

            let hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const ampm = match[3].toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;

            const now = new Date();
            let nextDate = new Date();
            nextDate.setHours(hours, minutes, 0, 0);

            let daysUntil = targetDay - now.getDay();
            if (daysUntil < 0) daysUntil += 7;
            else if (daysUntil === 0 && nextDate <= now) daysUntil += 7;

            nextDate.setDate(now.getDate() + daysUntil);
            const diff = nextDate.getTime() - now.getTime();

            if (diff < 0) {
                 timerDiv.innerHTML = '<span style="color:#EF4444"><i class="fas fa-circle" style="animation:pulse 1s infinite"></i> LIVE NOW</span>';
            } else {
                const totalSecs = Math.floor(diff / 1000);
                const d = Math.floor(totalSecs / 86400);
                const h = Math.floor((totalSecs % 86400) / 3600);
                const m = Math.floor((totalSecs % 3600) / 60);
                let parts = [];
                if (d > 0) parts.push(d + 'd');
                if (h > 0 || d > 0) parts.push(h + 'h');
                parts.push(m + 'm');
                timerDiv.innerHTML = `<i class="fas fa-clock"></i> ${parts.join(' ')} left`;
            }
        });
    }
    setInterval(initServiceTimers, 2000);
    setInterval(updateTimers, 1000);

    // ═══════════════════════════════════════════════════════════
    // 2. GROUPS SECTION (Sunday School, Youth, Men, Women)
    // ═══════════════════════════════════════════════════════════
    function setupGroupsSection() {
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav && !document.getElementById('nav-groups-btn')) {
            const discoverBtn = Array.from(bottomNav.children).find(btn => btn.textContent.includes('Discover'));
            const groupsBtn = document.createElement('button');
            groupsBtn.id = 'nav-groups-btn';
            groupsBtn.className = 'nav-item';
            groupsBtn.innerHTML = '<i class="fas fa-users"></i>Groups';
            groupsBtn.onclick = function() { window.switchSection('groups'); };
            if (discoverBtn) bottomNav.insertBefore(groupsBtn, discoverBtn);
            else bottomNav.appendChild(groupsBtn);
        }

        let groupsSection = document.getElementById('section-groups');
        if (!groupsSection) {
            groupsSection = document.createElement('div');
            groupsSection.id = 'section-groups';
            groupsSection.className = 'section';
            groupsSection.innerHTML = `
                <div id="groups-main" class="sub-page active">
                    <div class="section-title-app"><i class="fas fa-users"></i> Groups & Ministries</div>
                    <div id="groups-admin-panel" style="display:none; margin-bottom:14px">
                        <button class="btn btn-warm btn-block" onclick="openCreateGroupCategory()"><i class="fas fa-plus"></i> Add Category (Sunday School, Youth, etc.)</button>
                    </div>
                    <div class="grid-2" id="groups-categories-grid"></div>
                </div>
                <div id="group-forum" class="sub-page">
                    <button class="back-btn" onclick="showSubPage('groups-main')"><i class="fas fa-arrow-left"></i> Back to Groups</button>
                    <div id="group-forum-content"></div>
                </div>
            `;
            const mainEl = document.querySelector('main') || document.querySelector('.app-container');
            if (mainEl) mainEl.appendChild(groupsSection);
            else document.body.appendChild(groupsSection);
        }

        // Hook into switchSection to show groups
        const origSwitchSection = window.switchSection;
        window.switchSection = function(name) {
            if (name === 'groups') {
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                groupsSection.classList.add('active');
                loadGroupCategories();
                if (window.isAdmin && window.isAdmin()) {
                    document.getElementById('groups-admin-panel').style.display = 'block';
                }
            } else if (origSwitchSection) {
                origSwitchSection(name);
            }
        };
    }
    setupGroupsSection();

    window.loadGroupCategories = function() {
        if (!window.sb) return;
        sb.from('groups_categories').select('*').order('created_at', {ascending: false}).then(r => {
            window.groupsCategories = r.data || [];
            const grid = document.getElementById('groups-categories-grid');
            if (!grid) return;
            
            grid.innerHTML = window.groupsCategories.map(c => `
                <div class="card card-warm" style="cursor:pointer" onclick="openGroupForum('${c.id}')">
                    <div style="font-weight:700;font-size:1.1rem">${window.esc ? window.esc(c.name) : c.name}</div>
                    <div style="font-size:.85rem;color:var(--text-light); margin-bottom:10px">Ages ${c.min_age || 0} - ${c.max_age || 99}</div>
                    <button class="btn btn-sm btn-secondary">Open Forum</button>
                </div>
            `).join('');
        });
    };

    window.openCreateGroupCategory = function() {
        const html = `
            <div class="modal-overlay show" id="createGroupModal" onclick="if(event.target===this)closeModalDirect()">
                <div class="modal" onclick="event.stopPropagation()">
                    <div class="modal-handle"></div>
                    <div class="modal-title"><i class="fas fa-users"></i> Add Group Category</div>
                    <div class="form-group"><label class="form-label">Name (e.g., Sunday School, Youth)</label><input class="form-input" id="newGroupName" placeholder="Sunday School"></div>
                    <div class="grid-2">
                        <div class="form-group"><label class="form-label">Min Age</label><input class="form-input" id="newGroupMinAge" type="number" value="0"></div>
                        <div class="form-group"><label class="form-label">Max Age</label><input class="form-input" id="newGroupMaxAge" type="number" value="99"></div>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="saveGroupCategory()">Create Category</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    window.saveGroupCategory = function() {
        const payload = {
            name: document.getElementById('newGroupName').value,
            min_age: parseInt(document.getElementById('newGroupMinAge').value) || 0,
            max_age: parseInt(document.getElementById('newGroupMaxAge').value) || 99
        };
        if (!payload.name) return alert('Name is required.');
        sb.from('groups_categories').insert([payload]).then(r => {
            if (r.error) return alert('Error: ' + r.error.message);
            alert('✅ Category created!'); closeModalDirect(); loadGroupCategories();
        });
    };

    window.openGroupForum = function(catId) {
        const cat = (window.groupsCategories || []).find(c => c.id === catId);
        if (!cat) return;
        const content = document.getElementById('group-forum-content');
        content.innerHTML = `
            <div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px">
                <div class="dept-icon" style="background:var(--gradient-warm)"><i class="fas fa-users"></i></div>
                <div>
                    <div style="font-weight:800;font-size:1.2rem">${window.esc ? window.esc(cat.name) : cat.name}</div>
                    <div style="font-size:.8rem;opacity:.9">Ages ${cat.min_age || 0} - ${cat.max_age || 99}</div>
                </div>
            </div>
            <div class="tabs">
                <div class="tab active" onclick="switchGroupTab(this,'feed')">Feed</div>
                <div class="tab" onclick="switchGroupTab(this,'attendance')">Attendance/Offering</div>
                <div class="tab" onclick="switchGroupTab(this,'members')">Members</div>
                <div class="tab" onclick="switchGroupTab(this,'meetings')">Meetings</div>
            </div>
            <div id="group-tab-feed" class="group-tab-content"></div>
            <div id="group-tab-attendance" class="group-tab-content" style="display:none"></div>
            <div id="group-tab-members" class="group-tab-content" style="display:none"></div>
            <div id="group-tab-meetings" class="group-tab-content" style="display:none"></div>
        `;
        showSubPage('group-forum');
        loadGroupAttendance(catId);
    };

    window.switchGroupTab = function(el, tab) {
        document.querySelectorAll('#group-forum .tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        ['feed', 'attendance', 'members', 'meetings'].forEach(t => { 
            document.getElementById('group-tab-'+t).style.display = (t === tab) ? 'block' : 'none'; 
        });
    };

    function loadGroupAttendance(catId) {
        const container = document.getElementById('group-tab-attendance');
        const isAdminUser = window.isAdmin && window.isAdmin();
        let html = `
            ${isAdminUser ? `
            <div class="card card-warm" style="margin-bottom:14px">
                <div class="section-title-app">📝 Take Attendance</div>
                <div class="grid-2">
                    <div class="form-group"><label>Students Present</label><input class="form-input" id="groupStudents" type="number" value="0"></div>
                    <div class="form-group"><label>Total Offering</label><input class="form-input" id="groupOffering" type="number" step="0.01" value="0"></div>
                </div>
                <div class="form-group"><label>Lesson</label><input class="form-input" id="groupLesson"></div>
                <div class="media-upload" id="groupMediaUpload" onclick="attachMediaTo('group')"><i class="fas fa-cloud-upload-alt"></i><span>Upload Media</span></div>
                <button class="btn btn-primary btn-block" onclick="saveGroupAttendance('${catId}')"><i class="fas fa-save"></i> Save Record</button>
            </div>` : ''}
            <div id="groupRecordsList"></div>
            <div class="card card-cool" style="text-align:center; font-size:1.2rem; font-weight:700; margin-top:20px; padding:16px;">
                Total Students Present: <span id="groupTotalPresent">0</span><br>Total Offering: <span id="groupTotalOffering">0.00</span>
            </div>
        `;
        container.innerHTML = html;
        sb.from('groups_records').select('*').eq('category_id', catId).order('created_at', {ascending: false}).limit(50).then(r => {
            const records = r.data || [];
            let tP = 0, tO = 0;
            document.getElementById('groupRecordsList').innerHTML = records.map(rec => {
                tP += rec.students_present || 0; tO += rec.total_offering || 0;
                return `<div class="card" style="margin-bottom:10px;">
                    <div style="font-weight:700">${rec.lesson || 'No Lesson'}</div>
                    <div style="font-size:.85rem; color:var(--text-light); margin-bottom:6px">${new Date(rec.created_at).toLocaleDateString()}</div>
                    <div class="grid-2"><div><i class="fas fa-users"></i> ${rec.students_present}</div><div><i class="fas fa-coins"></i> ${rec.total_offering}</div></div>
                </div>`;
            }).join('');
            document.getElementById('groupTotalPresent').textContent = tP;
            document.getElementById('groupTotalOffering').textContent = tO.toFixed(2);
        });
    }

    window.saveGroupAttendance = function(catId) {
        const payload = {
            category_id: catId,
            students_present: parseInt(document.getElementById('groupStudents').value) || 0,
            total_offering: parseFloat(document.getElementById('groupOffering').value) || 0,
            lesson: document.getElementById('groupLesson').value,
            recorded_by: window.user.id
        };
        const media = window._pm && window._pm.group;
        const finish = (url) => {
            if (url) payload.media_url = url;
            sb.from('groups_records').insert([payload]).then(r => {
                if(r.error) return alert('Error: ' + r.error.message);
                alert('✅ Saved!'); loadGroupAttendance(catId);
            });
        };
        if(media) uploadMediaFile(media).then(finish); else finish(null);
    };

    // ═══════════════════════════════════════════════════════════
    // 3. SECRETARY MEETING MINUTES & APOLOGIES
    // ═══════════════════════════════════════════════════════════
    function injectMeetingFields() {
        const modalBody = document.querySelector('#updateWeeklyMeetingModal .modal');
        if (!modalBody || modalBody.querySelector('#meetingAgenda')) return;

        const newFields = `
            <div class="form-group" style="margin-top:14px;border-top:1px solid var(--border);padding-top:14px;">
                <label class="form-label">Agenda (Skeleton)</label>
                <textarea class="form-textarea" id="meetingAgenda" rows="4">1. Call to Order & Opening Prayer\n2. Reading & Approval of Previous Minutes\n3. Matters Arising\n4. New Business\n5. Any Other Business (AOB)\n6. Adjournment & Closing Prayer</textarea>
            </div>
            <div class="form-group"><label class="form-label">Members Present</label><textarea class="form-textarea" id="meetingPresent" rows="2" placeholder="List names..."></textarea></div>
            <div class="form-group"><label class="form-label">Absent with Apology</label><textarea class="form-textarea" id="meetingApology" rows="2" placeholder="Name - Reason..."></textarea></div>
            <div class="form-group"><label class="form-label">Absent without Apology</label><textarea class="form-textarea" id="meetingAbsent" rows="2"></textarea></div>
            <div class="form-group"><label class="form-label">Others in Attendance (Guests)</label><input class="form-input" id="meetingGuests"></div>
            <div class="form-group"><label class="form-label">Minutes / Proceedings</label><textarea class="form-textarea" id="meetingMinutes" rows="5"></textarea></div>
            <div class="grid-2">
                <div class="form-group"><label class="form-label">Time Taken (Mins)</label><input class="form-input" id="meetingTimeTaken" type="number"></div>
                <div class="form-group"><label class="form-label">Total Present</label><input class="form-input" id="meetingTotalPresent" type="number"></div>
            </div>
            <div class="media-upload" id="meetingMediaUpload" onclick="attachMediaTo('meeting')"><i class="fas fa-cloud-upload-alt"></i><span>Upload Media (All formats)</span></div>
        `;
        const submitBtn = modalBody.querySelector('button[onclick*="updateMeeting"]');
        if (submitBtn) submitBtn.insertAdjacentHTML('beforebegin', newFields);
    }
    setInterval(injectMeetingFields, 2000);

    // Hook Supabase to save the new fields automatically when updateMeeting is called
    function setupSBHook() {
        if (!window.sb) { setTimeout(setupSBHook, 500); return; }
        const originalFrom = sb.from.bind(sb);
        sb.from = function(table) {
            const chain = originalFrom(table);
            if (table === 'weekly_meetings') {
                const originalUpdate = chain.update.bind(chain);
                chain.update = function(payload) {
                    const extra = {};
                    const fields = ['meetingAgenda', 'meetingPresent', 'meetingApology', 'meetingAbsent', 'meetingGuests', 'meetingMinutes', 'meetingTimeTaken', 'meetingTotalPresent'];
                    fields.forEach(f => {
                        const el = document.getElementById(f);
                        if (el && el.value) {
                            const mapping = { meetingAgenda: 'agenda', meetingPresent: 'members_present', meetingApology: 'absent_with_apology', meetingAbsent: 'absent_without_apology', meetingGuests: 'guests', meetingMinutes: 'minutes', meetingTimeTaken: 'time_taken_minutes', meetingTotalPresent: 'total_members_present' };
                            if (mapping[f]) extra[mapping[f]] = el.value;
                        }
                    });
                    Object.assign(payload, extra);
                    return originalUpdate(payload);
                };
            }
            return chain;
        };
    }
    setupSBHook();

    // Inject Apology Buttons for members
    function injectApologyButtons() {
        document.querySelectorAll('.weekly-meeting-card, .meeting-card').forEach(card => {
            if (card.querySelector('.apology-btn')) return;
            const meetingId = card.getAttribute('data-meeting-id') || card.dataset.id;
            if (!meetingId) return;
            
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-secondary apology-btn';
            btn.style.marginTop = '8px';
            btn.innerHTML = '<i class="fas fa-hand-paper"></i> Submit Apology';
            btn.onclick = function(e) {
                e.stopPropagation();
                const html = `
                    <div class="modal-overlay show" id="apologyModal" onclick="if(event.target===this)closeModalDirect()">
                        <div class="modal" onclick="event.stopPropagation()">
                            <div class="modal-handle"></div>
                            <div class="modal-title">🙏 Absent with Apology</div>
                            <div class="form-group"><label class="form-label">Reason for Absence</label><textarea class="form-textarea" id="apologyReason" rows="4"></textarea></div>
                            <button class="btn btn-primary btn-block" onclick="saveApology('${meetingId}')">Submit</button>
                        </div>
                    </div>`;
                document.body.insertAdjacentHTML('beforeend', html);
            };
            card.appendChild(btn);
        });
    }
    setInterval(injectApologyButtons, 2000);

    window.saveApology = function(meetingId) {
        const reason = document.getElementById('apologyReason').value;
        if (!reason) return alert('Please enter a reason.');
        const name = window.profile ? window.profile.name : 'Unknown';
        sb.from('weekly_meetings').select('absent_with_apology').eq('id', meetingId).single().then(r => {
            const current = r.data.absent_with_apology || '';
            sb.from('weekly_meetings').update({ absent_with_apology: current + `${name}: ${reason}\n` }).eq('id', meetingId).then(upd => {
                alert('✅ Apology submitted!'); closeModalDirect();
            });
        });
    };
})();
