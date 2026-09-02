/* eslint-disable no-restricted-globals */

// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase config (use YOUR values from Firebase Console)
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "graceconnect.firebaseapp.com",
  projectId: "graceconnect",
  storageBucket: "graceconnect.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages (when app is closed/minimized)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'GraceConnect';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.type || 'default',
    data: payload.data,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  const data = event.notification.data;
  let targetUrl = '/';

  // Route based on notification type
  if (data?.type === 'dept_post' && data?.departmentId) {
    targetUrl = `/ushirika?dept=${data.departmentId}`;
  } else if (data?.type === 'event_reminder' && data?.eventId) {
    targetUrl = `/events?id=${data.eventId}`;
  } else if (data?.type === 'giving_update') {
    targetUrl = '/giving';
  } else if (data?.type === 'request_approved') {
    targetUrl = `/ushirika?dept=${data.departmentId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

// Handle push subscription
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push received:', event);
});