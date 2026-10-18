/* サービスワーカー：ホーム画面に追加したときのオフライン対応。
   ・同じオリジン（このサイト）のファイルだけをキャッシュする。広告・GA・Supabase など外部への通信は一切触らない。
   ・通信できるときは常に最新を取りに行き（ネットワーク優先）、できないときだけキャッシュを使う。
     → 更新を公開した直後でも、古い画面が居座らない。
   ・収支ノートのデータはlocalStorageにあり、サービスワーカーは触らない。 */
const CACHE = "pslab-static-v1";
const PRECACHE = [
  "./", "index.html", "style.css", "script.js", "border-tools.js", "catalog-ui.js", "ledger.js", "home.js",
  "borders.js", "catalog.js", "reviews.js", "votes.js", "votes-config.js",
  "manifest.webmanifest", "images/favicon.svg", "images/icon-192.png", "images/icon-512.png",
  "images/apple-touch-icon.png", "images/roto-san.webp", "privacy.html", "terms.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.startsWith("pslab-static-")).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     // 外部（広告・GA・Supabase等）は触らない
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === "navigate" ? caches.match("index.html") : undefined) || Response.error())
      )
  );
});
