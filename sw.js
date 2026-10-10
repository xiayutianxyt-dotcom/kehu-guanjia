/* 客户资料管家 · 离线缓存 Service Worker
   用途：客户成功打开过一次后，即使站点不可达或断网，也能从本机缓存继续打开使用。
   安全：本文件仅缓存页面代码（index.html 与自身），不含任何客户数据（客户数据在浏览器本地加密存储，SW 不触碰）。
   注意：对外部署需与 index.html 一起上传到同一目录。 */
var CACHE = 'khgj-v2.4.4f-sw';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(['./', './index.html', './sw.js']);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, clone); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (m) {
        if (m) return m;
        return caches.match('./index.html');
      });
    })
  );
});
