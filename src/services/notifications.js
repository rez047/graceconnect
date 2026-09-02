// services/notifications.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';

const messaging = getMessaging();

export class NotificationService {
  /**
   * Request permission and get FCM token
   */
  static async requestPermission(userId) {
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY'
      });

      // Save token to Firestore
      const functions = getFunctions();
      const saveToken = httpsCallable(functions, 'saveFcmToken');
      await saveToken({ userId, token });

      return token;
    } catch (error) {
      console.error('Notification permission failed:', error);
      throw error;
    }
  }

  /**
   * Listen for foreground messages
   */
  static onForegroundMessage(callback) {
    onMessage(messaging, (payload) => {
      callback(payload);
      
      // Show in-app notification
      this.showInAppNotification(payload.notification);
    });
  }

  /**
   * Show in-app notification
   */
  static showInAppNotification({ title, body }) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'in-app-notification';
    toast.innerHTML = `
      <div class="notif-title">${title}</div>
      <div class="notif-body">${body}</div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
  }
}

// Cloud Function to send notification
// functions/index.js
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const { userId, title, body, type, data: notifData } = data;

  const admin = require('firebase-admin');
  const db = admin.firestore();

  // Get user's FCM token
  const userDoc = await db.collection('users').doc(userId).get();
  const fcmToken = userDoc.data().fcmToken;

  if (!fcmToken) {
    throw new functions.https.HttpsError('not-found', 'User has no FCM token');
  }

  // Send FCM message
  const message = {
    notification: { title, body },
    data: notifData,
    token: fcmToken,
    android: {
      notification: {
        channelId: 'default',
        priority: 'high'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  const response = await admin.messaging().send(message);
  return { success: true, messageId: response };
});

// Send to multiple users (department)
exports.sendDeptNotification = functions.https.onCall(async (data, context) => {
  const { departmentId, title, body, type } = data;

  const admin = require('firebase-admin');
  const db = admin.firestore();

  // Get all department members
  const membersSnapshot = await db.collection('departments')
    .doc(departmentId)
    .collection('members')
    .get();

  const tokens = [];
  membersSnapshot.forEach(doc => {
    const userId = doc.data().userId;
    // Get each user's FCM token
    db.collection('users').doc(userId).get().then(userDoc => {
      const token = userDoc.data().fcmToken;
      if (token) tokens.push(token);
    });
  });

  // Send multicast message
  const message = {
    notification: { title, body },
    tokens: tokens,
    data: { departmentId, type }
  };

  const response = await admin.messaging().sendMulticast(message);
  return { successCount: response.successCount };
});