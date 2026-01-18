/* eslint-env serviceworker */

// Cache version for cache invalidation
const CACHE_VERSION = 'v1.0.2';
const STATIC_CACHE = `jellyfin-static-${CACHE_VERSION}`;
const API_CACHE = `jellyfin-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `jellyfin-images-${CACHE_VERSION}`;

// Cache size limits (in MB)
const CACHE_LIMITS = {
    [STATIC_CACHE]: 50, // 50MB for static assets
    [API_CACHE]: 20,    // 20MB for API responses
    [IMAGE_CACHE]: 100  // 100MB for images
};

// Static assets to cache on install - dynamically generated based on webpack output
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html'
];

// Dynamic assets that will be cached at runtime
const RUNTIME_STATIC_ASSETS = [
    '.css',
    '.js',
    'libraries/',
    'themes/',
    '.woff',
    '.woff2',
    '.ttf'
];

// Install event - cache static assets
/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');

    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
        ]).then(() => {
            console.log('[ServiceWorker] Install completed');
            return self.skipWaiting();
        })
    );
});

// Activate event - clean old caches and claim clients
/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');

    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE &&
                            cacheName !== API_CACHE &&
                            cacheName !== IMAGE_CACHE) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                        return Promise.resolve(); // Return resolved promise for caches we keep
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('[ServiceWorker] Activate completed');
        })
    );
});

// Fetch event - implement caching strategies
/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests (not same origin)
    if (url.origin !== self.location.origin) return;

    // Handle different types of requests
    if (isStaticAsset(url)) {
        // Cache-first strategy for static assets
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isApiRequest(url)) {
        // Network-first strategy for API requests (with cache fallback)
        event.respondWith(networkFirst(request, API_CACHE));
    } else if (isImageRequest(url)) {
        // Cache-first strategy for images
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else {
        // Network-first for everything else (HTML, dynamic content)
        event.respondWith(networkFirst(request));
    }
});

// Helper functions
function isStaticAsset(url) {
    const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot', '.map'];
    const path = url.pathname;

    // Check for static file extensions
    const hasStaticExtension = staticExtensions.some(ext => path.endsWith(ext));

    // Check for runtime static assets
    const isRuntimeStatic = RUNTIME_STATIC_ASSETS.some(asset =>
        path.includes(asset) || path.endsWith(asset)
    );

    return hasStaticExtension || isRuntimeStatic;
}

function isApiRequest(url) {
    const path = url.pathname;
    return path.includes('/emby/') ||
           path.includes('/jellyfin/') ||
           path.includes('/api/') ||
           path.includes('/Items/') ||
           path.includes('/Users/') ||
           path.includes('/System/');
}

function isImageRequest(url) {
    const path = url.pathname;
    const imageExtensions = /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|tiff?)$/i;

    return imageExtensions.test(path) ||
           path.includes('/images/') ||
           path.includes('/thumbnails/') ||
           path.includes('/logos/') ||
           path.includes('/backdrop/');
}

// Cache size management
async function enforceCacheLimit(cacheName) {
    const limit = CACHE_LIMITS[cacheName];
    if (!limit) return;

    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    let totalSize = 0;

    // Calculate current cache size
    const sizePromises = keys.map(async (request) => {
        try {
            const response = await cache.match(request);
            if (response) {
                const contentLength = response.headers.get('content-length');
                return contentLength ? parseInt(contentLength, 10) : 0;
            }
        } catch (error) {
            console.warn('[ServiceWorker] Error checking cache size:', error);
        }
        return 0;
    });

    const sizes = await Promise.all(sizePromises);
    totalSize = sizes.reduce((sum, size) => sum + size, 0);

    // If over limit, remove oldest entries (simple LRU approximation)
    if (totalSize > limit * 1024 * 1024) { // Convert MB to bytes
        console.log(`[ServiceWorker] Cache ${cacheName} over limit (${(totalSize / 1024 / 1024).toFixed(1)}MB), cleaning up`);

        // Remove oldest 20% of entries
        const entriesToRemove = Math.ceil(keys.length * 0.2);
        for (let i = 0; i < entriesToRemove && i < keys.length; i++) {
            await cache.delete(keys[i]);
        }
    }
}

function cacheFirst(request, cacheName) {
    return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
            console.log(`[ServiceWorker] Cache hit for: ${request.url}`);
            return cachedResponse;
        }

        return fetch(request).then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (cacheName) {
                const responseClone = response.clone();
                caches.open(cacheName).then(async (cache) => {
                    await cache.put(request, responseClone);
                    // Enforce cache size limits
                    await enforceCacheLimit(cacheName);
                }).catch((error) => {
                    console.warn('[ServiceWorker] Failed to cache response:', error);
                });
            }
            return response;
        }).catch((error) => {
            console.warn('[ServiceWorker] Fetch failed, trying offline fallback:', error);

            // Return offline fallback if available
            if (request.destination === 'document') {
                return caches.match('/offline.html');
            }

            // For other requests, let the browser handle the error
            throw error;
        });
    });
}

function networkFirst(request, cacheName) {
    return fetch(request).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (cacheName) {
            const responseClone = response.clone();
            caches.open(cacheName).then(async (cache) => {
                await cache.put(request, responseClone);
                // Enforce cache size limits
                await enforceCacheLimit(cacheName);
            }).catch((error) => {
                console.warn('[ServiceWorker] Failed to cache response:', error);
            });
        }
        return response;
    }).catch((error) => {
        console.warn('[ServiceWorker] Network failed, trying cache:', error);

        // Return cached version if network fails
        return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                console.log(`[ServiceWorker] Cache fallback for: ${request.url}`);
                return cachedResponse;
            }

            // Return offline fallback for HTML requests
            if (request.destination === 'document') {
                return caches.match('/offline.html');
            }

            // For API requests, return a proper error response
            throw error;
        });
    });
}

function getApiClient(serverId) {
    return Promise.resolve(window.connectionManager.getApiClient(serverId));
}

function executeAction(action, data, serverId) {
    return getApiClient(serverId).then(function (apiClient) {
        switch (action) {
            case 'cancel-install':
                return apiClient.cancelPackageInstallation(data.id);
            case 'restart':
                return apiClient.restartServer();
            default:
                clients.openWindow('/');
                return Promise.resolve();
        }
    });
}

// Message event - handle commands from main thread
/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('message', (event) => {
    const { type, data } = event.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CACHE_STATUS':
            handleCacheStatus(event);
            break;
        case 'CLEAR_CACHE':
            handleClearCache(event, data);
            break;
        default:
            console.log('[ServiceWorker] Unknown message type:', type);
    }
});

async function handleCacheStatus(event) {
    try {
        const cacheNames = await caches.keys();
        const cacheInfo = {};

        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheInfo[cacheName] = {
                entries: keys.length,
                estimatedSize: await estimateCacheSize(cache)
            };
        }

        event.ports[0].postMessage({
            success: true,
            cacheInfo,
            limits: CACHE_LIMITS
        });
    } catch (error) {
        event.ports[0].postMessage({
            success: false,
            error: error.message
        });
    }
}

async function handleClearCache(event, data) {
    try {
        const { cacheName } = data;
        if (cacheName) {
            await caches.delete(cacheName);
        } else {
            // Clear all caches
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        event.ports[0].postMessage({
            success: true,
            cleared: cacheName || 'all'
        });
    } catch (error) {
        event.ports[0].postMessage({
            success: false,
            error: error.message
        });
    }
}

async function estimateCacheSize(cache) {
    try {
        const keys = await cache.keys();
        let totalSize = 0;

        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    totalSize += parseInt(contentLength, 10);
                }
            }
        }

        return totalSize;
    } catch (error) {
        console.warn('[ServiceWorker] Error estimating cache size:', error);
        return 0;
    }
}

/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('notificationclick', function (event) {
    const notification = event.notification;
    notification.close();

    const data = notification.data;
    const serverId = data.serverId;
    const action = event.action;

    if (!action) {
        clients.openWindow('/');
        event.waitUntil(Promise.resolve());
        return;
    }

    event.waitUntil(executeAction(action, data, serverId));
}, false);
