export async function unregisterServiceWorkers(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    // eslint-disable-next-line compat/compat -- We are checking for serviceWorker support above, so this is safe to use.
    const serviceWorker = navigator.serviceWorker;

    try {
        const registrations = await serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
    } catch (error) {
        console.warn('Failed to unregister service workers', error);
    }
}
