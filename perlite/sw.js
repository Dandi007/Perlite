// perlite service worker —— 仅为让安卓 Chrome 可安装（需注册带 fetch handler
// 的 SW）并给壳/静态资源做离线兜底。笔记内容与搜索是动态的，一律不缓存：
// 只 SWR 缓存 .js/ 、.styles/ 与 PWA 图标这类静态壳资源；导航走 network-first。
const SHELL_CACHE = "perlite-shell-v1";

const STATIC_RE = /^\/(\.js\/|\.styles\/|pwa-|apple-touch-icon|favicon|manifest\.webmanifest)/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 导航：network-first，断网回落已缓存的壳。
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(SHELL_CACHE);
          cache.put("/", fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match("/")) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // 仅静态壳资源走 SWR；笔记内容/搜索等动态请求一律直通网络。
  if (!STATIC_RE.test(url.pathname)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    })(),
  );
});
