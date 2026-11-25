/*
 * DOMParser HTML extension
 * 2019-11-13
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */

(function (DOMParser) {
    'use strict';

    const DOMParserPrototype = DOMParser.prototype;
    const realParseFromString = DOMParserPrototype.parseFromString;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
        // WebKit returns null on unsupported types
        if ((new DOMParser).parseFromString('', 'text/html')) {
            // text/html parsing is natively supported
            return;
        }
    } catch { /* noop */ }

    DOMParserPrototype.parseFromString = function (this: DOMParser, markup: string, type: DOMParserSupportedType) {
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
            const doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = markup;
            return doc;
        } else {
            // Forward the original arguments (including their count) to the native implementation
            // eslint-disable-next-line prefer-rest-params
            return realParseFromString.apply(this, arguments as unknown as Parameters<typeof realParseFromString>);
        }
    };
}(DOMParser));
