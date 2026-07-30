// ═══════════════════════════════════════════════════════════════
// N2GOKAKU — Service Worker
// Xử lý: Caching (offline), Push Notifications
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'n2gokaku-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles/main.css',
    './scripts/data.js',
    './scripts/storage.js',
    './scripts/utils.js',
    './scripts/dashboard.js',
    './scripts/calendar.js',
    './scripts/weekly-summary.js',
    './scripts/notifications.js',
    './scripts/settings.js',
    './scripts/app.js',
    './manifest.json'
];

// ─── INSTALL: Cache tất cả assets ───
self.addEventListener('install', (event) => {
    console.log('🎯 [SW] Installing N2GOKAKU Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 [SW] Caching app assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// ─── ACTIVATE: Xóa cache cũ ───
self.addEventListener('activate', (event) => {
    console.log('✅ [SW] Service Worker activated!');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ [SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ─── FETCH: Serve from cache, fallback to network ───
self.addEventListener('fetch', (event) => {
    // Bỏ qua các request không phải GET
    if (event.request.method !== 'GET') return;
    
    // Bỏ qua Google Fonts (luôn lấy từ network)
    if (event.request.url.includes('fonts.googleapis.com') || 
        event.request.url.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Cache-first strategy cho assets của app
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Cập nhật cache ở background (stale-while-revalidate)
                    fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, networkResponse));
                            }
                        })
                        .catch(() => {}); // Bỏ qua lỗi network
                    
                    return cachedResponse;
                }
                
                // Nếu không có trong cache, lấy từ network
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const clone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, clone));
                        return response;
                    });
            })
    );
});

// ─── PUSH NOTIFICATION: Hiển thị thông báo nhắc nhở ───
self.addEventListener('push', (event) => {
    console.log('🔔 [SW] Push received');
    
    let data = {
        title: 'N2GOKAKU — Đến giờ học rồi!',
        body: 'Đừng quên hoàn thành tasks hôm nay! 🎯',
        icon: '🎯',
        tag: 'n2gokaku-reminder'
    };
    
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: '🎯',
            tag: data.tag,
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: [
                { action: 'open', title: '📋 Mở app' },
                { action: 'dismiss', title: '❌ Bỏ qua' }
            ]
        })
    );
});

// ─── NOTIFICATION CLICK: Mở app khi click thông báo ───
self.addEventListener('notificationclick', (event) => {
    console.log('👆 [SW] Notification clicked');
    event.notification.close();
    
    if (event.action === 'dismiss') return;
    
    // Mở app hoặc focus vào tab đã mở
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Nếu đã có tab mở, focus vào đó
                for (const client of clientList) {
                    if (client.url.includes('N2GOKAKU') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Nếu chưa có tab, mở tab mới
                if (clients.openWindow) {
                    return clients.openWindow('./');
                }
            })
    );
});

// ─── MESSAGE: Nhận lệnh từ main app ───
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, body, delay, tag } = event.data;
        
        // Lên lịch thông báo sau delay milliseconds
        setTimeout(() => {
            self.registration.showNotification(title, {
                body: body,
                tag: tag || 'n2gokaku-scheduled',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                actions: [
                    { action: 'open', title: '📋 Mở app' },
                    { action: 'dismiss', title: '❌ Bỏ qua' }
                ]
            });
        }, delay);
    }
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
