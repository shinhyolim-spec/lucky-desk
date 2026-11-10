// 오프라인 캐시. 배포할 때 VERSION을 올리면 새 파일로 교체됨
const VERSION = 'luckydesk-v4';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  // index.html / 모듈 import와 같은 ?v= 값이어야 함
  './css/style.css?v=4',
  './js/app.js?v=4', './js/saju.js?v=4', './js/fortune.js?v=4', './js/icons.js?v=4', './js/scratch.js?v=4', './js/match3.js?v=4',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;

  // 페이지·스크립트는 네트워크 우선(업데이트 반영), 실패하면 캐시
  if (url.origin === location.origin) {
    e.respondWith(
      // cache: 'no-cache' → 브라우저 HTTP 캐시(GitHub Pages 10분)를 건너뛰고 서버에 새 버전 확인
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
    );
    return;
  }
  // 웹폰트는 캐시 우선
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    })),
  );
});
