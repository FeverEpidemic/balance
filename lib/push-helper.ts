/**
 * Convert a URL-safe Base64 string to a Uint8Array.
 * Required for registering the VAPID public key with the push service.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushSubscriptionResult {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Register push notification subscription on the client browser.
 */
export async function registerPushSubscription(vapidPublicKey: string): Promise<PushSubscriptionResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  // 1. Check/request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  // 2. Wait for service worker to be ready
  const registration = await navigator.serviceWorker.ready;
  if (!registration) {
    throw new Error("Service worker not ready.");
  }

  // 3. Subscribe with the PushManager
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey as any
  });

  const keys = subscription.toJSON().keys;
  if (!subscription.endpoint || !keys || !keys.p256dh || !keys.auth) {
    throw new Error("Failed to generate complete push subscription keys.");
  }

  return {
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth
  };
}

/**
 * Unsubscribe current browser push subscription.
 */
export async function unsubscribePushNotification(): Promise<string | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    return endpoint;
  }
  return null;
}

/**
 * Check if browser currently has a push subscription.
 */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}
