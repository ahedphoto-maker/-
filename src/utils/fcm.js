import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// VAPID Public Key from Firebase Console (Web configuration)
// Can be overridden in production using environment variables
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || 'BF-YOUR-PUBLIC-VAPID-KEY-HERE';

// Retrieve or generate a unique persistent device ID for this browser
function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return 'server_side';
  let deviceId = localStorage.getItem('star_media_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    localStorage.setItem('star_media_device_id', deviceId);
  }
  return deviceId;
}

// Detect client device environment attributes
function getDeviceDetails() {
  if (typeof window === 'undefined') return { browser: 'Server', platform: 'Server', appType: 'Server' };
  const ua = navigator.userAgent;
  let browser = 'Other';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';

  let platform = 'Web';
  if (/iPad|iPhone|iPod/.test(ua)) platform = 'iOS';
  else if (ua.includes('Android')) platform = 'Android';
  else if (ua.includes('Macintosh')) platform = 'macOS';
  else if (ua.includes('Windows')) platform = 'Windows';
  else if (ua.includes('Linux')) platform = 'Linux';

  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  return {
    browser,
    platform,
    appType: isPWA ? 'PWA' : 'Web'
  };
}

// Register or update device token in Firestore devices collection
export async function registerDeviceToken(currentUser) {
  if (!currentUser || !currentUser.id) return null;
  
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('FCM Push Messaging is not supported on this browser.');
      return null;
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted yet.');
      return null;
    }

    // Get active service worker registration
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.warn('Service Worker is not ready.');
      return null;
    }

    const messaging = getMessaging();
    const tokenOptions = {
      serviceWorkerRegistration: registration
    };
    if (VAPID_KEY && 
        !VAPID_KEY.includes('YOUR') && 
        !VAPID_KEY.includes('ضع_مفتاح') && 
        VAPID_KEY !== '') {
      tokenOptions.vapidKey = VAPID_KEY;
    }
    const token = await getToken(messaging, tokenOptions);

    if (!token) {
      console.warn('No FCM token returned from registration.');
      return null;
    }

    const deviceId = getOrCreateDeviceId();
    const details = getDeviceDetails();

    const authUid = auth.currentUser?.uid || currentUser.uid || currentUser.email || `user_${currentUser.id}`;
    const docId = `${authUid}_${deviceId}`;
    const deviceRef = doc(db, 'devices', docId);

    const deviceData = {
      userId: authUid,
      teamMemberId: Number(currentUser.id),
      deviceId,
      pushToken: token,
      platform: details.platform,
      browser: details.browser,
      appType: details.appType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabled: true
    };

    await setDoc(deviceRef, deviceData, { merge: true });
    console.log('FCM Device token registered successfully in Firestore:', docId);
    
    // Save token locally for test notifications or status tracking
    localStorage.setItem('star_media_fcm_token', token);
    return token;
  } catch (error) {
    console.error('Error during FCM device token registration:', error);
    return null;
  }
}

// Disable device token upon logout to prevent cross-account notifications
export async function unregisterDeviceToken(currentUser) {
  if (!currentUser) return;
  try {
    const deviceId = getOrCreateDeviceId();
    const authUid = auth.currentUser?.uid || currentUser.uid || currentUser.email || `user_${currentUser.id}`;
    const docId = `${authUid}_${deviceId}`;
    const deviceRef = doc(db, 'devices', docId);

    await setDoc(deviceRef, { 
      enabled: false, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });
    
    localStorage.removeItem('star_media_fcm_token');
    console.log('FCM Device registration disabled in Firestore:', docId);
  } catch (error) {
    console.error('Error during FCM device token unregistration:', error);
  }
}

// Trigger a push notification event by calling our Netlify Function API
export async function triggerNotificationEvent(eventType, payload, actor) {
  if (!payload || !actor) return null;
  
  try {
    // Unique eventId to ensure idempotency and prevent duplicate delivery
    const eventId = `${payload.id}_${eventType}_${Date.now()}`;
    console.log(`Triggering notification event ${eventType} for entity ${payload.id}...`);

    const response = await fetch('/.netlify/functions/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId,
        eventType,
        payload,
        actor: {
          id: actor.id,
          name: actor.name,
          role: actor.role || 'employee',
          isSupervisor: !!(actor.isSupervisor || actor.role?.includes('مشرف') || actor.role?.includes('مدير') || actor.id === 1)
        }
      })
    });

    const data = await response.json();
    console.log(`FCM Event API Response for ${eventType}:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to call FCM notification API for ${eventType}:`, error);
    return null;
  }
}

// Send a test push notification to the current device token
export async function sendTestNotification(token) {
  if (!token) return false;
  
  try {
    console.log('Sending test push notification request to token...');
    const response = await fetch('/.netlify/functions/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: `test_${Date.now()}`,
        eventType: 'test',
        payload: { token },
        actor: { name: 'المشرف', role: 'admin', isSupervisor: true }
      })
    });

    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('Failed to trigger test push notification:', error);
    return false;
  }
}
