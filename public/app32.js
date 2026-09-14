/* ============================================================
   GRACECONNECT - APP32
   ADMIN BRANDING + LEGAL DOCUMENTS + LANDING PAGE SECTIONS
   + USER MODERATION + EMAIL BLOCKLIST + TERMS ACCEPTANCE

   Requires:
   - Existing Supabase client from your other app files
   - church_settings table
   - profiles table

   Recommended Supabase columns:
       church_settings.legal_document       JSONB
       church_settings.landing_sections     JSONB

   Recommended tables:
       blocked_emails

   Recommended RPC:
       is_email_blocked(text)
       admin_delete_user(uuid)
============================================================ */

(function () {
    'use strict';

    /* =========================================================
       CONFIGURATION
    ========================================================= */

    const SETTINGS_ID = 1;

    const STORAGE_KEY = 'graceconnect_app32_branding';

    const DEFAULT_DOCUMENT = {
        churchHistory: {
            title: 'Our History',
            content:
                'Our church exists to proclaim the Gospel of Jesus Christ, build strong Christian families, disciple believers and serve the community with love, integrity and faith.'
        },

        vision: {
            title: 'Our Vision',
            content:
                'To be a Christ-centered community where people encounter God, grow in faith, discover their purpose and positively transform their families and communities.'
        },

        mission: {
            title: 'Our Mission',
            content:
                'Our mission is to preach the Gospel, disciple believers, provide a place for worship and fellowship, equip people for ministry and demonstrate the love of Christ through practical service.'
        },

        statementOfFaith: {
            title: 'Statement of Faith',
            content:
                'We believe in one God, eternally existing as Father, Son and Holy Spirit. We believe that Jesus Christ is the Son of God, that He died for our sins, was buried, rose again and that salvation is found through faith in Him. We believe the Bible is the inspired Word of God and our authoritative guide for faith and Christian living.'
        },

        contactInfo: {
            title: 'Contact Information',
            content:
                'For questions, prayer requests, church information or other enquiries, please use the official communication channels provided by the church.'
        },

        dataProtection: {
            title: 'Data Protection',
            content:
                'GraceConnect respects the privacy of its users. Personal information collected through this platform may be used to provide accounts, church services, communication, security, administration and other legitimate platform functions. Personal information should not be submitted where it is not necessary.'
        },

        copyrightIP: {
            title: 'Copyright & Intellectual Property',
            content:
                'The GraceConnect platform, church branding, original content, graphics, documents, software and other protected materials belong to their respective owners. Users must not reproduce, distribute, modify, sell or misuse protected material without appropriate authorization.'
        },

        prohibitedContent: {
            title: 'Community Standards',
            content:
                'Users must not publish, upload, transmit or distribute unlawful, fraudulent, abusive, threatening, defamatory, obscene, hateful or otherwise prohibited content. Content that violates applicable law or these standards may be removed and the responsible account may be suspended, banned or removed from the system.'
        },

        termsAndConditions: {
            title: 'Terms & Conditions',
            content:
                'By creating an account and using GraceConnect, users agree to use the platform lawfully, respectfully and responsibly. Users are responsible for the information they submit and must not misuse the platform, impersonate others, interfere with platform operation or distribute prohibited content. The church or platform administrators may restrict or terminate access where these terms are violated.'
        }
    };


    /* =========================================================
       DEFAULT LANDING PAGE CONFIGURATION
    ========================================================= */

    const DEFAULT_LANDING = {
        churchHistory: {
            enabled: true,
            title: 'Our Story',
            order: 1
        },

        vision: {
            enabled: true,
            title: 'Our Vision',
            order: 2
        },

        mission: {
            enabled: true,
            title: 'Our Mission',
            order: 3
        },

        statementOfFaith: {
            enabled: false,
            title: 'Statement of Faith',
            order: 4
        },

        contactInfo: {
            enabled: true,
            title: 'Connect With Us',
            order: 5
        },

        dataProtection: {
            enabled: false,
            title: 'Data Protection',
            order: 6
        },

        copyrightIP: {
            enabled: false,
            title: 'Copyright & IP',
            order: 7
        },

        prohibitedContent: {
            enabled: false,
            title: 'Community Standards',
            order: 8
        },

        termsAndConditions: {
            enabled: false,
            title: 'Terms & Conditions',
            order: 9
        }
    };


    const SECTION_META = {
        churchHistory: {
            icon: 'fa-landmark',
            eyebrow: 'OUR STORY',
            description: 'Discover our history, roots and journey of faith.'
        },

        vision: {
            icon: 'fa-eye',
            eyebrow: 'OUR VISION',
            description: 'The future we believe God is calling us to build.'
        },

        mission: {
            icon: 'fa-bullseye',
            eyebrow: 'OUR MISSION',
            description: 'How we serve God, people and our community.'
        },

        statementOfFaith: {
            icon: 'fa-cross',
            eyebrow: 'OUR FAITH',
            description: 'The biblical convictions that guide our church.'
        },

        contactInfo: {
            icon: 'fa-address-card',
            eyebrow: 'CONTACT',
            description: 'Ways to connect with the church and community.'
        },

        dataProtection: {
            icon: 'fa-user-shield',
            eyebrow: 'PRIVACY',
            description: 'How personal information is treated and protected.'
        },

        copyrightIP: {
            icon: 'fa-copyright',
            eyebrow: 'INTELLECTUAL PROPERTY',
            description: 'Important information about protected materials.'
        },

        prohibitedContent: {
            icon: 'fa-ban',
            eyebrow: 'COMMUNITY STANDARDS',
            description: 'Content and behaviour that are not permitted.'
        },

        termsAndConditions: {
            icon: 'fa-file-contract',
            eyebrow: 'LEGAL',
            description: 'The terms governing use of GraceConnect.'
        }
    };


    let state = {
        legalDocument: deepClone(DEFAULT_DOCUMENT),
        landingSections: deepClone(DEFAULT_LANDING)
    };

    let stateLoaded = false;
    let statePromise = null;
    let adminPanelInserted = false;
    let landingInserted = false;
    let termsInjected = false;
    let registrationWrapped = false;
    let loginWrapped = false;


    /* =========================================================
       BASIC HELPERS
    ========================================================= */

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function db() {
        try {
            if (typeof window.sb === 'function') {
                return window.sb();
            }

            if (
                window.sb &&
                typeof window.sb.from === 'function'
            ) {
                return window.sb;
            }

            if (
                window.supabaseClient &&
                typeof window.supabaseClient.from === 'function'
            ) {
                return window.supabaseClient;
            }

            if (
                window.supabase &&
                typeof window.supabase.from === 'function'
            ) {
                return window.supabase;
            }
        } catch (e) {
            console.warn('GraceConnect App32: Supabase client error', e);
        }

        return null;
    }


    function escapeHTML(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    function escapeAttribute(value) {
        return escapeHTML(value);
    }


    function stripHTML(value) {
        const div = document.createElement('div');
        div.innerHTML = String(value || '');
        return div.textContent || div.innerText || '';
    }


    function excerpt(value, maxLength) {
        let text = stripHTML(value)
            .replace(/\s+/g, ' ')
            .trim();

        if (text.length <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength).trim() + '…';
    }


    function notify(message, type) {
        type = type || 'info';

        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }

        if (typeof window.toast === 'function') {
            window.toast(message, type);
            return;
        }

        const old = document.getElementById('gc32-notification');

        if (old) {
            old.remove();
        }

        const el = document.createElement('div');

        el.id = 'gc32-notification';

        el.innerHTML = `
            <div class="gc32-notification-icon">
                <i class="fas ${
                    type === 'success'
                        ? 'fa-check-circle'
                        : type === 'error'
                            ? 'fa-exclamation-circle'
                            : 'fa-info-circle'
                }"></i>
            </div>

            <div>${escapeHTML(message)}</div>
        `;

        document.body.appendChild(el);

        setTimeout(() => {
            el.classList.add('gc32-hide');
        }, 3200);

        setTimeout(() => {
            el.remove();
        }, 3700);
    }


    function getCurrentUser() {
        try {
            if (window.currentUser) {
                return window.currentUser;
            }

            if (window.user) {
                return window.user;
            }

            if (window.loggedInUser) {
                return window.loggedInUser;
            }
        } catch (e) {}

        return null;
    }


    async function getAuthenticatedUser() {
        const client = db();

        if (!client || !client.auth) {
            return null;
        }

        try {
            const result = await client.auth.getUser();

            return result &&
                result.data &&
                result.data.user
                ? result.data.user
                : null;
        } catch (e) {
            return null;
        }
    }


    async function getUserProfile(userId) {
        const client = db();

        if (!client || !userId) {
            return null;
        }

        try {
            const result = await client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (result.error) {
                console.warn(
                    'GraceConnect App32: profile lookup failed',
                    result.error
                );

                return null;
            }

            return result.data || null;
        } catch (e) {
            return null;
        }
    }


    async function isAdminUser() {
        const user = await getAuthenticatedUser();

        if (!user) {
            const current = getCurrentUser();

            if (
                current &&
                (
                    current.isAdmin === true ||
                    current.is_admin === true ||
                    ['admin', 'super_admin', 'superadmin']
                        .includes(String(current.role || '').toLowerCase())
                )
            ) {
                return true;
            }

            return false;
        }

        const profile = await getUserProfile(user.id);

        const role = String(
            profile && profile.role
                ? profile.role
                : user.user_metadata &&
                  user.user_metadata.role
                    ? user.user_metadata.role
                    : ''
        ).toLowerCase();

        return [
            'admin',
            'super_admin',
            'superadmin'
        ].includes(role);
    }


    /* =========================================================
       STATE MERGING
    ========================================================= */

    function mergeLegalDocument(remote) {
        const result = deepClone(DEFAULT_DOCUMENT);

        if (!remote || typeof remote !== 'object') {
            return result;
        }

        Object.keys(result).forEach(key => {
            if (remote[key] && typeof remote[key] === 'object') {
                if (remote[key].title !== undefined) {
                    result[key].title = String(remote[key].title);
                }

                if (remote[key].content !== undefined) {
                    result[key].content = String(remote[key].content);
                }
            }
        });

        return result;
    }


    function mergeLandingSections(remote) {
        const result = deepClone(DEFAULT_LANDING);

        if (!remote || typeof remote !== 'object') {
            return result;
        }

        Object.keys(result).forEach(key => {
            if (remote[key] && typeof remote[key] === 'object') {
                if (remote[key].enabled !== undefined) {
                    result[key].enabled =
                        remote[key].enabled === true;
                }

                if (remote[key].title !== undefined) {
                    result[key].title =
                        String(remote[key].title);
                }

                if (remote[key].order !== undefined) {
                    const parsed = Number(remote[key].order);

                    if (Number.isFinite(parsed)) {
                        result[key].order = parsed;
                    }
                }
            }
        });

        return result;
    }


    /* =========================================================
       LOAD SETTINGS
    ========================================================= */

    async function loadState() {
        if (stateLoaded) {
            return state;
        }

        if (statePromise) {
            return statePromise;
        }

        statePromise = (async function () {
            const client = db();

            if (!client) {
                console.warn(
                    'GraceConnect App32: Supabase client not available.'
                );

                const cached =
                    localStorage.getItem(STORAGE_KEY);

                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);

                        state.legalDocument =
                            mergeLegalDocument(
                                parsed.legalDocument
                            );

                        state.landingSections =
                            mergeLandingSections(
                                parsed.landingSections
                            );
                    } catch (e) {}
                }

                stateLoaded = true;

                return state;
            }

            try {
                const result = await client
                    .from('church_settings')
                    .select(
                        'legal_document,landing_sections'
                    )
                    .eq('id', SETTINGS_ID)
                    .maybeSingle();

                if (result.error) {
                    console.warn(
                        'GraceConnect App32: Could not load church settings.',
                        result.error
                    );
                }

                const row = result.data || {};

                state.legalDocument =
                    mergeLegalDocument(
                        row.legal_document
                    );

                state.landingSections =
                    mergeLandingSections(
                        row.landing_sections
                    );

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(state)
                );

                stateLoaded = true;

                return state;
            } catch (error) {
                console.error(
                    'GraceConnect App32 loadState:',
                    error
                );

                stateLoaded = true;

                return state;
            }
        })();

        return statePromise;
    }


    /* =========================================================
       SAVE SETTINGS
    ========================================================= */

    async function saveState() {
        const client = db();

        if (!client) {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );

            return {
                success: true,
                localOnly: true
            };
        }

        const payload = {
            id: SETTINGS_ID,
            legal_document: state.legalDocument,
            landing_sections: state.landingSections,
            updated_at: new Date().toISOString()
        };

        try {
            const result = await client
                .from('church_settings')
                .upsert(
                    payload,
                    {
                        onConflict: 'id'
                    }
                );

            if (result.error) {
                throw result.error;
            }

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );

            return {
                success: true
            };
        } catch (error) {
            console.error(
                'GraceConnect App32 saveState:',
                error
            );

            return {
                success: false,
                error
            };
        }
    }


    /* =========================================================
       CSS
    ========================================================= */

    function injectStyles() {
        if (document.getElementById('gc32-styles')) {
            return;
        }

        const style = document.createElement('style');

        style.id = 'gc32-styles';

        style.textContent = `
/* =========================================================
   GRACECONNECT APP32 PREMIUM BRANDING
========================================================= */

#gc32-public-sections {
    width: 100%;
    margin: 48px auto 20px;
    padding: 0 18px;
    max-width: 1400px;
    box-sizing: border-box;
}

.gc32-public-heading {
    text-align: center;
    margin-bottom: 30px;
}

.gc32-public-heading .gc32-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 13px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    background: rgba(99,102,241,.10);
    color: #6366f1;
}

.gc32-public-heading h2 {
    margin: 13px 0 8px;
    font-size: clamp(25px, 4vw, 39px);
    font-weight: 850;
    letter-spacing: -.8px;
}

.gc32-public-heading p {
    margin: 0 auto;
    max-width: 680px;
    color: #6b7280;
    line-height: 1.7;
}

.gc32-public-grid {
    display: grid;
    grid-template-columns: repeat(
        auto-fit,
        minmax(245px, 1fr)
    );
    gap: 18px;
}

.gc32-public-card {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(148,163,184,.18);
    border-radius: 22px;
    padding: 24px;
    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.98),
            rgba(248,250,252,.96)
        );
    box-shadow:
        0 10px 35px rgba(15,23,42,.06);
    cursor: pointer;
    transition:
        transform .25s ease,
        box-shadow .25s ease,
        border-color .25s ease;
}

.gc32-public-card::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 4px;
    background:
        linear-gradient(
            90deg,
            #6366f1,
            #8b5cf6,
            #ec4899
        );
    opacity: .9;
}

.gc32-public-card:hover {
    transform: translateY(-5px);
    border-color: rgba(99,102,241,.28);
    box-shadow:
        0 18px 45px rgba(15,23,42,.12);
}

.gc32-card-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background:
        linear-gradient(
            135deg,
            rgba(99,102,241,.13),
            rgba(139,92,246,.10)
        );
    color: #6366f1;
    font-size: 20px;
    margin-bottom: 18px;
}

.gc32-card-eyebrow {
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 1.2px;
    color: #94a3b8;
    margin-bottom: 6px;
}

.gc32-public-card h3 {
    margin: 0 0 10px;
    font-size: 20px;
    font-weight: 800;
}

.gc32-public-card p {
    margin: 0;
    color: #64748b;
    line-height: 1.65;
    font-size: 14px;
}

.gc32-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid rgba(148,163,184,.14);
    color: #6366f1;
    font-size: 12px;
    font-weight: 800;
}

.gc32-card-footer i {
    transition: transform .2s ease;
}

.gc32-public-card:hover .gc32-card-footer i {
    transform: translateX(4px);
}


/* =========================================================
   MODALS
========================================================= */

.gc32-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    background: rgba(2,6,23,.72);
    backdrop-filter: blur(10px);
}

.gc32-modal {
    width: min(940px, 100%);
    max-height: 92vh;
    overflow: auto;
    border-radius: 26px;
    background: #fff;
    box-shadow:
        0 30px 90px rgba(0,0,0,.28);
    animation: gc32ModalIn .22s ease;
}

@keyframes gc32ModalIn {
    from {
        opacity: 0;
        transform: translateY(15px) scale(.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.gc32-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
    padding: 25px 27px 20px;
    border-bottom: 1px solid #e5e7eb;
}

.gc32-modal-header h2 {
    margin: 0;
    font-size: 23px;
    font-weight: 850;
}

.gc32-modal-header p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
}

.gc32-close {
    width: 38px;
    height: 38px;
    border: 0;
    border-radius: 12px;
    background: #f1f5f9;
    cursor: pointer;
    color: #475569;
    font-size: 16px;
}

.gc32-modal-body {
    padding: 27px;
}

.gc32-document-section {
    padding: 20px 0;
    border-bottom: 1px solid #edf2f7;
}

.gc32-document-section:last-child {
    border-bottom: 0;
}

.gc32-document-section h3 {
    margin: 0 0 10px;
    font-size: 19px;
}

.gc32-document-section .gc32-content {
    color: #475569;
    line-height: 1.8;
    white-space: pre-wrap;
}

.gc32-modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 18px 27px;
    border-top: 1px solid #e5e7eb;
}

.gc32-btn {
    min-height: 42px;
    padding: 0 17px;
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 750;
    transition: .2s ease;
}

.gc32-btn-primary {
    color: #fff;
    background: linear-gradient(
        135deg,
        #6366f1,
        #7c3aed
    );
}

.gc32-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(99,102,241,.25);
}

.gc32-btn-secondary {
    color: #334155;
    background: #f1f5f9;
}

.gc32-btn-danger {
    color: #fff;
    background: #dc2626;
}

.gc32-btn-success {
    color: #fff;
    background: #059669;
}

.gc32-btn-small {
    min-height: 34px;
    padding: 0 11px;
    border-radius: 9px;
    font-size: 12px;
}


/* =========================================================
   ADMIN
========================================================= */

.gc32-admin-shell {
    display: grid;
    gap: 20px;
}

.gc32-admin-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 5px;
}

.gc32-admin-tab {
    border: 0;
    padding: 10px 14px;
    border-radius: 11px;
    background: #f1f5f9;
    cursor: pointer;
    font-weight: 750;
    color: #475569;
}

.gc32-admin-tab.active {
    background: #6366f1;
    color: white;
}

.gc32-admin-pane {
    display: none;
}

.gc32-admin-pane.active {
    display: block;
}

.gc32-form-group {
    margin-bottom: 18px;
}

.gc32-form-group label {
    display: block;
    margin-bottom: 7px;
    font-size: 12px;
    font-weight: 800;
    color: #334155;
}

.gc32-form-group input,
.gc32-form-group textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #dbe2ea;
    border-radius: 12px;
    padding: 12px 13px;
    outline: none;
    font: inherit;
    background: #fff;
}

.gc32-form-group textarea {
    min-height: 150px;
    resize: vertical;
    line-height: 1.6;
}

.gc32-form-group input:focus,
.gc32-form-group textarea:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(99,102,241,.10);
}

.gc32-landing-row {
    display: grid;
    grid-template-columns: 40px minmax(0,1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 14px;
    margin-bottom: 10px;
    border: 1px solid #e5e7eb;
    border-radius: 15px;
    background: #fff;
}

.gc32-landing-row:hover {
    border-color: #c7d2fe;
}

.gc32-landing-toggle {
    width: 19px;
    height: 19px;
    accent-color: #6366f1;
}

.gc32-order-buttons {
    display: flex;
    gap: 5px;
}

.gc32-order-btn {
    width: 33px;
    height: 33px;
    border: 0;
    border-radius: 9px;
    background: #f1f5f9;
    cursor: pointer;
}

.gc32-order-btn:hover {
    background: #e2e8f0;
}

.gc32-landing-row input {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 11px;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
}


/* =========================================================
   MODERATION
========================================================= */

.gc32-user-row {
    display: grid;
    grid-template-columns: minmax(0,1fr) auto;
    gap: 15px;
    align-items: center;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    margin-bottom: 10px;
}

.gc32-user-name {
    font-weight: 800;
}

.gc32-user-email {
    color: #64748b;
    font-size: 13px;
    margin-top: 3px;
    word-break: break-word;
}

.gc32-block-row {
    display: grid;
    grid-template-columns: minmax(0,1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 14px;
    border: 1px solid #fee2e2;
    background: #fffafa;
    border-radius: 13px;
    margin-bottom: 9px;
}

.gc32-block-email {
    font-weight: 750;
    word-break: break-word;
}

.gc32-block-reason {
    color: #64748b;
    font-size: 12px;
    margin-top: 3px;
}


/* =========================================================
   ADMIN DISCOVER CARD
========================================================= */

.gc32-discover-admin-card {
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    padding: 22px;
    background:
        linear-gradient(
            135deg,
            #0f172a,
            #312e81
        );
    color: #fff;
    margin: 12px 0;
    box-shadow:
        0 15px 35px rgba(15,23,42,.18);
}

.gc32-discover-admin-card::after {
    content: "";
    position: absolute;
    width: 180px;
    height: 180px;
    right: -60px;
    top: -70px;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
}

.gc32-discover-admin-card h3 {
    position: relative;
    z-index: 1;
    margin: 0 0 6px;
    font-size: 19px;
}

.gc32-discover-admin-card p {
    position: relative;
    z-index: 1;
    color: rgba(255,255,255,.72);
    margin: 0 0 17px;
    font-size: 13px;
    line-height: 1.6;
}

.gc32-admin-card-buttons {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.gc32-admin-card-buttons button {
    border: 0;
    border-radius: 10px;
    padding: 9px 12px;
    cursor: pointer;
    background: rgba(255,255,255,.12);
    color: #fff;
    font-weight: 750;
}

.gc32-admin-card-buttons button:hover {
    background: rgba(255,255,255,.2);
}


/* =========================================================
   TERMS CHECKBOX
========================================================= */

.gc32-terms-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 15px 0;
    padding: 13px;
    border-radius: 13px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
}

.gc32-terms-wrapper.invalid {
    border-color: #ef4444;
    background: #fff7f7;
}

.gc32-terms-wrapper input {
    margin-top: 3px;
    width: 17px;
    height: 17px;
    accent-color: #6366f1;
}

.gc32-terms-wrapper label {
    font-size: 12px;
    line-height: 1.55;
    color: #475569;
}

.gc32-terms-wrapper a {
    color: #6366f1;
    font-weight: 800;
    cursor: pointer;
}


/* =========================================================
   NOTIFICATION
========================================================= */

#gc32-notification {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 1000001;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 250px;
    max-width: 390px;
    padding: 14px 16px;
    border-radius: 14px;
    background: #0f172a;
    color: #fff;
    box-shadow: 0 15px 40px rgba(0,0,0,.25);
    font-size: 13px;
    animation: gc32ToastIn .2s ease;
}

.gc32-notification-icon {
    font-size: 17px;
}

#gc32-notification.gc32-hide {
    opacity: 0;
    transform: translateY(8px);
    transition: .3s ease;
}


/* =========================================================
   DARK MODE SUPPORT
========================================================= */

body.dark #gc32-public-sections,
.dark #gc32-public-sections {
    color: #f8fafc;
}

body.dark .gc32-public-card,
.dark .gc32-public-card {
    background:
        linear-gradient(
            145deg,
            #111827,
            #0f172a
        );
    border-color: rgba(255,255,255,.08);
}

body.dark .gc32-public-card p,
.dark .gc32-public-card p {
    color: #94a3b8;
}

body.dark .gc32-public-heading p,
.dark .gc32-public-heading p {
    color: #94a3b8;
}

body.dark .gc32-modal,
.dark .gc32-modal {
    background: #0f172a;
    color: #f8fafc;
}

body.dark .gc32-modal-header,
.dark .gc32-modal-actions,
.dark .gc32-document-section,
body.dark .gc32-modal-header,
body.dark .gc32-modal-actions,
body.dark .gc32-document-section {
    border-color: rgba(255,255,255,.08);
}

body.dark .gc32-document-section .gc32-content,
.dark .gc32-document-section .gc32-content {
    color: #cbd5e1;
}

body.dark .gc32-form-group input,
body.dark .gc32-form-group textarea,
.dark .gc32-form-group input,
.dark .gc32-form-group textarea {
    background: #111827;
    color: #f8fafc;
    border-color: #334155;
}

body.dark .gc32-landing-row,
.dark .gc32-landing-row {
    background: #111827;
    border-color: #334155;
}

body.dark .gc32-landing-row input,
.dark .gc32-landing-row input {
    background: #0f172a;
    color: #fff;
    border-color: #334155;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 650px) {

    #gc32-public-sections {
        padding: 0 12px;
        margin-top: 35px;
    }

    .gc32-public-grid {
        grid-template-columns: 1fr;
    }

    .gc32-modal-backdrop {
        padding: 8px;
    }

    .gc32-modal {
        max-height: 95vh;
        border-radius: 20px;
    }

    .gc32-modal-header,
    .gc32-modal-body,
    .gc32-modal-actions {
        padding-left: 18px;
        padding-right: 18px;
    }

    .gc32-landing-row {
        grid-template-columns: 35px minmax(0,1fr);
    }

    .gc32-order-buttons {
        grid-column: 2;
    }

    .gc32-user-row,
    .gc32-block-row {
        grid-template-columns: 1fr;
    }

    .gc32-modal-actions {
        flex-direction: column;
    }

    .gc32-modal-actions .gc32-btn {
        width: 100%;
    }
}
`;

        document.head.appendChild(style);
    }


    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    function closeModal(id) {
        const modal = document.getElementById(id);

        if (modal) {
            modal.remove();
        }
    }

    window.gc32CloseModal = function (id) {
        closeModal(id);
    };


    /* =========================================================
       PUBLIC SECTION MODAL
    ========================================================= */

    window.gc32OpenPublicSection = async function (key) {
        await loadState();

        const doc =
            state.legalDocument[key];

        const landing =
            state.landingSections[key];

        if (!doc) {
            return;
        }

        const title =
            landing && landing.title
                ? landing.title
                : doc.title;

        const meta =
            SECTION_META[key] || {};

        closeModal('gc32-public-document-modal');

        const modal =
            document.createElement('div');

        modal.id =
            'gc32-public-document-modal';

        modal.className =
            'gc32-modal-backdrop';

        modal.innerHTML = `
            <div
                class="gc32-modal"
                role="dialog"
                aria-modal="true"
            >

                <div class="gc32-modal-header">

                    <div>
                        <div
                            class="gc32-card-eyebrow"
                            style="color:#6366f1;margin-bottom:7px;"
                        >
                            ${escapeHTML(meta.eyebrow || 'GRACECONNECT')}
                        </div>

                        <h2>
                            ${escapeHTML(title)}
                        </h2>

                        <p>
                            ${escapeHTML(
                                meta.description || ''
                            )}
                        </p>
                    </div>

                    <button
                        class="gc32-close"
                        onclick="gc32CloseModal('gc32-public-document-modal')"
                        aria-label="Close"
                    >
                        <i class="fas fa-times"></i>
                    </button>

                </div>

                <div class="gc32-modal-body">

                    <div class="gc32-document-section">
                        <div class="gc32-content">
                            ${escapeHTML(doc.content || '')}
                        </div>
                    </div>

                </div>

            </div>
        `;

        modal.addEventListener(
            'click',
            function (event) {
                if (event.target === modal) {
                    closeModal(
                        'gc32-public-document-modal'
                    );
                }
            }
        );

        document.body.appendChild(modal);
    };


    /* =========================================================
       FULL PUBLIC LEGAL DOCUMENT
    ========================================================= */

    window.gc32OpenFullDocument = async function () {
        await loadState();

        closeModal('gc32-full-document-modal');

        const modal =
            document.createElement('div');

        modal.id =
            'gc32-full-document-modal';

        modal.className =
            'gc32-modal-backdrop';

        const sections = Object.keys(
            state.legalDocument
        );

        modal.innerHTML = `
            <div class="gc32-modal">

                <div class="gc32-modal-header">

                    <div>
                        <h2>
                            Church Information & Terms
                        </h2>

                        <p>
                            Official church information,
                            policies and platform terms.
                        </p>
                    </div>

                    <button
                        class="gc32-close"
                        onclick="gc32CloseModal('gc32-full-document-modal')"
                    >
                        <i class="fas fa-times"></i>
                    </button>

                </div>

                <div class="gc32-modal-body">

                    ${sections.map(key => {

                        const doc =
                            state.legalDocument[key];

                        return `
                            <section class="gc32-document-section">

                                <h3>
                                    ${escapeHTML(
                                        doc.title
                                    )}
                                </h3>

                                <div class="gc32-content">
                                    ${escapeHTML(
                                        doc.content
                                    )}
                                </div>

                            </section>
                        `;

                    }).join('')}

                </div>

            </div>
        `;

        modal.addEventListener(
            'click',
            function (event) {
                if (event.target === modal) {
                    closeModal(
                        'gc32-full-document-modal'
                    );
                }
            }
        );

        document.body.appendChild(modal);
    };


    /* =========================================================
       FIND GALLERY
    ========================================================= */

    function findGallery() {

        const selectors = [
            '#gallerySection',
            '#gallery-section',
            '#gallery',
            '.gallery-section',
            '[data-section="gallery"]'
        ];

        for (const selector of selectors) {
            const element =
                document.querySelector(selector);

            if (element) {
                return element;
            }
        }

        const headings =
            document.querySelectorAll(
                'h1,h2,h3,h4,.section-title,.section-heading'
            );

        for (const heading of headings) {

            const text =
                String(
                    heading.textContent || ''
                )
                    .trim()
                    .toLowerCase();

            if (text === 'gallery') {

                let parent =
                    heading.closest('section');

                if (!parent) {
                    parent =
                        heading.parentElement;
                }

                if (parent) {
                    return parent;
                }
            }
        }

        return null;
    }


    /* =========================================================
       FIND LANDING CONTAINER
    ========================================================= */

    function findLandingFallback() {

        const selectors = [
            '#discover',
            '#discoverSection',
            '#discover-section',
            '#home',
            '#landing',
            'main'
        ];

        for (const selector of selectors) {

            const el =
                document.querySelector(selector);

            if (el) {
                return el;
            }
        }

        return document.body;
    }


    /* =========================================================
       RENDER PUBLIC LANDING SECTIONS
    ========================================================= */

    async function renderLandingSections() {

        await loadState();

        let container =
            document.getElementById(
                'gc32-public-sections'
            );

        if (!container) {

            container =
                document.createElement('section');

            container.id =
                'gc32-public-sections';

            const gallery =
                findGallery();

            if (gallery && gallery.parentNode) {

                gallery.parentNode.insertBefore(
                    container,
                    gallery.nextSibling
                );

            } else {

                const fallback =
                    findLandingFallback();

                fallback.appendChild(container);
            }
        }

        const visible =
            Object.keys(
                state.landingSections
            )
                .filter(key => {

                    const setting =
                        state.landingSections[key];

                    return (
                        setting &&
                        setting.enabled === true &&
                        state.legalDocument[key]
                    );
                })
                .sort((a, b) => {

                    return (
                        Number(
                            state.landingSections[a].order
                        ) -
                        Number(
                            state.landingSections[b].order
                        )
                    );
                });

        if (!visible.length) {

            container.innerHTML = '';

            return;
        }

        container.innerHTML = `

            <div class="gc32-public-heading">

                <span class="gc32-eyebrow">
                    <i class="fas fa-church"></i>
                    Discover
                </span>

                <h2>
                    Know Our Church
                </h2>

                <p>
                    Learn more about our story,
                    purpose, faith and community.
                </p>

            </div>

            <div class="gc32-public-grid">

                ${visible.map(key => {

                    const setting =
                        state.landingSections[key];

                    const doc =
                        state.legalDocument[key];

                    const meta =
                        SECTION_META[key] || {};

                    return `

                        <article
                            class="gc32-public-card"
                            data-gc32-section="${escapeAttribute(key)}"
                            onclick="gc32OpenPublicSection('${escapeAttribute(key)}')"
                        >

                            <div class="gc32-card-icon">
                                <i class="fas ${
                                    meta.icon ||
                                    'fa-book-open'
                                }"></i>
                            </div>

                            <div class="gc32-card-eyebrow">
                                ${escapeHTML(
                                    meta.eyebrow ||
                                    'DISCOVER'
                                )}
                            </div>

                            <h3>
                                ${escapeHTML(
                                    setting.title ||
                                    doc.title
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    excerpt(
                                        doc.content,
                                        155
                                    )
                                )}
                            </p>

                            <div class="gc32-card-footer">

                                <span>
                                    Read more
                                </span>

                                <i class="fas fa-arrow-right"></i>

                            </div>

                        </article>
                    `;
                }).join('')}

            </div>
        `;

        landingInserted = true;
    }


    /* =========================================================
       ADMIN LANDING PAGE MANAGER
    ========================================================= */

    window.gc32OpenLandingManager = async function () {

        if (!(await isAdminUser())) {
            notify(
                'Administrator access is required.',
                'error'
            );
            return;
        }

        await loadState();

        closeModal('gc32-admin-branding-modal');

        const modal =
            document.createElement('div');

        modal.id =
            'gc32-admin-branding-modal';

        modal.className =
            'gc32-modal-backdrop';

        const orderedKeys =
            Object.keys(
                state.landingSections
            ).sort((a, b) => {

                return (
                    Number(
                        state.landingSections[a].order
                    ) -
                    Number(
                        state.landingSections[b].order
                    )
                );
            });

        modal.innerHTML = `

            <div class="gc32-modal">

                <div class="gc32-modal-header">

                    <div>
                        <h2>
                            Landing Page Visibility
                        </h2>

                        <p>
                            Choose which church information
                            appears after Gallery.
                        </p>
                    </div>

                    <button
                        class="gc32-close"
                        onclick="gc32CloseModal('gc32-admin-branding-modal')"
                    >
                        <i class="fas fa-times"></i>
                    </button>

                </div>

                <div class="gc32-modal-body">

                    <div
                        style="
                            padding:14px;
                            border-radius:13px;
                            background:#f8fafc;
                            margin-bottom:18px;
                            color:#475569;
                            font-size:13px;
                            line-height:1.6;
                        "
                    >
                        <strong>
                            Control what visitors see.
                        </strong>
                        <br>
                        Hidden sections remain available
                        inside the full church document
                        and Terms & Conditions remain
                        mandatory during registration.
                    </div>

                    <div id="gc32-landing-manager-list">

                        ${orderedKeys.map(key => {

                            const setting =
                                state.landingSections[key];

                            const doc =
                                state.legalDocument[key];

                            const meta =
                                SECTION_META[key] || {};

                            return `

                                <div
                                    class="gc32-landing-row"
                                    data-key="${escapeAttribute(key)}"
                                >

                                    <input
                                        class="gc32-landing-toggle"
                                        type="checkbox"
                                        ${
                                            setting.enabled
                                                ? 'checked'
                                                : ''
                                        }
                                        title="Show on landing page"
                                    >

                                    <div>

                                        <div
                                            style="
                                                display:flex;
                                                align-items:center;
                                                gap:9px;
                                                margin-bottom:7px;
                                            "
                                        >

                                            <i
                                                class="fas ${
                                                    meta.icon ||
                                                    'fa-file'
                                                }"
                                                style="
                                                    color:#6366f1;
                                                    width:18px;
                                                "
                                            ></i>

                                            <strong>
                                                ${
                                                    escapeHTML(
                                                        doc.title
                                                    )
                                                }
                                            </strong>

                                        </div>

                                        <input
                                            class="gc32-landing-title"
                                            value="${escapeAttribute(
                                                setting.title
                                            )}"
                                            placeholder="Landing page title"
                                        >

                                    </div>

                                    <div class="gc32-order-buttons">

                                        <button
                                            class="gc32-order-btn"
                                            onclick="gc32MoveLanding('${escapeAttribute(key)}', -1)"
                                            title="Move up"
                                        >
                                            <i class="fas fa-chevron-up"></i>
                                        </button>

                                        <button
                                            class="gc32-order-btn"
                                            onclick="gc32MoveLanding('${escapeAttribute(key)}', 1)"
                                            title="Move down"
                                        >
                                            <i class="fas fa-chevron-down"></i>
                                        </button>

                                    </div>

                                </div>
                            `;

                        }).join('')}

                    </div>

                </div>

                <div class="gc32-modal-actions">

                    <button
                        class="gc32-btn gc32-btn-secondary"
                        onclick="gc32CloseModal('gc32-admin-branding-modal')"
                    >
                        Cancel
                    </button>

                    <button
                        class="gc32-btn gc32-btn-primary"
                        onclick="gc32SaveLandingManager()"
                    >
                        <i class="fas fa-save"></i>
                        Save Landing Page
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener(
            'click',
            function (event) {

                if (event.target === modal) {
                    closeModal(
                        'gc32-admin-branding-modal'
                    );
                }

            }
        );
    };


    /* =========================================================
       MOVE LANDING SECTION
    ========================================================= */

    window.gc32MoveLanding = function (
        key,
        direction
    ) {

        const list =
            document.getElementById(
                'gc32-landing-manager-list'
            );

        if (!list) {
            return;
        }

        const rows =
            Array.from(
                list.querySelectorAll(
                    '.gc32-landing-row'
                )
            );

        const index =
            rows.findIndex(
                row =>
                    row.dataset.key === key
            );

        if (index < 0) {
            return;
        }

        const row = rows[index];

        if (direction < 0 && index > 0) {

            list.insertBefore(
                row,
                rows[index - 1]
            );

        } else if (
            direction > 0 &&
            index < rows.length - 1
        ) {

            list.insertBefore(
                rows[index + 1],
                row
            );
        }
    };


    /* =========================================================
       SAVE LANDING MANAGER
    ========================================================= */

    window.gc32SaveLandingManager = async function () {

        if (!(await isAdminUser())) {
            notify(
                'Administrator access is required.',
                'error'
            );
            return;
        }

        const list =
            document.getElementById(
                'gc32-landing-manager-list'
            );

        if (!list) {
            return;
        }

        const rows =
            Array.from(
                list.querySelectorAll(
                    '.gc32-landing-row'
                )
            );

        rows.forEach((row, index) => {

            const key =
                row.dataset.key;

            const checkbox =
                row.querySelector(
                    '.gc32-landing-toggle'
                );

            const titleInput =
                row.querySelector(
                    '.gc32-landing-title'
                );

            if (!state.landingSections[key]) {
                state.landingSections[key] = {};
            }

            state.landingSections[key].enabled =
                !!(
                    checkbox &&
                    checkbox.checked
                );

            state.landingSections[key].title =
                titleInput
                    ? titleInput.value.trim() ||
                      state.legalDocument[key].title
                    : state.legalDocument[key].title;

            state.landingSections[key].order =
                index + 1;
        });

        notify(
            'Saving landing page settings…',
            'info'
        );

        const result =
            await saveState();

        if (!result.success) {

            notify(
                'Could not save landing page settings.',
                'error'
            );

            return;
        }

        closeModal(
            'gc32-admin-branding-modal'
        );

        landingInserted = false;

        await renderLandingSections();

        notify(
            'Landing page settings saved successfully.',
            'success'
        );
    };


    /* =========================================================
       ADMIN BRANDING EDITOR
    ========================================================= */

    window.gc32OpenBrandingEditor = async function () {

        if (!(await isAdminUser())) {
            notify(
                'Administrator access is required.',
                'error'
            );
            return;
        }

        await loadState();

        closeModal('gc32-branding-editor');

        const modal =
            document.createElement('div');

        modal.id =
            'gc32-branding-editor';

        modal.className =
            'gc32-modal-backdrop';

        modal.innerHTML = `

            <div class="gc32-modal">

                <div class="gc32-modal-header">

                    <div>
                        <h2>
                            Admin Branding & Church Document
                        </h2>

                        <p>
                            Edit the official church information,
                            policies and platform terms.
                        </p>
                    </div>

                    <button
                        class="gc32-close"
                        onclick="gc32CloseModal('gc32-branding-editor')"
                    >
                        <i class="fas fa-times"></i>
                    </button>

                </div>

                <div class="gc32-modal-body">

                    <div class="gc32-admin-tabs">

                        <button
                            class="gc32-admin-tab active"
                            data-tab="content"
                            onclick="gc32BrandingTab('content')"
                        >
                            <i class="fas fa-file-alt"></i>
                            Document
                        </button>

                        <button
                            class="gc32-admin-tab"
                            data-tab="landing"
                            onclick="gc32BrandingTab('landing')"
                        >
                            <i class="fas fa-layer-group"></i>
                            Landing Page
                        </button>

                    </div>

                    <div
                        class="gc32-admin-pane active"
                        id="gc32-pane-content"
                    >

                        ${Object.keys(
                            state.legalDocument
                        ).map(key => {

                            const doc =
                                state.legalDocument[key];

                            return `

                                <div class="gc32-form-group">

                                    <label>
                                        ${escapeHTML(
                                            SECTION_META[key]
                                                ?.eyebrow ||
                                            key
                                        )}
                                    </label>

                                    <input
                                        id="gc32-title-${escapeAttribute(key)}"
                                        value="${escapeAttribute(
                                            doc.title
                                        )}"
                                        placeholder="Section title"
                                    >

                                    <textarea
                                        id="gc32-content-${escapeAttribute(key)}"
                                        style="margin-top:8px;"
                                        placeholder="Section content"
                                    >${escapeHTML(
                                        doc.content
                                    )}</textarea>

                                </div>

                            `;
                        }).join('')}

                    </div>

                    <div
                        class="gc32-admin-pane"
                        id="gc32-pane-landing"
                    >

                        <p
                            style="
                                color:#64748b;
                                font-size:13px;
                                line-height:1.6;
                                margin-top:0;
                            "
                        >
                            Use the Landing Page manager to
                            individually control visibility and
                            order.
                        </p>

                        <button
                            class="gc32-btn gc32-btn-primary"
                            onclick="gc32OpenLandingManager()"
                        >
                            <i class="fas fa-sliders-h"></i>
                            Open Visibility Manager
                        </button>

                    </div>

                </div>

                <div class="gc32-modal-actions">

                    <button
                        class="gc32-btn gc32-btn-secondary"
                        onclick="gc32CloseModal('gc32-branding-editor')"
                    >
                        Cancel
                    </button>

                    <button
                        class="gc32-btn gc32-btn-primary"
                        onclick="gc32SaveBrandingDocument()"
                    >
                        <i class="fas fa-save"></i>
                        Save Document
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener(
            'click',
            function (event) {

                if (event.target === modal) {
                    closeModal(
                        'gc32-branding-editor'
                    );
                }

            }
        );
    };


    /* =========================================================
       BRANDING TABS
    ========================================================= */

    window.gc32BrandingTab = function (tab) {

        const modal =
            document.getElementById(
                'gc32-branding-editor'
            );

        if (!modal) {
            return;
        }

        modal
            .querySelectorAll('.gc32-admin-tab')
            .forEach(button => {

                button.classList.toggle(
                    'active',
                    button.dataset.tab === tab
                );

            });

        modal
            .querySelectorAll('.gc32-admin-pane')
            .forEach(pane => {

                pane.classList.toggle(
                    'active',
                    pane.id ===
                    'gc32-pane-' + tab
                );

            });
    };


    /* =========================================================
       SAVE BRANDING DOCUMENT
    ========================================================= */

    window.gc32SaveBrandingDocument =
        async function () {

        if (!(await isAdminUser())) {
            notify(
                'Administrator access is required.',
                'error'
            );
            return;
        }

        Object.keys(
            state.legalDocument
        ).forEach(key => {

            const title =
                document.getElementById(
                    'gc32-title-' + key
                );

            const content =
                document.getElementById(
                    'gc32-content-' + key
                );

            if (title) {
                state.legalDocument[key].title =
                    title.value.trim() ||
                    DEFAULT_DOCUMENT[key].title;
            }

            if (content) {
                state.legalDocument[key].content =
                    content.value.trim() ||
                    DEFAULT_DOCUMENT[key].content;
            }
        });

        notify(
            'Saving church document…',
            'info'
        );

        const result =
            await saveState();

        if (!result.success) {

            notify(
                'Could not save the church document.',
                'error'
            );

            return;
        }

        closeModal(
            'gc32-branding-editor'
        );

        landingInserted = false;

        await renderLandingSections();

        notify(
            'Church document saved successfully.',
            'success'
        );
    };


    /* =========================================================
       ADMIN DISCOVER CARD
    ========================================================= */

    async function insertAdminDiscoverCard() {

        if (adminPanelInserted) {
            return;
        }

        if (!(await isAdminUser())) {
            return;
        }

        const panel =
            document.getElementById(
                'adminDiscoverPanel'
            ) ||
            document.querySelector(
                '#adminDiscoverPanel'
            );

        if (!panel) {
            return;
        }

        if (
            panel.querySelector(
                '#gc32-admin-branding-card'
            )
        ) {
            adminPanelInserted = true;
            return;
        }

        const card =
            document.createElement('div');

        card.id =
            'gc32-admin-branding-card';

        card.className =
            'gc32-discover-admin-card';

        card.innerHTML = `

            <h3>
                <i class="fas fa-palette"></i>
                Church Branding & Policies
            </h3>

            <p>
                Manage church history, vision, mission,
                statement of faith, contact information,
                privacy, copyright, community standards
                and Terms & Conditions.
            </p>

            <div class="gc32-admin-card-buttons">

                <button
                    onclick="gc32OpenBrandingEditor()"
                >
                    <i class="fas fa-edit"></i>
                    Edit Document
                </button>

                <button
                    onclick="gc32OpenLandingManager()"
                >
                    <i class="fas fa-layer-group"></i>
                    Landing Visibility
                </button>

                <button
                    onclick="gc32OpenFullDocument()"
                >
                    <i class="fas fa-eye"></i>
                    Preview
                </button>

                <button
                    onclick="gc32OpenModeration()"
                >
                    <i class="fas fa-user-shield"></i>
                    Moderation
                </button>

            </div>
        `;

        panel.prepend(card);

        adminPanelInserted = true;
    }


    /* =========================================================
       EMAIL BLOCKLIST CHECK
    ========================================================= */

    async function isEmailBlocked(email) {

        email =
            String(email || '')
                .trim()
                .toLowerCase();

        if (!email) {
            return false;
        }

        const client = db();

        if (!client) {
            return false;
        }

        /* Preferred secure RPC */

        try {

            if (typeof client.rpc === 'function') {

                const result =
                    await client.rpc(
                        'is_email_blocked',
                        {
                            p_email: email
                        }
                    );

                if (!result.error) {
                    return !!result.data;
                }
            }

        } catch (e) {
            console.warn(
                'GraceConnect App32 blocklist RPC unavailable.',
                e
            );
        }

        /*
         * Fallback.

         * This requires appropriate RLS.
         */

        try {

            const result =
                await client
                    .from('blocked_emails')
                    .select('email')
                    .eq('email', email)
                    .eq('active', true)
                    .maybeSingle();

            if (!result.error) {
                return !!result.data;
            }

        } catch (e) {}

        return false;
    }


    /* =========================================================
       BLOCK EMAIL
    ========================================================= */

    async function blockEmail(
        email,
        reason
    ) {

        const client = db();

        if (!client) {
            throw new Error(
                'Supabase client unavailable.'
            );
        }

        email =
            String(email || '')
                .trim()
                .toLowerCase();

        if (!email) {
            throw new Error(
                'A valid email address is required.'
            );
        }

        const user =
            await getAuthenticatedUser();

        const payload = {
            email: email,
            active: true,
            reason:
                String(reason || '').trim() ||
                'Blocked by administrator.',
            blocked_by:
                user ? user.id : null,
            blocked_at:
                new Date().toISOString(),
            unblocked_at: null
        };

        const result =
            await client
                .from('blocked_emails')
                .upsert(
                    payload,
                    {
                        onConflict: 'email'
                    }
                );

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =========================================================
       UNBLOCK EMAIL
    ========================================================= */

    window.gc32UnblockEmail = async function (
        email
    ) {

        if (!(await isAdminUser())) {
            notify(
                'Administrator access is required.',
                'error'
            );
            return;
        }

        const client = db();

        if (!client) {
            notify(
                'Supabase is unavailable.',
                'error'
            );
            return;
        }

        const confirmed =
            window.confirm(
                'Remove ' +
                email +
                ' from the active blocklist?'
            );

        if (!confirmed) {
            return;
        }

        try {

            const result =
                await client
                    .from('blocked_emails')
                    .update({
                        active: false,
                        unblocked_at:
                            new Date().toISOString()
                    })
                    .eq(
                        'email',
                        String(email)
                            .trim()
                            .toLowerCase()
                    );

            if (result.error) {
                throw result.error;
            }

            notify(
                'Email removed from the blocklist.',
                'success'
            );

            await gc32OpenModeration();

        } catch (error) {

            console.error(error);

            notify(
                'Could not remove the email from the blocklist.',
                'error'
            );
        }
    };


    /* =========================================================
       DELETE USER
    ========================================================= */

    async function deleteUser(
        userId,
        email
    ) {

        const client = db();

        if (!client) {
            throw new Error(
                'Supabase client unavailable.'
            );
        }

        /*
         * Block the email first.
         * This means that even if auth deletion fails,
         * the address remains blocked.
         */

        if (email) {
            await blockEmail(
                email,
                'Account removed by administrator.'
            );
        }

        /*
         * Full auth.users deletion must be performed
         * by a SECURITY DEFINER Postgres function.
         */

        if (
            typeof client.rpc !== 'function'
        ) {
            throw new Error(
                'Admin deletion RPC is unavailable.'
            );
        }

        const result =
            await client.rpc(
                'admin_delete_user',
                {
                    target_user_id: userId
                }
            );

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =========================================================
       MODERATION PANEL
    ========================================================= */

    window.gc32OpenModeration = async function () {

        if (!(await isAdminUser())) {
            notify(
                'Administrator access is required.',
                'error'
            );
            return;
        }

        const client = db();

        if (!client) {
            notify(
                'Supabase is unavailable.',
                'error'
            );
            return;
        }

        closeModal('gc32-moderation-modal');

        let users = [];
        let blocked = [];

        try {

            const userResult =
                await client
                    .from('profiles')
                    .select('*')
                    .order(
                        'created_at',
                        {
                            ascending: false
                        }
                    )
                    .limit(200);

            if (!userResult.error) {
                users =
                    userResult.data || [];
            }

        } catch (e) {
            console.warn(
                'Could not load profiles.',
                e
            );
        }

        try {

            const blockedResult =
                await client
                    .from('blocked_emails')
                    .select(
                        'email,reason,blocked_at'
                    )
                    .eq(
                        'active',
                        true
                    )
                    .order(
                        'blocked_at',
                        {
                            ascending: false
                        }
                    );

            if (!blockedResult.error) {
                blocked =
                    blockedResult.data || [];
            }

        } catch (e) {
            console.warn(
                'Could not load blocklist.',
                e
            );
        }

        const modal =
            document.createElement('div');

        modal.id =
            'gc32-moderation-modal';

        modal.className =
            'gc32-modal-backdrop';

        modal.innerHTML = `

            <div class="gc32-modal">

                <div class="gc32-modal-header">

                    <div>
                        <h2>
                            User Moderation
                        </h2>

                        <p>
                            Remove accounts and manage blocked
                            email addresses.
                        </p>
                    </div>

                    <button
                        class="gc32-close"
                        onclick="gc32CloseModal('gc32-moderation-modal')"
                    >
                        <i class="fas fa-times"></i>
                    </button>

                </div>

                <div class="gc32-modal-body">

                    <section>

                        <h3
                            style="
                                margin:0 0 12px;
                            "
                        >
                            Registered Users
                        </h3>

                        <div>

                            ${
                                users.length
                                    ? users.map(user => {

                                        const name =
                                            user.name ||
                                            (
                                                String(
                                                    user.first_name ||
                                                    ''
                                                ) +
                                                ' ' +
                                                String(
                                                    user.last_name ||
                                                    ''
                                                )
                                            ).trim() ||
                                            'Unnamed User';

                                        const email =
                                            user.email ||
                                            '';

                                        return `

                                            <div
                                                class="gc32-user-row"
                                            >

                                                <div>

                                                    <div
                                                        class="gc32-user-name"
                                                    >
                                                        ${escapeHTML(
                                                            name
                                                        )}
                                                    </div>

                                                    <div
                                                        class="gc32-user-email"
                                                    >
                                                        ${escapeHTML(
                                                            email
                                                        )}
                                                    </div>

                                                </div>

                                                <button
                                                    class="gc32-btn gc32-btn-danger gc32-btn-small"
                                                    onclick="gc32RemoveUser('${escapeAttribute(user.id)}','${escapeAttribute(email)}')"
                                                >
                                                    <i class="fas fa-user-times"></i>
                                                    Remove
                                                </button>

                                            </div>

                                        `;

                                    }).join('')
                                    :
                                    `
                                        <div
                                            style="
                                                padding:18px;
                                                text-align:center;
                                                color:#64748b;
                                            "
                                        >
                                            No users found.
                                        </div>
                                    `
                            }

                        </div>

                    </section>

                    <section
                        style="
                            margin-top:32px;
                        "
                    >

                        <h3
                            style="
                                margin:0 0 12px;
                            "
                        >
                            Active Email Blocklist
                        </h3>

                        ${
                            blocked.length
                                ? blocked.map(item => `

                                    <div
                                        class="gc32-block-row"
                                    >

                                        <div>

                                            <div
                                                class="gc32-block-email"
                                            >
                                                ${escapeHTML(
                                                    item.email
                                                )}
                                            </div>

                                            <div
                                                class="gc32-block-reason"
                                            >
                                                ${escapeHTML(
                                                    item.reason ||
                                                    'No reason provided.'
                                                )}
                                            </div>

                                        </div>

                                        <button
                                            class="gc32-btn gc32-btn-success gc32-btn-small"
                                            onclick="gc32UnblockEmail('${escapeAttribute(item.email)}')"
                                        >
                                            <i class="fas fa-unlock"></i>
                                            Unblock
                                        </button>

                                    </div>

                                `).join('')
                                :
                                `
                                    <div
                                        style="
                                            padding:18px;
                                            text-align:center;
                                            color:#64748b;
                                            background:#f8fafc;
                                            border-radius:12px;
                                        "
                                    >
                                        No active blocked emails.
                                    </div>
                                `
                        }

                    </section>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener(
            'click',
            function (event) {
                if (event.target === modal) {
                    closeModal(
                        'gc32-moderation-modal'
                    );
                }
            }
        );
    };


    /* =========================================================
       REMOVE USER
    ========================================================= */

    window.gc32RemoveUser = async function (
        userId,
        email
    ) {

        if (!(await isAdminUser())) {
            notify(
                'Administrator access is required.',
                'error'
            );
            return;
        }

        if (!userId) {
            return;
        }

        const confirmed =
            window.confirm(
                'Remove this user from GraceConnect?\n\n' +
                'The email will also be added to the blocklist.'
            );

        if (!confirmed) {
            return;
        }

        try {

            notify(
                'Removing user…',
                'info'
            );

            await deleteUser(
                userId,
                email
            );

            notify(
                'User removed and email blocked.',
                'success'
            );

            await gc32OpenModeration();

        } catch (error) {

            console.error(
                'GraceConnect App32 delete user:',
                error
            );

            notify(
                'User deletion failed: ' +
                (
                    error.message ||
                    'Unknown error'
                ),
                'error'
            );
        }
    };


    /* =========================================================
       ADMIN MANUAL BLOCK EMAIL
    ========================================================= */

    window.gc32PromptBlockEmail = async function () {

        if (!(await isAdminUser())) {
            notify(
                'Administrator access is required.',
                'error'
            );
            return;
        }

        const email =
            window.prompt(
                'Enter the email address to block:'
            );

        if (!email) {
            return;
        }

        const reason =
            window.prompt(
                'Reason for blocking this email:',
                'Blocked by administrator.'
            );

        try {

            await blockEmail(
                email,
                reason
            );

            notify(
                'Email added to the blocklist.',
                'success'
            );

            await gc32OpenModeration();

        } catch (error) {

            notify(
                'Could not block email: ' +
                (
                    error.message ||
                    'Unknown error'
                ),
                'error'
            );
        }
    };


    /* =========================================================
       TERMS CHECKBOX
    ========================================================= */

    function findRegistrationContainer() {

        const ids = [
            'onboarding',
            'onboardingModal',
            'register',
            'registerModal',
            'signup',
            'signupModal'
        ];

        for (const id of ids) {

            const el =
                document.getElementById(id);

            if (el) {
                return el;
            }
        }

        const password =
            document.getElementById(
                'ob-password'
            );

        if (password) {
            return (
                password.closest('form') ||
                password.parentElement
            );
        }

        return null;
    }


    function injectTermsCheckbox() {

        if (
            document.getElementById(
                'gc32-terms-wrapper'
            )
        ) {
            termsInjected = true;
            return;
        }

        const email =
            document.getElementById(
                'ob-email'
            );

        const password =
            document.getElementById(
                'ob-password'
            );

        if (!email || !password) {
            return;
        }

        const container =
            findRegistrationContainer();

        if (!container) {
            return;
        }

        const wrapper =
            document.createElement('div');

        wrapper.id =
            'gc32-terms-wrapper';

        wrapper.className =
            'gc32-terms-wrapper';

        wrapper.innerHTML = `

            <input
                id="gc32-terms-checkbox"
                type="checkbox"
                required
            >

            <label
                for="gc32-terms-checkbox"
            >
                I have read and agree to the
                <a
                    href="javascript:void(0)"
                    onclick="gc32OpenFullDocument()"
                >
                    Terms & Conditions
                </a>
                and understand the GraceConnect
                community rules and privacy requirements.
            </label>

        `;

        /*
         * Put terms immediately after the password field
         * where possible.
         */

        if (password.parentElement) {

            password.parentElement.insertAdjacentElement(
                'afterend',
                wrapper
            );

        } else {

            container.appendChild(
                wrapper
            );
        }

        termsInjected = true;
    }


    /* =========================================================
       VALIDATE TERMS
    ========================================================= */

    async function validateRegistration() {

        const checkbox =
            document.getElementById(
                'gc32-terms-checkbox'
            );

        if (!checkbox) {
            /*
             * Fail closed once registration fields exist.
             */
            return {
                valid: false,
                message:
                    'Please accept the Terms & Conditions.'
            };
        }

        if (!checkbox.checked) {

            const wrapper =
                document.getElementById(
                    'gc32-terms-wrapper'
                );

            if (wrapper) {
                wrapper.classList.add(
                    'invalid'
                );
            }

            return {
                valid: false,
                message:
                    'You must accept the Terms & Conditions before registering.'
            };
        }

        const emailInput =
            document.getElementById(
                'ob-email'
            );

        const email =
            emailInput
                ? emailInput.value.trim()
                : '';

        if (email) {

            const blocked =
                await isEmailBlocked(email);

            if (blocked) {

                return {
                    valid: false,
                    message:
                        'This email address has been blocked from accessing GraceConnect.'
                };
            }
        }

        return {
            valid: true
        };
    }


    /* =========================================================
       WRAP EXISTING REGISTRATION
    ========================================================= */

    function wrapRegistration() {

        if (
            typeof window.completeOnboarding !==
            'function'
        ) {
            return;
        }

        if (
            window.completeOnboarding.__gc32Wrapped
        ) {
            registrationWrapped = true;
            return;
        }

        const original =
            window.completeOnboarding;

        async function wrappedRegistration() {

            const validation =
                await validateRegistration();

            if (!validation.valid) {

                notify(
                    validation.message,
                    'error'
                );

                return false;
            }

            /*
             * Existing app6 registration is then allowed
             * to continue.
             */

            return await original.apply(
                this,
                arguments
            );
        }

        wrappedRegistration.__gc32Wrapped =
            true;

        wrappedRegistration.__gc32Original =
            original;

        window.completeOnboarding =
            wrappedRegistration;

        registrationWrapped = true;
    }


    /* =========================================================
       WRAP LOGIN
    ========================================================= */

    function wrapLogin() {

        if (
            typeof window.doLogin !==
            'function'
        ) {
            return;
        }

        if (
            window.doLogin.__gc32Wrapped
        ) {
            loginWrapped = true;
            return;
        }

        const original =
            window.doLogin;

        async function wrappedLogin() {

            const input =
                document.getElementById(
                    'login-email'
                );

            const email =
                input
                    ? input.value.trim()
                    : '';

            if (email) {

                const blocked =
                    await isEmailBlocked(
                        email
                    );

                if (blocked) {

                    notify(
                        'This email address has been blocked from accessing GraceConnect.',
                        'error'
                    );

                    return false;
                }
            }

            return await original.apply(
                this,
                arguments
            );
        }

        wrappedLogin.__gc32Wrapped =
            true;

        wrappedLogin.__gc32Original =
            original;

        window.doLogin =
            wrappedLogin;

        loginWrapped = true;
    }


    /* =========================================================
       PASSWORD / TERMS FORM SUBMIT SAFETY
    ========================================================= */

    function attachRegistrationSubmitGuard() {

        document.addEventListener(
            'submit',
            async function (event) {

                const target =
                    event.target;

                if (!target) {
                    return;
                }

                const email =
                    target.querySelector(
                        '#ob-email'
                    );

                const password =
                    target.querySelector(
                        '#ob-password'
                    );

                if (!email || !password) {
                    return;
                }

                const validation =
                    await validateRegistration();

                if (!validation.valid) {

                    event.preventDefault();
                    event.stopPropagation();

                    notify(
                        validation.message,
                        'error'
                    );
                }

            },
            true
        );
    }


    /* =========================================================
       REGISTRATION ACCEPTANCE AUDIT
    ========================================================= */

    async function recordTermsAcceptance() {

        const checkbox =
            document.getElementById(
                'gc32-terms-checkbox'
            );

        if (!checkbox || !checkbox.checked) {
            return;
        }

        localStorage.setItem(
            'graceconnect_terms_accepted',
            'true'
        );

        localStorage.setItem(
            'graceconnect_terms_accepted_at',
            new Date().toISOString()
        );

        /*
         * If the existing registration has already produced
         * an authenticated user/session, record the acceptance.
         */

        try {

            const user =
                await getAuthenticatedUser();

            const client =
                db();

            if (
                user &&
                client
            ) {

                await client
                    .from('profiles')
                    .update({
                        terms_accepted: true,
                        terms_accepted_at:
                            new Date().toISOString(),
                        terms_version:
                            'app32-v1'
                    })
                    .eq(
                        'id',
                        user.id
                    );
            }

        } catch (e) {
            /*
             * UX remains successful even if the optional
             * audit columns do not yet exist.
             */
        }
    }


    /* =========================================================
       OBSERVE REGISTRATION
    ========================================================= */

    function registrationWatcher() {

        injectTermsCheckbox();

        wrapRegistration();

        wrapLogin();

        if (
            !registrationWrapped ||
            !loginWrapped
        ) {
            setTimeout(
                registrationWatcher,
                1000
            );
        }
    }


    /* =========================================================
       OBSERVE APP DOM
    ========================================================= */

    function startObserver() {

        if (
            typeof MutationObserver ===
            'undefined'
        ) {
            return;
        }

        const observer =
            new MutationObserver(
                function () {

                    /*
                     * Do not constantly query Supabase.
                     * Only restore missing UI.
                     */

                    injectTermsCheckbox();

                    wrapRegistration();

                    wrapLogin();

                    if (
                        !document.getElementById(
                            'gc32-public-sections'
                        )
                    ) {

                        renderLandingSections()
                            .catch(console.error);

                    }

                    insertAdminDiscoverCard()
                        .catch(console.error);
                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }


    /* =========================================================
       KEYBOARD ESC
    ========================================================= */

    document.addEventListener(
        'keydown',
        function (event) {

            if (event.key !== 'Escape') {
                return;
            }

            [
                'gc32-public-document-modal',
                'gc32-full-document-modal',
                'gc32-branding-editor',
                'gc32-admin-branding-modal',
                'gc32-moderation-modal'
            ].forEach(closeModal);

        }
    );


    /* =========================================================
       INITIALIZATION
    ========================================================= */

    async function initialize() {

        injectStyles();

        await loadState();

        await renderLandingSections();

        await insertAdminDiscoverCard();

        injectTermsCheckbox();

        wrapRegistration();

        wrapLogin();

        attachRegistrationSubmitGuard();

        startObserver();

        registrationWatcher();

        /*
         * Recheck admin Discover after the main application
         * has finished switching views.
         */

        setTimeout(
            async function () {
                await insertAdminDiscoverCard();
                injectTermsCheckbox();
                wrapRegistration();
                wrapLogin();
            },
            1500
        );

        setTimeout(
            async function () {
                await insertAdminDiscoverCard();
                injectTermsCheckbox();
                wrapRegistration();
                wrapLogin();
            },
            3500
        );
    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.GraceConnectBranding = {
        load: loadState,
        save: saveState,
        openDocument:
            window.gc32OpenFullDocument,
        openBranding:
            window.gc32OpenBrandingEditor,
        openLandingManager:
            window.gc32OpenLandingManager,
        openModeration:
            window.gc32OpenModeration,
        isEmailBlocked:
            isEmailBlocked
    };


    /* =========================================================
       START
    ========================================================= */

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initialize
        );

    } else {

        initialize();

    }

})();
