'use client';

import { useEffect } from 'react';

export function usePushNotifications() {
  useEffect(() => {
    // Solo en browser y si soporta service workers
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // Registrar service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (registration) => {
        // Si ya hay suscripción activa, no pedir de nuevo
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          // Re-sincronizar con el servidor por si acaso
          await syncSubscription(existing);
          return;
        }

        // Pedir permiso (solo si es la primera vez)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Suscribir al usuario
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await syncSubscription(subscription);
      })
      .catch(console.error);
  }, []);
}

async function syncSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    }),
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
