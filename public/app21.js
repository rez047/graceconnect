// public/app21.js
(function() {
    console.log('✝️ app21.js loaded — Timer, Secretary, Sunday School');

    // Utility Fallbacks (ensures media upload works even if global isn't defined)
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

    // ═══════════════════════════════════════════════════════════
    // 1. TIMER TO NEXT SERVICE (Parses DOM, handles LIVE state)
    // ═══════════════════════════════════════════════════════════
    function initServiceTimer() {
        const timerContainer = document.createElement('div');
        timerContainer.id = 'service-timer-container';
        timerContainer.className = 'card card-cool';
        timerContainer.style.textAlign = 'center';
        timerContainer.style.margin = '20px 0';
        timerContainer.innerHTML = `
            <div style="font-size:1.1rem;font-weight:700;margin-bottom:8px;color:var(--primary)">Next Service</div>
            <div id="next-service-name" style="font-size:1.2rem;font-weight:800;">Loading...</div>
            <div id="countdown-timer" style="font-size:2.5rem;font-weight:900;color:var(--accent);margin:10px 0;">00:00:00</div>
        `;
        const serviceGrid = document.querySelector('.service-times-grid');
        if (serviceGrid) {
            serviceGrid.parentNode.insertBefore(timerContainer, serviceGrid.nextSibling);
        }

        function parseServices() {
            const services = [];
            const cards = document.querySelectorAll('.service-card');
            cards.forEach(card => {
                const dayText = card.querySelector('.service-day').textContent.trim();
                const timeText = card.querySelector('.service-time').textContent.trim();
                const label = card.querySelector('.service-label').textContent.trim();
                const times = timeText.split('-').map(t => t.trim());
                if (times.length >= 1) {
                    services.push({ day: dayText, startTime: times[0], endTime: times[1] || times[0], label: label });
                }
            });
            return services;
        }

        function getNextServiceDate(dayStr, timeStr) {
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const targetDay = days.indexOf(dayStr);
            if (targetDay === -1) return null;

            const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!timeMatch) return null;

            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const ampm = timeMatch[3].toUpperCase();

            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;

            const now = new Date();
            let nextDate = new Date();
            nextDate.setHours(hours, minutes, 0, 0);

            let daysUntil = targetDay - now.getDay();
            if (daysUntil < 0 || (daysUntil === 0 && nextDate < now)) {
                daysUntil += 7;
            }
            nextDate.setDate(now.getDate() + daysUntil);
            return nextDate;
        }

        function updateTimer() {
            const services = parseServices();
            if (!services.length) return;

            const now = new Date();
            let nextService = null;
            let isLive = false;

            // Check if currently LIVE
            for (let s of services) {
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                if (days.indexOf(s.day) === now.getDay()) {
                    const startMatch = s.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    const endMatch = s.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (startMatch && endMatch) {
                        let startH = parseInt(startMatch[1], 10);
                        let startM = parseInt(startMatch[2], 10);
                        if (startMatch[3].toUpperCase() === 'PM' && startH < 12) startH += 12;
                        if (startMatch[3].toUpperCase() === 'AM' && startH === 12) startH = 0;

                        let endH = parseInt(endMatch[1], 10);
                        let endM = parseInt(endMatch[2], 10);
                        if (endMatch[3].toUpperCase() === 'PM' && endH < 12) endH += 12;
                        if (endMatch[3].toUpperCase() === 'AM' && endH === 12) endH = 0;

                        const nowMins = now.getHours() * 60 + now.getMinutes();
                        const startMins = startH * 60 + startM;
                        const endMins = endH * 60 + endM;

                        if (nowMins >= startMins && nowMins <= endMins) {
                            nextService = s;
                            isLive = true;
                            break;
                        }
                    }
                }
            }

            // Find next upcoming if not live
            if (!isLive) {
                let nextTime = Infinity;
                services.forEach(s => {
                    const dt = getNextServiceDate(s.day, s.startTime);
                    if (dt && dt.getTime() < nextTime) {
                        nextTime = dt.getTime();
                        nextService = { ...s, date: dt };
                    }
                });
            }

            if (!nextService) return;

            const nameEl = document.getElementById('next-service-name');
            const timerEl = document.getElementById('countdown-timer');

            if (isLive) {
                nameEl.innerHTML = `<span style="color:#EF4444"><i class="fas fa-circle" style="animation:pulse 1s infinite"></i> LIVE NOW</span>`;
                timerEl.textContent = `${nextService.label} is LIVE!`;
                timerEl.style.color = "#EF4444";
            } else {
                const diff = nextService.date.getTime() - now.getTime();
                nameEl.textContent = `${nextService.label} (${nextService.day})`;
                timerEl.style.color = "var(--accent)";
                const hrs = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                timerEl.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            }
        }

        setInterval(updateTimer, 1000);
        setTimeout(updateTimer, 500);
    }
    initServiceTimer();

    // ═══════════════════════════════════════════════════════════
    // 2. SECRETARY MEETING MINUTES & APOLOGIES
    // ═══════════════════════════════════════════════════════════
    window.openMeetingMinutesModal = function(groupId, type) {
        if (!window.canManageMeeting(groupId, type)) return alert('🚫 Only Admin, Leader, or Secretary can take minutes.');
        
        const template = `
        <div class="modal-overlay show" id="meetingMinutesModal" onclick="if(event.target===this)closeModalDirect()">
            <div class="modal" onclick="event.stopPropagation()" style="max-width:650px">
                <div class="modal-handle"></div>
                <div class="modal-title">📝 Official Meeting Minutes</div>
                <div class="form-group"><label class="form-label">1. Date & Venue</label>
                    <input class="form-input" id="mmDate" type="datetime-local">
                    <input class="form-input" id="mmVenue" placeholder="Venue" style="margin-top:8px">
                </div>
                <div class="form-group"><label class="form-label">2. Agenda</label>
                    <textarea class="form-textarea" id="mmAgenda" rows="4">1. Call to Order\n2. Opening Prayer\n3. Reading & Approval of Previous Minutes\n4. Matters Arising\n5. New Business\n6. AOB\n7. Adjournment</textarea>
                </div>
                <div class="form-group"><label class="form-label">3. Members Present</label>
                    <textarea class="form-textarea" id="mmPresent" rows="3" placeholder="Click to select from list or type..."></textarea>
                </div>
                <div class="form-group"><label class="form-label">4. Absent with Apology (and reasons)</label>
                    <textarea class="form-textarea" id="mmApology" rows="3" placeholder="1. Name - Reason..."></textarea>
                </div>
                <div class="form-group"><label class="form-label">5. Absent without Apology</label>
                    <textarea class="form-textarea" id="mmAbsent" rows="2"></textarea>
                </div>
                <div class="form-group"><label class="form-label">6. Others in Attendance (Guests)</label>
                    <input class="form-input" id="mmGuests" placeholder="Guest names">
                </div>
                <div class="form-group"><label class="form-label">7. Minutes / Proceedings</label>
                    <textarea class="form-textarea" id="mmMinutes" rows="8" placeholder="Minute 1: ...\nMinute 2: ..."></textarea>
                </div>
                <div class="grid-2">
                    <div class="form-group"><label class="form-label">Time Taken (Mins)</label><input class="form-input" id="mmTimeTaken" type="number" placeholder="e.g. 90"></div>
                    <div class="form-group"><label class="form-label">Total Members Present</label><input class="form-input" id="mmTotalPresent" type="number" placeholder="e.g. 15"></div>
                </div>
                <div class="media-upload" id="mmMediaUpload" onclick="attachMediaTo('mm')"><i class="fas fa-cloud-upload-alt"></i><span>Upload Media (All formats)</span></div>
                <button class="btn btn-primary btn-block" onclick="saveMeetingMinutes('${groupId}', '${type}')"><i class="fas fa-save"></i> Save Minutes</button>
                <button class="btn btn-secondary-alt btn-block" onclick="closeModalDirect()">Cancel</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', template);
    };

    window.saveMeetingMinutes = function(groupId, type) {
        const payload = {
            meeting_date: document.getElementById('mmDate').value,
            venue: document.getElementById('mmVenue').value,
            agenda: document.getElementById('mmAgenda').value,
            minutes: document.getElementById('mmMinutes').value,
            time_taken_minutes: parseInt(document.getElementById('mmTimeTaken').value) || 0,
            guests: document.getElementById('mmGuests').value
        };
        if (type === 'ush') payload.ushirika_id = groupId;
        else if (type === 'dept') payload.department_id = groupId;
        else if (type === 'ss') payload.sunday_school_id = groupId;

        const media = window._pm && window._pm.mm;
        const finish = (url) => {
            if (url) payload.media_urls = [url];
            sb.from('weekly_meetings').insert([payload]).then(r => {
                if (r.error) return alert('Error: ' + r.error.message);
                alert('✅ Minutes saved!');
                closeModalDirect();
            });
        };
        if (media) uploadToSupabaseStorage(media, 'meeting-minutes').then(finish);
        else finish(null);
    };

    // Inject "Submit Apology" button into weekly meeting cards
    setInterval(function() {
        document.querySelectorAll('.weekly-meeting-card').forEach(card => {
            if (card.dataset.apologyBound) return;
            card.dataset.apologyBound = 'true';
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-secondary';
            btn.style.marginTop = '8px';
            btn.innerHTML = '<i class="fas fa-hand-paper"></i> Submit Apology';
            btn.onclick = function() {
                if (!window.user) return alert('Log in first');
                const html = `<div class="modal-overlay show" id="apologyModal" onclick="if(event.target===this)closeModalDirect()"><div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div><div class="modal-title">🙏 Absent with Apology</div><div class="form-group"><label class="form-label">Reason for Absence</label><textarea class="form-textarea" id="apologyReason" rows="4"></textarea></div><button class="btn btn-primary btn-block" onclick="saveApology()">Submit</button></div></div>`;
                document.body.insertAdjacentHTML('beforeend', html);
            };
            card.appendChild(btn);
        });
    }, 2000);

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

    // ═══════════════════════════════════════════════════════════
    // 3. SUNDAY SCHOOL SYSTEM
    // ═══════════════════════════════════════════════════════════
    window.openSundaySchoolMain = function() {
        let sec = document.getElementById('section-sunday-school');
        if(!sec) {
            sec = document.createElement('div');
            sec.id = 'section-sunday-school';
            sec.className = 'main-section';
            document.querySelector('.main-content').appendChild(sec);
        }
        sb.from('sunday_school_classes').select('*').then(r => {
            window.sundaySchoolClasses = r.data || [];
            let html = `<button class="back-btn" onclick="activateSection('section-home', 'home-main', 'home')"><i class="fas fa-arrow-left"></i> Back</button>`;
            html += `<div class="section-title-app">🏫 Sunday School Classes</div>`;
            if (window.isAdmin && window.isAdmin()) {
                html += `<button class="btn btn-primary btn-block" onclick="openSSCreateClass()"><i class="fas fa-plus"></i> Create New Class</button>`;
            }
            html += `<div class="grid-2" style="margin-top:16px">`;
            window.sundaySchoolClasses.forEach(c => {
                html += `<div class="card card-warm" style="cursor:pointer" onclick="openSundaySchoolForum('${c.id}')">
                    <div style="font-weight:700;font-size:1.1rem">${window.esc(c.name)}</div>
                    <div style="font-size:.85rem;color:var(--text-light)">Ages ${c.min_age || 0} - ${c.max_age || 99}</div>
                    <button class="btn btn-sm btn-secondary" style="margin-top:8px">Open Forum</button>
                </div>`;
            });
            html += `</div>`;
            sec.innerHTML = html;
            window.activateSection('section-sunday-school', 'section-sunday-school', 'home');
        });
    };

    window.openSundaySchoolForum = function(classId) {
        if(!window.user) return alert('Please log in first');
        const cls = (window.sundaySchoolClasses || []).find(c => c.id === classId);
        if(!cls) return alert('Class not found');
        let sec = document.getElementById('section-sunday-school');
        
        sec.innerHTML = `
            <button class="back-btn" onclick="openSundaySchoolMain()"><i class="fas fa-arrow-left"></i> Back</button>
            <div class="dept-banner" style="border-radius:var(--radius);margin-bottom:14px">
                <div class="dept-icon" style="background:var(--gradient-warm)"><i class="fas fa-child"></i></div>
                <div>
                    <div style="font-weight:800;font-size:1.2rem">${window.esc(cls.name)}</div>
                    <div style="font-size:.8rem;opacity:.9">Ages ${cls.min_age || 0} - ${cls.max_age || 99}</div>
                </div>
            </div>
            <div id="ssAttendancePanel" style="display:none; margin-bottom:14px;">
                <div class="card card-warm">
                    <div class="section-title-app">📝 Take Attendance</div>
                    <div class="form-group"><label>No. Students Present</label><input class="form-input" id="ssStudents" type="number"></div>
                    <div class="form-group"><label>Total Offering</label><input class="form-input" id="ssOffering" type="number" step="0.01"></div>
                    <div class="form-group"><label>Lesson</label><input class="form-input" id="ssLesson"></div>
                    <div class="media-upload" id="ssMediaUpload" onclick="attachMediaTo('ss')"><i class="fas fa-cloud-upload-alt"></i><span>Upload Media</span></div>
                    <button class="btn btn-primary btn-block" onclick="saveSSAttendance('${classId}')">Save Record</button>
                </div>
            </div>
            <div class="tabs">
                <div class="tab active" onclick="switchSSTab(this,'feed')">Feed</div>
                <div class="tab" onclick="switchSSTab(this,'students')">Students</div>
                <div class="tab" onclick="switchSSTab(this,'records')">Records</div>
            </div>
            <div id="ssd-feed"><div id="ssForumPosts">Feed posts render here...</div></div>
            <div id="ssd-students" style="display:none"><div id="ssStudentsList">Students list...</div></div>
            <div id="ssd-records" style="display:none">
                <div id="ssRecordsList"></div>
                <div id="ssTotalsBox" class="card card-cool" style="text-align:center; font-size:1.2rem; font-weight:700; margin-top:20px;">
                    Total Students Present: <span id="ssTotalPresent">0</span><br>Total Offering: <span id="ssTotalOffering">0.00</span>
                </div>
            </div>
        `;
        if (window.isAdmin && window.isAdmin() || cls.teacher_id === window.user.id) {
            document.getElementById('ssAttendancePanel').style.display = 'block';
        }
        loadSSRecords(classId);
    };

    window.switchSSTab = function(el, tab) {
        document.querySelectorAll('#section-sunday-school .tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        ['feed','students','records'].forEach(t => { document.getElementById('ssd-'+t).style.display = (t === tab) ? 'block' : 'none'; });
    };

    window.saveSSAttendance = function(classId) {
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
                loadSSRecords(classId);
            });
        };
        if(media) uploadToSupabaseStorage(media, 'sunday-school').then(finish);
        else finish(null);
    };

    window.loadSSRecords = function(classId) {
        const box = document.getElementById('ssRecordsList');
        const totalP = document.getElementById('ssTotalPresent');
        const totalO = document.getElementById('ssTotalOffering');
        sb.from('sunday_school_records').select('*').eq('class_id', classId).order('created_at', {ascending: false}).limit(50).then(r => {
            const records = r.data || [];
            let tP = 0, tO = 0;
            box.innerHTML = records.map(rec => {
                tP += rec.students_present || 0; tO += rec.total_offering || 0;
                return `<div class="card"><b>${rec.lesson || 'No Lesson'}</b><br>${rec.students_present} students | ${rec.total_offering} offering</div>`;
            }).join('');
            totalP.textContent = tP; totalO.textContent = tO.toFixed(2);
        });
    };

    // Inject Sunday School Nav Button
    setInterval(function() {
        const nav = document.querySelector('.bottom-nav');
        if (nav && !document.getElementById('nav-sunday-school')) {
            const btn = document.createElement('button');
            btn.id = 'nav-sunday-school'; btn.className = 'nav-item';
            btn.innerHTML = '<i class="fas fa-child"></i><span>Sunday School</span>';
            btn.onclick = function() { window.openSundaySchoolMain(); };
            nav.appendChild(btn);
        }
    }, 1000);
})();
