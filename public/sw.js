self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Sentirse Única', body: event.data.text() };
  }

  const title = data.title || 'Sentirse Única';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    data: { url: data.url || '/patient' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// PWA requirements: A fetch event handler is required to be installable.
self.addEventListener('fetch', function (event) {
  // Pass-through
});
