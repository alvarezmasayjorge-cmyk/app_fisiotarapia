import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true };
    }
    console.error('[webpush] sendNotification falló', {
      statusCode: error?.statusCode,
      body: error?.body,
      message: error?.message,
      endpoint: subscription.endpoint.slice(0, 60) + '...',
    });
    return { success: false, error };
  }
}

export { webpush };
