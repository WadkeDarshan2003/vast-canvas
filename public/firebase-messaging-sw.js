importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCV57SpIcDHNWWrIklPT0O9xDQz0V9ToIs",
  authDomain: "vast-canvas-connect.firebaseapp.com",
  projectId: "vast-canvas-connect",
  storageBucket: "vast-canvas-connect.firebasestorage.app",
  messagingSenderId: "949197894176",
  appId: "1:949197894176:web:7791c8835a7373e9604245",
  measurementId: "G-ZY755BHLFG"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Vast Canvas';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/'
    },
    requireInteraction: false,
    tag: 'notification-' + Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url: urlToOpen
          });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
