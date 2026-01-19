/**
 * Legacy browser support module
 *
 * Note: Most polyfills have been removed as we now target ES2022+ evergreen browsers.
 * The following are native in all supported browsers:
 * - Promise, fetch, AbortController
 * - IntersectionObserver, ResizeObserver
 * - TextEncoder, Proxy, classList, Element.closest()
 *
 * jQuery is retained temporarily for legacy component compatibility.
 */
import 'jquery';

// Legacy DOM patches (still needed for some edge cases)
import './domParserTextHtml';
import './elementAppendPrepend';
import './focusPreventScroll';
import './htmlMediaElement';
import './keyboardEvent';
import './patchHeaders';
import './vendorStyles';
