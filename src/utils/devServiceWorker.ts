export type ServiceWorkerResetResult = {
    unregisteredCount: number;
    deletedCaches: string[];
};

export const resetServiceWorkerAndCaches = async (): Promise<ServiceWorkerResetResult> => {
    const deletedCaches: string[] = [];
    let unregisteredCount = 0;

    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
            registrations.map(async registration => {
                const success = await registration.unregister();
                if (success) {
                    unregisteredCount += 1;
                }
            })
        );
    }

    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(async cacheName => {
                const deleted = await caches.delete(cacheName);
                if (deleted) {
                    deletedCaches.push(cacheName);
                }
            })
        );
    }

    return { unregisteredCount, deletedCaches };
};
