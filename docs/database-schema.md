// ═══════════════════════════════════════════
// COLLECTIONS STRUCTURE
// ═══════════════════════════════════════════

// ─── USERS COLLECTION ───
// users/{userId}
{
  uid: "user123",
  name: "John Mwangi",           // Required
  email: "john@example.com",     // Optional
  phone: "+254712345678",        // Optional
  profilePic: "https://storage.../profile.jpg",  // Optional
  memberType: "member",          // "member" | "admin" | "superadmin"
  status: "active",              // "active" | "pending" | "suspended"
  ushirikaId: "ush_nairobi",     // Reference to ushirika
  departments: ["dept_worship", "dept_media"],  // Multi-dept array
  createdAt: Timestamp,
  lastLogin: Timestamp,
  streak: {
    current: 7,
    longest: 21,
    lastActivity: Timestamp
  },
  fcmToken: "device_token_here",
  settings: {
    notifications: true,
    dailyVerse: true,
    darkMode: false
  }
}

// ─── DEPARTMENTS COLLECTION ───
// departments/{deptId}
{
  id: "dept_worship",
  name: "Praise & Worship",
  description: "Music ministry leading worship",
  icon: "fa-music",
  colorTheme: "purple",
  isPrivate: true,
  bannerUrl: "https://storage.../banner.jpg",
  memberCount: 18,
  createdBy: "admin_uid",
  createdAt: Timestamp,
  
  // Subcollections:
  // departments/{deptId}/members/{userId}
  // departments/{deptId}/posts/{postId}
}

// ─── DEPARTMENT MEMBERS ───
// departments/{deptId}/members/{userId}
{
  userId: "user123",
  role: "member",                // "leader" | "chairman" | "secretary" | "treasurer" | "member"
  joinedAt: Timestamp,
  joinedBy: "admin_uid",
  status: "active"
}

