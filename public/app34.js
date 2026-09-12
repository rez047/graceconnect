/* ============================================================
   GRACECONNECT — APP34.JS
   Notifications + New Chat + Live Devotional Synchronization
   ADDITIVE PATCH — DOES NOT REPLACE APP33
   ============================================================ */

(function () {
    "use strict";

    /* ============================================================
       SUPABASE CLIENT DETECTION
       ============================================================ */

    function getSupabase() {
    try {
        if (
            typeof window.sb === "function"
        ) {
            const client = window.sb();

            if (
                client &&
                typeof client.from === "function"
            ) {
                return client;
            }
        }

        if (
            window.sb &&
            typeof window.sb.from === "function"
        ) {
            return window.sb;
        }

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {
            return window.supabaseClient;
        }

        if (
            window.supabase &&
            typeof window.supabase.from === "function"
        ) {
            return window.supabase;
        }

        if (
            typeof window.getSupabaseClient === "function"
        ) {
            const client = window.getSupabaseClient();

            if (
                client &&
                typeof client.from === "function"
            ) {
                return client;
            }
        }

        return null;

    } catch (error) {
        console.error(
            "GraceConnect App34: Supabase detection failed:",
            error
        );

        return null;
    }
}


    /* ============================================================
       SAFE HTML
       ============================================================ */

    function escapeHtml(value) {
        return String(
            value === null || value === undefined
                ? ""
                : value
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* ============================================================
       TOAST
       ============================================================ */

    function notify(message, type) {
        try {
            if (typeof window.showToast === "function") {
                window.showToast(message, type || "info");
                return;
            }

            if (typeof window.toast === "function") {
                window.toast(message, type || "info");
                return;
            }
        } catch (error) {
            console.warn(error);
        }

        console.log(message);
    }


    /* ============================================================
       NOTIFICATIONS
       ============================================================ */

    async function getCurrentUser() {
        const client = getSupabase();

        if (!client || !client.auth) {
            return null;
        }

        try {
            const result = await client.auth.getUser();

            if (
                result &&
                result.data &&
                result.data.user
            ) {
                return result.data.user;
            }
        } catch (error) {
            console.error(
                "GraceConnect App34: Could not obtain current user:",
                error
            );
        }

        return null;
    }


    async function refreshNotificationBadge() {
        const badge = document.getElementById("notifBadge");

        if (!badge) {
            return;
        }

        const client = getSupabase();

        if (!client) {
            return;
        }

        const user = await getCurrentUser();

        if (!user) {
            badge.style.display = "none";
            return;
        }

        try {
            const result = await client
                .from("notifications")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq("user_id", user.id)
                .eq("is_read", false);

            if (result.error) {
                console.warn(
                    "GraceConnect App34: Notification badge query:",
                    result.error
                );

                return;
            }

            const count = Number(result.count || 0);

            badge.textContent =
                count > 99
                    ? "99+"
                    : String(count);

            badge.style.display =
                count > 0
                    ? "flex"
                    : "none";

        } catch (error) {
            console.warn(
                "GraceConnect App34: Badge refresh failed:",
                error
            );
        }
    }


    async function openNotifications() {
        try {
            if (
                typeof window.switchSection === "function"
            ) {
                window.switchSection("home");
            }
        } catch (error) {
            console.warn(error);
        }

        try {
            if (
                typeof window.showSubPage === "function"
            ) {
                window.showSubPage(
                    "home-notifications"
                );
            }
        } catch (error) {
            console.warn(error);
        }

        /*
         * Use an existing notification loader if the
         * application already provides one.
         */

        try {
            if (
                typeof window.loadNotifications === "function"
            ) {
                await window.loadNotifications();
            }
        } catch (error) {
            console.warn(
                "Existing notification loader failed:",
                error
            );
        }

        try {
            if (
                typeof window.fetchNotifications === "function"
            ) {
                await window.fetchNotifications();
            }
        } catch (error) {
            console.warn(
                "Existing notification fetch failed:",
                error
            );
        }

        await refreshNotificationBadge();
    }


    function installNotificationBell() {
        const buttons =
            document.querySelectorAll(
                ".header-btn"
            );

        buttons.forEach(function (button) {
            const icon =
                button.querySelector(
                    ".fa-bell"
                );

            if (!icon) {
                return;
            }

            /*
             * Preserve the actual bell element but replace
             * only its click behavior.
             */

            button.onclick =
                openNotifications;

            button.setAttribute(
                "aria-label",
                "Notifications"
            );

            button.setAttribute(
                "title",
                "Notifications"
            );
        });
    }


    /* ============================================================
       NOTIFICATION REALTIME
       ============================================================ */

    function subscribeNotifications() {
        const client = getSupabase();

        if (
            !client ||
            typeof client.channel !== "function"
        ) {
            return;
        }

        if (
            window.__gc34NotificationChannel
        ) {
            return;
        }

        try {
            window.__gc34NotificationChannel =
                client
                    .channel(
                        "gc34-notifications-live"
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "notifications"
                        },
                        function () {
                            refreshNotificationBadge();
                        }
                    )
                    .subscribe();

        } catch (error) {
            console.warn(
                "GraceConnect App34: Notification realtime unavailable:",
                error
            );
        }
    }


    /* ============================================================
       NEW CHAT BUTTON
       ============================================================ */

    function locateChatContainer() {
        const selectors = [
            "#chat",
            "#section-chat",
            "#chat-section",
            "#messages",
            "#messages-section",
            '[data-section="chat"]',
            '[data-page="chat"]',
            ".chat-section"
        ];

        for (
            let i = 0;
            i < selectors.length;
            i++
        ) {
            const element =
                document.querySelector(
                    selectors[i]
                );

            if (element) {
                return element;
            }
        }

        return null;
    }


    function installNewChatButton() {
        if (
            document.getElementById(
                "gc34NewChatButton"
            )
        ) {
            return;
        }

        const chatContainer =
            locateChatContainer();

        if (!chatContainer) {
            return;
        }

        const button =
            document.createElement(
                "button"
            );

        button.id =
            "gc34NewChatButton";

        button.type = "button";

        button.className =
            "gc34-new-chat-button";

        button.innerHTML =
            '<i class="fas fa-user-plus"></i> New Chat';

        button.addEventListener(
            "click",
            function () {
                openNewChatPicker();
            }
        );

        const heading =
            chatContainer.querySelector(
                "h1,h2,h3,.section-title,.page-title"
            );

        if (
            heading &&
            heading.parentElement
        ) {
            heading.parentElement.insertBefore(
                button,
                heading.nextSibling
            );
        } else {
            chatContainer.insertBefore(
                button,
                chatContainer.firstChild
            );
        }
    }


    /* ============================================================
       NEW CHAT MODAL
       ============================================================ */

    async function openNewChatPicker() {
        const client =
            getSupabase();

        if (!client) {
            notify(
                "Supabase is not available.",
                "error"
            );

            return;
        }

        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            notify(
                "Please sign in before starting a chat.",
                "error"
            );

            return;
        }

        let members = [];

        try {
            const result =
                await client
                    .from("profiles")
                    .select(
                        "id,full_name,username,email,avatar_url"
                    )
                    .order(
                        "full_name",
                        {
                            ascending: true
                        }
                    );

            if (result.error) {
                throw result.error;
            }

            members =
                Array.isArray(result.data)
                    ? result.data
                    : [];

        } catch (error) {
            console.error(
                "GraceConnect App34: Member loading failed:",
                error
            );

            notify(
                "Unable to load members: " +
                (
                    error.message ||
                    "Unknown error"
                ),
                "error"
            );

            return;
        }

        members =
            members.filter(function (member) {
                return (
                    member.id !==
                    currentUser.id
                );
            });

        const oldModal =
            document.getElementById(
                "gc34ChatModal"
            );

        if (oldModal) {
            oldModal.remove();
        }

        const overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "gc34ChatModal";

        overlay.className =
            "gc34-chat-overlay";

        overlay.innerHTML = `
            <div class="gc34-chat-modal">

                <div class="gc34-chat-header">

                    <div>
                        <h2>Start a New Chat</h2>
                        <p>Select any member to begin a conversation.</p>
                    </div>

                    <button
                        type="button"
                        class="gc34-chat-close"
                        id="gc34ChatClose"
                    >
                        &times;
                    </button>

                </div>

                <div class="gc34-chat-search-wrap">

                    <i class="fas fa-search"></i>

                    <input
                        type="search"
                        id="gc34MemberSearch"
                        placeholder="Search members..."
                        autocomplete="off"
                    >

                </div>

                <div
                    id="gc34MemberList"
                    class="gc34-member-list"
                ></div>

            </div>
        `;

        document.body.appendChild(
            overlay
        );

        document.getElementById(
            "gc34ChatClose"
        ).addEventListener(
            "click",
            function () {
                overlay.remove();
            }
        );

        overlay.addEventListener(
            "click",
            function (event) {
                if (
                    event.target ===
                    overlay
                ) {
                    overlay.remove();
                }
            }
        );

        const search =
            document.getElementById(
                "gc34MemberSearch"
            );

        function renderMembers(
            searchTerm
        ) {
            const query =
                String(
                    searchTerm || ""
                )
                    .trim()
                    .toLowerCase();

            const filtered =
                members.filter(
                    function (member) {

                        const searchable = [
                            member.full_name,
                            member.username,
                            member.email
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();

                        return searchable.includes(
                            query
                        );
                    }
                );

            const list =
                document.getElementById(
                    "gc34MemberList"
                );

            if (!list) {
                return;
            }

            if (!filtered.length) {
                list.innerHTML = `
                    <div class="gc34-empty-members">
                        <i class="fas fa-user-slash"></i>
                        <p>No members found.</p>
                    </div>
                `;

                return;
            }

            list.innerHTML =
                filtered.map(
                    function (member) {

                        const name =
                            member.full_name ||
                            member.username ||
                            member.email ||
                            "Member";

                        const secondary =
                            member.username ||
                            member.email ||
                            "";

                        const avatar =
                            member.avatar_url;

                        return `
                            <button
                                type="button"
                                class="gc34-member"
                                data-member-id="${escapeHtml(member.id)}"
                            >

                                ${
                                    avatar
                                        ? `
                                            <img
                                                src="${escapeHtml(avatar)}"
                                                alt=""
                                                class="gc34-member-avatar"
                                            >
                                        `
                                        : `
                                            <span class="gc34-member-avatar gc34-avatar-placeholder">
                                                <i class="fas fa-user"></i>
                                            </span>
                                        `
                                }

                                <span class="gc34-member-info">

                                    <strong>
                                        ${escapeHtml(name)}
                                    </strong>

                                    ${
                                        secondary
                                            ? `
                                                <small>
                                                    ${escapeHtml(secondary)}
                                                </small>
                                            `
                                            : ""
                                    }

                                </span>

                                <i class="fas fa-chevron-right gc34-member-arrow"></i>

                            </button>
                        `;
                    }
                )
                .join("");

            list
                .querySelectorAll(
                    ".gc34-member"
                )
                .forEach(
                    function (memberButton) {

                        memberButton.addEventListener(
                            "click",
                            function () {

                                const memberId =
                                    memberButton.getAttribute(
                                        "data-member-id"
                                    );

                                overlay.remove();

                                startChat(
                                    memberId
                                );
                            }
                        );
                    }
                );
        }

        search.addEventListener(
            "input",
            function () {
                renderMembers(
                    search.value
                );
            }
        );

        renderMembers("");
        search.focus();
    }


    /* ============================================================
       OPEN EXISTING CHAT SYSTEM
       ============================================================ */

    function startChat(memberId) {
        if (!memberId) {
            return;
        }

        /*
         * GraceConnect's existing chat implementation
         * is deliberately preferred.
         */

        if (
            typeof window._gcOpenChat ===
            "function"
        ) {
            window._gcOpenChat(
                memberId
            );

            return;
        }

        if (
            typeof window.openChat ===
            "function"
        ) {
            window.openChat(
                memberId
            );

            return;
        }

        if (
            typeof window.startChat ===
            "function" &&
            window.startChat !== startChat
        ) {
            window.startChat(
                memberId
            );

            return;
        }

        /*
         * Fallback navigation if the existing
         * chat function is not exposed globally.
         */

        try {
            if (
                typeof window.switchSection ===
                "function"
            ) {
                window.switchSection(
                    "chat"
                );
            }

            if (
                typeof window.showSubPage ===
                "function"
            ) {
                window.showSubPage(
                    "chat"
                );
            }
        } catch (error) {
            console.warn(error);
        }

        notify(
            "The chat interface could not be opened.",
            "error"
        );
    }


    /* ============================================================
       DEVOTIONAL REFRESH
       ============================================================ */

    async function refreshDevotional() {
        try {

            /*
             * Prefer the existing App33 devotional
             * renderer rather than replacing it.
             */

            const possibleFunctions = [
                "gc33RenderDevotional",
                "renderDevotional",
                "loadDevotional",
                "fetchDevotional"
            ];

            for (
                let i = 0;
                i < possibleFunctions.length;
                i++
            ) {
                const functionName =
                    possibleFunctions[i];

                if (
                    typeof window[
                        functionName
                    ] === "function"
                ) {
                    await window[
                        functionName
                    ]();

                    return true;
                }
            }

            /*
             * If App33 doesn't expose its renderer,
             * reload only the devotional home elements
             * from Supabase.
             */

            return await fallbackDevotionalRefresh();

        } catch (error) {

            console.error(
                "GraceConnect App34: Devotional refresh failed:",
                error
            );

            return false;
        }
    }


    async function fallbackDevotionalRefresh() {
        const client =
            getSupabase();

        if (!client) {
            return false;
        }

        try {

            const today =
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const result =
                await client
                    .from("devotionals")
                    .select("*")
                    .eq(
                        "date",
                        today
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(1);

            if (
                result.error ||
                !result.data ||
                !result.data.length
            ) {
                return false;
            }

            const devotional =
                result.data[0];

            /*
             * We intentionally search for common
             * devotional containers rather than
             * replacing App33's markup.
             */

            const containers = [
                "#dailyDevotional",
                "#devotionalCard",
                "#homeDevotional",
                "#todaysDevotional",
                ".daily-devotional",
                ".devotional-card",
                "[data-devotional]"
            ];

            let container = null;

            for (
                let i = 0;
                i < containers.length;
                i++
            ) {
                container =
                    document.querySelector(
                        containers[i]
                    );

                if (container) {
                    break;
                }
            }

            if (!container) {
                return false;
            }

            const title =
                devotional.title ||
                devotional.heading ||
                "Today's Devotional";

            const scripture =
                devotional.scripture ||
                devotional.reference ||
                "";

            const content =
                devotional.content ||
                devotional.body ||
                devotional.message ||
                "";

            container.innerHTML = `
                <div class="gc34-devotional-inner">

                    <div class="gc34-devotional-heading">
                        <i class="fas fa-book-open"></i>

                        <div>
                            <h3>
                                ${escapeHtml(title)}
                            </h3>

                            ${
                                scripture
                                    ? `
                                        <div class="gc34-devotional-scripture">
                                            ${escapeHtml(scripture)}
                                        </div>
                                    `
                                    : ""
                            }
                        </div>

                    </div>

                    <div class="gc34-devotional-content">
                        ${escapeHtml(content)}
                    </div>

                </div>
            `;

            return true;

        } catch (error) {

            console.warn(
                "GraceConnect App34: Fallback devotional refresh failed:",
                error
            );

            return false;
        }
    }


    /* ============================================================
       DEVOTIONAL REALTIME
       ============================================================ */

    function subscribeDevotionals() {
        const client =
            getSupabase();

        if (
            !client ||
            typeof client.channel !==
                "function"
        ) {
            return;
        }

        if (
            window.__gc34DevotionalChannel
        ) {
            return;
        }

        try {

            window.__gc34DevotionalChannel =
                client
                    .channel(
                        "gc34-devotionals-live"
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "devotionals"
                        },
                        function () {

                            /*
                             * Small delay allows the
                             * database transaction to
                             * finish before rendering.
                             */

                            setTimeout(
                                function () {
                                    refreshDevotional();
                                },
                                150
                            );
                        }
                    )
                    .subscribe();

        } catch (error) {

            console.warn(
                "GraceConnect App34: Devotional realtime unavailable:",
                error
            );
        }
    }


    /* ============================================================
       ADMIN SAVE DETECTION
       ============================================================ */

    function installDevotionalSaveWatcher() {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target &&
                    event.target.closest
                        ? event.target.closest(
                              "button,input[type='submit']"
                          )
                        : null;

                if (!button) {
                    return;
                }

                const text =
                    (
                        button.innerText ||
                        button.textContent ||
                        button.value ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                if (
                    !text.includes("save")
                ) {
                    return;
                }

                /*
                 * Detect a devotional-related
                 * manager/modal without interfering
                 * with the actual save operation.
                 */

                const devotionalContext =
                    document.querySelector(
                        ".gc33-modal"
                    ) ||
                    document.querySelector(
                        "[id*='devotional' i]"
                    ) ||
                    document.querySelector(
                        "[class*='devotional' i]"
                    );

                if (!devotionalContext) {
                    return;
                }

                /*
                 * Wait for App33 to complete its
                 * database INSERT/UPDATE.
                 */

                setTimeout(
                    refreshDevotional,
                    300
                );

                setTimeout(
                    refreshDevotional,
                    1000
                );

                setTimeout(
                    refreshDevotional,
                    2000
                );
            },
            true
        );
    }


    /* ============================================================
       STYLES
       ============================================================ */

    function injectStyles() {

        if (
            document.getElementById(
                "gc34-style"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "gc34-style";

        style.textContent = `

            /* ========================================
               NEW CHAT BUTTON
               ======================================== */

            .gc34-new-chat-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;

                border: 0;
                border-radius: 12px;

                padding: 11px 16px;

                margin: 8px 0 14px 0;

                background: #4f46e5;
                color: #ffffff;

                font-weight: 800;
                font-size: 14px;

                cursor: pointer;

                transition:
                    transform .15s ease,
                    opacity .15s ease,
                    box-shadow .15s ease;
            }

            .gc34-new-chat-button:hover {
                transform: translateY(-1px);
                opacity: .95;
                box-shadow:
                    0 8px 24px rgba(79,70,229,.25);
            }


            /* ========================================
               CHAT OVERLAY
               ======================================== */

            .gc34-chat-overlay {
                position: fixed;

                inset: 0;

                z-index: 1000000;

                display: flex;

                align-items: center;
                justify-content: center;

                padding: 16px;

                background:
                    rgba(15,23,42,.72);

                backdrop-filter:
                    blur(8px);
            }


            /* ========================================
               CHAT MODAL
               ======================================== */

            .gc34-chat-modal {
                width: min(
                    560px,
                    100%
                );

                max-height: 86vh;

                overflow: hidden;

                display: flex;
                flex-direction: column;

                background: #ffffff;

                border-radius: 22px;

                box-shadow:
                    0 30px 90px
                    rgba(0,0,0,.35);
            }


            /* ========================================
               CHAT HEADER
               ======================================== */

            .gc34-chat-header {
                display: flex;

                align-items: flex-start;
                justify-content: space-between;

                gap: 15px;

                padding: 20px;

                border-bottom:
                    1px solid #e5e7eb;
            }

            .gc34-chat-header h2 {
                margin: 0 0 5px 0;

                color: #111827;

                font-size: 21px;
            }

            .gc34-chat-header p {
                margin: 0;

                color: #64748b;

                font-size: 13px;
            }

            .gc34-chat-close {
                width: 38px;
                height: 38px;

                flex: 0 0 38px;

                border: 0;

                border-radius: 10px;

                background: #eef2f7;

                color: #334155;

                font-size: 23px;

                line-height: 1;

                cursor: pointer;
            }


            /* ========================================
               SEARCH
               ======================================== */

            .gc34-chat-search-wrap {
                display: flex;

                align-items: center;

                gap: 10px;

                margin: 16px 20px;

                padding: 0 13px;

                border:
                    1px solid #dbe2ea;

                border-radius: 12px;

                background: #f8fafc;
            }

            .gc34-chat-search-wrap i {
                color: #64748b;
            }

            .gc34-chat-search-wrap input {
                width: 100%;

                border: 0;
                outline: 0;

                padding: 12px 0;

                background: transparent;

                color: #172033;

                font: inherit;
            }


            /* ========================================
               MEMBER LIST
               ======================================== */

            .gc34-member-list {
                overflow-y: auto;

                padding:
                    0 20px 20px 20px;
            }

            .gc34-member {
                width: 100%;

                display: flex;

                align-items: center;

                gap: 12px;

                border: 0;

                margin: 5px 0;

                padding: 11px;

                border-radius: 13px;

                background: #f8fafc;

                text-align: left;

                cursor: pointer;

                transition:
                    background .15s ease,
                    transform .15s ease;
            }

            .gc34-member:hover {
                background: #eef2ff;

                transform:
                    translateX(2px);
            }


            /* ========================================
               AVATAR
               ======================================== */

            .gc34-member-avatar {
                width: 44px;
                height: 44px;

                flex: 0 0 44px;

                border-radius: 50%;

                object-fit: cover;

                display: grid;

                place-items: center;

                background: #4f46e5;

                color: #ffffff;

                font-size: 16px;
            }

            .gc34-avatar-placeholder {
                background:
                    linear-gradient(
                        135deg,
                        #4f46e5,
                        #7c3aed
                    );
            }


            /* ========================================
               MEMBER INFORMATION
               ======================================== */

            .gc34-member-info {
                min-width: 0;

                flex: 1;

                display: flex;

                flex-direction: column;

                gap: 3px;
            }

            .gc34-member-info strong {
                color: #172033;

                font-size: 14px;

                overflow: hidden;

                text-overflow: ellipsis;

                white-space: nowrap;
            }

            .gc34-member-info small {
                color: #64748b;

                font-size: 12px;

                overflow: hidden;

                text-overflow: ellipsis;

                white-space: nowrap;
            }

            .gc34-member-arrow {
                color: #94a3b8;

                font-size: 12px;
            }


            /* ========================================
               EMPTY MEMBERS
               ======================================== */

            .gc34-empty-members {
                text-align: center;

                padding: 40px 20px;

                color: #64748b;
            }

            .gc34-empty-members i {
                display: block;

                margin-bottom: 10px;

                font-size: 30px;
            }

            .gc34-empty-members p {
                margin: 0;
            }


            /* ========================================
               DEVOTIONAL FALLBACK
               ======================================== */

            .gc34-devotional-inner {
                padding: 4px;
            }

            .gc34-devotional-heading {
                display: flex;

                align-items: flex-start;

                gap: 12px;

                margin-bottom: 12px;
            }

            .gc34-devotional-heading > i {
                margin-top: 3px;

                color: #4f46e5;

                font-size: 20px;
            }

            .gc34-devotional-heading h3 {
                margin: 0 0 4px 0;

                font-size: 18px;
            }

            .gc34-devotional-scripture {
                color: #4f46e5;

                font-weight: 700;

                font-size: 13px;
            }

            .gc34-devotional-content {
                color: #334155;

                line-height: 1.7;

                white-space: pre-wrap;
            }


            /* ========================================
               MOBILE
               ======================================== */

            @media (max-width: 600px) {

                .gc34-chat-overlay {
                    padding: 8px;
                }

                .gc34-chat-modal {
                    width: 100%;

                    max-height: 92vh;

                    border-radius: 18px;
                }

                .gc34-chat-header {
                    padding: 16px;
                }

                .gc34-chat-search-wrap {
                    margin:
                        12px 16px;
                }

                .gc34-member-list {
                    padding:
                        0 16px 16px 16px;
                }
            }

        `;

        document.head.appendChild(
            style
        );
    }


    /* ============================================================
       DOM OBSERVER
       ============================================================ */

    function installDomObserver() {

        if (
            window.__gc34Observer
        ) {
            return;
        }

        const observer =
            new MutationObserver(
                function () {

                    installNotificationBell();

                    installNewChatButton();

                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        window.__gc34Observer =
            observer;
    }


    /* ============================================================
       INITIALIZATION
       ============================================================ */

    async function initialize() {

        injectStyles();

        installNotificationBell();

        installNewChatButton();

        installDevotionalSaveWatcher();

        installDomObserver();

        await refreshNotificationBadge();

        subscribeNotifications();

        subscribeDevotionals();

        /*
         * Initial devotional synchronization.
         */

        setTimeout(
            function () {
                refreshDevotional();
            },
            500
        );

        console.log(
            "GraceConnect App34 initialized successfully."
        );
    }


    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.gc34 = {

        openNotifications:
            openNotifications,

        openNewChat:
            openNewChatPicker,

        refreshNotifications:
            refreshNotificationBadge,

        refreshDevotional:
            refreshDevotional

    };


    /* ============================================================
       START
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();
