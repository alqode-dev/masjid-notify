/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Listen for push events
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json() as {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    data?: Record<string, unknown>;
  };

  const options: NotificationOptions & { vibrate?: number[] } = {
    body: payload.body,
    icon: payload.icon || "/icon-192x192.png",
    badge: payload.badge || "/icon-192x192.png",
    tag: payload.tag,
    data: { url: payload.url || "/", ...payload.data },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Handle notification click - open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data?.url as string) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url);
    })
  );
});

// Basic install/activate - claim clients immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
