/* eslint-env serviceworker */

// Service worker manifest - loaded at runtime for cache invalidation
let CACHE_VERSION = 'v1.0.0';
let BUILD_ID = 'unknown';

// Fetch manifest to get build-specific cache version
async function loadManifest() {
    try {
        const response = await fetch('/sw-manifest.json');
        if (response.ok) {
            const manifest = await response.json();
            CACHE_VERSION = manifest.version || CACHE_VERSION;
            BUILD_ID = manifest.buildId || BUILD_ID;
            console.log(`[ServiceWorker] Using build ${BUILD_ID}, cache version ${CACHE_VERSION}`);
        }
    } catch (e) {
        console.log('[ServiceWorker] Using default cache version (manifest not available)');
    }
}

const STATIC_CACHE = `jellyfin-static-${CACHE_VERSION}`;
const API_CACHE = `jellyfin-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `jellyfin-images-${CACHE_VERSION}`;

// Cache size limits (in MB)
const CACHE_LIMITS = {
    [STATIC_CACHE]: 50,
    [API_CACHE]: 20,
    [IMAGE_CACHE]: 100
};

// Static assets to cache on install
const STATIC_ASSETS = ['/', '/index.html', '/offline.html'];

// Runtime static assets patterns
const RUNTIME_STATIC_ASSETS = ['.css', '.js', 'libraries/', 'themes/', '.woff', '.woff2', '.ttf'];

// Load manifest before installing
loadManifest();

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
    console.log(`[ServiceWorker] Activate (build: ${BUILD_ID})`);

    event.waitUntil(
        Promise.all([
            // Clean old caches (anything not matching current version prefix)
            caches
                .keys()
                .then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((cacheName) => {
                            const isCurrentCache =
                                cacheName === STATIC_CACHE ||
                                cacheName === API_CACHE ||
                                cacheName === IMAGE_CACHE;
                            if (!isCurrentCache) {
                                console.log('[ServiceWorker] Deleting old cache:', cacheName);
                                return caches.delete(cacheName);
                            }
                            return Promise.resolve();
                        })
                    );
                }),
            self.clients.claim()
        ]).then(() => {
            console.log('[ServiceWorker] Activate completed');
        })
    );
});

// Get path-only cache key (strips query params)
function getCacheKey(request) {
    const url = new URL(request.url);
    return url.pathname;
}

// Helper: Check if valid response (200-299)
function isOkResponse(response) {
    return response && response.status >= 200 && response.status < 300;
}

// Helper: Check if Vite dev server URL
function isViteDevServer(url) {
    const path = url.pathname;
    return (
        path.includes('/node_modules/.vite/deps/') || path.includes('@fs/') || url.port === '5173'
    );
}

// Helper: Check if static asset
function isStaticAsset(url) {
    const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot', '.map'];
    const path = url.pathname;

    const hasStaticExtension = staticExtensions.some((ext) => path.endsWith(ext));
    const isRuntimeStatic = RUNTIME_STATIC_ASSETS.some(
        (asset) => path.includes(asset) || path.endsWith(asset)
    );

    return hasStaticExtension || isRuntimeStatic;
}

// Helper: Check if API request
function isApiRequest(url) {
    const path = url.pathname;
    return (
        path.includes('/emby/') ||
        path.includes('/jellyfin/') ||
        path.includes('/api/') ||
        path.includes('/Items/') ||
        path.includes('/Users/') ||
        path.includes('/System/')
    );
}

// Helper: Check if image request
function isImageRequest(url) {
    const path = url.pathname;
    const imageExtensions = /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|tiff?)$/i;

    return (
        imageExtensions.test(path) ||
        path.includes('/images/') ||
        path.includes('/thumbnails/') ||
        path.includes('/logos/') ||
        path.includes('/backdrop/')
    );
}

// Fetch event - implement caching strategies
/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests
    if (url.origin !== self.location.origin) return;

    // Handle different types of requests
    if (isViteDevServer(url)) {
        event.respondWith(networkFirst(request));
    } else if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isApiRequest(url)) {
        event.respondWith(networkFirst(request, API_CACHE));
    } else if (isImageRequest(url)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else {
        event.respondWith(networkFirst(request));
    }
});

// Cache size management
async function enforceCacheLimit(cacheName) {
    const limit = CACHE_LIMITS[cacheName];
    if (!limit) return;

    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    let totalSize = 0;

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

    if (totalSize > limit * 1024 * 1024) {
        console.log(
            `[ServiceWorker] Cache ${cacheName} over limit (${(totalSize / 1024 / 1024).toFixed(1)}MB), cleaning up`
        );

        const entriesToRemove = Math.ceil(keys.length * 0.2);
        for (let i = 0; i < entriesToRemove && i < keys.length; i++) {
            await cache.delete(keys[i]);
        }
    }
}

// Cache-first strategy
function cacheFirst(request, cacheName) {
    const cacheKey = getCacheKey(request);

    return caches.match(cacheKey).then((cachedResponse) => {
        if (cachedResponse) {
            console.log(`[ServiceWorker] Cache hit for: ${request.url}`);
            return cachedResponse;
        }

        return fetch(request)
            .then((response) => {
                // NEVER cache error responses or non-OK status
                if (!isOkResponse(response)) {
                    console.warn(
                        `[ServiceWorker] Not caching error response: ${response.status} ${request.url}`
                    );
                    return response;
                }

                if (cacheName) {
                    const responseClone = response.clone();
                    caches
                        .open(cacheName)
                        .then(async (cache) => {
                            // Store with path-only key to avoid query param duplicates
                            const cacheRequest = new Request(request.url, {
                                method: request.method,
                                headers: request.headers,
                                mode: request.mode,
                                credentials: request.credentials,
                                cache: 'no-store'
                            });
                            await cache.put(cacheRequest, responseClone);
                            await enforceCacheLimit(cacheName);
                        })
                        .catch((error) => {
                            console.warn('[ServiceWorker] Failed to cache response:', error);
                        });
                }
                return response;
            })
            .catch((error) => {
                console.warn('[ServiceWorker] Fetch failed:', error);

                if (request.destination === 'document') {
                    return caches.match('/offline.html');
                }

                throw error;
            });
    });
}

// Network-first strategy
function networkFirst(request, cacheName) {
    const cacheKey = getCacheKey(request);

    return fetch(request)
        .then((response) => {
            // NEVER cache error responses or non-OK status
            if (!isOkResponse(response)) {
                console.warn(
                    `[ServiceWorker] Not caching error response: ${response.status} ${request.url}`
                );

                // For 504 errors, try to return cached version if available
                if (response.status === 504) {
                    return caches.match(cacheKey).then((cachedResponse) => {
                        if (cachedResponse) {
                            console.log(
                                `[ServiceWorker] Cache fallback for Vite 504: ${request.url}`
                            );
                            return cachedResponse;
                        }
                        throw new Error('HTTP 504: Vite dev server timeout');
                    });
                }

                throw new Error(`HTTP ${response.status}`);
            }

            if (cacheName) {
                const responseClone = response.clone();
                caches
                    .open(cacheName)
                    .then(async (cache) => {
                        const cacheRequest = new Request(request.url, {
                            method: request.method,
                            headers: request.headers,
                            mode: request.mode,
                            credentials: request.credentials,
                            cache: 'no-store'
                        });
                        await cache.put(cacheRequest, responseClone);
                        await enforceCacheLimit(cacheName);
                    })
                    .catch((error) => {
                        console.warn('[ServiceWorker] Failed to cache response:', error);
                    });
            }
            return response;
        })
        .catch((error) => {
            console.warn('[ServiceWorker] Network failed, trying cache:', error);

            return caches.match(cacheKey).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log(`[ServiceWorker] Cache fallback for: ${request.url}`);
                    return cachedResponse;
                }

                if (request.destination === 'document') {
                    return caches.match('/offline.html');
                }

                throw error;
            });
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
            limits: CACHE_LIMITS,
            buildId: BUILD_ID
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
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
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
self.addEventListener(
    'notificationclick',
    (event) => {
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
    },
    false
);

function getApiClient(serverId) {
    return Promise.resolve(window.connectionManager.getApiClient(serverId));
}

function executeAction(action, data, serverId) {
    return getApiClient(serverId).then((apiClient) => {
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
