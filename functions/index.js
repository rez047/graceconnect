// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// ═══════════════════════════════════════
// M-PESA CONFIGURATION (from File #1)
// ═══════════════════════════════════════
const MPESA_CONFIG = {
  consumerKey: functions.config().mpesa.consumer_key,
  consumerSecret: functions.config().mpesa.consumer_secret,
  shortCode: '174379',
  passKey: functions.config().mpesa.pass_key,
  callbackUrl: 'https://yourdomain.com/api/mpesa/callback'
};

async function getAccessToken() {
  const auth = Buffer.from(
    `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`
  ).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { 'Authorization': `Basic ${auth}` } }
  );
  return response.data.access_token;
}

// STK Push (Lipa na M-Pesa)
exports.mpesaStkPush = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  const { phoneNumber, amount, causeId, accountReference } = data;
  try {
    const accessToken = await getAccessToken();
    const formattedPhone = phoneNumber.startsWith('0') 
      ? `254${phoneNumber.slice(1)}` : phoneNumber;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passKey}${timestamp}`
    ).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: MPESA_CONFIG.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: MPESA_CONFIG.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: MPESA_CONFIG.callbackUrl,
        AccountReference: accountReference || 'GraceConnect',
        TransactionDesc: `Giving - ${causeId}`
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// M-Pesa Callback
exports.mpesaCallback = functions.https.onRequest(async (req, res) => {
  const { Body } = req.body;
  const { stkCallback } = Body;
  const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

  const transactionRef = db.collection('mpesaTransactions')
    .where('checkoutRequestID', '==', CheckoutRequestID);
  const snapshot = await transactionRef.get();

  if (!snapshot.empty) {
    const transaction = snapshot.docs[0];
    await transaction.ref.update({
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      status: ResultCode === 0 ? 'completed' : 'failed',
      completedAt: new Date()
    });

    if (ResultCode === 0) {
      const mpesaReceipt = stkCallback.CallbackMetadata.Item.find(
        item => item.Name === 'MpesaReceiptNumber'
      )?.Value;
      await db.collection('givingCauses')
        .doc(transaction.data().causeId)
        .collection('contributions')
        .add({
          userId: transaction.data().userId,
          amount: transaction.data().amount,
          method: 'mpesa_stk',
          transactionCode: mpesaReceipt,
          createdAt: new Date()
        });
    }
  }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// C2B Validation
exports.mpesaC2BValidation = functions.https.onRequest(async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// C2B Confirmation
exports.mpesaC2BConfirmation = functions.https.onRequest(async (req, res) => {
  const { TransID, TransAmount, MSISDN, BillRefNumber } = req.body;
  await db.collection('mpesaTransactions').add({
    transId: TransID,
    amount: TransAmount,
    phoneNumber: MSISDN,
    accountRef: BillRefNumber,
    status: 'completed',
    createdAt: new Date()
  });
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ═══════════════════════════════════════
// ADMIN OVERRIDE FUNCTIONS (from File #2)
// ═══════════════════════════════════════

async function verifyAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  if (!userData || !['admin', 'superadmin'].includes(userData.memberType)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  return userData;
}

// Add Department
exports.addDepartment = functions.https.onCall(async (data, context) => {
  const adminUser = await verifyAdmin(context);
  const { name, description, icon, colorTheme, isPrivate } = data;
  if (!name) throw new functions.https.HttpsError('invalid-argument', 'Name required');

  const deptRef = await db.collection('departments').add({
    name, description, icon, colorTheme, isPrivate,
    memberCount: 0,
    createdBy: context.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await db.collection('adminLogs').add({
    action: 'create_department',
    adminId: context.auth.uid,
    adminName: adminUser.name,
    targetId: deptRef.id,
    targetName: name,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, departmentId: deptRef.id };
});

// Add Ushirika
exports.addUshirika = functions.https.onCall(async (data, context) => {
  const adminUser = await verifyAdmin(context);
  const { name, location, meetingDay, meetingTime, venue, gpsLocation } = data;
  if (!name) throw new functions.https.HttpsError('invalid-argument', 'Name required');

  const ushirikaRef = await db.collection('ushirikas').add({
    name, location, meetingDay, meetingTime, venue, gpsLocation,
    memberCount: 0,
    createdBy: context.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await db.collection('adminLogs').add({
    action: 'create_ushirika',
    adminId: context.auth.uid,
    targetId: ushirikaRef.id,
    targetName: name,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, ushirikaId: ushirikaRef.id };
});

// Add Department Member
exports.addDeptMember = functions.https.onCall(async (data, context) => {
  const adminUser = await verifyAdmin(context);
  const { departmentId, userId, role } = data;

  await db.collection('departments').doc(departmentId)
    .collection('members').doc(userId).set({
      userId, role: role || 'member',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      joinedBy: context.auth.uid, status: 'active'
    });

  await db.collection('users').doc(userId).update({
    departments: admin.firestore.FieldValue.arrayUnion(departmentId)
  });

  await db.collection('departments').doc(departmentId).update({
    memberCount: admin.firestore.FieldValue.increment(1)
  });

  return { success: true };
});

// Remove Department Member
exports.removeDeptMember = functions.https.onCall(async (data, context) => {
  const adminUser = await verifyAdmin(context);
  const { departmentId, userId } = data;

  await db.collection('departments').doc(departmentId)
    .collection('members').doc(userId).delete();

  await db.collection('users').doc(userId).update({
    departments: admin.firestore.FieldValue.arrayRemove(departmentId)
  });

  await db.collection('departments').doc(departmentId).update({
    memberCount: admin.firestore.FieldValue.increment(-1)
  });

  return { success: true };
});

// Assign Department Role
exports.assignDeptRole = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);
  const { departmentId, userId, role } = data;

  await db.collection('departments').doc(departmentId)
    .collection('members').doc(userId).update({ role });

  return { success: true };
});

// Create Event
exports.createEvent = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);
  const { title, description, startDate, endDate, location, gpsLocation, mediaUrls } = data;

  const eventRef = await db.collection('events').add({
    title, description,
    startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
    endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
    status: 'upcoming', location, gpsLocation, mediaUrls,
    createdBy: context.auth.uid,
    rsvpCount: 0, commentCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, eventId: eventRef.id };
});

// Create Giving Cause
exports.createGivingCause = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);
  const { title, description, goalAmount, paymentMethods, mediaUrls } = data;

  const causeRef = await db.collection('givingCauses').add({
    title, description, goalAmount,
    raisedAmount: 0, currency: 'KES', status: 'active',
    paymentMethods, mediaUrls,
    createdBy: context.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, causeId: causeRef.id };
});

// Approve Request
exports.approveRequest = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);
  const { requestId } = data;

  const requestRef = db.collection('pendingRequests').doc(requestId);
  const requestSnap = await requestRef.get();
  const requestData = requestSnap.data();

  if (!requestData) throw new functions.https.HttpsError('not-found', 'Request not found');

  await requestRef.update({
    status: 'approved',
    reviewedBy: context.auth.uid,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  if (requestData.type === 'join_department') {
    await db.collection('departments').doc(requestData.targetId)
      .collection('members').doc(requestData.userId).set({
        userId: requestData.userId, role: 'member',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        joinedBy: context.auth.uid, status: 'active'
      });

    await db.collection('users').doc(requestData.userId).update({
      departments: admin.firestore.FieldValue.arrayUnion(requestData.targetId)
    });
  }

  await db.collection('notifications').add({
    userId: requestData.userId,
    type: 'request_approved',
    title: 'Request Approved',
    body: `Your request to join ${requestData.targetName} has been approved!`,
    data: { departmentId: requestData.targetId },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});