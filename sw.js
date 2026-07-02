/* 성서 손목 지킴이 — 서비스워커
   전략: 네트워크 우선(항상 최신 코드 사용) + 실패 시 캐시 폴백.
   AI 모델은 CDN에서 받으므로 첫 실행엔 인터넷이 필요하지만,
   한 번 연 뒤에는 화면 자체는 오프라인에서도 열립니다. */
const CACHE = "sonjikimi-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 같은 출처의 성공 응답은 캐시 갱신
        if (res.ok && new URL(e.request.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match("./index.html")))
  );
});
