// Polyfill to add support for preventScroll by focus function

if (HTMLElement.prototype.nativeFocus === undefined) {
    (function () {
        let supportsPreventScrollOption = false;
        try {
            const focusElem = document.createElement('div');

            focusElem.addEventListener(
                'focus',
                function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                },
                true
            );

            const opts = Object.defineProperty({}, 'preventScroll', {
                get: function () {
                    supportsPreventScrollOption = true;
                    return null;
                }
            });

            focusElem.focus(opts);
        } catch {
            // no preventScroll supported
        }

        if (!supportsPreventScrollOption) {
            HTMLElement.prototype.nativeFocus = HTMLElement.prototype.focus;

            HTMLElement.prototype.focus = function (options) {
                const scrollX = window.scrollX;
                const scrollY = window.scrollY;

                this.nativeFocus();

                // Restore window scroll if preventScroll
                if (options?.preventScroll) {
                    window.scroll(scrollX, scrollY);
                }
            };
        }
    })();
}
