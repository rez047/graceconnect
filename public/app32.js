/* ============================================================
   GRACECONNECT — app32.js
   Church Branding, Legal Document, Terms & User Moderation
   ============================================================ */

(function () {
  "use strict";

  const APP32 = {
    version: "1.0.0",
    legalKey: "gc32_legal_document"
  };

  /* ============================================================
     DEFAULT CHURCH DOCUMENT
     ============================================================ */

  const DEFAULT_DOCUMENT = {
    churchHistory: `Our church was established to provide a Christ-centred community where people can worship God, grow in faith, serve others and share the Gospel.

The church continues to grow through worship, discipleship, prayer, fellowship, evangelism and community service.

[EDIT THIS SECTION: Add the official history of your church, founding date, founders, important milestones, previous locations, pastors/leaders and major developments.]`,

    vision: `To be a Christ-centred, Bible-grounded and Spirit-led church that transforms lives, strengthens families, develops faithful disciples and positively impacts the community for the glory of God.`,

    mission: `Our mission is to glorify God by:

• Worshipping God faithfully.
• Proclaiming the Gospel of Jesus Christ.
• Making and developing disciples.
• Teaching and applying the Word of God.
• Providing Christian fellowship and pastoral care.
• Equipping members to serve God and others.
• Supporting families, young people and the wider community.
• Demonstrating Christ's love through practical service.`,

    statementOfFaith: `We believe:

1. The Bible is the inspired and authoritative Word of God and the foundation for Christian faith and conduct.

2. There is one true God, eternally existing as Father, Son and Holy Spirit.

3. Jesus Christ is the Son of God, fully divine and fully human, who lived a sinless life, died for the sins of humanity, was bodily raised from the dead and is Lord.

4. Salvation is by the grace of God through faith in Jesus Christ.

5. The Holy Spirit convicts, regenerates, guides, empowers and equips believers for Christian living and service.

6. The Church is the body of Christ and is called to worship God, proclaim the Gospel, make disciples and serve humanity.

7. Jesus Christ will return and God will ultimately establish His righteous kingdom.

[EDIT THIS SECTION to match your church's official doctrinal statement.]`,

    contactInfo: `Church Name: [ENTER CHURCH NAME]

Physical Address:
[ENTER ADDRESS]

Postal Address:
[ENTER POSTAL ADDRESS]

Telephone:
[ENTER PHONE NUMBER]

Email:
[ENTER OFFICIAL EMAIL]

Website:
[ENTER WEBSITE]

Office Hours:
[ENTER OFFICE HOURS]

Data Protection Contact:
[NAME / EMAIL OF RESPONSIBLE PERSON]`,

    dataProtection: `DATA PROTECTION AND RECORDING OF PERSONAL INFORMATION

GraceConnect may collect and process personal information provided by users when they register, create profiles, communicate, participate in church activities or use other services provided through the platform.

Information may include:

• Name
• Email address
• Telephone number
• Profile information
• Church/de­partment/usherika participation
• User-generated content
• Communication records
• Technical and security information necessary to operate the platform

Personal information will be processed for legitimate purposes including account administration, church communication, community participation, security, moderation and provision of requested services.

Users should not submit another person's personal information without appropriate authority or consent.

The church will take reasonable technical and organisational measures to protect personal information against unauthorised access, misuse, loss or disclosure.

Where applicable under Kenyan law, users may request access to, correction of, or deletion of their personal information and may raise concerns through the church's designated data-protection contact or the appropriate regulatory authority.

[EDIT THIS SECTION with your church's specific privacy practices and responsible data-protection contact.]`,

    copyrightIP: `COPYRIGHT AND INTELLECTUAL PROPERTY

Unless otherwise stated, original church branding, logos, names, text, graphics, photographs, videos, documents, publications and other materials made available through GraceConnect are protected by applicable intellectual-property laws.

Users must not reproduce, sell, redistribute, modify, publish or commercially exploit protected material without appropriate permission.

Users who upload photographs, videos, documents or other content must have the necessary rights or permission to submit that content.

By submitting content, the user confirms that the submission does not knowingly infringe another person's copyright, trademark, privacy, publicity or other legal rights.

Where third-party material is used, ownership remains with the applicable rights holder.`,

    prohibitedContent: `PROHIBITED OR UNLAWFUL ONLINE CONTENT

GraceConnect is intended to provide a safe, respectful and constructive Christian community.

The following content and activities are prohibited:

• Unlawful content or activity.
• Threats or incitement to violence.
• Harassment, bullying or intimidation.
• Hate or discriminatory abuse.
• Impersonation or identity fraud.
• Fraud, scams or deceptive activity.
• Spam and malicious advertising.
• Malware, malicious code or attempts to compromise the platform.
• Unauthorised disclosure of another person's private information.
• Sexually exploitative or illegal material.
• Content that infringes intellectual-property rights.
• Deliberate misinformation intended to cause harm.
• Attempts to evade moderation or account restrictions.
• Any other activity prohibited by applicable law or church policy.

The church reserves the right to remove prohibited content immediately.

Serious violations may result in suspension or permanent banning of the user's account.

Where appropriate or legally required, serious unlawful activity may be reported to the relevant authorities.

A permanently banned user's email address may be placed on the system blocklist so that the user cannot simply create another account using the same email address.`,

    termsAndConditions: `GRACECONNECT TERMS AND CONDITIONS

1. ACCEPTANCE

By registering for or using GraceConnect, you confirm that you have read, understood and accepted these Terms & Conditions and the church's applicable policies.

2. ELIGIBILITY

You must provide accurate information when creating an account and must not impersonate another person.

3. ACCOUNT SECURITY

You are responsible for protecting your account credentials and for activity conducted through your account.

4. ACCEPTABLE USE

GraceConnect must be used lawfully and respectfully. Users must not abuse other members, distribute prohibited content, attempt unauthorised access, interfere with the platform or misuse another person's information.

5. CONTENT

Users remain responsible for content they submit. The church may remove content that violates these Terms, church policy or applicable law.

6. MODERATION

The church may investigate reported violations and may warn, restrict, suspend or permanently ban accounts where appropriate.

7. ACCOUNT DELETION AND BLOCKLIST

Where an account is permanently removed for serious or repeated violations, the associated email address may be placed on a blocklist.

A blocklisted email address cannot be used to create or access another GraceConnect account while the block remains active.

A block may be removed by an authorised church administrator where appropriate.

8. PRIVACY

Personal information is processed according to the church's Data Protection and Privacy provisions contained in this document.

9. INTELLECTUAL PROPERTY

Users must respect copyright, trademarks and other intellectual-property rights.

10. CHANGES

The church may update these Terms & Conditions when necessary. Users may be required to accept updated terms before continuing to use certain services.

11. TERMINATION

The church may suspend or terminate access where a user violates these Terms, applicable law or legitimate security requirements.

12. CONTACT

Questions regarding these Terms should be directed to the church through the official contact information provided in this document.

[EDIT THIS DOCUMENT to reflect your church's official legal requirements and policies before publishing.]`
  };


  /* ============================================================
     SUPABASE HELPER
     ============================================================ */

  function getSupabase() {
    return (
      window.supabaseClient ||
      window.supabase ||
      window.sb ||
      null
    );
  }


  function getCurrentUser() {
    return (
      window.currentUser ||
      window.user ||
      null
    );
  }


  function isAdmin() {
    const user = getCurrentUser();

    if (!user) return false;

    if (typeof window.isAdmin === "function") {
      try {
        return !!window.isAdmin();
      } catch (_) {}
    }

    const role = String(
      user.role ||
      user.user_role ||
      user.user_type ||
      ""
    ).toLowerCase();

    return [
      "admin",
      "administrator",
      "superadmin",
      "super_admin",
      "pastor",
      "hod"
    ].includes(role);
  }


  /* ============================================================
     STORAGE
     ============================================================ */

  function loadLocalDocument() {
    try {
      const saved = localStorage.getItem(APP32.legalKey);

      if (saved) {
        return {
          ...DEFAULT_DOCUMENT,
          ...JSON.parse(saved)
        };
      }
    } catch (_) {}

    return { ...DEFAULT_DOCUMENT };
  }


  function saveLocalDocument(document) {
    try {
      localStorage.setItem(
        APP32.legalKey,
        JSON.stringify(document)
      );
    } catch (_) {}
  }


  let legalDocument = loadLocalDocument();


  /* ============================================================
     SUPABASE LOAD
     ============================================================ */

  async function loadLegalDocument() {
    const supabase = getSupabase();

    if (!supabase) {
      return legalDocument;
    }

    try {
      const result = await supabase
        .from("church_settings")
        .select("legal_document")
        .eq("id", 1)
        .maybeSingle();

      if (!result.error && result.data?.legal_document) {
        let remote = result.data.legal_document;

        if (typeof remote === "string") {
          try {
            remote = JSON.parse(remote);
          } catch (_) {
            remote = {};
          }
        }

        legalDocument = {
          ...DEFAULT_DOCUMENT,
          ...remote
        };

        saveLocalDocument(legalDocument);
      }
    } catch (error) {
      console.warn(
        "GraceConnect app32: Could not load legal document.",
        error
      );
    }

    return legalDocument;
  }


  /* ============================================================
     SAVE DOCUMENT
     ============================================================ */

  async function saveLegalDocument(document) {
    legalDocument = {
      ...DEFAULT_DOCUMENT,
      ...document
    };

    saveLocalDocument(legalDocument);

    const supabase = getSupabase();

    if (!supabase) {
      return {
        success: true,
        localOnly: true
      };
    }

    try {
      const result = await supabase
        .from("church_settings")
        .upsert(
          {
            id: 1,
            legal_document: legalDocument,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "id"
          }
        );

      if (result.error) {
        throw result.error;
      }

      return {
        success: true,
        localOnly: false
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error: error.message
      };
    }
  }


  /* ============================================================
     STYLES
     ============================================================ */

  function injectStyles() {
    if (document.getElementById("gc32-styles")) return;

    const style = document.createElement("style");

    style.id = "gc32-styles";

    style.textContent = `
      .gc32-section {
        margin-top: 18px;
        padding: 18px;
        border-radius: 18px;
        border: 1px solid var(--border, #e5e7eb);
        background: var(--card-bg, #fff);
        box-shadow: 0 5px 18px rgba(0,0,0,.06);
      }

      .gc32-header {
        display:flex;
        align-items:center;
        gap:12px;
        margin-bottom:15px;
      }

      .gc32-icon {
        width:44px;
        height:44px;
        border-radius:13px;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#fff;
        background:linear-gradient(135deg,#6d28d9,#4f46e5);
        flex-shrink:0;
      }

      .gc32-title {
        font-size:1rem;
        font-weight:800;
      }

      .gc32-subtitle {
        font-size:.74rem;
        opacity:.7;
        margin-top:3px;
      }

      .gc32-grid {
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
        gap:12px;
      }

      .gc32-card {
        border:1px solid var(--border,#e5e7eb);
        border-radius:15px;
        padding:15px;
        cursor:pointer;
        transition:.2s ease;
        background:var(--card-bg,#fff);
      }

      .gc32-card:hover {
        transform:translateY(-2px);
        box-shadow:0 8px 22px rgba(0,0,0,.08);
      }

      .gc32-card-icon {
        width:38px;
        height:38px;
        border-radius:11px;
        display:flex;
        align-items:center;
        justify-content:center;
        margin-bottom:10px;
        background:rgba(79,70,229,.1);
        color:#4f46e5;
      }

      .gc32-card-title {
        font-weight:800;
        font-size:.85rem;
        margin-bottom:5px;
      }

      .gc32-card-description {
        font-size:.72rem;
        opacity:.7;
        line-height:1.45;
      }

      .gc32-editor {
        width:100%;
        min-height:180px;
        resize:vertical;
        border:1px solid var(--border,#d1d5db);
        border-radius:12px;
        padding:12px;
        font-family:inherit;
        line-height:1.55;
        background:var(--input-bg,#fff);
      }

      .gc32-label {
        display:block;
        font-weight:800;
        font-size:.8rem;
        margin:14px 0 7px;
      }

      .gc32-document {
        line-height:1.75;
        font-size:.86rem;
        white-space:pre-wrap;
      }

      .gc32-danger {
        padding:13px;
        border-radius:12px;
        background:#fff1f2;
        border:1px solid #fecdd3;
        color:#9f1239;
        font-size:.78rem;
        line-height:1.55;
        margin-bottom:12px;
      }

      .gc32-warning {
        padding:12px;
        border-radius:12px;
        background:#fffbeb;
        border:1px solid #fde68a;
        font-size:.78rem;
        line-height:1.5;
      }

      .gc32-user {
        display:flex;
        align-items:center;
        gap:10px;
        padding:11px;
        border:1px solid var(--border,#e5e7eb);
        border-radius:13px;
        margin-bottom:8px;
      }

      .gc32-user-info {
        flex:1;
        min-width:0;
      }

      .gc32-user-name {
        font-weight:800;
        font-size:.82rem;
      }

      .gc32-user-email {
        font-size:.7rem;
        opacity:.7;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .gc32-modal-overlay {
        position:fixed;
        inset:0;
        z-index:99999;
        background:rgba(0,0,0,.62);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
      }

      .gc32-modal {
        width:min(900px,100%);
        max-height:92vh;
        overflow:auto;
        background:var(--card-bg,#fff);
        border-radius:20px;
        padding:20px;
        box-shadow:0 25px 70px rgba(0,0,0,.3);
      }

      .gc32-modal-title {
        font-size:1.05rem;
        font-weight:900;
        margin-bottom:14px;
      }

      .gc32-close {
        float:right;
        border:0;
        background:transparent;
        font-size:1.2rem;
        cursor:pointer;
      }

      .gc32-check {
        display:flex;
        gap:10px;
        align-items:flex-start;
        padding:13px;
        border:1px solid var(--border,#e5e7eb);
        border-radius:13px;
        margin-top:12px;
        font-size:.78rem;
        line-height:1.55;
      }

      .gc32-check input {
        width:19px;
        height:19px;
        margin-top:1px;
        flex-shrink:0;
      }

      .gc32-empty {
        padding:18px;
        text-align:center;
        opacity:.65;
        font-size:.8rem;
      }
    `;

    document.head.appendChild(style);
  }


  /* ============================================================
     MODAL
     ============================================================ */

  function closeModal() {
    const modal = document.querySelector(".gc32-modal-overlay");

    if (modal) {
      modal.remove();
    }
  }


  window.gc32CloseModal = closeModal;


  function createModal(title, content) {
    closeModal();

    const overlay = document.createElement("div");

    overlay.className = "gc32-modal-overlay";

    overlay.innerHTML = `
      <div class="gc32-modal">
        <button class="gc32-close" onclick="gc32CloseModal()">×</button>
        <div class="gc32-modal-title">${title}</div>
        ${content}
      </div>
    `;

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeModal();
      }
    });

    document.body.appendChild(overlay);

    return overlay;
  }


  /* ============================================================
     DOCUMENT SECTIONS
     ============================================================ */

  const SECTIONS = [
    {
      key: "churchHistory",
      title: "Church History",
      icon: "fa-landmark",
      description: "Official history, background and milestones."
    },
    {
      key: "vision",
      title: "Vision",
      icon: "fa-eye",
      description: "The church's long-term vision."
    },
    {
      key: "mission",
      title: "Mission",
      icon: "fa-bullseye",
      description: "The purpose and ministry mission."
    },
    {
      key: "statementOfFaith",
      title: "Statement of Faith",
      icon: "fa-cross",
      description: "The church's official Christian beliefs."
    },
    {
      key: "contactInfo",
      title: "Contact Information",
      icon: "fa-address-card",
      description: "Official church contact information."
    },
    {
      key: "dataProtection",
      title: "Data Protection",
      icon: "fa-user-shield",
      description: "Personal information and privacy."
    },
    {
      key: "copyrightIP",
      title: "Copyright & IP",
      icon: "fa-copyright",
      description: "Copyright and intellectual-property rules."
    },
    {
      key: "prohibitedContent",
      title: "Prohibited Content",
      icon: "fa-ban",
      description: "Unlawful content and moderation policy."
    },
    {
      key: "termsAndConditions",
      title: "Terms & Conditions",
      icon: "fa-file-contract",
      description: "Rules users accept before registration."
    }
  ];


  /* ============================================================
     PUBLIC DOCUMENT
     ============================================================ */

  window.gc32ViewDocument = async function () {

    injectStyles();

    await loadLegalDocument();

    let html = `
      <div class="gc32-document">
    `;

    SECTIONS.forEach(function (section) {

      html += `
        <div class="gc32-section">
          <div class="gc32-header">
            <div class="gc32-icon">
              <i class="fas ${section.icon}"></i>
            </div>

            <div>
              <div class="gc32-title">
                ${escapeHTML(section.title)}
              </div>
            </div>
          </div>

          <div class="gc32-document">
            ${escapeHTML(legalDocument[section.key] || "")}
          </div>
        </div>
      `;
    });

    html += `
      </div>

      <button
        class="btn btn-secondary-alt btn-block"
        style="margin-top:15px"
        onclick="gc32CloseModal()">
        Close
      </button>
    `;

    createModal(
      "Church Information, Policies & Terms",
      html
    );
  };


  /* ============================================================
     ADMIN DOCUMENT EDITOR
     ============================================================ */

  window.gc32OpenEditor = async function () {

    if (!isAdmin()) {
      alert("Administrator access required.");
      return;
    }

    injectStyles();

    await loadLegalDocument();

    let html = `
      <div class="gc32-warning">
        <strong>Administrator editor</strong><br>
        This document is displayed to users and is used for registration
        Terms & Conditions. Replace all bracketed placeholders before
        publishing the final church policy.
      </div>
    `;

    SECTIONS.forEach(function (section) {

      html += `
        <label class="gc32-label">
          <i class="fas ${section.icon}"></i>
          ${escapeHTML(section.title)}
        </label>

        <textarea
          class="gc32-editor"
          id="gc32-edit-${section.key}">${escapeHTML(
            legalDocument[section.key] || ""
          )}</textarea>
      `;
    });

    html += `
      <button
        class="btn btn-primary btn-block"
        style="margin-top:15px"
        onclick="gc32SaveEditor()">
        <i class="fas fa-save"></i>
        Save Church Document
      </button>

      <button
        class="btn btn-secondary-alt btn-block"
        style="margin-top:8px"
        onclick="gc32ViewDocument()">
        <i class="fas fa-eye"></i>
        Preview
      </button>
    `;

    createModal(
      "Church Branding & Governance Document",
      html
    );
  };


  window.gc32SaveEditor = async function () {

    if (!isAdmin()) {
      alert("Administrator access required.");
      return;
    }

    const updated = {};

    SECTIONS.forEach(function (section) {

      const input = document.getElementById(
        "gc32-edit-" + section.key
      );

      updated[section.key] =
        input ? input.value.trim() : legalDocument[section.key];
    });

    const result = await saveLegalDocument(updated);

    if (!result.success) {

      alert(
        "Document could not be saved to Supabase.\n\n" +
        result.error
      );

      return;
    }

    alert(
      result.localOnly
        ? "Document saved locally. Configure the Supabase church_settings table to sync it."
        : "Church document saved successfully."
    );

    closeModal();
  };


  /* ============================================================
     ADMIN DISCOVER SECTION
     ============================================================ */

  function addAdminDiscoverSection() {

    if (!isAdmin()) return;

    const possibleContainers = [
      document.getElementById("adminDiscoverPanel"),
      document.getElementById("discoverAdminPanel"),
      document.getElementById("admin-panel"),
      document.querySelector(".admin-discover-panel")
    ];

    const container = possibleContainers.find(Boolean);

    if (!container) return;

    if (document.getElementById("gc32-admin-section")) return;

    const section = document.createElement("div");

    section.id = "gc32-admin-section";

    section.className = "gc32-section";

    section.innerHTML = `
      <div class="gc32-header">

        <div class="gc32-icon">
          <i class="fas fa-building-columns"></i>
        </div>

        <div>
          <div class="gc32-title">
            Church Branding & Governance
          </div>

          <div class="gc32-subtitle">
            Manage church information, policies, terms and user moderation.
          </div>
        </div>

      </div>

      <div class="gc32-grid">

        <div class="gc32-card"
             onclick="gc32OpenEditor()">

          <div class="gc32-card-icon">
            <i class="fas fa-file-pen"></i>
          </div>

          <div class="gc32-card-title">
            Edit Church Document
          </div>

          <div class="gc32-card-description">
            Edit and save Church History, Vision, Mission, Faith,
            Contact Information, Data Protection, Copyright,
            Prohibited Content and Terms.
          </div>

        </div>

        <div class="gc32-card"
             onclick="gc32ViewDocument()">

          <div class="gc32-card-icon">
            <i class="fas fa-book-open"></i>
          </div>

          <div class="gc32-card-title">
            Preview Public Document
          </div>

          <div class="gc32-card-description">
            See exactly what members and visitors will read.
          </div>

        </div>

        <div class="gc32-card"
             onclick="gc32OpenUserModeration()">

          <div class="gc32-card-icon">
            <i class="fas fa-user-shield"></i>
          </div>

          <div class="gc32-card-title">
            User Moderation
          </div>

          <div class="gc32-card-description">
            Search users, permanently remove accounts and block
            associated email addresses.
          </div>

        </div>

      </div>
    `;

    container.appendChild(section);
  }


  /* ============================================================
     BLOCKLIST
     ============================================================ */

  async function isEmailBlocked(email) {

    email = String(email || "")
      .trim()
      .toLowerCase();

    if (!email) return false;

    const supabase = getSupabase();

    if (!supabase) {

      try {
        const list =
          JSON.parse(
            localStorage.getItem("gc32_blocked_emails") || "[]"
          );

        return list.some(
          item =>
            String(item.email).toLowerCase() === email &&
            item.active !== false
        );

      } catch (_) {
        return false;
      }
    }

    try {

      const result = await supabase
        .from("blocked_emails")
        .select("email,active")
        .eq("email", email)
        .eq("active", true)
        .maybeSingle();

      return !!(
        result.data &&
        !result.error
      );

    } catch (_) {

      return false;
    }
  }


  window.gc32IsEmailBlocked = isEmailBlocked;


  /* ============================================================
     BLOCK EMAIL
     ============================================================ */

  async function blockEmail(
    email,
    reason
  ) {

    email = String(email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      throw new Error("Email address is required.");
    }

    const supabase = getSupabase();

    if (!supabase) {

      let list = [];

      try {
        list =
          JSON.parse(
            localStorage.getItem(
              "gc32_blocked_emails"
            ) || "[]"
          );
      } catch (_) {}

      const existing = list.find(
        x =>
          String(x.email).toLowerCase() === email
      );

      if (existing) {
        existing.active = true;
        existing.reason = reason;
      } else {
        list.push({
          email,
          active: true,
          reason,
          created_at: new Date().toISOString()
        });
      }

      localStorage.setItem(
        "gc32_blocked_emails",
        JSON.stringify(list)
      );

      return true;
    }

    const user = getCurrentUser();

    const result = await supabase
      .from("blocked_emails")
      .upsert(
        {
          email,
          active: true,
          reason: reason || "Church policy violation",
          blocked_by: user?.id || null,
          blocked_at: new Date().toISOString()
        },
        {
          onConflict: "email"
        }
      );

    if (result.error) {
      throw result.error;
    }

    return true;
  }


  /* ============================================================
     DELETE USER
     ============================================================ */

  async function permanentlyDeleteUser(userId) {

    const supabase = getSupabase();

    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    /*
      IMPORTANT:

      The browser must NOT contain a Supabase service-role key.

      The preferred secure implementation is a Postgres RPC called:

          admin_delete_user

      which verifies that the caller is an administrator and then
      deletes the corresponding Supabase Auth identity securely.
    */

    const result = await supabase.rpc(
      "admin_delete_user",
      {
        target_user_id: userId
      }
    );

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }


  /* ============================================================
     USER MODERATION
     ============================================================ */

  async function getUsers() {

    const supabase = getSupabase();

    if (!supabase) return [];

    let result = await supabase
      .from("profiles")
      .select("*")
      .order("name", {
        ascending: true
      });

    if (result.error) {

      result = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", {
          ascending: false
        });
    }

    if (result.error) {
      throw result.error;
    }

    return result.data || [];
  }


  function getUserEmail(user) {

    return (
      user.email ||
      user.user_email ||
      user.email_address ||
      ""
    );
  }


  function getUserName(user) {

    return (
      user.name ||
      user.full_name ||
      [
        user.first_name,
        user.last_name
      ].filter(Boolean).join(" ") ||
      "Unnamed User"
    );
  }


  window.gc32OpenUserModeration = async function () {

    if (!isAdmin()) {
      alert("Administrator access required.");
      return;
    }

    injectStyles();

    let users;

    try {
      users = await getUsers();
    } catch (error) {

      alert(
        "Unable to load users.\n\n" +
        error.message
      );

      return;
    }

    window.gc32Users = users;

    createUserModerationModal(users);
  };


  function createUserModerationModal(users) {

    const content = `

      <div class="gc32-danger">

        <strong>Permanent moderation action</strong><br>

        Deleting a user removes the user's account through the
        secure Supabase administrator function and places the
        associated email address on the blocklist.

        A blocked email cannot register or log in again while
        the block remains active.

      </div>

      <input
        class="form-input"
        id="gc32-user-search"
        placeholder="Search users by name or email..."
        oninput="gc32FilterUsers()"
        style="margin-bottom:12px;"
      >

      <div id="gc32-user-results">
        ${renderUserList(users)}
      </div>
    `;

    createModal(
      "User Moderation",
      content
    );
  }


  function renderUserList(users) {

    if (!users.length) {

      return `
        <div class="gc32-empty">
          No users found.
        </div>
      `;
    }

    return users.map(function (user) {

      const name = getUserName(user);

      const email = getUserEmail(user);

      const role =
        user.role ||
        user.user_type ||
        "member";

      return `
        <div class="gc32-user">

          <div class="gc32-user-info">

            <div class="gc32-user-name">
              ${escapeHTML(name)}
            </div>

            <div class="gc32-user-email">
              ${escapeHTML(email || "Email unavailable")}
              · ${escapeHTML(role)}
            </div>

          </div>

          <button
            class="btn btn-danger btn-sm"
            onclick="gc32DeleteUser(
              '${escapeJS(user.id)}',
              '${escapeJS(email)}'
            )">

            <i class="fas fa-user-slash"></i>

          </button>

        </div>
      `;

    }).join("");
  }


  window.gc32FilterUsers = function () {

    const input =
      document.getElementById(
        "gc32-user-search"
      );

    const query =
      String(input?.value || "")
        .trim()
        .toLowerCase();

    const filtered =
      (window.gc32Users || [])
        .filter(function (user) {

          const name =
            getUserName(user)
              .toLowerCase();

          const email =
            getUserEmail(user)
              .toLowerCase();

          return (
            name.includes(query) ||
            email.includes(query)
          );
        });

    const results =
      document.getElementById(
        "gc32-user-results"
      );

    if (results) {
      results.innerHTML =
        renderUserList(filtered);
    }
  };


  window.gc32DeleteUser = async function (
    userId,
    email
  ) {

    if (!isAdmin()) {
      alert("Administrator access required.");
      return;
    }

    const current =
      getCurrentUser();

    if (
      current &&
      String(current.id) === String(userId)
    ) {
      alert(
        "For security, you cannot delete your own administrator account."
      );

      return;
    }

    email =
      String(email || "")
        .trim()
        .toLowerCase();

    if (!email) {

      alert(
        "This user's email address could not be identified."
      );

      return;
    }

    const confirmed =
      confirm(
        "PERMANENT USER REMOVAL\n\n" +
        "User: " + email + "\n\n" +
        "The account will be permanently removed and " +
        "the email will be added to the blocklist.\n\n" +
        "The user will NOT be able to register or log in " +
        "again while the block remains active.\n\n" +
        "Continue?"
      );

    if (!confirmed) return;

    const reason =
      prompt(
        "Enter the reason for the block:",
        "Violation of GraceConnect Terms & Conditions"
      );

    if (reason === null) return;

    try {

      /*
        BLOCK FIRST.

        This ensures the email is protected even if the
        Auth deletion operation encounters an error.
      */

      await blockEmail(
        email,
        reason || "Church policy violation"
      );

      /*
        DELETE THE AUTH USER + PROFILE.

        This requires the secure Supabase RPC.
      */

      await permanentlyDeleteUser(userId);

      alert(
        "User permanently deleted.\n\n" +
        "Email added to blocklist:\n" +
        email
      );

      await gc32OpenUserModeration();

    } catch (error) {

      alert(
        "The moderation operation could not be completed.\n\n" +
        error.message +
        "\n\nThe email may already have been placed on the blocklist."
      );
    }
  };


  /* ============================================================
     REGISTRATION TERMS CHECKBOX
     ============================================================ */

  function findRegistrationContainer() {

    return (
      document.getElementById("onboardingOverlay") ||
      document.getElementById("registerModal") ||
      document.querySelector(
        '[id*="onboard"], [id*="register"]'
      )
    );
  }


  function injectTermsCheckbox() {

    const container =
      findRegistrationContainer();

    if (!container) return;

    if (
      document.getElementById(
        "gc32-registration-terms"
      )
    ) {
      return;
    }

    const emailInput =
      document.getElementById("ob-email");

    if (!emailInput) return;

    const wrapper =
      emailInput.closest(
        ".form-group"
      ) || emailInput.parentElement;

    if (!wrapper) return;

    const terms =
      document.createElement("div");

    terms.id =
      "gc32-registration-terms";

    terms.className =
      "gc32-check";

    terms.innerHTML = `

      <input
        type="checkbox"
        id="gc32-accept-terms"
      >

      <label
        for="gc32-accept-terms">

        I have read and agree to the
        <a
          href="#"
          onclick="
            event.preventDefault();
            gc32ViewDocument();
          ">
          GraceConnect Terms & Conditions
        </a>,
        including the Data Protection,
        Copyright & Intellectual Property,
        and Prohibited Content policies.

      </label>
    `;

    wrapper.insertAdjacentElement(
      "afterend",
      terms
    );
  }


  window.gc32ValidateRegistration = async function () {

    injectTermsCheckbox();

    const checkbox =
      document.getElementById(
        "gc32-accept-terms"
      );

    if (
      !checkbox ||
      !checkbox.checked
    ) {

      alert(
        "You must read and accept the Terms & Conditions before creating a GraceConnect account."
      );

      return false;
    }

    const emailInput =
      document.getElementById("ob-email");

    const email =
      String(
        emailInput?.value || ""
      )
        .trim()
        .toLowerCase();

    if (!email) {

      alert(
        "Please enter your email address."
      );

      return false;
    }

    if (
      await isEmailBlocked(email)
    ) {

      alert(
        "Registration denied.\n\n" +
        "This email address has been blocked from GraceConnect by the church administrator."
      );

      return false;
    }

    try {

      localStorage.setItem(
        "gc32_terms_accepted",
        "true"
      );

      localStorage.setItem(
        "gc32_terms_accepted_at",
        new Date().toISOString()
      );

    } catch (_) {}

    return true;
  };


  /* ============================================================
     LOGIN BLOCKLIST CHECK
     ============================================================ */

  window.gc32ValidateLogin = async function (
    email
  ) {

    if (
      await isEmailBlocked(email)
    ) {

      alert(
        "Access denied.\n\n" +
        "This email address has been blocked from GraceConnect by the church administrator."
      );

      return false;
    }

    return true;
  };


  /* ============================================================
     FUNCTION WRAPPERS
     ============================================================ */

  function wrapRegistrationFunction() {

    const functionNames = [
      "completeOnboarding",
      "register",
      "handleRegister",
      "doRegister",
      "signUp"
    ];

    functionNames.forEach(function (name) {

      const original =
        window[name];

      if (
        typeof original !== "function" ||
        original.__gc32Wrapped
      ) {
        return;
      }

      const wrapped =
        async function () {

          const allowed =
            await window.gc32ValidateRegistration();

          if (!allowed) {
            return;
          }

          return original.apply(
            this,
            arguments
          );
        };

      wrapped.__gc32Wrapped = true;

      window[name] = wrapped;
    });
  }


  function wrapLoginFunction() {

    const functionNames = [
      "doLogin",
      "login",
      "handleLogin",
      "signIn"
    ];

    functionNames.forEach(function (name) {

      const original =
        window[name];

      if (
        typeof original !== "function" ||
        original.__gc32Wrapped
      ) {
        return;
      }

      const wrapped =
        async function () {

          const emailInput =
            document.getElementById(
              "login-email"
            );

          const email =
            emailInput?.value || "";

          const allowed =
            await window.gc32ValidateLogin(
              email
            );

          if (!allowed) {
            return;
          }

          return original.apply(
            this,
            arguments
          );
        };

      wrapped.__gc32Wrapped = true;

      window[name] = wrapped;
    });
  }


  /* ============================================================
     UTILITY
     ============================================================ */

  function escapeHTML(value) {

    return String(
      value == null ? "" : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function escapeJS(value) {

    return String(
      value == null ? "" : value
    )
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  }


  /* ============================================================
     INITIALIZATION
     ============================================================ */

  async function initialize() {

    injectStyles();

    await loadLegalDocument();

    injectTermsCheckbox();

    wrapRegistrationFunction();

    wrapLoginFunction();

    addAdminDiscoverSection();
  }


  /*
    Some of the original GraceConnect functions are created
    after the initial page load, therefore retry initialization
    without replacing existing application functionality.
  */

  initialize();

  const observer =
    new MutationObserver(function () {

      injectTermsCheckbox();

      wrapRegistrationFunction();

      wrapLoginFunction();

      if (isAdmin()) {
        addAdminDiscoverSection();
      }

    });

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );


  setInterval(function () {

    injectTermsCheckbox();

    wrapRegistrationFunction();

    wrapLoginFunction();

    if (isAdmin()) {
      addAdminDiscoverSection();
    }

  }, 2000);


  /* ============================================================
     PUBLIC API
     ============================================================ */

  window.GraceConnectApp32 = {

    version: APP32.version,

    getDocument: function () {
      return {
        ...legalDocument
      };
    },

    loadDocument:
      loadLegalDocument,

    saveDocument:
      saveLegalDocument,

    isEmailBlocked:
      isEmailBlocked,

    blockEmail:
      blockEmail,

    viewDocument:
      window.gc32ViewDocument,

    openEditor:
      window.gc32OpenEditor,

    openUserModeration:
      window.gc32OpenUserModeration

  };


  console.log(
    "GraceConnect app32.js loaded — Church Branding, Terms & Moderation"
  );

})();
