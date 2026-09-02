// services/brevo.js
const nodemailer = require('nodemailer');

// Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: 'your-brevo-email@example.com',
    pass: 'your-brevo-smtp-key'
  }
});

/**
 * Send admin invite email
 */
exports.sendAdminInvite = functions.https.onCall(async (data, context) => {
  const { email, role, invitedBy } = data;

  // Verify super admin
  const adminDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  if (adminDoc.data().memberType !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Only super admin can invite admins');
  }

  // Generate unique invite token
  const inviteToken = crypto.randomBytes(32).toString('hex');
  
  // Save invite to Firestore
  await admin.firestore().collection('adminInvites').add({
    email,
    role,
    invitedBy: context.auth.uid,
    token: inviteToken,
    status: 'pending',
    expiresAt: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    ),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Generate invite link
  const inviteLink = `https://graceconnect.app/invite/admin/${inviteToken}`;

  // Send email via Brevo
  await transporter.sendMail({
    from: '"GraceConnect" <noreply@graceconnect.app>',
    to: email,
    subject: 'You\'ve been invited as an Admin - GraceConnect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #A855F7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">✝️ GraceConnect</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>Welcome to the Admin Team!</h2>
          <p>You've been invited by <strong>${invitedBy}</strong> to join GraceConnect as a <strong>${role}</strong>.</p>
          <p>Click the button below to accept your invitation:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
          </div>
          <p style="font-size: 14px; color: #666;">This invitation expires in 7 days.</p>
          <p style="font-size: 14px; color: #666;">If you didn't expect this invitation, please ignore this email.</p>
        </div>
      </div>
    `
  });

  return { success: true, inviteLink };
});

/**
 * Send member signup invite
 */
exports.sendMemberInvite = functions.https.onCall(async (data, context) => {
  const { email, phone, invitedBy } = data;

  const inviteToken = crypto.randomBytes(32).toString('hex');
  
  await admin.firestore().collection('memberInvites').add({
    email: email || null,
    phone: phone || null,
    invitedBy: context.auth.uid,
    token: inviteToken,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const inviteLink = `https://graceconnect.app/join/${inviteToken}`;

  if (email) {
    await transporter.sendMail({
      from: '"GraceConnect" <noreply@graceconnect.app>',
      to: email,
      subject: 'Join GraceConnect Church App',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Join GraceConnect! 🙏</h2>
          <p>You've been invited to join our church community app.</p>
          <a href="${inviteLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join Now</a>
        </div>
      `
    });
  }

  return { success: true, inviteLink };
});