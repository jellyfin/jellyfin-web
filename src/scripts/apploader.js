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

    injectScriptElement(
        self.Promise ? "./bower_components/alameda/alameda.js" : "./bower_components/requirejs/require.js",
        function() {
            // onload of require library
            injectScriptElement("./scripts/site.js");
        }
    );
})();
