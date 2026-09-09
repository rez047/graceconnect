/* ============================================================
   GRACECONNECT — APP33.JS
   Bible Content + Moderation Engine
   ============================================================ */

(function () {
    "use strict";

    /* ============================================================
       CONFIGURATION
       ============================================================ */

    const TRIVIA_TABLE = "bible_trivia_questions";
    const CHARACTER_TABLE = "bible_characters";
    const DEVOTIONAL_TABLE = "devotionals";

    /*
     * Scripture-based Bible-person dataset.
     * This is NOT Wikipedia.
     */
    const THEOGRAPHIC_PEOPLE =
        "https://bible.helloao.org/api/d/theographic/people.json";

    /*
     * Christian devotional fallback.
     * Custom GraceConnect devotionals always take priority.
     */
    const DEVOTIONAL_API =
        "https://www.christhimself.com/api/v1/devotionals/";

    /* ============================================================
       STATE
       ============================================================ */

    let triviaState = {
        question: null,
        answered: false,
        seen: new Set()
    };

    let devotionalRendering = false;

    /* ============================================================
       SUPABASE CLIENT
       ============================================================ */

    function db() {
        try {
            if (
                typeof window.sb === "function" &&
                window.sb()
            ) {
                return window.sb();
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

            return null;
        } catch (e) {
            console.error("GraceConnect Supabase error:", e);
            return null;
        }
    }

    async function currentUser() {
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

    async function currentUserId() {
        const user = await currentUser();
        return user ? user.id : null;
    }

    async function isAdmin() {
        const client = db();

        if (!client || !client.auth) {
            return false;
        }

        try {
            const user = await currentUser();

            if (!user) {
                return false;
            }

            const result = await client
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (result.error) {
                return false;
            }

            const role = String(
                result.data && result.data.role
                    ? result.data.role
                    : ""
            ).toLowerCase();

            return [
                "admin",
                "super_admin",
                "superadmin"
            ].includes(role);

        } catch (e) {
            console.error("Admin check failed:", e);
            return false;
        }
    }

    /* ============================================================
       UTILITIES
       ============================================================ */

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

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
        } catch (e) {}

        alert(message);
    }

    function closeElement(id) {
        const element = document.getElementById(id);

        if (element) {
            element.remove();
        }
    }

    function createModal(id, html) {
        closeElement(id);

        const backdrop = document.createElement("div");

        backdrop.id = id;
        backdrop.className = "gc33-backdrop";

        backdrop.innerHTML =
            '<div class="gc33-modal">' +
            html +
            "</div>";

        document.body.appendChild(backdrop);

        return backdrop;
    }

    /* ============================================================
       STYLES
       ============================================================ */

    function injectStyles() {
        if (document.getElementById("gc33-style")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "gc33-style";

        style.textContent = `
            .gc33-backdrop {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(15,23,42,.76);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 14px;
            }

            .gc33-modal {
                width: min(1050px, 100%);
                max-height: 94vh;
                overflow-y: auto;
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 30px 100px rgba(0,0,0,.35);
                font-family: inherit;
            }

            .gc33-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                padding: 20px 22px;
                border-bottom: 1px solid #e5e7eb;
                position: sticky;
                top: 0;
                background: #ffffff;
                z-index: 2;
            }

            .gc33-head h2 {
                margin: 0;
                font-size: 22px;
            }

            .gc33-body {
                padding: 20px;
            }

            .gc33-close {
                width: 38px;
                height: 38px;
                border: 0;
                border-radius: 10px;
                background: #eef2f7;
                cursor: pointer;
                font-size: 22px;
            }

            .gc33-tabs {
                display: flex;
                gap: 8px;
                overflow-x: auto;
                margin-bottom: 18px;
            }

            .gc33-tab {
                border: 0;
                border-radius: 11px;
                background: #eef2ff;
                color: #3730a3;
                padding: 10px 15px;
                font-weight: 800;
                cursor: pointer;
                white-space: nowrap;
            }

            .gc33-tab.active {
                background: #4f46e5;
                color: #ffffff;
            }

            .gc33-grid {
                display: grid;
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
                gap: 14px;
            }

            .gc33-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .gc33-field.full {
                grid-column: 1 / -1;
            }

            .gc33-field label {
                font-size: 12px;
                font-weight: 800;
                color: #475569;
            }

            .gc33-field input,
            .gc33-field textarea,
            .gc33-field select {
                width: 100%;
                box-sizing: border-box;
                border: 1px solid #dbe2ea;
                border-radius: 11px;
                padding: 11px 12px;
                font: inherit;
                color: #172033;
                background: #ffffff;
            }

            .gc33-field textarea {
                min-height: 120px;
                resize: vertical;
            }

            .gc33-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 9px;
                margin-top: 16px;
            }

            .gc33-btn {
                border: 0;
                border-radius: 11px;
                padding: 11px 15px;
                font-weight: 800;
                cursor: pointer;
            }

            .gc33-primary {
                background: #4f46e5;
                color: #ffffff;
            }

            .gc33-muted {
                background: #eef2f7;
                color: #334155;
            }

            .gc33-danger {
                background: #dc2626;
                color: #ffffff;
            }

            .gc33-help {
                padding: 13px 15px;
                border-radius: 13px;
                background: #f8fafc;
                color: #475569;
                font-size: 12px;
                line-height: 1.65;
                margin-bottom: 15px;
            }

            .gc33-list {
                display: grid;
                gap: 10px;
            }

            .gc33-row {
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                padding: 13px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }

            .gc33-row small {
                display: block;
                color: #64748b;
                margin-top: 4px;
            }

            .gc33-quiz {
                padding: 22px;
                border-radius: 20px;
                background:
                    linear-gradient(
                        135deg,
                        #4f46e5,
                        #7c3aed
                    );
                color: #ffffff;
                margin-top: 12px;
            }

            .gc33-quiz .gc33-question {
                font-size: 20px;
                font-weight: 850;
                line-height: 1.5;
                margin: 14px 0;
            }

            .gc33-options {
                display: grid;
                gap: 9px;
            }

            .gc33-option {
                border: 1px solid rgba(255,255,255,.35);
                background: rgba(255,255,255,.12);
                color: #ffffff;
                border-radius: 12px;
                padding: 13px;
                text-align: left;
                cursor: pointer;
                font: inherit;
            }

            .gc33-option:hover {
                background: rgba(255,255,255,.2);
            }

            .gc33-option.correct {
                background: #059669;
            }

            .gc33-option.wrong {
                background: #dc2626;
            }

            .gc33-next {
                margin-top: 14px;
                background: #ffffff;
                color: #3730a3;
            }

            .gc33-character-card {
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 16px;
                margin-bottom: 12px;
            }

            .gc33-character-card h3 {
                margin: 0 0 8px;
            }

            .gc33-character-card p {
                line-height: 1.75;
            }

            .gc33-source {
                color: #64748b;
                font-size: 11px;
                line-height: 1.5;
            }

            @media (max-width: 700px) {
                .gc33-grid {
                    grid-template-columns: 1fr;
                }

                .gc33-field.full {
                    grid-column: auto;
                }

                .gc33-modal {
                    border-radius: 18px;
                }

                .gc33-body {
                    padding: 15px;
                }

                .gc33-row {
                    align-items: flex-start;
                    flex-direction: column;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ============================================================
       USER REMOVAL + BLOCKLIST
       ============================================================ */

    /*
     * IMPORTANT:
     *
     * This calls the secure Supabase RPC:
     *
     * admin_remove_user(target_user_id uuid)
     *
     * The RPC should:
     * 1. Verify current user is an admin.
     * 2. Read the target user's email.
     * 3. Insert the email into blocked_emails.
     * 4. Delete auth.users.
     *
     * This fixes the RLS error you showed in your screenshot.
     */

    window.deleteUser = async function (userId, email) {

        const allowed = await isAdmin();

        if (!allowed) {
            notify(
                "Administrator access is required.",
                "error"
            );
            return;
        }

        if (!userId) {
            notify(
                "The selected user has no valid ID.",
                "error"
            );
            return;
        }

        const confirmed = confirm(
            "Remove this user permanently?\n\n" +
            "Their email address will also be added to " +
            "the blocked-email list so they cannot register " +
            "again until an administrator unblocks it."
        );

        if (!confirmed) {
            return;
        }

        const client = db();

        if (!client) {
            notify(
                "Supabase is not available.",
                "error"
            );
            return;
        }

        try {

            /*
             * Preferred secure RPC.
             */
            let result = await client.rpc(
                "admin_remove_user",
                {
                    target_user_id: userId
                }
            );

            /*
             * Compatibility with the alternative RPC name.
             */
            if (
                result.error &&
                String(result.error.message || "")
                    .toLowerCase()
                    .includes("function")
            ) {
                result = await client.rpc(
                    "admin_delete_user",
                    {
                        target_user_id: userId
                    }
                );
            }

            if (result.error) {
                throw result.error;
            }

            notify(
                "User removed successfully and their email has been blocked.",
                "success"
            );

            /*
             * Re-open the moderation interface if App32 exposes it.
             */
            if (
                typeof window.gc32OpenModeration ===
                "function"
            ) {
                window.gc32OpenModeration();
            }

            /*
             * Also refresh if the moderation panel has a
             * generic refresh method.
             */
            if (
                typeof window.refreshUsers ===
                "function"
            ) {
                window.refreshUsers();
            }

        } catch (error) {

            console.error(
                "GraceConnect user deletion failed:",
                error
            );

            notify(
                "User deletion failed: " +
                (
                    error &&
                    error.message
                        ? error.message
                        : "Unknown database error"
                ),
                "error"
            );
        }
    };

    /* ============================================================
       BLOCKED EMAIL CHECK
       ============================================================ */

    async function isEmailBlocked(email) {

        const client = db();

        if (!client || !email) {
            return false;
        }

        const normalized =
            String(email)
                .trim()
                .toLowerCase();

        try {

            /*
             * Preferred secure RPC.
             */
            const result = await client.rpc(
                "is_email_blocked",
                {
                    p_email: normalized
                }
            );

            if (!result.error) {
                return result.data === true;
            }

            console.warn(
                "is_email_blocked RPC failed:",
                result.error
            );

            /*
             * Do NOT directly query blocked_emails here.
             *
             * RLS intentionally prevents ordinary users from
             * reading/writing the table.
             */

            return false;

        } catch (error) {

            console.warn(
                "Blocklist check failed:",
                error
            );

            return false;
        }
    }

    /*
     * Public helper for registration code.
     */
    window.gc33IsEmailBlocked = isEmailBlocked;

    /* ============================================================
   CYCLING / RANDOM TRIVIA ENGINE
   ============================================================ */
window.gcNorm = function (v, n) {
  v = String(v == null ? '' : v).trim().toUpperCase();
  if (/^[A-Z]$/.test(v)) return v.charCodeAt(0) - 65;   // A→0 … D→3
  var x = parseInt(v, 10); if (isNaN(x)) return 0;
  return x >= 1 ? x - 1 : x;                            // 1–4 → 0–3
};
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('button') : null;
  if (!b) return;
  var t = (b.textContent || '').toLowerCase();
  if (t.indexOf('add question') < 0 && t.indexOf('save question') < 0 && t.indexOf('save trivia') < 0) return;
  var scope = b.closest('.modal, .modal-overlay, [role="dialog"], form') || document;
  var f = scope.querySelector('[id*="correct" i], [name*="correct" i], [placeholder*="correct" i]');
  if (f && f.tagName !== 'SELECT') { var p = window.gcNorm(f.value, 4); if (p >= 0) f.value = String(p); }
}, true);
   
const TRIVIA_CYCLE_KEY =
    "graceconnect_trivia_cycle_v2";

/*
 * Keep the completed-question cycle separately for each
 * authenticated user.
 *
 * localStorage survives page refreshes, unlike the old
 * in-memory Set.
 */
function triviaCycleStorageKey(userId) {
    return (
        TRIVIA_CYCLE_KEY +
        ":" +
        String(userId || "guest")
    );
}

/*
 * Read completed questions for the current cycle.
 */
function getTriviaCycle(userId) {

    try {

        const raw =
            localStorage.getItem(
                triviaCycleStorageKey(userId)
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return Array.from(
            new Set(
                parsed.map(function (id) {
                    return String(id);
                })
            )
        );

    } catch (error) {

        console.warn(
            "Unable to read trivia cycle:",
            error
        );

        return [];
    }
}

/*
 * Save completed questions.
 */
function saveTriviaCycle(
    userId,
    ids
) {

    try {

        localStorage.setItem(
            triviaCycleStorageKey(userId),
            JSON.stringify(
                Array.from(
                    new Set(
                        (ids || []).map(
                            function (id) {
                                return String(id);
                            }
                        )
                    )
                )
            )
        );

    } catch (error) {

        console.warn(
            "Unable to save trivia cycle:",
            error
        );
    }
}

/*
 * Fisher-Yates shuffle.
 */
function shuffleTriviaQuestions(
    questions
) {

    const copy =
        Array.isArray(questions)
            ? questions.slice()
            : [];

    for (
        let index = copy.length - 1;
        index > 0;
        index--
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                (index + 1)
            );

        const temp =
            copy[index];

        copy[index] =
            copy[randomIndex];

        copy[randomIndex] =
            temp;
    }

    return copy;
}


/* ============================================================
   GET RANDOM TRIVIA QUESTION
   ============================================================ */

async function getRandomTriviaQuestion() {

    const client = db();

    if (!client) {

        notify(
            "Supabase is unavailable.",
            "error"
        );

        return null;
    }

    const user =
        await currentUser();

    if (!user) {

        notify(
            "Please sign in to use Bible Trivia.",
            "error"
        );

        return null;
    }


    /*
     * ----------------------------------------------------------
     * FIRST: TRY THE DATABASE RPC
     * ----------------------------------------------------------
     *
     * If your Supabase function exists and can provide an
     * unanswered question, use it.
     */

    try {

        const result =
            await client.rpc(
                "get_random_trivia_question",
                {
                    p_user_id:
                        user.id
                }
            );

        if (
            !result.error &&
            result.data
        ) {

            const question =
                Array.isArray(
                    result.data
                )
                    ? result.data[0]
                    : result.data;

            if (question) {

                triviaState.question =
                    question;

                triviaState.answered =
                    false;

                return question;
            }
        }

    } catch (error) {

        console.warn(
            "Trivia RPC failed; using local cycling:",
            error
        );
    }


    /*
     * ----------------------------------------------------------
     * FALLBACK: LOAD APPROVED QUESTIONS
     * ----------------------------------------------------------
     */

    try {

        const result =
            await client
                .from(TRIVIA_TABLE)
                .select("*")
                .eq(
                    "approved",
                    true
                )
                .limit(500);

        if (result.error) {
            throw result.error;
        }

        const questions =
            (result.data || [])
                .filter(function (item) {

                    return (
                        item &&
                        item.id
                    );

                });

        /*
         * There are genuinely no questions in the database.
         */
        if (!questions.length) {

            notify(
                "No Bible trivia questions are currently available.",
                "info"
            );

            return null;
        }


        /*
         * ------------------------------------------------------
         * READ CURRENT LOCAL CYCLE
         * ------------------------------------------------------
         */

        let completed =
            getTriviaCycle(
                user.id
            );


        /*
         * Remove IDs belonging to questions that no longer
         * exist in the database.
         */

        const availableIds =
            new Set(
                questions.map(
                    function (item) {
                        return String(
                            item.id
                        );
                    }
                )
            );

        completed =
            completed.filter(
                function (id) {

                    return availableIds.has(
                        String(id)
                    );

                }
            );


        /*
         * ------------------------------------------------------
         * FIND QUESTIONS NOT YET ANSWERED IN THIS CYCLE
         * ------------------------------------------------------
         */

        let available =
            questions.filter(
                function (item) {

                    return !completed.includes(
                        String(item.id)
                    );

                }
            );


        /*
         * ------------------------------------------------------
         * CYCLE COMPLETE
         * ------------------------------------------------------
         *
         * IMPORTANT:
         *
         * DO NOT DISPLAY:
         *
         * "You have completed all currently available
         * trivia questions."
         *
         * Instead, automatically reset the cycle and start
         * another randomized round.
         */

        if (!available.length) {

            completed = [];

            saveTriviaCycle(
                user.id,
                []
            );

            available =
                questions.slice();
        }


        /*
         * ------------------------------------------------------
         * RANDOMIZE
         * ------------------------------------------------------
         */

        available =
            shuffleTriviaQuestions(
                available
            );


        /*
         * Select the first random question.
         */

        const question =
            available[0];


        triviaState.question =
            question;

        triviaState.answered =
            false;


        return question;


    } catch (error) {

        console.error(
            "Trivia loading failed:",
            error
        );

        notify(
            "Unable to load Bible Trivia.",
            "error"
        );

        return null;
    }
}


/* ============================================================
   MARK TRIVIA QUESTION AS SEEN
   ============================================================ */

async function markTriviaSeen(
    questionId
) {

    if (!questionId) {
        return;
    }


    /*
     * Keep the current in-memory state for compatibility.
     */

    triviaState.seen.add(
        questionId
    );


    const client =
        db();

    if (!client) {
        return;
    }


    const user =
        await currentUser();

    if (!user) {
        return;
    }


    /*
     * ----------------------------------------------------------
     * PERSIST LOCALLY
     * ----------------------------------------------------------
     *
     * This survives page refreshes.
     */

    try {

        const completed =
            getTriviaCycle(
                user.id
            );

        const normalizedId =
            String(questionId);

        if (
            !completed.includes(
                normalizedId
            )
        ) {

            completed.push(
                normalizedId
            );

            saveTriviaCycle(
                user.id,
                completed
            );
        }

    } catch (error) {

        console.warn(
            "Unable to persist local trivia cycle:",
            error
        );
    }


    /*
     * ----------------------------------------------------------
     * ALSO PERSIST TO SUPABASE
     * ----------------------------------------------------------
     */

    try {

        const result =
            await client.rpc(
                "mark_trivia_question_seen",
                {
                    p_user_id:
                        user.id,

                    p_question_id:
                        questionId
                }
            );

        if (result.error) {

            console.warn(
                "Supabase trivia tracking failed:",
                result.error
            );
        }

    } catch (error) {

        console.warn(
            "Unable to mark trivia question seen:",
            error
        );
    }
}


/* ============================================================
   TRIVIA OPTIONS
   ============================================================ */

function triviaOptions(
    question
) {

    if (
        Array.isArray(
            question.options
        ) &&
        question.options.length
    ) {

        return question.options;
    }


    if (
        question.options &&
        typeof question.options ===
            "object"
    ) {

        return Object.values(
            question.options
        );
    }


    return [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d
    ].filter(Boolean);
}


/* ============================================================
   CORRECT ANSWER INDEX
   ============================================================ */

function correctTriviaIndex(
    question,
    options
) {

    if (
        question.correct_index !==
            undefined &&
        question.correct_index !==
            null
    ) {

        return Number(
            question.correct_index
        );
    }


    if (
        question.correct !==
            undefined &&
        typeof question.correct ===
            "number"
    ) {

        return Number(
            question.correct
        );
    }


    if (
        question.correct &&
        typeof question.correct ===
            "string"
    ) {

        return options.indexOf(
            question.correct
        );
    }


    return 0;
}


/* ============================================================
   RENDER TRIVIA
   ============================================================ */

async function renderTrivia() {

    const host =
        document.getElementById(
            "home-trivia"
        );

    if (!host) {
        return;
    }


    let root =
        document.getElementById(
            "gc33-trivia-root"
        );


    if (!root) {

        root =
            document.createElement(
                "div"
            );

        root.id =
            "gc33-trivia-root";

        host.appendChild(
            root
        );
    }


    root.innerHTML =
        '<div class="section-title-app">' +
        "🧠 Bible Trivia" +
        "</div>" +

        '<div class="gc33-help">' +
        "Every question is selected randomly from " +
        "the approved Bible-question library. " +
        "Questions you answer are remembered for " +
        "the current cycle, including after refresh." +
        "</div>" +

        '<div class="gc33-quiz">' +
        "Loading a fresh Scripture question…" +
        "</div>";


    const question =
        await getRandomTriviaQuestion();


    if (!question) {

        const quiz =
            root.querySelector(
                ".gc33-quiz"
            );

        if (quiz) {

            quiz.innerHTML =
                "No Bible trivia question is currently available.";
        }

        return;
    }


    drawTriviaQuestion(
        root,
        question
    );
}


/* ============================================================
   DRAW TRIVIA QUESTION
   ============================================================ */

function drawTriviaQuestion(
    root,
    question
) {

    const options =
        triviaOptions(
            question
        );


    const correctIndex =
        correctTriviaIndex(
            question,
            options
        );


    const quiz =
        root.querySelector(
            ".gc33-quiz"
        );


    if (!quiz) {
        return;
    }


    quiz.innerHTML =

        '<div style="font-size:11px;font-weight:800;opacity:.8">' +

        escapeHTML(
            question.category ||
            "SCRIPTURE"
        ) +

        " · " +

        escapeHTML(
            question.difficulty ||
            "NORMAL"
        ) +

        "</div>" +

        '<div class="gc33-question">' +

        escapeHTML(
            question.question
        ) +

        "</div>" +

        '<div class="gc33-options">' +

        options
            .map(
                function (
                    option,
                    index
                ) {

                    return (

                        '<button class="gc33-option" ' +

                        'data-index="' +
                        index +
                        '">' +

                        escapeHTML(
                            option
                        ) +

                        "</button>"
                    );
                }
            )
            .join("") +

        "</div>" +

        '<div id="gc33-trivia-feedback"></div>' +

        (
            question.reference
                ? (

                    '<div style="margin-top:12px;font-size:11px;opacity:.8">' +

                    "📖 Reference: " +

                    escapeHTML(
                        question.reference
                    ) +

                    "</div>"
                )
                : ""
        );


    Array.from(
        quiz.querySelectorAll(
            ".gc33-option"
        )
    ).forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    if (
                        triviaState.answered
                    ) {
                        return;
                    }


                    triviaState.answered =
                        true;


                    const selected =
                        Number(
                            button.dataset.index
                        );


                    const buttons =
                        Array.from(
                            quiz.querySelectorAll(
                                ".gc33-option"
                            )
                        );


                    buttons.forEach(
                        function (
                            item,
                            index
                        ) {

                            item.disabled =
                                true;


                            if (
                                index ===
                                correctIndex
                            ) {

                                item.classList.add(
                                    "correct"
                                );
                            }

                        }
                    );


                    if (
                        selected !==
                        correctIndex
                    ) {

                        button.classList.add(
                            "wrong"
                        );
                    }


                    const feedback =
                        quiz.querySelector(
                            "#gc33-trivia-feedback"
                        );


                    if (feedback) {

                        feedback.innerHTML =

                            '<div style="margin-top:14px;line-height:1.65">' +

                            (
                                selected ===
                                correctIndex

                                    ? "✓ Correct!"

                                    : "✗ Not quite."
                            ) +

                            (
                                question.explanation
                                    ? (

                                        "<br><br>" +

                                        escapeHTML(
                                            question.explanation
                                        )
                                    )
                                    : ""
                            ) +

                            "</div>" +

                            '<button class="gc33-btn gc33-next" ' +

                            'id="gc33-next-trivia">' +

                            "Next Question" +

                            "</button>";
                    }


                    /*
                     * Record the question before allowing
                     * the next question.
                     */

                    await markTriviaSeen(
                        question.id
                    );


                    const next =
                        document.getElementById(
                            "gc33-next-trivia"
                        );


                    if (next) {

                        next.onclick =
                            function () {

                                renderTrivia();
                            };
                    }
                }
            );
        }
    );
}


window.gc33RenderTrivia =
    renderTrivia;

    /* ============================================================
       BIBLE CHARACTERS
       ============================================================ */

    /*
     * Existing dictionary support.
     *
     * This means your current character model does not have
     * to be deleted immediately.
     */

    function existingCharacterDictionary(
        name
    ) {

        const dictionary =
            window.CHAR_BIOS ||
            {};

        if (dictionary[name]) {
            return dictionary[name];
        }

        const normalized =
            String(name)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

        const key =
            Object.keys(dictionary)
                .find(function (item) {

                    return String(item)
                        .toLowerCase()
                        .replace(
                            /[^a-z0-9]/g,
                            ""
                        ) === normalized;

                });

        return key
            ? dictionary[key]
            : null;
    }

    async function searchTheographicCharacter(
        name
    ) {

        const response =
            await fetch(
                THEOGRAPHIC_PEOPLE
            );

        if (!response.ok) {
            throw new Error(
                "Unable to load biblical people dataset."
            );
        }

        const data =
            await response.json();

        const people =
            data.people ||
            [];

        const term =
            String(name)
                .trim()
                .toLowerCase();

        let person =
            people.find(function (item) {

                return String(
                    item.name || ""
                ).toLowerCase() === term;

            });

        if (!person) {

            person =
                people.find(function (item) {

                    return String(
                        item.name || ""
                    )
                    .toLowerCase()
                    .includes(term);

                });

        }

        if (!person) {
            throw new Error(
                "Bible character not found."
            );
        }

        /*
         * If the dataset supplies a link to the person's
         * detailed record, retrieve it.
         */

        if (person.thisPersonApiLink) {

            const detailURL =
                person.thisPersonApiLink
                    .startsWith("http")
                    ? person.thisPersonApiLink
                    : (
                        "https://bible.helloao.org" +
                        person.thisPersonApiLink
                    );

            const detailResponse =
                await fetch(
                    detailURL
                );

            if (detailResponse.ok) {

                const detail =
                    await detailResponse.json();

                return (
                    detail.person ||
                    detail
                );
            }
        }

        return person;
    }

    function formatCharacterReferences(
        references
    ) {

        if (!Array.isArray(references)) {
            return "";
        }

        return references
            .slice(0, 30)
            .map(function (reference) {

                if (
                    typeof reference ===
                    "string"
                ) {
                    return reference;
                }

                return (
                    (
                        reference.book ||
                        ""
                    ) +

                    " " +

                    (
                        reference.chapter ||
                        ""
                    ) +

                    ":" +

                    (
                        reference.verse ||
                        ""
                    )
                );

            })
            .filter(Boolean)
            .join(", ");
    }

    async function loadCharacter() {

        const input =
            document.getElementById(
                "charSearch"
            );

        const output =
            document.getElementById(
                "charOut"
            );

        if (!input || !output) {
            return;
        }

        const search =
            input.value.trim();

        if (!search) {
            return;
        }

        output.innerHTML =
            '<div style="color:#94A3B8">' +
            "Searching Scripture-based character data…" +
            "</div>";

        try {

            const client = db();

            let custom =
                null;

            /*
             * First search your own Supabase character library.
             * Admin-created/editable content has priority.
             */

            if (client) {

                const result =
                    await client
                        .from(
                            CHARACTER_TABLE
                        )
                        .select("*")
                        .ilike(
                            "name",
                            "%" +
                            search +
                            "%"
                        )
                        .eq(
                            "active",
                            true
                        )
                        .limit(1);

                if (
                    !result.error &&
                    result.data &&
                    result.data.length
                ) {
                    custom =
                        result.data[0];
                }
            }

            /*
             * Then search broad Scripture-based dataset.
             */

            let theographic =
                null;

            try {

                theographic =
                    await searchTheographicCharacter(
                        search
                    );

            } catch (error) {

                console.warn(
                    "Theographic search failed:",
                    error
                );
            }

            /*
             * Existing local dictionary as final fallback.
             */

            const dictionary =
                existingCharacterDictionary(
                    search
                );

            if (
                !custom &&
                !theographic &&
                !dictionary
            ) {

                output.innerHTML =
                    "<div>" +
                    "This character was not found " +
                    "in the current biblical-person datasets." +
                    "</div>";

                return;
            }

            const name =
                (
                    custom &&
                    custom.name
                ) ||

                (
                    theographic &&
                    theographic.name
                ) ||

                search;

            const lifeStory =
                (
                    custom &&
                    custom.life_story
                ) ||

                (
                    dictionary &&
                    (
                        dictionary.life_story ||
                        dictionary.story
                    )
                ) ||

                (
                    theographic &&
                    (
                        Array.isArray(
                            theographic.description
                        )
                            ? theographic.description.join(
                                " "
                            )
                            : theographic.description
                    )
                ) ||

                "";

            const faith =
                (
                    custom &&
                    custom.faith
                ) ||

                (
                    dictionary &&
                    dictionary.faith
                ) ||

                "Study this person's recorded relationship with God directly from the cited Scriptures. Distinguish clearly between what Scripture explicitly states and conclusions drawn from the biblical narrative.";

            const virtues =
                (
                    custom &&
                    custom.virtues
                ) ||

                (
                    dictionary &&
                    dictionary.virtues
                ) ||

                "The character's faith, obedience, courage, repentance, perseverance, wisdom or other qualities should be evaluated from the biblical passages in which those qualities are demonstrated.";

            const trials =
                (
                    custom &&
                    custom.trials
                ) ||

                (
                    dictionary &&
                    (
                        dictionary.trials ||
                        dictionary.went
                    )
                ) ||

                "";

            const lessons =
                (
                    custom &&
                    custom.lessons
                ) ||

                (
                    dictionary &&
                    (
                        dictionary.lessons ||
                        dictionary.today
                    )
                ) ||

                "Read the cited passages in context and apply the lesson according to what Scripture actually teaches.";

            const references =
                (
                    custom &&
                    Array.isArray(
                        custom.scripture_refs
                    )
                        ? custom.scripture_refs.join(
                            ", "
                        )
                        : (
                            custom &&
                            custom.scripture_refs
                        )
                ) ||

                formatCharacterReferences(
                    theographic &&
                    theographic.references
                ) ||

                "";

            output.innerHTML =

                '<div class="gc33-character-card">' +

                "<h3>" +
                escapeHTML(name) +
                "</h3>" +

                '<div>' +
                "<strong>Life Story</strong>" +
                "<p>" +
                escapeHTML(
                    lifeStory ||
                    "No expanded life story has been authored yet."
                ) +
                "</p>" +
                "</div>" +

                "</div>" +

                '<div class="gc33-character-card">' +

                "<strong>Faith & Trust in God</strong>" +

                "<p>" +
                escapeHTML(
                    faith
                ) +
                "</p>" +

                "</div>" +

                '<div class="gc33-character-card">' +

                "<strong>Faith & Virtues — Deeper Study</strong>" +

                "<p>" +
                escapeHTML(
                    virtues
                ) +
                "</p>" +

                "</div>" +

                (
                    trials
                        ? (
                            '<div class="gc33-character-card">' +

                            "<strong>Trials & Turning Points</strong>" +

                            "<p>" +
                            escapeHTML(
                                trials
                            ) +
                            "</p>" +

                            "</div>"
                        )
                        : ""
                ) +

                '<div class="gc33-character-card">' +

                "<strong>What We Can Learn</strong>" +

                "<p>" +
                escapeHTML(
                    lessons
                ) +
                "</p>" +

                "</div>" +

                '<div class="gc33-character-card">' +

                "<strong>Scripture References</strong>" +

                "<p>" +
                escapeHTML(
                    references ||
                    "Use the Scripture passages associated with this character."
                ) +
                "</p>" +

                "</div>" +

                '<div class="gc33-source">' +

                "Character source: Theographic Bible Metadata / " +
                "Free Use Bible API. " +
                "GraceConnect custom content takes precedence. " +
                "Wikipedia is not used as the character source." +

                "</div>";

        } catch (error) {

            console.error(
                "Character loading error:",
                error
            );

            output.innerHTML =
                "<div>" +
                "Unable to load this Bible character right now." +
                "</div>";
        }
    }

    window.loadCharacter =
        loadCharacter;

    window.gc33LoadCharacter =
        loadCharacter;

    /* ============================================================
       DEVOTIONAL SYSTEM
       ============================================================ */

    function todayISO() {

        const date =
            new Date();

        return date
            .toISOString()
            .slice(0, 10);
    }

    function monthDay() {

        const date =
            new Date();

        return (
            String(
                date.getMonth() + 1
            ).padStart(2, "0") +

            "-" +

            String(
                date.getDate()
            ).padStart(2, "0")
        );
    }

    async function getCustomDevotional() {

        const client = db();

        if (!client) {
            return null;
        }

        try {

            const result =
                await client
                    .from(
                        DEVOTIONAL_TABLE
                    )
                    .select("*")
                    .eq(
                        "active",
                        true
                    )
                    .eq(
                        "date",
                        todayISO()
                    )
                    .order(
                        "updated_at",
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
                return null;
            }

            return result.data[0];

        } catch (error) {

            console.warn(
                "Custom devotional lookup failed:",
                error
            );

            return null;
        }
    }

    async function getFallbackDevotional() {

        const url =
            DEVOTIONAL_API +
            monthDay() +
            ".json";

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Devotional service unavailable."
            );
        }

        const data =
            await response.json();

        const periods =
            data.periods ||
            [];

        const morning =
            periods.find(function (item) {

                return item.period === "am";

            }) ||

            periods[0];

        const english =
            morning &&
            morning.languages &&
            morning.languages.en;

        if (!english) {

            throw new Error(
                "No English devotional found."
            );
        }

        return {

            title:
                english.theme ||
                "Today's Devotional",

            body:
                english.summary ||
                english.text ||
                "",

            verse:
                (
                    english.verses ||
                    []
                )
                .map(function (verse) {

                    return (
                        verse.reference ||
                        verse.text ||
                        ""
                    );

                })
                .filter(Boolean)
                .join(" · "),

            questions:
                english.questions ||
                [],

            prayer:
                english.prayer ||
                ""

        };
    }

    async function getDevotional() {

        /*
         * ADMIN CUSTOM CONTENT FIRST
         */

        const custom =
            await getCustomDevotional();

        if (custom) {

            return {

                data: custom,

                source:
                    custom.source_name ||
                    "GraceConnect custom devotional"

            };
        }

        /*
         * CHRISTIAN FALLBACK
         */

        try {

            const fallback =
                await getFallbackDevotional();

            return {

                data: fallback,

                source:
                    "Christ Himself — A Daily Devotional"

            };

        } catch (error) {

            console.warn(
                "Devotional fallback failed:",
                error
            );

            /*
             * Final local fallback.
             */

            return {

                data: {

                    title:
                        "Walking in Faith",

                    body:
                        "Faith calls us to trust God even when we cannot see the entire path ahead. Read the Word, pray faithfully and walk according to what God has revealed.",

                    verse:
                        "2 Corinthians 5:7",

                    prayer:
                        "Lord, strengthen my faith and help me trust You in every circumstance.",

                    questions: [
                        "Where is God asking me to trust Him today?",
                        "What Scripture can I hold onto in this season?"
                    ]

                },

                source:
                    "GraceConnect fallback"

            };
        }
    }

    async function renderDevotional() {

        if (devotionalRendering) {
            return;
        }

        const card =
            document.getElementById(
                "devotionalCard"
            );

        if (!card) {
            return;
        }

        devotionalRendering =
            true;

        try {

            const result =
                await getDevotional();

            const devotional =
                result.data;

            const title =
                document.getElementById(
                    "devTitle"
                );

            const body =
                document.getElementById(
                    "devBody"
                );

            const verse =
                document.getElementById(
                    "devVerse"
                );

            if (title) {
                title.textContent =
                    devotional.title ||
                    "Daily Devotional";
            }

            if (body) {
                body.textContent =
                    devotional.body ||
                    devotional.reflection ||
                    "";
            }

            if (verse) {
                verse.textContent =
                    devotional.verse
                        ? "📖 " +
                          devotional.verse
                        : "";
            }

            let extra =
                document.getElementById(
                    "gc33-devotional-extra"
                );

            if (!extra) {

                extra =
                    document.createElement(
                        "div"
                    );

                extra.id =
                    "gc33-devotional-extra";

                card.appendChild(extra);
            }

            extra.innerHTML =

                (
                    devotional.prayer
                        ? (
                            '<div style="margin-top:14px">' +
                            "<strong>Prayer</strong>" +

                            '<div style="margin-top:6px;line-height:1.7">' +
                            escapeHTML(
                                devotional.prayer
                            ) +
                            "</div>" +

                            "</div>"
                        )
                        : ""
                ) +

                (
                    Array.isArray(
                        devotional.questions
                    ) &&
                    devotional.questions.length
                        ? (
                            '<div style="margin-top:14px">' +

                            "<strong>Reflect</strong>" +

                            '<ol style="margin:7px 0 0 20px;line-height:1.7">' +

                            devotional.questions
                                .map(function (question) {

                                    return (
                                        "<li>" +
                                        escapeHTML(
                                            question
                                        ) +
                                        "</li>"
                                    );

                                })
                                .join("") +

                            "</ol>" +

                            "</div>"
                        )
                        : ""
                ) +

                '<div class="gc33-source" style="margin-top:14px">' +

                "Source: " +
                escapeHTML(
                    result.source
                ) +

                "</div>";

        } catch (error) {

            console.warn(
                "Devotional rendering failed:",
                error
            );

        } finally {

            devotionalRendering =
                false;
        }
    }

    window.gc33RenderDevotional =
        renderDevotional;

    /* ============================================================
       ADMIN CONTENT MANAGER
       ============================================================ */

    const managerState = {
        tab: "trivia"
    };

    function openContentManager() {

        isAdmin().then(function (allowed) {

            if (!allowed) {

                notify(
                    "Administrator access is required.",
                    "error"
                );

                return;
            }

            injectStyles();

            const modal =
                createModal(
                    "gc33-content-manager",

                    '<div class="gc33-head">' +

                    "<h2>✝ Bible Content Manager</h2>" +

                    '<button class="gc33-close" ' +
                    'id="gc33-close-manager">' +
                    "×" +
                    "</button>" +

                    "</div>" +

                    '<div class="gc33-body">' +

                    '<div class="gc33-tabs">' +

                    '<button class="gc33-tab active" data-tab="trivia">' +
                    "🧠 Trivia" +
                    "</button>" +

                    '<button class="gc33-tab" data-tab="characters">' +
                    "👤 Bible Characters" +
                    "</button>" +

                    '<button class="gc33-tab" data-tab="devotionals">' +
                    "🙏 Devotionals" +
                    "</button>" +

                    "</div>" +

                    '<div id="gc33-manager-content"></div>' +

                    "</div>"
                );

            modal.querySelector(
                "#gc33-close-manager"
            ).onclick =
                function () {

                    closeElement(
                        "gc33-content-manager"
                    );
                };

            Array.from(
                modal.querySelectorAll(
                    ".gc33-tab"
                )
            ).forEach(function (tab) {

                tab.onclick =
                    function () {

                        Array.from(
                            modal.querySelectorAll(
                                ".gc33-tab"
                            )
                        ).forEach(
                            function (item) {
                                item.classList.remove(
                                    "active"
                                );
                            }
                        );

                        tab.classList.add(
                            "active"
                        );

                        managerState.tab =
                            tab.dataset.tab;

                        renderManager();
                    };
            });

            renderManager();
        });
    }

    async function renderManager() {

        const host =
            document.getElementById(
                "gc33-manager-content"
            );

        if (!host) {
            return;
        }

        if (
            managerState.tab ===
            "trivia"
        ) {

            await renderTriviaAdmin(
                host
            );

            return;
        }

        if (
            managerState.tab ===
            "characters"
        ) {

            await renderCharactersAdmin(
                host
            );

            return;
        }

        await renderDevotionalsAdmin(
            host
        );
    }

    /* ============================================================
       ADMIN — TRIVIA
       ============================================================ */

    async function renderTriviaAdmin(host) {

        const client = db();

        if (!client) {
            host.innerHTML =
                "<p>Supabase unavailable.</p>";
            return;
        }

        const result =
            await client
                .from(
                    TRIVIA_TABLE
                )
                .select("*")
                .order(
                    "updated_at",
                    {
                        ascending: false
                    }
                )
                .limit(100);

        const rows =
            (result.data || [])
                .map(function (item) {

                    return (

                        '<div class="gc33-row">' +

                        '<div>' +

                        "<b>" +
                        escapeHTML(
                            item.question
                        ) +
                        "</b>" +

                        "<small>" +

                        escapeHTML(
                            item.reference ||
                            "No Scripture reference"
                        ) +

                        " · " +

                        escapeHTML(
                            item.source_name ||
                            "Source not specified"
                        ) +

                        "</small>" +

                        "</div>" +

                        '<button class="gc33-btn gc33-muted" ' +
                        'data-trivia-id="' +
                        escapeHTML(
                            item.id
                        ) +
                        '">' +

                        "Edit" +

                        "</button>" +

                        "</div>"
                    );

                })
                .join("");

        host.innerHTML =

            '<div class="gc33-actions">' +

            '<button class="gc33-btn gc33-primary" id="gc33-new-trivia">' +
            "+ Add Question" +
            "</button>" +

            '<button class="gc33-btn gc33-muted" id="gc33-import-trivia">' +
            "Import JSON" +
            "</button>" +

            "</div>" +

            '<div class="gc33-help">' +

            "<strong>Trivia library</strong><br>" +

            "Questions should come from reputable biblical " +
            "sources and include their Scripture reference " +
            "where appropriate. The database stores each " +
            "question independently so the library can grow " +
            "to 10,000+ questions without putting thousands " +
            "of questions into JavaScript." +

            "</div>" +

            '<div class="gc33-list">' +

            (
                rows ||
                "<div>No trivia questions have been added yet.</div>"
            ) +

            "</div>";

        host.querySelector(
            "#gc33-new-trivia"
        ).onclick =
            function () {

                openEditor(
                    "trivia",
                    null
                );
            };

        host.querySelector(
            "#gc33-import-trivia"
        ).onclick =
            importTriviaJSON;

        Array.from(
            host.querySelectorAll(
                "[data-trivia-id]"
            )
        ).forEach(function (button) {

            button.onclick =
                async function () {

                    const id =
                        button.dataset.triviaId;

                    const item =
                        await client
                            .from(
                                TRIVIA_TABLE
                            )
                            .select("*")
                            .eq(
                                "id",
                                id
                            )
                            .single();

                    if (
                        item.error
                    ) {

                        notify(
                            item.error.message,
                            "error"
                        );

                        return;
                    }

                    openEditor(
                        "trivia",
                        item.data
                    );
                };
        });
    }

    /* ============================================================
       ADMIN — CHARACTERS
       ============================================================ */

    async function renderCharactersAdmin(host) {

        const client = db();

        if (!client) {
            host.innerHTML =
                "<p>Supabase unavailable.</p>";
            return;
        }

        const result =
            await client
                .from(
                    CHARACTER_TABLE
                )
                .select("*")
                .order(
                    "name",
                    {
                        ascending: true
                    }
                )
                .limit(300);

        const rows =
            (result.data || [])
                .map(function (item) {

                    return (

                        '<div class="gc33-row">' +

                        '<div>' +

                        "<b>" +
                        escapeHTML(
                            item.name
                        ) +
                        "</b>" +

                        "<small>" +

                        escapeHTML(
                            item.source_name ||
                            "GraceConnect"
                        ) +

                        "</small>" +

                        "</div>" +

                        '<button class="gc33-btn gc33-muted" ' +
                        'data-character-id="' +
                        escapeHTML(
                            item.id
                        ) +
                        '">' +

                        "Edit" +

                        "</button>" +

                        "</div>"
                    );

                })
                .join("");

        host.innerHTML =

            '<div class="gc33-actions">' +

            '<button class="gc33-btn gc33-primary" id="gc33-new-character">' +
            "+ Add Character" +
            "</button>" +

            '<button class="gc33-btn gc33-muted" id="gc33-sync-character">' +
            "Sync Bible People Dataset" +
            "</button>" +

            "</div>" +

            '<div class="gc33-help">' +

            "<strong>Bible character library</strong><br>" +

            "The broad biblical-person dataset is used instead " +
            "of Wikipedia. GraceConnect then lets administrators " +
            "add deeper Scripture-grounded material including " +
            "life story, faith, trust in God, virtues, trials " +
            "and practical lessons." +

            "</div>" +

            '<div class="gc33-list">' +

            (
                rows ||
                "<div>No custom/imported characters yet.</div>"
            ) +

            "</div>";

        host.querySelector(
            "#gc33-new-character"
        ).onclick =
            function () {

                openEditor(
                    "characters",
                    null
                );
            };

        host.querySelector(
            "#gc33-sync-character"
        ).onclick =
            syncBiblePeople;

        Array.from(
            host.querySelectorAll(
                "[data-character-id]"
            )
        ).forEach(function (button) {

            button.onclick =
                async function () {

                    const id =
                        button.dataset.characterId;

                    const item =
                        await client
                            .from(
                                CHARACTER_TABLE
                            )
                            .select("*")
                            .eq(
                                "id",
                                id
                            )
                            .single();

                    if (
                        item.error
                    ) {

                        notify(
                            item.error.message,
                            "error"
                        );

                        return;
                    }

                    openEditor(
                        "characters",
                        item.data
                    );
                };
        });
    }

    /* ============================================================
       SYNC THEOGRAPHIC / BIBLE PEOPLE
       ============================================================ */

    async function syncBiblePeople() {

        const allowed =
            await isAdmin();

        if (!allowed) {
            notify(
                "Administrator access is required.",
                "error"
            );
            return;
        }

        try {

            notify(
                "Loading biblical people dataset…",
                "info"
            );

            const response =
                await fetch(
                    THEOGRAPHIC_PEOPLE
                );

            if (!response.ok) {
                throw new Error(
                    "Unable to download biblical people dataset."
                );
            }

            const data =
                await response.json();

            const people =
                data.people ||
                [];

            const client =
                db();

            const userId =
                await currentUserId();

            const rows =
                people.map(function (person) {

                    return {

                        source_id:
                            person.id,

                        name:
                            person.name,

                        aliases:
                            [],

                        life_story:
                            "",

                        faith:
                            "",

                        virtues:
                            "",

                        trials:
                            "",

                        lessons:
                            "",

                        scripture_refs:
                            [],

                        source_name:
                            "Theographic Bible Metadata via Free Use Bible API",

                        source_url:
                            "https://github.com/robertrouse/theographic-bible-metadata",

                        active:
                            true,

                        created_by:
                            userId,

                        updated_by:
                            userId,

                        updated_at:
                            new Date().toISOString()

                    };

                });

            /*
             * Upload in batches to avoid oversized requests.
             */

            for (
                let index = 0;
                index < rows.length;
                index += 300
            ) {

                const batch =
                    rows.slice(
                        index,
                        index + 300
                    );

                const result =
                    await client
                        .from(
                            CHARACTER_TABLE
                        )
                        .upsert(
                            batch,
                            {
                                onConflict:
                                    "source_id"
                            }
                        );

                if (
                    result.error
                ) {
                    throw result.error;
                }
            }

            notify(
                people.length +
                " biblical-person records synchronized.",
                "success"
            );

            renderManager();

        } catch (error) {

            console.error(
                "Bible people synchronization failed:",
                error
            );

            notify(
                "Character synchronization failed: " +
                (
                    error.message ||
                    "Unknown error"
                ),
                "error"
            );
        }
    }

    /* ============================================================
       ADMIN — DEVOTIONALS
       ============================================================ */

    async function renderDevotionalsAdmin(
        host
    ) {

        const client =
            db();

        if (!client) {
            host.innerHTML =
                "<p>Supabase unavailable.</p>";
            return;
        }

        const result =
            await client
                .from(
                    DEVOTIONAL_TABLE
                )
                .select("*")
                .order(
                    "date",
                    {
                        ascending: false
                    }
                )
                .limit(100);

        const rows =
            (result.data || [])
                .map(function (item) {

                    return (

                        '<div class="gc33-row">' +

                        '<div>' +

                        "<b>" +

                        escapeHTML(
                            item.title ||
                            "Untitled devotional"
                        ) +

                        "</b>" +

                        "<small>" +

                        escapeHTML(
                            item.date ||
                            ""
                        ) +

                        " · " +

                        escapeHTML(
                            item.source_name ||
                            "GraceConnect"
                        ) +

                        "</small>" +

                        "</div>" +

                        '<button class="gc33-btn gc33-muted" ' +
                        'data-devotional-id="' +
                        escapeHTML(
                            item.id
                        ) +
                        '">' +

                        "Edit" +

                        "</button>" +

                        "</div>"
                    );

                })
                .join("");

        host.innerHTML =

            '<div class="gc33-actions">' +

            '<button class="gc33-btn gc33-primary" id="gc33-new-devotional">' +
            "+ Add / Override Devotional" +
            "</button>" +

            "</div>" +

            '<div class="gc33-help">' +

            "<strong>Devotional priority</strong><br>" +

            "An active custom GraceConnect devotional for " +
            "today overrides the external fallback. If no " +
            "custom devotional exists, the Christian devotional " +
            "fallback is used. Administrators can edit existing " +
            "custom devotionals at any time." +

            "</div>" +

            '<div class="gc33-list">' +

            (
                rows ||
                "<div>No custom devotionals yet.</div>"
            ) +

            "</div>";

        host.querySelector(
            "#gc33-new-devotional"
        ).onclick =
            function () {

                openEditor(
                    "devotionals",
                    null
                );
            };

        Array.from(
            host.querySelectorAll(
                "[data-devotional-id]"
            )
        ).forEach(function (button) {

            button.onclick =
                async function () {

                    const id =
                        button.dataset.devotionalId;

                    const item =
                        await client
                            .from(
                                DEVOTIONAL_TABLE
                            )
                            .select("*")
                            .eq(
                                "id",
                                id
                            )
                            .single();

                    if (
                        item.error
                    ) {

                        notify(
                            item.error.message,
                            "error"
                        );

                        return;
                    }

                    openEditor(
                        "devotionals",
                        item.data
                    );
                };
        });
    }

    /* ============================================================
       EDITOR FIELDS
       ============================================================ */

    function editorFields(
        type,
        item
    ) {

        item =
            item ||
            {};

        if (
            type ===
            "trivia"
        ) {

            return (

                '<div class="gc33-grid">' +

                '<div class="gc33-field full">' +
                "<label>Question</label>" +
                '<textarea id="gc33-question">' +
                escapeHTML(
                    item.question ||
                    ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field full">' +
                "<label>Answer options — one per line</label>" +
                '<textarea id="gc33-options">' +
                escapeHTML(
                    Array.isArray(
                        item.options
                    )
                        ? item.options.join(
                            "\n"
                        )
                        : ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field">' +
                "<label>Correct option index</label>" +
                '<input id="gc33-correct" type="number" min="0" max="9" value="' +
                escapeHTML(
                    item.correct_index ===
                    undefined
                        ? 0
                        : item.correct_index
                ) +
                '">' +
                "</div>" +

                '<div class="gc33-field">' +
                "<label>Category</label>" +
                '<input id="gc33-category" value="' +
                escapeHTML(
                    item.category ||
                    "Scripture"
                ) +
                '">' +
                "</div>" +

                '<div class="gc33-field">' +
                "<label>Difficulty</label>" +
                "<select id=\"gc33-difficulty\">" +

                "<option " +
                (
                    item.difficulty ===
                    "EASY"
                        ? "selected"
                        : ""
                ) +
                ">EASY</option>" +

                "<option " +
                (
                    !item.difficulty ||
                    item.difficulty ===
                    "NORMAL"
                        ? "selected"
                        : ""
                ) +
                ">NORMAL</option>" +

                "<option " +
                (
                    item.difficulty ===
                    "HARD"
                        ? "selected"
                        : ""
                ) +
                ">HARD</option>" +

                "</select>" +

                "</div>" +

                '<div class="gc33-field">' +
                "<label>Bible reference</label>" +
                '<input id="gc33-reference" value="' +
                escapeHTML(
                    item.reference ||
                    ""
                ) +
                '">' +
                "</div>" +

                '<div class="gc33-field full">' +
                "<label>Explanation</label>" +
                '<textarea id="gc33-explanation">' +
                escapeHTML(
                    item.explanation ||
                    ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field">' +
                "<label>Source name</label>" +
                '<input id="gc33-source" value="' +
                escapeHTML(
                    item.source_name ||
                    ""
                ) +
                '">' +
                "</div>" +

                '<div class="gc33-field">' +
                "<label>Source URL</label>" +
                '<input id="gc33-source-url" value="' +
                escapeHTML(
                    item.source_url ||
                    ""
                ) +
                '">' +
                "</div>" +

                "</div>"
            );
        }

        if (
            type ===
            "characters"
        ) {

            return (

                '<div class="gc33-grid">' +

                '<div class="gc33-field">' +
                "<label>Name</label>" +
                '<input id="gc33-name" value="' +
                escapeHTML(
                    item.name ||
                    ""
                ) +
                '">' +
                "</div>" +

                '<div class="gc33-field">' +
                "<label>Aliases</label>" +
                '<input id="gc33-aliases" value="' +
                escapeHTML(
                    Array.isArray(
                        item.aliases
                    )
                        ? item.aliases.join(
                            ", "
                        )
                        : ""
                ) +
                '">' +
                "</div>" +

                '<div class="gc33-field full">' +
                "<label>Life Story</label>" +
                '<textarea id="gc33-life-story">' +
                escapeHTML(
                    item.life_story ||
                    ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field full">' +
                "<label>Faith & Trust in God — detailed</label>" +
                '<textarea id="gc33-faith">' +
                escapeHTML(
                    item.faith ||
                    ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field full">' +
                "<label>Faith & Virtues — detailed</label>" +
                '<textarea id="gc33-virtues">' +
                escapeHTML(
                    item.virtues ||
                    ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field full">' +
                "<label>Trials & Turning Points</label>" +
                '<textarea id="gc33-trials">' +
                escapeHTML(
                    item.trials ||
                    ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field full">' +
                "<label>Lessons / Application</label>" +
                '<textarea id="gc33-lessons">' +
                escapeHTML(
                    item.lessons ||
                    ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field full">' +
                "<label>Scripture References</label>" +
                '<textarea id="gc33-scripture-refs">' +
                escapeHTML(
                    Array.isArray(
                        item.scripture_refs
                    )
                        ? item.scripture_refs.join(
                            ", "
                        )
                        : ""
                ) +
                "</textarea>" +
                "</div>" +

                '<div class="gc33-field">' +
                "<label>Source name</label>" +
                '<input id="gc33-source" value="' +
                escapeHTML(
                    item.source_name ||
                    ""
                ) +
                '">' +
                "</div>" +

                '<div class="gc33-field">' +
                "<label>Source URL</label>" +
                '<input id="gc33-source-url" value="' +
                escapeHTML(
                    item.source_url ||
                    ""
                ) +
                '">' +
                "</div>" +

                "</div>"
            );
        }

        return (

            '<div class="gc33-grid">' +

            '<div class="gc33-field">' +
            "<label>Date</label>" +
            '<input id="gc33-date" type="date" value="' +
            escapeHTML(
                item.date ||
                todayISO()
            ) +
            '">' +
            "</div>" +

            '<div class="gc33-field">' +
            "<label>Title</label>" +
            '<input id="gc33-title" value="' +
            escapeHTML(
                item.title ||
                ""
            ) +
            '">' +
            "</div>" +

            '<div class="gc33-field full">' +
            "<label>Theme / Scripture</label>" +
            '<input id="gc33-theme" value="' +
            escapeHTML(
                item.theme ||
                ""
            ) +
            '">' +
            "</div>" +

            '<div class="gc33-field full">' +
            "<label>Reflection / Body</label>" +
            '<textarea id="gc33-body">' +
            escapeHTML(
                item.body ||
                item.reflection ||
                ""
            ) +
            "</textarea>" +
            "</div>" +

            '<div class="gc33-field full">' +
            "<label>Prayer</label>" +
            '<textarea id="gc33-prayer">' +
            escapeHTML(
                item.prayer ||
                ""
            ) +
            "</textarea>" +
            "</div>" +

            '<div class="gc33-field full">' +
            "<label>Reflection Questions — one per line</label>" +
            '<textarea id="gc33-questions">' +
            escapeHTML(
                Array.isArray(
                    item.questions
                )
                    ? item.questions.join(
                        "\n"
                    )
                    : ""
            ) +
            "</textarea>" +
            "</div>" +

            '<div class="gc33-field">' +
            "<label>Source name</label>" +
            '<input id="gc33-source" value="' +
            escapeHTML(
                item.source_name ||
                "GraceConnect"
            ) +
            '">' +
            "</div>" +

            '<div class="gc33-field">' +
            "<label>Source URL</label>" +
            '<input id="gc33-source-url" value="' +
            escapeHTML(
                item.source_url ||
                ""
            ) +
            '">' +
            "</div>" +

            "</div>"
        );
    }

    /* ============================================================
       READ EDITOR
       ============================================================ */

    function readEditor(
        type
    ) {

        if (
            type ===
            "trivia"
        ) {

            return {

                question:
                    document.getElementById(
                        "gc33-question"
                    ).value.trim(),

                options:
                    document.getElementById(
                        "gc33-options"
                    ).value
                        .split(/\n+/)
                        .map(function (item) {
                            return item.trim();
                        })
                        .filter(Boolean),

                correct_index:
                    Number(
                        document.getElementById(
                            "gc33-correct"
                        ).value
                    ),

                category:
                    document.getElementById(
                        "gc33-category"
                    ).value.trim(),

                difficulty:
                    document.getElementById(
                        "gc33-difficulty"
                    ).value,

                reference:
                    document.getElementById(
                        "gc33-reference"
                    ).value.trim(),

                explanation:
                    document.getElementById(
                        "gc33-explanation"
                    ).value.trim(),

                source_name:
                    document.getElementById(
                        "gc33-source"
                    ).value.trim(),

                source_url:
                    document.getElementById(
                        "gc33-source-url"
                    ).value.trim(),

                approved:
                    true
            };
        }

        if (
            type ===
            "characters"
        ) {

            return {

                name:
                    document.getElementById(
                        "gc33-name"
                    ).value.trim(),

                aliases:
                    document.getElementById(
                        "gc33-aliases"
                    ).value
                        .split(",")
                        .map(function (item) {
                            return item.trim();
                        })
                        .filter(Boolean),

                life_story:
                    document.getElementById(
                        "gc33-life-story"
                    ).value.trim(),

                faith:
                    document.getElementById(
                        "gc33-faith"
                    ).value.trim(),

                virtues:
                    document.getElementById(
                        "gc33-virtues"
                    ).value.trim(),

                trials:
                    document.getElementById(
                        "gc33-trials"
                    ).value.trim(),

                lessons:
                    document.getElementById(
                        "gc33-lessons"
                    ).value.trim(),

                scripture_refs:
                    document.getElementById(
                        "gc33-scripture-refs"
                    ).value
                        .split(",")
                        .map(function (item) {
                            return item.trim();
                        })
                        .filter(Boolean),

                source_name:
                    document.getElementById(
                        "gc33-source"
                    ).value.trim(),

                source_url:
                    document.getElementById(
                        "gc33-source-url"
                    ).value.trim(),

                active:
                    true
            };
        }

        return {

            date:
                document.getElementById(
                    "gc33-date"
                ).value,

            title:
                document.getElementById(
                    "gc33-title"
                ).value.trim(),

            theme:
                document.getElementById(
                    "gc33-theme"
                ).value.trim(),

            body:
                document.getElementById(
                    "gc33-body"
                ).value.trim(),

            prayer:
                document.getElementById(
                    "gc33-prayer"
                ).value.trim(),

            questions:
                document.getElementById(
                    "gc33-questions"
                ).value
                    .split(/\n+/)
                    .map(function (item) {
                        return item.trim();
                    })
                    .filter(Boolean),

            source_name:
                document.getElementById(
                    "gc33-source"
                ).value.trim(),

            source_url:
                document.getElementById(
                    "gc33-source-url"
                ).value.trim(),

            active:
                true,

            is_custom:
                true
        };
    }

    /* ============================================================
       SAVE EDITOR
       ============================================================ */

    async function saveEditor(
        type,
        existingId
    ) {

        const client =
            db();

        if (!client) {
            throw new Error(
                "Supabase unavailable."
            );
        }

        const userId =
            await currentUserId();

        const data =
            readEditor(type);

        data.updated_by =
            userId;

        data.updated_at =
            new Date().toISOString();

        if (
            existingId
        ) {
            data.id =
                existingId;
        }

        let table;

        if (
            type ===
            "trivia"
        ) {
            table =
                TRIVIA_TABLE;
        } else if (
            type ===
            "characters"
        ) {
            table =
                CHARACTER_TABLE;
        } else {
            table =
                DEVOTIONAL_TABLE;
        }

        const result =
            await client
                .from(table)
                .upsert(data);

        if (
            result.error
        ) {
            throw result.error;
        }

        notify(
            "Content saved successfully.",
            "success"
        );

        closeElement(
            "gc33-content-editor"
        );

        renderManager();
    }

    /* ============================================================
       OPEN EDITOR
       ============================================================ */

    function openEditor(
        type,
        item
    ) {

        const titles = {

            trivia:
                "Bible Trivia Question",

            characters:
                "Bible Character",

            devotionals:
                "Daily Devotional"

        };

        const modal =
            createModal(

                "gc33-content-editor",

                '<div class="gc33-head">' +

                "<h2>" +
                escapeHTML(
                    titles[type]
                ) +
                "</h2>" +

                '<button class="gc33-close" id="gc33-close-editor">' +
                "×" +
                "</button>" +

                "</div>" +

                '<div class="gc33-body">' +

                editorFields(
                    type,
                    item
                ) +

                '<div class="gc33-actions">' +

                '<button class="gc33-btn gc33-primary" id="gc33-save-editor">' +
                "Save" +
                "</button>" +

                '<button class="gc33-btn gc33-muted" id="gc33-cancel-editor">' +
                "Cancel" +
                "</button>" +

                "</div>" +

                "</div>"
            );

        modal.querySelector(
            "#gc33-close-editor"
        ).onclick =
            function () {

                closeElement(
                    "gc33-content-editor"
                );
            };

        modal.querySelector(
            "#gc33-cancel-editor"
        ).onclick =
            function () {

                closeElement(
                    "gc33-content-editor"
                );
            };

        modal.querySelector(
            "#gc33-save-editor"
        ).onclick =
            async function () {

                const button =
                    modal.querySelector(
                        "#gc33-save-editor"
                    );

                button.disabled =
                    true;

                button.textContent =
                    "Saving…";

                try {

                    await saveEditor(
                        type,
                        item &&
                        item.id
                            ? item.id
                            : null
                    );

                } catch (error) {

                    console.error(
                        "Content save failed:",
                        error
                    );

                    notify(
                        "Save failed: " +
                        (
                            error.message ||
                            "Unknown error"
                        ),
                        "error"
                    );

                    button.disabled =
                        false;

                    button.textContent =
                        "Save";
                }
            };
    }

    /* ============================================================
       IMPORT TRIVIA JSON
       ============================================================ */

    function importTriviaJSON() {

        const modal =
            createModal(

                "gc33-trivia-import",

                '<div class="gc33-head">' +

                "<h2>Import Bible Trivia JSON</h2>" +

                '<button class="gc33-close" id="gc33-close-import">' +
                "×" +
                "</button>" +

                "</div>" +

                '<div class="gc33-body">' +

                '<div class="gc33-help">' +

                "Paste a JSON array of Bible questions. " +
                "Each object should contain question, " +
                "options, correct_index, reference, " +
                "explanation, category, difficulty, " +
                "source_name and source_url where available." +

                "<br><br>" +

                "For a 10,000+ question library, import " +
                "the questions in batches rather than placing " +
                "them inside app33.js." +

                "</div>" +

                '<textarea id="gc33-json-import" ' +
                'style="width:100%;min-height:320px;' +
                'box-sizing:border-box;border:1px solid #dbe2ea;' +
                'border-radius:12px;padding:12px;font:inherit">' +
                "</textarea>" +

                '<div class="gc33-actions">' +

                '<button class="gc33-btn gc33-primary" id="gc33-run-import">' +
                "Import Questions" +
                "</button>" +

                "</div>" +

                "</div>"
            );

        modal.querySelector(
            "#gc33-close-import"
        ).onclick =
            function () {

                closeElement(
                    "gc33-trivia-import"
                );
            };

        modal.querySelector(
            "#gc33-run-import"
        ).onclick =
            async function () {

                try {

                    const raw =
                        modal.querySelector(
                            "#gc33-json-import"
                        ).value;

                    const questions =
                        JSON.parse(raw);

                    if (
                        !Array.isArray(
                            questions
                        )
                    ) {
                        throw new Error(
                            "JSON must contain an array."
                        );
                    }

                    const client =
                        db();

                    const userId =
                        await currentUserId();

                    const rows =
                        questions
                            .map(function (item) {

                                return {

                                    question:
                                        String(
                                            item.question ||
                                            ""
                                        ).trim(),

                                    options:
                                        Array.isArray(
                                            item.options
                                        )
                                            ? item.options
                                            : [],

                                    correct_index:
                                        Number(
                                            item.correct_index ||
                                            0
                                        ),

                                    reference:
                                        String(
                                            item.reference ||
                                            ""
                                        ),

                                    explanation:
                                        String(
                                            item.explanation ||
                                            ""
                                        ),

                                    category:
                                        String(
                                            item.category ||
                                            "Scripture"
                                        ),

                                    difficulty:
                                        String(
                                            item.difficulty ||
                                            "NORMAL"
                                        ),

                                    source_name:
                                        String(
                                            item.source_name ||
                                            ""
                                        ),

                                    source_url:
                                        String(
                                            item.source_url ||
                                            ""
                                        ),

                                    approved:
                                        true,

                                    created_by:
                                        userId,

                                    updated_by:
                                        userId,

                                    updated_at:
                                        new Date().toISOString()

                                };

                            })
                            .filter(function (item) {

                                return (
                                    item.question &&
                                    item.options.length >=
                                    2
                                );

                            });

                    if (!rows.length) {

                        throw new Error(
                            "No valid questions were found."
                        );
                    }

                    let imported =
                        0;

                    for (
                        let index = 0;
                        index < rows.length;
                        index += 500
                    ) {

                        const batch =
                            rows.slice(
                                index,
                                index + 500
                            );

                        const result =
                            await client
                                .from(
                                    TRIVIA_TABLE
                                )
                                .insert(
                                    batch
                                );

                        if (
                            result.error
                        ) {
                            throw result.error;
                        }

                        imported +=
                            batch.length;
                    }

                    notify(
                        imported +
                        " Bible trivia questions imported.",
                        "success"
                    );

                    closeElement(
                        "gc33-trivia-import"
                    );

                    renderManager();

                } catch (error) {

                    console.error(
                        "Trivia import failed:",
                        error
                    );

                    notify(
                        "Import failed: " +
                        (
                            error.message ||
                            "Invalid JSON"
                        ),
                        "error"
                    );
                }
            };
    }

    /* ============================================================
       ADMIN BUTTON
       ============================================================ */

    function injectAdminButton() {

        const panel =
            document.getElementById(
                "adminDiscoverPanel"
            );

        if (!panel) {
            return;
        }

        if (
            document.getElementById(
                "gc33-content-button"
            )
        ) {
            return;
        }

        const button =
            document.createElement(
                "button"
            );

        button.id =
            "gc33-content-button";

        button.className =
            "btn btn-primary btn-block btn-sm";

        button.style.marginTop =
            "8px";

        button.innerHTML =
            '<i class="fas fa-book-bible"></i> ' +
            "Bible Content Manager";

        button.onclick =
            openContentManager;

        panel.appendChild(
            button
        );
    }

    /* ============================================================
       REGISTRATION BLOCKLIST HELPER
       ============================================================ */

    /*
     * Other registration code can call:
     *
     * await window.gc33IsEmailBlocked(email)
     *
     * BEFORE creating the Supabase account.
     */

    window.gc33ValidateRegistrationEmail =
        async function (email) {

            const blocked =
                await isEmailBlocked(
                    email
                );

            if (blocked) {

                notify(
                    "Registration is unavailable for this email address.",
                    "error"
                );

                return false;
            }

            return true;
        };



// ============ SMART IMPORT — accepts JSON **or** plain text ============
(function () {
  function sbx() { return window.sb; }

  // Normalize correct answer: "A"–"D", "1"–"4", or 0-based index → 0-based index
  function normCorrect(val, optCount) {
    var s = String(val == null ? '' : val).trim();
    if (/^[A-Za-z]$/.test(s)) { var i = s.toUpperCase().charCodeAt(0) - 65; if (i >= 0 && i < optCount) return i; }
    if (/^\d+$/.test(s)) { var n = parseInt(s, 10); if (n >= 1 && n <= optCount) return n - 1; if (n >= 0 && n < optCount) return n; }
    return -1;
  }

  // ---- JSON parser (flexible keys) ----
  function parseJSON(raw) {
    var data = JSON.parse(raw);
    if (!Array.isArray(data)) data = data.questions || data.items || data.data || [data];
    return data.map(function (it) {
      var opts = it.options || it.choices || it.answers || [];
      var corr = (it.correct != null ? it.correct : (it.correct_index != null ? it.correct_index : (it.answer != null ? it.answer : it.correctIndex)));
      if (opts.length) return { kind: 'trivia', question: it.question || it.q || it.title || '', options: opts, correct: normCorrect(corr, opts.length), reference: it.reference || it.verse || it.ref || '' };
      if (it.name && (it.story || it.description)) return { kind: 'character', name: it.name, story: it.story || it.description, reference: it.reference || '' };
      if (it.title && (it.body || it.content)) return { kind: 'devotional', title: it.title, body: it.body || it.content, verse: it.verse || it.reference || '' };
      return null;
    }).filter(Boolean);
  }

  // ---- Plain-text parser (blocks separated by blank lines) ----
  // Example block:
  //   Who built the ark?
  //   A) Moses
  //   B) Noah
  //   C) Abraham
  //   D) David
  //   Answer: B
  //   Reference: Genesis 6
  function parseText(raw) {
    var out = [];
    raw.split(/\n\s*\n/).forEach(function (bl) {
      var lines = bl.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var q = '', opts = [], corr = null, ref = '', name = '', story = '', title = '', body = '', verse = '';
      lines.forEach(function (l) {
        var m;
        if ((m = l.match(/^(?:Name)\s*[:.)-]\s*(.+)$/i))) name = m[1];
        else if ((m = l.match(/^(?:Story|Description)\s*[:.)-]\s*(.+)$/i))) story = m[1];
        else if ((m = l.match(/^(?:Title)\s*[:.)-]\s*(.+)$/i))) title = m[1];
        else if ((m = l.match(/^(?:Body|Content)\s*[:.)-]\s*(.+)$/i))) body = m[1];
        else if ((m = l.match(/^(?:Verse)\s*[:.)-]\s*(.+)$/i))) verse = m[1];
        else if ((m = l.match(/^(?:Reference|Ref)\s*[:.)-]\s*(.+)$/i))) ref = m[1];
        else if ((m = l.match(/^(?:Answer|Correct)\s*[:.)-]\s*(.+)$/i))) corr = m[1];
        else if ((m = l.match(/^([A-Da-d])\s*[:.)-]\s*(.+)$/))) opts.push(m[2]);
        else if ((m = l.match(/^([1-9])\s*[:.)-]\s*(.+)$/))) opts.push(m[2]);
        else if ((m = l.match(/^(?:Q|Question)\s*[:.)-]\s*(.+)$/i))) q = m[1];
        else if (!q && !name && !title) q = l;
        else if (opts.length && opts.length < 4) opts.push(l);
        else if (name) story += (story ? ' ' : '') + l;
        else if (title) body += (body ? ' ' : '') + l;
      });
      if (q && opts.length) out.push({ kind: 'trivia', question: q, options: opts, correct: normCorrect(corr, opts.length), reference: ref });
      else if (name) out.push({ kind: 'character', name: name, story: story, reference: ref });
      else if (title) out.push({ kind: 'devotional', title: title, body: body, verse: verse || ref });
    });
    return out;
  }

  function parseAuto(raw) {
    raw = String(raw || '').trim();
    if (!raw) return [];
    if (raw.charAt(0) === '[' || raw.charAt(0) === '{') { try { return parseJSON(raw); } catch (e) { /* fall through to text */ } }
    return parseText(raw);
  }

  // ---- Adaptive insert (drops unknown columns automatically) ----
  async function adaptiveInsert(table, row) {
    var keys = Object.keys(row).filter(function (k) { return row[k] !== undefined; });
    for (;;) {
      var payload = {}; keys.forEach(function (k) { payload[k] = row[k]; });
      var r = await sbx().from(table).insert([payload]);
      if (!r.error) return r;
      var mm = String(r.error.message || '').match(/column\s+["']?([a-zA-Z_]+)["']?/);
      var col = mm && mm[1];
      if (col && keys.indexOf(col) > -1) { keys = keys.filter(function (k) { return k !== col; }); continue; }
      return r;
    }
  }

  async function runImport(raw) {
    var items = parseAuto(raw);
    if (!items.length) return alert('⚠️ Nothing could be parsed. Check the format examples.');
    var ok = 0, fail = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], r;
      if (it.kind === 'trivia') r = await adaptiveInsert('trivia_questions', { question: it.question, options: it.options, correct_index: it.correct, reference: it.reference });
      else if (it.kind === 'character') r = await adaptiveInsert('bible_characters', { name: it.name, story: it.story, description: it.story, reference: it.reference });
      else r = await adaptiveInsert('devotionals', { title: it.title, body: it.body, content: it.body, verse: it.verse });
      if (r && !r.error) ok++; else fail++;
    }
    alert('✅ Imported ' + ok + ' item(s)' + (fail ? ' (' + fail + ' failed)' : '') + '.');
    if (window.loadTriviaLibrary) window.loadTriviaLibrary();
    if (window.refreshContentManager) window.refreshContentManager();
  }

  // ---- Import modal (textarea: paste JSON or text) ----
  function openImportModal() {
    var old = document.getElementById('gcImportModal'); if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay show" id="gcImportModal" style="display:flex" onclick="if(event.target===this)this.remove()">' +
      '<div class="modal" onclick="event.stopPropagation()"><div class="modal-handle"></div>' +
      '<div class="modal-title"><i class="fas fa-file-import"></i> Import — JSON or Text</div>' +
      '<div class="form-group"><label class="form-label">Paste JSON or plain text</label>' +
      '<textarea class="form-textarea" id="gcImportBox" rows="12" placeholder=\'JSON:\n[{"question":"Who built the ark?","options":["Moses","Noah","Abraham","David"],"correct":"B","reference":"Genesis 6"}]\n\n— or TEXT —\nWho built the ark?\nA) Moses\nB) Noah\nC) Abraham\nD) David\nAnswer: B\nReference: Genesis 6\'></textarea></div>' +
      '<button class="btn btn-primary btn-block" onclick="gcRunImportFromBox()"><i class="fas fa-upload"></i> Import</button>' +
      '<button class="btn btn-secondary-alt btn-block" style="margin-top:6px" onclick="document.getElementById(\'gcImportModal\').remove()">Cancel</button>' +
      '</div></div>');
  }
  window.gcRunImportFromBox = function () {
    var raw = (document.getElementById('gcImportBox') || {}).value || '';
    document.getElementById('gcImportModal').remove();
    runImport(raw);
  };
  window.gcOpenImportModal = openImportModal;

  // ---- Rewire the existing "Import JSON" button to accept both formats ----
  setInterval(function () {
    document.querySelectorAll('button').forEach(function (b) {
      if (/import\s*json/i.test(b.textContent || '') && !b.dataset.gcImp) {
        b.dataset.gcImp = '1';
        b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openImportModal(); };
      }
    });
  }, 1500);
})();
    /* ============================================================
       INITIALIZATION
       ============================================================ */

    let lastTriviaVisible =
        false;

    function isVisible(element) {

        if (!element) {
            return false;
        }

        const style =
            window.getComputedStyle(
                element
            );

        return (
            style.display !== "none" &&
            style.visibility !== "hidden"
        );
    }

    function initialize() {

        injectStyles();

        injectAdminButton();

        const trivia =
            document.getElementById(
                "home-trivia"
            );

        if (trivia) {

            const visible =
                isVisible(trivia);

            if (
                visible &&
                !lastTriviaVisible
            ) {

                renderTrivia();
            }

            lastTriviaVisible =
                visible;
        }

        const devotional =
            document.getElementById(
                "home-devotional"
            );

        if (
            devotional &&
            isVisible(devotional)
        ) {

            renderDevotional();
        }
    }

    /*
     * The existing application changes screens dynamically,
     * so periodically check for the relevant containers.
     */

    setTimeout(
        initialize,
        700
    );

    setInterval(
        initialize,
        1500
    );

    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.gc33OpenContentManager =
        openContentManager;

    window.gc33OpenBibleContentManager =
        openContentManager;

    window.gc33RenderTrivia =
        renderTrivia;

    window.gc33RenderDevotional =
        renderDevotional;

    window.gc33IsEmailBlocked =
        isEmailBlocked;

    window.gc33SyncBiblePeople =
        syncBiblePeople;



// ============ TRIVIA FIX — accept A–D or 1–4, store 0-based, heal bad rows ============
(function () {
  function sbx() { return window.sb; }

  // "A"-"D", "a"-"d", "1"-"4", "0"-"3"  ->  0-based index (or -1 if invalid)
  window.gcParseCorrect = function (val, optCount) {
    optCount = optCount || 4;
    var s = String(val == null ? '' : val).trim().toUpperCase();
    if (/^[A-Z]$/.test(s)) { var li = s.charCodeAt(0) - 65; if (li >= 0 && li < optCount) return li; }
    if (/^\d+$/.test(s)) {
      var n = parseInt(s, 10);
      if (n >= 1 && n <= optCount) return n - 1;   // 1-based -> 0-based
      if (n >= 0 && n < optCount) return n;        // already 0-based
    }
    return -1;
  };

  // 1) NORMALIZE ON SAVE: rewrite the correct-answer field to 0-based BEFORE the save handler reads it
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    var t = (btn.textContent || '').toLowerCase();
    if (!(t.includes('add question') || t.includes('save question') || t.includes('save trivia'))) return;
    var scope = btn.closest('.modal, .modal-overlay, [role="dialog"], form') || document;
    var field = scope.querySelector('[id*="correct" i], [name*="correct" i], [placeholder*="correct" i], [id*="answer" i], [name*="answer" i]');
    if (!field) return;
    var parsed = window.gcParseCorrect(field.value, 4);
    if (parsed >= 0) field.value = String(parsed);
  }, true);

  // 2) Guide users: placeholder + label now say A–D or 1–4
  setInterval(function () {
    document.querySelectorAll('[id*="correct" i], [name*="correct" i], [placeholder*="correct" i]').forEach(function (f) {
      if (!f.dataset.gcHint) { if (f.tagName !== 'SELECT') f.placeholder = 'Correct answer: A–D or 1–4'; f.dataset.gcHint = '1'; }
    });
  }, 1500);

  // 3) HEAL existing bad rows once per session (letters, strings, 1-based overflow)
  var healed = false;
  async function gcHealTrivia() {
    if (healed || !sbx()) return; healed = true;
    try {
      var tables = ['trivia_questions', 'trivia', 'bible_trivia'];
      var tbl = null;
      for (var i = 0; i < tables.length; i++) { var r = await sbx().from(tables[i]).select('id').limit(1); if (!r.error) { tbl = tables[i]; break; } }
      if (!tbl) return;
      var rows = (await sbx().from(tbl).select('*')).data || [];
      for (var j = 0; j < rows.length; j++) {
        var q = rows[j];
        var opts = q.options || q.choices || [];
        var n = 4;
        if (Array.isArray(opts)) n = opts.length || 4;
        else if (typeof opts === 'string') { try { n = (JSON.parse(opts) || []).length || 4; } catch (e) {} }
        var c = (q.correct_index !== undefined && q.correct_index !== null) ? q.correct_index : q.correct;
        var fixed = null;
        if (typeof c === 'string') { var t2 = c.trim().toUpperCase(); if (/^[A-Z]$/.test(t2)) fixed = t2.charCodeAt(0) - 65; else if (/^\d+$/.test(t2)) fixed = parseInt(t2, 10); }
        else if (typeof c === 'number' && !isNaN(c)) fixed = c;
        if (fixed !== null && fixed >= n) fixed = fixed - 1;      // 1-based overflow -> 0-based
        if (fixed !== null && fixed >= 0 && fixed < n && fixed !== q.correct_index) {
          await sbx().from(tbl).update({ correct_index: fixed }).eq('id', q.id);
        }
      }
    } catch (e) {}
  }
  setTimeout(gcHealTrivia, 2500);
})();

})();