// ─── DEPARTMENT POSTS ───
// departments/{deptId}/posts/{postId}
{
  postId: "post123",
  authorId: "user123",
  authorName: "John Mwangi",
  authorRole: "member",
  content: "Sunday setlist...",
  mediaUrls: ["https://storage.../file1.jpg"],
  mediaTypes: ["image"],
  likes: 22,
  likedBy: ["user1", "user2"],
  commentCount: 8,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// ─── USHIRIKAS COLLECTION ───
// ushirikas/{ushirikaId}
{
  id: "ush_nairobi",
  name: "Ushirika wa Nairobi",
  location: "Nairobi County",
  meetingDay: "Saturdays",
  meetingTime: "10:00 AM",
  venue: "Kenyatta Community Hall",
  gpsLocation: {
    lat: -1.2921,
    lng: 36.8219,
    pinned: true
  },
  memberCount: 45,
  mediaUrls: [],
  createdBy: "admin_uid",
  createdAt: Timestamp,
  
  // Subcollection: ushirikas/{id}/officials
}

// ─── USHIRIKA OFFICIALS ───
// ushirikas/{ushirikaId}/officials/{officialId}
{
  userId: "user456",
  name: "Pastor Peter",
  role: "Senior Pastor",
  phone: "+254712345678",
  email: "pastor@church.org",
  profilePic: "https://...",
  appointedAt: Timestamp,
  appointedBy: "admin_uid"
}

// ─── EVENTS COLLECTION ───
// events/{eventId}
{
  id: "event_youth_revival",
  title: "Youth Revival Week 2026",
  description: "A powerful week of worship...",
  startDate: Timestamp,
  endDate: Timestamp,
  status: "upcoming",            // "upcoming" | "ongoing" | "completed"
  location: "Main Sanctuary",
  gpsLocation: { lat: -1.2921, lng: 36.8219 },
  mediaUrls: ["https://storage.../poster.jpg"],
  createdBy: "admin_uid",
  rsvpCount: 34,
  commentCount: 15,
  createdAt: Timestamp
}

// ─── GIVING CAUSES COLLECTION ───
// givingCauses/{causeId}
{
  id: "cause_building",
  title: "Church Building Fund",
  description: "Help us complete the new worship hall",
  goalAmount: 1000000,
  raisedAmount: 750000,
  currency: "KES",
  status: "active",
  mediaUrls: [],
  paymentMethods: [
    {
      type: "mpesa_paybill",
      paybill: "123456",
      account: "BUILDING",
      treasurerPhone: "+254712345678"
    },
    {
      type: "bank",
      bankName: "KCB",
      accountNumber: "1234567890",
      accountName: "Grace Church"
    },
    {
      type: "cash",
      enabled: true
    }
  ],
  createdBy: "admin_uid",
  createdAt: Timestamp,
  contributions: []  // Subcollection
}

// ─── CONTRIBUTIONS ───
// givingCauses/{causeId}/contributions/{contribId}
{
  userId: "user123",
  amount: 1000,
  currency: "KES",
  method: "mpesa_paybill",
  transactionCode: "SHJ4K7LMN2",
  note: "For building fund",
  recordedBy: "user123",        // Or admin if cash
  createdAt: Timestamp
}

// ─── NOTIFICATIONS COLLECTION ───
// notifications/{notifId}
{
  userId: "user123",             // Target user
  type: "dept_post",             // Type of notification
  title: "Praise & Worship has new posts",
  body: "2 new posts in your department",
  data: {
    departmentId: "dept_worship",
    postId: "post123"
  },
  read: false,
  createdAt: Timestamp
}

// ─── PENDING REQUESTS COLLECTION ───
// pendingRequests/{requestId}
{
  requestId: "req123",
  type: "join_department",       // "join_department" | "leader_verification" | "join_ushirika"
  userId: "user123",
  userName: "John Mwangi",
  targetId: "dept_pastors",      // Department/ushirika ID
  targetName: "Pastors",
  message: "I feel called to serve...",
  status: "pending",             // "pending" | "approved" | "declined"
  createdAt: Timestamp,
  reviewedBy: null,
  reviewedAt: null
}

// ─── ADMIN INVITES COLLECTION ───
// adminInvites/{inviteId}
{
  inviteId: "inv_abc123",
  email: "newadmin@example.com",
  role: "pastor",
  invitedBy: "superadmin_uid",
  token: "unique_invite_token",
  status: "pending",             // "pending" | "accepted" | "expired"
  expiresAt: Timestamp,
  createdAt: Timestamp
}

// ─── PRAYER REQUESTS COLLECTION ───
// prayers/{prayerId}
{
  userId: "user123",
  type: "prayer_request",
  content: "Please pray for my mother's healing",
  isAnonymous: false,
  status: "active",
  prayedBy: ["user1", "user2"],
  createdAt: Timestamp
}

// ─── BIBLE QUESTIONS COLLECTION ───
// questions/{questionId}
{
  userId: "user123",
  category: "bible_help",
  question: "What does born again mean?",
  mediaUrls: [],
  status: "pending",             // "pending" | "answered"
  answers: [],                   // Subcollection
  createdAt: Timestamp
}

// questions/{questionId}/answers/{answerId}
{
  adminId: "admin_uid",
  adminName: "Pastor Peter",
  adminRole: "Senior Pastor",
  answer: "Being born again refers to...",
  mediaUrls: [],
  createdAt: Timestamp
}

// ─── EMOTIONAL SUPPORT VERSES ───
// verses/{verseId}
{
  category: "grief",
  text: "Blessed are those who mourn...",
  reference: "Matthew 5:4",
  encouragement: "God sees your tears...",
  translation: "NIV"
}

// ─── USER STREAKS (for admin viewing) ───
// streaks/{userId}
{
  userId: "user123",
  userName: "John Mwangi",
  currentStreak: 7,
  longestStreak: 21,
  lastActivity: Timestamp,
  departmentIds: ["dept_worship", "dept_media"],
  ushirikaId: "ush_nairobi"
}