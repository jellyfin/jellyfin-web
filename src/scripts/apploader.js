(function() {
    "use strict";

    function injectScriptElement(src, onload) {
        if (!src) {
            return;
        }

        var script = document.createElement("script");
        if (self.dashboardVersion) {
            src += "?v=" + self.dashboardVersion;
        }
        script.src = src;

        if (onload) {
            script.onload = onload;
        }

        document.head.appendChild(script);
    }

    function loadSite() {
        injectScriptElement(
            "./libraries/alameda.js",
            function() {
                // onload of require library
                injectScriptElement("./scripts/site.js");
            }
        );
    }

    if (!self.Promise) {
        // Load Promise polyfill if they are not natively supported
        injectScriptElement(
            "./libraries/npo.js",
            loadSite
        );
    } else {
        loadSite();
    }
})();
