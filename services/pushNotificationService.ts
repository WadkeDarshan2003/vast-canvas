import { getToken, onMessage } from "firebase/messaging";
import { messaging, db } from "./firebaseConfig";
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";

const ensureMessagingServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration('./sw.js');
  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register('./sw.js');
};

export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (!messaging) {
    console.log("Notification permission skipped: Messaging not supported");
    return null;
  }

  try {
    console.log("Requesting notification permission for user:", userId);
    const permission = await Notification.requestPermission();
    console.log("Permission status:", permission);
    
    if (permission === "granted") {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        throw new Error("Missing VITE_FIREBASE_VAPID_KEY for FCM token registration");
      }

      const serviceWorkerRegistration = await ensureMessagingServiceWorkerRegistration();

      if (!serviceWorkerRegistration) {
        throw new Error("Service worker registration is not available for FCM token registration");
      }

      console.log("Getting FCM token...");
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration
      });
      
      console.log("FCM Token received:", token ? token.substring(0, 20) + "..." : "null");
      
      if (token && userId) {
        // Save token to user profile
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          console.log("Saving token to user profile...");
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
          });
          console.log("✅ Token saved successfully!");
        } else {
          console.error("User document doesn't exist:", userId);
        }
      } else {
        console.error("Token or userId missing:", { hasToken: !!token, userId });
      }
      
      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    onMessage(messaging, (payload) => {
      console.log("📬 Foreground message received:", payload);
      
      // Show browser notification even when app is in foreground
      if (Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title || 'Vast Canvas';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'notification-' + Date.now(),
          requireInteraction: false,
          data: {
            url: payload.data?.url || payload.fcmOptions?.link || '/'
          }
        };
        
        const notification = new Notification(notificationTitle, notificationOptions);
        
        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();
          const url = notificationOptions.data.url;
          window.focus();
          if (url && url !== '/') {
            window.location.href = url;
          }
          notification.close();
        };
        
        console.log("✅ Browser notification displayed");
      }
      
      resolve(payload);
    });
  });

// Get Cloud Function URL from environment or use deployed URL
const getCloudFunctionUrl = () => {
  const customUrl = import.meta.env.VITE_PUSH_FUNCTION_URL;
  
  if (customUrl) {
    return customUrl;
  }
  
  // Use the deployed Cloud Function URL
  return 'https://sendpushnotification-jl3d2uhdra-uc.a.run.app';
};

const PUSH_FUNCTION_URL = getCloudFunctionUrl();

/**
 * Sends a push notification via Cloud Function.
 */
export const sendPushNotification = async (
  recipientId: string,
  title: string,
  body: string,
  url?: string
): Promise<void> => {
  try {
    const payload = {
      recipientId,
      title,
      body,
      url,
      icon: "/icons/icon-192x192.png"
    };

    // Call Cloud Function
    await fetch(PUSH_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

