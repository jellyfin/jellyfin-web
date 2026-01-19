/**
 * Legacy browser support module
 *
 * Note: Most polyfills have been removed as we now target ES2022+ evergreen browsers.
 * The following are native in all supported browsers:
 * - Promise, fetch, AbortController
 * - IntersectionObserver, ResizeObserver
 * - TextEncoder, Proxy, classList, Element.closest()
 *
 * jQuery has been removed. Use native DOM APIs or utils/domQuery.ts helpers.
 */

// Legacy DOM patches (still needed for some edge cases)
import './domParserTextHtml';
import './elementAppendPrepend';
import './focusPreventScroll';
import './htmlMediaElement';
import './keyboardEvent';
import './patchHeaders';
import './vendorStyles';
