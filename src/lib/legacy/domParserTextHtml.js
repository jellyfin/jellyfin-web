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

    const DOMParser_proto = DOMParser.prototype;
    const real_parseFromString = DOMParser_proto.parseFromString;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
        // WebKit returns null on unsupported types
        if ((new DOMParser).parseFromString('', 'text/html')) {
            // text/html parsing is natively supported
            return;
        }
    } catch (ex) { /* noop */ }

    DOMParser_proto.parseFromString = function (markup, type) {
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
            const doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = markup;
            return doc;
        } else {
            return real_parseFromString.apply(this, arguments);
        }
    };
}(DOMParser));
