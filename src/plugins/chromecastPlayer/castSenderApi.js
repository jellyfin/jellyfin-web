class CastSenderApi {
    load() {
        if (window.appMode === 'cordova' || window.appMode === 'android') {
            window.chrome = window.chrome || {};
            return Promise.resolve();
        }

        // Pre-establish the gstatic.com connection before the SDK fetch.
        // Only injected when the Cast plugin is active, so no privacy impact for
        // users who don't use Cast.
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://www.gstatic.com';
        document.head.appendChild(preconnect);

        // Start the SDK fetch without blocking app init. CastPlayer uses
        // window.__onGCastApiAvailable for an instant ready-callback rather than
        // a fixed 1-second poll, so Cast is available as soon as the SDK loads
        // (~180ms after this point on a cold connection).
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js');
        document.head.appendChild(script);

        return Promise.resolve();
    }
}

export default CastSenderApi;
