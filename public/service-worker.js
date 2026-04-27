self.addEventListener("install", event => {
  console.log("App instalada");
});

self.addEventListener("fetch", event => {});

// 🔔 ESCUCHAR NOTIFICACIONES
self.addEventListener("push", event => {

  const data = event.data ? event.data.json() : {
    title: "📋 Notificación",
    body: "Nueva tarea disponible"
  };

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/logo.png"
  });

});