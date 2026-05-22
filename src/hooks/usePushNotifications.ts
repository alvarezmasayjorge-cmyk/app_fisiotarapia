'use client';

import { useEffect, useState, useCallback } from 'react';

export type PushStatus =
  | 'unsupported'        // Navegador no soporta Push API
  | 'ios_needs_install'  // iOS Safari sin instalar como PWA
  | 'default'            // Aún no se ha pedido permiso
  | 'denied'             // Usuario bloqueó las notificaciones
  | 'granted_no_sub'     // Permiso dado pero falló la suscripción
  | 'subscribed'         // ✅ Todo funcionando
  | 'loading';

interface PushState {
  status: PushStatus;
  error?: string;
  enable: () => Promise<void>;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function usePushNotifications(): PushState {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [error, setError] = useState<string>();

  const subscribe = useCallback(async (): Promise<PushStatus> => {
    try {
      // Soporte básico
      if (typeof window === 'undefined') return 'loading';
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        return 'unsupported';
      }

      // iOS necesita PWA instalada
      if (isIOS() && !isStandalone()) {
        return 'ios_needs_install';
      }

      // Registrar service worker y esperar a que esté listo
      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;

      // ¿Ya está suscrito?
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await syncSubscription(existing);
        return 'subscribed';
      }

      // Pedir permiso
      const permission = await Notification.requestPermission();
      if (permission === 'denied') return 'denied';
      if (permission !== 'granted') return 'default';

      // Suscribir
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError('Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en el servidor');
        return 'granted_no_sub';
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const synced = await syncSubscription(subscription);
      return synced ? 'subscribed' : 'granted_no_sub';
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
      return 'granted_no_sub';
    }
  }, []);

  // Estado inicial al montar (sin pedir permiso)
  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;

      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setStatus('unsupported');
        return;
      }

      if (isIOS() && !isStandalone()) {
        setStatus('ios_needs_install');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await syncSubscription(existing);
          setStatus('subscribed');
          return;
        }

        const perm = Notification.permission;
        if (perm === 'denied') setStatus('denied');
        else if (perm === 'granted') {
          // Permiso dado pero sin suscripción → reintentar
          const result = await subscribe();
          setStatus(result);
        } else {
          setStatus('default');
        }
      } catch (e: any) {
        setError(e?.message);
        setStatus('default');
      }
    })();
  }, [subscribe]);

  const enable = useCallback(async () => {
    setStatus('loading');
    const result = await subscribe();
    setStatus(result);
  }, [subscribe]);

  return { status, error, enable };
}

async function syncSubscription(subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON();
  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
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
