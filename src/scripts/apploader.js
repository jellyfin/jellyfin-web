(function() {
    function injectScriptElement(src, onload) {
        if (!src) {
            return;
        }

        const script = document.createElement('script');
        if (window.dashboardVersion) {
            src += `?v=${window.dashboardVersion}`;
        }
        script.src = src;
        script.setAttribute('async', '');

        if (onload) {
            script.onload = onload;
        }

        document.head.appendChild(script);
    }

    function loadSite() {
        injectScriptElement(
            './libraries/alameda.js',
            function() {
                // onload of require library
                injectScriptElement('./scripts/site.js');
            }
        );
    }

    try {
        Promise.resolve();
    } catch (ex) {
        // this checks for several cases actually, typical is
        // Promise() being missing on some legacy browser, and a funky one
        // is Promise() present but buggy on WebOS 2
        window.Promise = undefined;
        /* eslint-disable-next-line no-restricted-globals -- Explicit check on self needed */
        self.Promise = undefined;
    }

    if (!window.Promise) {
        // Load Promise polyfill if they are not natively supported
        injectScriptElement(
            './libraries/npo.js',
            loadSite
        );
    } else {
        loadSite();
    }
})();
