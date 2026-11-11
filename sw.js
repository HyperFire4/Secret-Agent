/* Secret Agent service worker: makes the app installable and playable offline (Pass the Phone). */
const CACHE = 'secret-agent-v2';   // bump this (v2, v3...) whenever you upload a new version
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
// Only these hosts are cached. PeerJS's own server calls must never be cached or players would get duplicate IDs.
const HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Serve from cache instantly, refresh the cache in the background (updates show up on the next launch).
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if(r.method !== 'GET' || !(u.origin === location.origin || HOSTS.includes(u.hostname))) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, {ignoreSearch: true});
    const net = fetch(r).then(res => { if(res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => hit);
    if(hit){ e.waitUntil(net); return hit; }
    return net;
  }));
});
