export async function unregisterServiceWorkers(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    // eslint-disable-next-line compat/compat -- We are checking for serviceWorker support above, so this is safe to use.
    const serviceWorker = navigator.serviceWorker;

    try {
        const scriptURL = new URL('serviceworker.js', document.baseURI);
        const scope = new URL('./', scriptURL).href;
        const registrations = await serviceWorker.getRegistrations();
        const legacyRegistrations = registrations.filter(registration =>
            registration.scope === scope
            && [registration.active, registration.waiting, registration.installing]
                .some(worker => worker?.scriptURL === scriptURL.href)
        );
        await Promise.all(legacyRegistrations.map(registration => registration.unregister()));
    } catch (error) {
        console.warn('Failed to unregister service workers', error);
    }
}
