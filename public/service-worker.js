self.addEventListener("install", event => {
  console.log("App instalada");
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Service Worker activo");
  event.waitUntil(self.clients.claim());
});

// 🔔 PUSH NOTIFICATIONS
self.addEventListener("push", event => {

  const data = event.data ? event.data.json() : {
    title: "📋 Notificación",
    body: "Nueva tarea disponible"
  };

  const options = {
    body: data.body,
    icon: "/logo.png",
    badge: "/logo.png"
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 👆 CLICK EN NOTIFICACIÓN
self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow("/")
  );
});