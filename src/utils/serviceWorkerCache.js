/**
 * Service Worker Cache Management Utilities
 * Provides methods to interact with the service worker cache from the main thread
 */

export class ServiceWorkerCacheManager {
    static async getCacheStatus() {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        return new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                const { success, cacheInfo, limits, error } = event.data;
                if (success) {
                    resolve({ cacheInfo, limits });
                } else {
                    reject(new Error(error));
                }
            };

            messageChannel.port1.onmessageerror = () => {
                reject(new Error('Failed to communicate with service worker'));
            };

            navigator.serviceWorker.controller?.postMessage(
                { type: 'CACHE_STATUS' },
                [messageChannel.port2]
            );
        });
    }

    static async clearCache(cacheName = null) {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        return new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                const { success, cleared, error } = event.data;
                if (success) {
                    resolve(cleared);
                } else {
                    reject(new Error(error));
                }
            };

            messageChannel.port1.onmessageerror = () => {
                reject(new Error('Failed to communicate with service worker'));
            };

            navigator.serviceWorker.controller?.postMessage(
                { type: 'CLEAR_CACHE', data: { cacheName } },
                [messageChannel.port2]
            );
        });
    }

    static async clearAllCaches() {
        return this.clearCache();
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    static async getFormattedCacheStatus() {
        const { cacheInfo, limits } = await this.getCacheStatus();

        const formatted = {};
        for (const [cacheName, info] of Object.entries(cacheInfo)) {
            formatted[cacheName] = {
                entries: info.entries,
                size: this.formatBytes(info.estimatedSize),
                limit: limits[cacheName] ? `${limits[cacheName]} MB` : 'Unlimited'
            };
        }

        return formatted;
    }
}