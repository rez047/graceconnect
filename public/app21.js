// public/app21.js
(function() {
    console.log('✝️ app21.js loaded — Timer, Secretary, Sunday School (v2)');

    // Utility Fallbacks
    if (!window.attachMediaTo) {
        window.attachMediaTo = function(key) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '*/*';
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

    if (!window.uploadToSupabaseStorage) {
        window.uploadToSupabaseStorage = async function(file, bucket) {
            if (!window.sb || !file) return null;
            const fileName = `${Date.now()}_${file.name}`;
            const { data, error } = await sb.storage.from(bucket || 'media').upload(fileName, file);
            if (error) { console.error(error); return null; }
            const { data: urlData } = sb.storage.from(bucket || 'media').getPublicUrl(fileName);
            return urlData.publicUrl;
        };
    }
    
    // Helper to get Supabase client (in case 'sb' isn't globally attached but window.supabase is)
    function getSB() {
        if (window.sb) return window.sb;
        if (window.supabaseClient) return window.supabaseClient;
        return window.sb || null; 
    }

    // ═══════════════════════════════════════════════════════════
    // 1. TIMER TO NEXT SERVICE (Individual Cards)
    // ═══════════════════════════════════════════════════════════
    function initServiceTimer() {
        const cards = document.querySelectorAll('.service-card');
        if (!cards.length) return;

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        cards.forEach(card => {
            if (card.querySelector('.service-timer-widget')) return;
            
            const widget = document.createElement('div');
            widget.className = 'service-timer-widget';
            widget.style.cssText = 'margin-top:12px; padding:8px; background:rgba(79,70,229,0.05); border-radius:8px; text-align:center; font-weight:600; color:var(--primary); font-size:0.95rem;';
            widget.innerHTML = '<i class="fas fa-clock"></i> <span class="timer-text">Calculating...</span>';
            card.appendChild(widget);
        });

        function parseTime(timeStr) {
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return null;
            let hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const ampm = match[3].toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            return { hours, minutes };
        }

        function getNextOccurrence(dayStr, startTimeStr, now) {
            const targetDay = days.indexOf(dayStr);
            if (targetDay === -1) return null;
            
            const time = parseTime(startTimeStr);
            if (!time) return null;

            let nextDate = new Date(now);
            nextDate.setHours(time.hours, time.minutes, 0, 0);

            let daysUntil = targetDay - now.getDay();
            if (daysUntil < 0) {
                daysUntil += 7;
            } else if (daysUntil === 0 && nextDate < now) {
                // If today but time has passed, it's next week
                daysUntil += 7;
            }
            nextDate.setDate(now.getDate() + daysUntil);
            return nextDate;
        }

        function isCurrentlyLive(dayStr, startStr, endStr, now) {
            if (days.indexOf(dayStr) !== now.getDay()) return false;
            const start = parseTime(startStr);
            const end = parseTime(endStr);
            if (!start || !end) return false;

            const nowMins = now.getHours() * 60 + now.getMinutes();
            const startMins = start.hours * 60 + start.minutes;
            let endMins = end.hours * 60 + end.minutes;
            
            // Handle crossing midnight (e.g. 9:00 PM - 12:00 AM)
            if (endMins <= startMins) {
                endMins += 24 * 60; 
                if (nowMins < startMins) nowMins += 24 * 60;
            }

            return nowMins >= startMins && nowMins <= endMins;
        }

        function formatDiff(ms) {
            if (ms <= 0) return 'Starting...';
            const totalSecs = Math.floor(ms / 1000);
            const d = Math.floor(totalSecs / 86400);
            const h = Math.floor((totalSecs % 86400) / 3600);
            const m = Math.floor((totalSecs % 3600) / 60);
            
            let parts = [];
            if (d > 0) parts.push(d + 'd');
            if (h > 0 || d > 0) parts.push(h + 'h');
            parts.push(m + 'm');
            return parts.join(' ');
        }

        function updateTimers() {
            const now = new Date();
            const cards = document.querySelectorAll('.service-card');
            
            cards.forEach(card => {
                const widget = card.querySelector('.service-timer-widget');
                if (!widget) return;
                const textEl = widget.querySelector('.timer-text');
                
                const dayText = card.querySelector('.service-day').textContent.trim();
                const timeText = card.querySelector('.service-time').textContent.trim();
                const times = timeText.split('-').map(t => t.trim());
                
                if (times.length < 1) return;
                const startStr = times[0];
                const endStr = times[1] || startStr;

                if (isCurrentlyLive(dayText, startStr, endStr, now)) {
                    textEl.innerHTML = '<span style="color:#EF4444"><i class="fas fa-circle" style="animation:pulse 1s infinite"></i> LIVE NOW</span>';
                } else {
                    const nextDate = getNextOccurrence(dayText, startStr, now);
                    if (nextDate) {
                        const diff = nextDate.getTime() - now.getTime();
                        textEl.textContent = 'Starts in: ' + formatDiff(diff);
                    } else {
                        textEl.textContent = 'Calculating...';
                    }
                }
            });
        }

        setInterval(updateTimers, 10000); 
        setTimeout(updateTimers, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initServiceTimer);
    } else {
        initServiceTimer();
    }
    setInterval(initServiceTimer, 3000);

    // ═══════════════════════════════════════════════════════════
    // 2. SECRETARY MEETING MINUTES & EDITING
    // ═══════════════════════════════════════════════════════════
    window.canManageMeeting = function(groupId, type) {
        if (window.isAdmin && window.isAdmin()) return true;
        const isLeader = (type === 'ush') ? (window.isUshLeaderOf && window.isUshLeaderOf(groupId)) : (window.isDeptLeader9 && window.isDeptLeader9(groupId));
        if (isLeader) return true;
        const lists = (window._myUsh || []).concat(window._myDepts || []);
        return lists.some(m => 
            ((type === 'ush' && m.ushirika_id === groupId) || (type === 'dept' && m.department_id === groupId)) && 
            String(m.role).toLowerCase() === 'secretary'
        );
    };

    window.openMeetingMinutesModal = function(groupId, type, meetingId) {
        const sb = getSB();
        if (!sb) return alert('Database not connected.');
        if (!window.canManageMeeting(groupId, type)) return alert('🚫 Only Admin, Leader, or Secretary can manage minutes.');
        
        const isEdit = !!meetingId;
        
        const showModal = (data = {}) => {
            const template = `
            <div class="modal-overlay show" id="meetingMinutesModal" onclick="if(event.target===this)closeModalDirect()">
                <div class="modal" onclick="event.stopPropagation()" style="max-width:650px">
                    <div class="modal-handle"></div>
                    <div class="modal-title">${isEdit ? '📝 Edit Meeting' : '📝 Official Meeting Minutes'}</div>
                    <div class="form-group"><label class="form-label">1. Date & Venue</label>
                        <input class="form-input" id="mmDate" type="datetime-local" value="${data.meeting_date ? new Date(data.meeting_date).toISOString().slice(0,16) : ''}">
                        <input class="form-input" id="mmVenue" placeholder="Venue" style="margin-top:8px" value="${data.venue || ''}">
                    </div>
                    <div class="form-group"><label class="form-label">2. Agenda</label>
                        <textarea class="form-textarea" id="mmAgenda" rows="4">${data.agenda || '1. Call to Order\n2. Opening Prayer\n3. Reading & Approval of Previous Minutes\n4. Matters Arising\n5. New Business\n6. AOB\n7. Adjournment'}</textarea>
                    </div>
                    <div class="form-group"><label class="form-label">3. Members Present</label>
                        <textarea class="form-textarea" id="mmPresent" rows="3">${data.members_present || ''}</textarea>
                    </div>
                    <div class="form-group"><label class="form-label">4. Absent with Apology (and reasons)</label>
                        <textarea class="form-textarea" id="mmApology" rows="3">${data.absent_with_apology || ''}</textarea>
                    </div>
                    <div class="form-group"><label class="form-label">5. Absent without Apology</label>
                        <textarea class="form-textarea" id="mmAbsent" rows="2">${data.absent_without_apology || ''}</textarea>
                    </div>
                    <div class="form-group"><label class="form-label">6. Others in Attendance (Guests)</label>
                        <input class="form-input" id="mmGuests" placeholder="Guest names" value="${data.guests || ''}">
                    </div>
                    <div class="form-group"><label class="form-label">7. Minutes / Proceedings</label>
                        <textarea class="form-textarea" id="mmMinutes" rows="8">${data.minutes || ''}</textarea>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label class="form-label">Time Taken (Mins)</label><input class="form-input" id="mmTimeTaken" type="number" placeholder="e.g. 90" value="${data.time_taken_minutes || ''}"></div>
                        <div class="form-group"><label class="form-label">Total Members Present</label><input class="form-input" id="mmTotalPresent" type="number" placeholder="e.g. 15" value="${data.total_members_present || ''}"></div>
                    </div>
                    <div class="media-upload" id="mmMediaUpload" onclick="attachMediaTo('mm')"><i class="fas fa-cloud-upload-alt"></i><span>Upload Media (All formats)</span></div>
                    <button class="btn btn-primary btn-block" onclick="saveMeetingMinutes('${groupId}', '${type}', ${isEdit ? `'${meetingId}'` : 'null'})"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'} Minutes</button>
                    <button class="btn btn-secondary-alt btn-block" onclick="closeModalDirect()">Cancel</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', template);
        };

        if (isEdit) {
            sb.from('weekly_meetings').select('*').eq('id', meetingId).single().then(r => {
                if (r.data) showModal(r.data);
                else showModal();
            });
        } else {
            showModal();
        }
    };

    window.saveMeetingMinutes = function(groupId, type, meetingId) {
        const sb = getSB();
        if (!sb) return alert('Database not connected.');

        const payload = {
            meeting_date: document.getElementById('mmDate').value,
            venue: document.getElementById('mmVenue').value,
            agenda: document.getElementById('mmAgenda').value,
            minutes: document.getElementById('mmMinutes').value,
            time_taken_minutes: parseInt(document.getElementById('mmTimeTaken').value) || 0,
            guests: document.getElementById('mmGuests').value,
            members_present: document.getElementById('mmPresent').value,
            absent_with_apology: document.getElementById('mmApology').value,
            absent_without_apology: document.getElementById('mmAbsent').value,
            total_members_present: parseInt(document.getElementById('mmTotalPresent').value) || 0
        };
        
        if (type === 'ush') payload.ushirika_id = groupId;
        else if (type === 'dept') payload.department_id = groupId;
        else if (type === 'ss') payload.sunday_school_id = groupId;

        const media = window._pm && window._pm.mm;
        const finish = (url) => {
            if (url) payload.media_urls = [url];
            
            const query = meetingId ? 
                sb.from('weekly_meetings').update(payload).eq('id', meetingId) : 
                sb.from('weekly_meetings').insert([payload]);
                
            query.then(r => {
                if (r.error) return alert('Error: ' + r.error.message);
                alert('✅ Minutes saved!');
                closeModalDirect();
                if (window.loadDeptMeetings) window.loadDeptMeetings(groupId, type);
                if (window.loadUshirikaMeetings) window.loadUshirikaMeetings(groupId);
            });
        };
        if (media) uploadToSupabaseStorage(media, 'meeting-minutes').then(finish);
        else finish(null);
    };

    // Inject "Edit" and "Apology" buttons into meeting cards
    setInterval(function() {
        document.querySelectorAll('.meeting-card, .weekly-meeting-card').forEach(card => {
            if (card.dataset.btnsBound) return;
            card.dataset.btnsBound = 'true';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-secondary';
            editBtn.style.marginTop = '8px';
            editBtn.style.marginRight = '8px';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Meeting';
            
            editBtn.onclick = function(e) {
                e.stopPropagation();
                const meetingId = card.getAttribute('data-meeting-id') || prompt('Enter Meeting ID to edit (check URL or console):');
                if (!meetingId) return;
                const groupType = card.closest('#section-department') ? 'dept' : (card.closest('#section-ushirika') ? 'ush' : 'dept');
                const groupId = window.currentDeptId || window.currentUshId || 'unknown';
                
                if (groupId !== 'unknown') {
                    window.openMeetingMinutesModal(groupId, groupType, meetingId);
                } else {
                    alert('Could not detect group context.');
                }
            };

            const apBtn = document.createElement('button');
            apBtn.className = 'btn btn-sm btn-primary-alt';
            apBtn.style.marginTop = '8px';
            apBtn.innerHTML = '<i class="fas fa-hand-paper"></i> Submit Apology';
            apBtn.onclick = function(e) {
                e.stopPropagation();
                if (!window.user) return alert('Log in first');
                const meetingId = card.getAttribute('data-meeting-id');
                const html = `<div class="modal-overlay show" id="apologyModal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">🙏 Absent with Apology</div><div class="form-group"><label class="form-label">Reason for Absence</label><textarea class="form-textarea" id="apologyReason" rows="4"></textarea></div><button class="btn btn-primary btn-block" onclick="saveApology('${meetingId}')">Submit</button></div></div>`;
                document.body.insertAdjacentHTML('beforeend', html);
            };

            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '8px';
            btnRow.style.flexWrap = 'wrap';
            btnRow.appendChild(editBtn);
            btnRow.appendChild(apBtn);
            card.appendChild(btnRow);
        });
    }, 2000);

    window.saveApology = function(meetingId) {
        const sb = getSB();
        if (!sb) return;
        const reason = document.getElementById('apologyReason').value;
        if (!reason) return alert('Please enter a reason.');
        
        const payload = {
            meeting_id: meetingId,
            user_id: window.user.id,
            status: 'absent_with_apology',
            apology_reason: reason
        };
        
        sb.from('meeting_attendance').insert([payload]).then(r => {
            if (r.error) return alert('Error: ' + r.error.message);
            alert('✅ Apology submitted!');
            closeModalDirect();
        });
    };

    // ═══════════════════════════════════════════════════════════
    // 3. SUNDAY SCHOOL SYSTEM (Robust Navigation)
    // ═══════════════════════════════════════════════════════════
    
    function ensureSundaySchoolSection() {
        if (!document.getElementById('section-sunday-school')) {
            const sec = document.createElement('div');
            sec.id = 'section-sunday-school';
            sec.className = 'main-section';
            sec.style.display = 'none';
            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.appendChild(sec);
            else document.body.appendChild(sec);
        }
        return document.getElementById('section-sunday-school');
    }

    window.openSundaySchoolMain = function() {
        const sb = getSB();
        if (!sb) {
            setTimeout(window.openSundaySchoolMain, 1000);
            return;
        }
        
        const sec = ensureSundaySchoolSection();
        
        document.querySelectorAll('.main-section').forEach(s => {
            if (s.id !== 'section-sunday-school') s.style.display = 'none';
        });
        sec.style.display = 'block';

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const ssNav = document.getElementById('nav-sunday-school');
        if (ssNav) ssNav.classList.add('active');
        if (window.history) window.history.pushState({page: 'sunday-school'}, '', '#sunday-school');

        sb.from('sunday_school_classes').select('*').then(r => {
            window.sundaySchoolClasses = r.data || [];
            let html = `<button class="back-btn" onclick="goBackFromSS()"><i class="fas fa-arrow-left"></i> Back to Home</button>`;
            html += `<div class="section-title-app" style="margin-bottom:16px">🏫 Sunday School Classes</div>`;
            if (window.isAdmin && window.isAdmin()) {
                html += `<button class="btn btn-primary btn-block" onclick="openSSCreateClass()"><i class="fas fa-plus"></i> Create New Class</button>`;
            }
            html += `<div class="grid-2" style="margin-top:16px">`;
            window.sundaySchoolClasses.forEach(c => {
                html += `<div class="card card-warm" style="cursor:pointer" onclick="openSundaySchoolForum('${c.id}')">
                    <div style="font-weight:700;font-size:1.1rem">${window.esc ? window.esc(c.name) : c.name}</div>
                    <div style="font-size:.85rem;color:var(--text-light)">Ages ${c.min_age || 0} - ${c.max_age || 99}</div>
                    <button class="btn btn-sm btn-secondary" style="margin-top:8px">Open Forum</button>
                </div>`;
            });
            html += `</div>`;
            sec.innerHTML = html;
        });
    };

    window.goBackFromSS = function() {
        const sec = ensureSundaySchoolSection();
        sec.style.display = 'none';
        const home = document.getElementById('section-home') || document.getElementById('home-main') || document.querySelector('.main-section[id*="home"]');
        if (home) home.style.display = 'block';
        if (window.history) window.history.back();
    };

    window.openSundaySchoolForum = function(classId) {
        if(!window.user) return alert('Please log in first');
        const sb = getSB();
        if (!sb) return;
        
        const cls = (window.sundaySchoolClasses || []).find(c => c.id === classId);
        if(!cls) return alert('Class not found');
        
        const sec = ensureSundaySchoolSection();
        const isAdminUser = (window.isAdmin && window.isAdmin());
        const isTeacher = (cls.teacher_id === window.user.id);
        
        let html = `
            <button class="back-btn" onclick="openSundaySchoolMain()"><i class="fas fa-arrow-left"></i> Back to Classes</button>
            <div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px">
                <div class="dept-icon" style="background:var(--gradient-warm)"><i class="fas fa-child"></i></div>
                <div>
                    <div style="font-weight:800;font-size:1.2rem">${window.esc ? window.esc(cls.name) : cls.name}</div>
                    <div style="font-size:.8rem;opacity:.9">Ages ${cls.min_age || 0} - ${cls.max_age || 99}</div>
                </div>
            </div>
            
            ${(isAdminUser || isTeacher) ? `
            <div class="card card-warm" style="margin-bottom:14px;">
                <div style="font-weight:700;font-size:1.1rem; margin-bottom:10px;">📝 Take Attendance</div>
                <div class="grid-2">
                    <div class="form-group"><label>Students Present</label><input class="form-input" id="ssStudents" type="number" value="0"></div>
                    <div class="form-group"><label>Total Offering</label><input class="form-input" id="ssOffering" type="number" step="0.01" value="0"></div>
                </div>
                <div class="form-group"><label>Lesson Topic</label><input class="form-input" id="ssLesson" placeholder="e.g. David and Goliath"></div>
                <div class="media-upload" id="ssMediaUpload" onclick="attachMediaTo('ss')"><i class="fas fa-cloud-upload-alt"></i><span>Upload Media (Photos/Videos)</span></div>
                <button class="btn btn-primary btn-block" onclick="saveSSAttendance('${classId}')"><i class="fas fa-save"></i> Save Record</button>
            </div>` : ''}
            
            <div class="tabs" style="margin-bottom:14px">
                <div class="tab active" onclick="switchSSTab(this,'feed')">Feed</div>
                <div class="tab" onclick="switchSSTab(this,'students')">Students</div>
                <div class="tab" onclick="switchSSTab(this,'records')">Records</div>
            </div>
            <div id="ssd-feed"><div id="ssForumPosts"><p style="text-align:center; color:var(--text-light)">Feed posts render here...</p></div></div>
            <div id="ssd-students" style="display:none"><div id="ssStudentsList">Students list...</div></div>
            <div id="ssd-records" style="display:none">
                <div id="ssRecordsList"></div>
                <div id="ssTotalsBox" class="card card-cool" style="text-align:center; font-size:1.1rem; font-weight:700; margin-top:20px; padding:16px;">
                    Total Students Present: <span id="ssTotalPresent">0</span><br>Total Offering: <span id="ssTotalOffering">0.00</span>
                </div>
            </div>
        `;
        sec.innerHTML = html;
        loadSSRecords(classId);
    };

    window.switchSSTab = function(el, tab) {
        document.querySelectorAll('#section-sunday-school .tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        ['feed','students','records'].forEach(t => { document.getElementById('ssd-'+t).style.display = (t === tab) ? 'block' : 'none'; });
    };

    window.saveSSAttendance = function(classId) {
        const sb = getSB();
        if (!sb) return;
        const payload = {
            class_id: classId,
            students_present: parseInt(document.getElementById('ssStudents').value) || 0,
            total_offering: parseFloat(document.getElementById('ssOffering').value) || 0,
            lesson: document.getElementById('ssLesson').value,
            recorded_by: window.user.id
        };
        const media = window._pm && window._pm.ss;
        const finish = (url) => {
            if (url) payload.media_url = url;
            sb.from('sunday_school_records').insert([payload]).then(r => {
                if(r.error) return alert('Error: ' + r.error.message);
                alert('✅ Attendance saved!');
                document.getElementById('ssStudents').value = '0';
                document.getElementById('ssOffering').value = '0';
                document.getElementById('ssLesson').value = '';
                const uploadDiv = document.getElementById('ssMediaUpload');
                if (uploadDiv) uploadDiv.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Upload Media (Photos/Videos)</span>';
                loadSSRecords(classId);
            });
        };
        if(media) uploadToSupabaseStorage(media, 'sunday-school').then(finish);
        else finish(null);
    };

    window.loadSSRecords = function(classId) {
        const sb = getSB();
        if (!sb) return;
        const box = document.getElementById('ssRecordsList');
        const totalP = document.getElementById('ssTotalPresent');
        const totalO = document.getElementById('ssTotalOffering');
        if(!box) return;
        
        sb.from('sunday_school_records').select('*').eq('class_id', classId).order('created_at', {ascending: false}).limit(50).then(r => {
            const records = r.data || [];
            let tP = 0, tO = 0;
            box.innerHTML = records.map(rec => {
                tP += rec.students_present || 0; tO += rec.total_offering || 0;
                const date = new Date(rec.created_at).toLocaleDateString();
                return `<div class="card" style="margin-bottom:10px;">
                    <div style="font-weight:700">${window.esc ? window.esc(rec.lesson) : rec.lesson || 'No Lesson'}</div>
                    <div style="font-size:.85rem; color:var(--text-light); margin-bottom:6px">${date}</div>
                    <div class="grid-2" style="gap:8px">
                        <div><i class="fas fa-users"></i> ${rec.students_present} students</div>
                        <div><i class="fas fa-coins"></i> ${rec.total_offering} offering</div>
                    </div>
                    ${rec.media_url ? `<img src="${rec.media_url}" style="width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-top:8px;">` : ''}
                </div>`;
            }).join('');
            totalP.textContent = tP; totalO.textContent = tO.toFixed(2);
        });
    };

    function injectSSNav() {
        const nav = document.querySelector('.bottom-nav') || document.querySelector('#bottomNav') || document.querySelector('nav');
        if (nav && !document.getElementById('nav-sunday-school')) {
            const btn = document.createElement('button');
            btn.id = 'nav-sunday-school'; 
            btn.className = 'nav-item';
            btn.innerHTML = '<i class="fas fa-child"></i><span>Sunday School</span>';
            btn.onclick = function() { window.openSundaySchoolMain(); };
            nav.appendChild(btn);
        }
    }
    
    setInterval(injectSSNav, 1000);
    injectSSNav();
    
    // Fallback shortcut on the home page
    setInterval(function() {
        const homeFeed = document.getElementById('section-home') || document.getElementById('home-main') || document.querySelector('.main-section');
        if (homeFeed && !document.getElementById('home-ss-shortcut')) {
            const btn = document.createElement('button');
            btn.id = 'home-ss-shortcut';
            btn.className = 'btn btn-primary btn-block';
            btn.style.marginBottom = '16px';
            btn.innerHTML = '<i class="fas fa-child"></i> Open Sunday School';
            btn.onclick = window.openSundaySchoolMain;
            homeFeed.prepend(btn);
        }
    }, 2000);

})();
