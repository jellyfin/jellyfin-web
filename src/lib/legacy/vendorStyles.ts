// Polyfill for vendor prefixed style properties

type VendorStyleProperty = 'webkitTransform' | 'webkitTransition';

(function () {
    const vendorProperties: Partial<Record<string, VendorStyleProperty[]>> = {
        'transform': ['webkitTransform'],
        'transition': ['webkitTransition']
    };

    const elem = document.createElement('div');

    function polyfillProperty(name: string) {
        if (!(name in elem.style)) {
            (vendorProperties[name] || []).every((vendorName) => {
                if (vendorName in elem.style) {
                    console.debug(`polyfill '${name}' with '${vendorName}'`);

                    Object.defineProperty(CSSStyleDeclaration.prototype, name, {
                        get: function (this: CSSStyleDeclaration) { return this[vendorName]; },
                        set: function (this: CSSStyleDeclaration, val: string) { this[vendorName] = val; }
                    });

                    return false;
                }

                return true;
            });
        }
    }

    if (elem.style instanceof CSSStyleDeclaration) {
        polyfillProperty('transform');
        polyfillProperty('transition');
    }
})();

export {};
