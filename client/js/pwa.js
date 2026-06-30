// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ ServiceWorker registered successfully with scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('❌ ServiceWorker registration failed: ', error);
      });
  });
}
