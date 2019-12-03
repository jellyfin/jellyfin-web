// Polyfill to add support for preventScroll by focus function

if (HTMLElement.prototype.nativeFocus === undefined) {
    (function () {
        var supportsPreventScrollOption = false;
        try {
            var focusElem = document.createElement("div");

            focusElem.addEventListener("focus", function(event) {
                event.preventDefault();
                event.stopPropagation();
            }, true);

            var opts = Object.defineProperty({}, "preventScroll", {
                get: function () {
                    supportsPreventScrollOption = true;
                }
            });

            focusElem.focus(opts);
        } catch (e) {
            console.log("error checking preventScroll support");
        }

        if (!supportsPreventScrollOption) {
            HTMLElement.prototype.nativeFocus = HTMLElement.prototype.focus;

            HTMLElement.prototype.focus = function(options) {
                var scrollX = window.scrollX;
                var scrollY = window.scrollY;

                this.nativeFocus();

                // Restore window scroll if preventScroll
                if (options && options.preventScroll) {
                    window.scroll(scrollX, scrollY);
                }
            };
        }
    })();
}
