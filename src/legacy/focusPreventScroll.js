// Polyfill to add support for preventScroll by focus function

if (HTMLElement.prototype.nativeFocus === undefined) {
    (function () {
        let supportsPreventScrollOption = false;
        try {
            const focusElem = document.createElement('div');

            focusElem.addEventListener('focus', function(event) {
                event.preventDefault();
                event.stopPropagation();
            }, true);

            const opts = Object.defineProperty({}, 'preventScroll', {
                // eslint-disable-next-line getter-return
                get: function () {
                    supportsPreventScrollOption = true;
                }
            });

            focusElem.focus(opts);
        } catch (e) {
            console.error('error checking preventScroll support');
        }

        if (!supportsPreventScrollOption) {
            HTMLElement.prototype.nativeFocus = HTMLElement.prototype.focus;

            HTMLElement.prototype.focus = function(options) {
                const scrollX = window.scrollX;
                const scrollY = window.scrollY;

                this.nativeFocus();

                // Restore window scroll if preventScroll
                if (options && options.preventScroll) {
                    window.scroll(scrollX, scrollY);
                }
            };
        }
    })();
}
