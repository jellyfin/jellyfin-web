/* eslint-env serviceworker */
/* eslint-disable compat/compat -- Service Worker APIs (caches, URL, Response) are not supported in older browsers but that's acceptable */

const CACHE_VERSION = 'jellyfin-web-v1';
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// =============================================================================
// INSTALACIÓN: Activar inmediatamente sin pre-cache
// =============================================================================
/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('install', () => {
    /* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment, cannot use globalThis */
    self.skipWaiting();
});

// =============================================================================
// ACTIVACIÓN: Limpiar cachés de versiones anteriores
// =============================================================================
/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('jellyfin-web-') && !name.startsWith(CACHE_VERSION))
                    .map((name) => caches.delete(name))
            );
        })
    );
    /* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment, cannot use globalThis */
    self.clients.claim();
});

// =============================================================================
// FETCH: Estrategias de caché por tipo de recurso
// =============================================================================
/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo cachear requests del mismo origen
    /* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
    if (url.origin !== self.location.origin) {
        // Dejar pasar requests externos (CDN, etc)
        return;
    }

    // 1. Imágenes de items - Cache-First permanente
    if (url.pathname.includes('/Items/') && url.pathname.includes('/Images/')) {
        event.respondWith(handleImageRequest(request));
        return;
    }

    // 2. Requests de API - Cache-First con Network timeout
    if (url.pathname.includes('/Users/')
        || url.pathname.includes('/Items')
        || url.pathname.includes('/System/')
        || url.pathname.includes('/Localization/')
        || url.pathname.includes('/Plugins')) {
        event.respondWith(handleApiRequest(request));
    }

    // 3. Network Only (sin caché): HTML, JS, CSS, websockets, streaming
});

// =============================================================================
// ESTRATEGIA 1: API Requests - Cache-First con Network Timeout
// =============================================================================
async function handleApiRequest(request) {
    const url = new URL(request.url);

    // Endpoints que NO deben cachearse (datos en tiempo real)
    const noCachePatterns = [
        '/Sessions', // Sesiones activas
        '/LiveTv/Programs', // Programación en vivo
        '/PlaybackInfo', // Info de reproducción
        '/Playing', // Estado actual
        '/Progress', // Progreso
        '/Audio/', // Streaming de audio
        '/Videos/', // Streaming de video
        '/Search' // Búsquedas (pueden cambiar)
    ];

    const shouldNotCache = noCachePatterns.some(pattern => url.pathname.includes(pattern));
    if (shouldNotCache) {
        // Estos siempre van directo a network, sin caché
        return fetch(request);
    }

    // Para endpoints cacheables: Cache-First con Network timeout
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);

    // Race: Network (max 2 segundos) vs Cache
    const networkPromise = fetch(request)
        .then((response) => {
            // Solo cachear respuestas exitosas
            if (response?.ok && response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null); // Si falla network, devolver null

    const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve(null), 2000) // 2 segundos de timeout
    );

    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);

    // Si network respondió a tiempo, usar esa respuesta
    if (networkResponse) {
        return networkResponse;
    }

    // Si hay caché y network fue lenta/falló, usar caché
    if (cached) {
        // Intentar actualizar caché en background sin bloquear
        fetch(request).then((response) => {
            if (response?.ok) {
                cache.put(request, response.clone());
            }
        }).catch(() => {
            // Ignorar errores en background update - no hacer nada
            return undefined;
        });
        return cached;
    }

    // Último recurso: esperar network sin timeout (solo si no hay caché)
    try {
        return await fetch(request);
    } catch (error) {
        // Si falla y no hay caché, devolver respuesta de error
        console.error('[ServiceWorker] Network error:', error);
        return new Response(
            JSON.stringify({ error: 'Network unavailable and no cache available' }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// =============================================================================
// ESTRATEGIA 2: Imágenes - Cache-First permanente
// =============================================================================
async function handleImageRequest(request) {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);

    // Si existe en caché, devolverla inmediatamente
    if (cached) {
        return cached;
    }

    // Si no está en caché, descargar y cachear
    try {
        const response = await fetch(request);

        if (response?.ok && response.status === 200) {
            // Cachear solo imágenes pequeñas (< 2MB)
            const contentLength = response.headers.get('content-length');
            if (!contentLength || Number.parseInt(contentLength, 10) < 2 * 1024 * 1024) {
                cache.put(request, response.clone());
            }
        }

        return response;
    } catch (error) {
        // Si falla descarga, devolver imagen placeholder transparente
        console.error('[ServiceWorker] Image fetch error:', error);
        return new Response(
            new Blob([], { type: 'image/png' }),
            { status: 200, statusText: 'OK', headers: { 'Content-Type': 'image/png' } }
        );
    }
}

// =============================================================================
// NOTIFICACIONES PUSH (código original)
// =============================================================================
function getApiClient(serverId) {
    /* eslint-disable-next-line no-restricted-globals -- window is valid in serviceworker for connectionManager */
    return Promise.resolve(globalThis.connectionManager.getApiClient(serverId));
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
        }
        return undefined;
    });
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
