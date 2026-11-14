/**
 * Gets the url search string.
 * This function should be used instead of location.search alone, because the app router
 * includes search parameters in the hash portion of the url.
 * @returns The url search string.
 */
export const getLocationSearch = () => {
    // Check location.hash for a search string (this should be the case for our routing library)
    let index = window.location.hash.indexOf('?');
    if (index !== -1) {
        return window.location.hash.substring(index);
    }

    // Return location.search if it exists
    if (window.location.search) {
        return window.location.search;
    }

    // Fallback to checking the entire url
    index = window.location.href.indexOf('?');
    if (index !== -1) {
        return window.location.href.substring(index);
    }

    return '';
};

/**
 * Gets the value of a url search parameter by name.
 * @param name The parameter name.
 * @param url The url to search (optional).
 * @returns The parameter value.
 */
export const getParameterByName = (name: string, url?: string | null | undefined) => {
    if (!url) {
        url = getLocationSearch();
    }

    return new URLSearchParams(url).get(name) || '';
};

/**
 * Safely decodes a URI component, returning the original value if decoding fails.
 * This is useful for handling cases where the value may or may not be encoded.
 * @param value The value to decode.
 * @returns The decoded value.
 */
export const safeDecodeURIComponent = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        // If decoding fails, return the original value, this can happen for values that are not encoded.
        return value;
    }
};

/**
 * The URL protocols that are allowed for links pointing outside of the app.
 * This is an allowlist; any other protocol (javascript:, data:, vbscript:, file:, etc.) is rejected.
 */
const SAFE_EXTERNAL_PROTOCOLS: ReadonlySet<string> = new Set([ 'http:', 'https:' ]);

/**
 * Parses a value as an absolute URL, only if it uses an allowed (http or https) protocol.
 * @param value The value to parse.
 * @returns The parsed URL, or null if the value is not a string, not a valid absolute URL, or uses a disallowed protocol.
 */
const parseSafeExternalUrl = (value: unknown): URL | null => {
    if (typeof value !== 'string') {
        return null;
    }

    let url;

    try {
        url = new URL(value);
    } catch {
        return null;
    }

    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol) ? url : null;
};

/**
 * Gets a normalized URL that is safe to use as the target of an external link.
 * Only absolute http and https URLs are allowed, other values return null.
 *
 * NOTE: The returned value is safe to assign to an href DOM property or React prop, but it is NOT
 * HTML escaped. URL serialization can leave characters such as `"` in place (e.g. in the host), so
 * the value must still be HTML escaped when building markup strings.
 * @param value The untrusted value to validate (e.g. a URL from item metadata).
 * @returns The normalized URL, or null if the value is not a safe external URL.
 */
export const getSafeExternalUrl = (value: unknown): string | null => {
    return parseSafeExternalUrl(value)?.href ?? null;
};

/**
 * Test if a value is a valid http or https URL.
 * @param value The value to test.
 * @returns Whether the value is a URL or not.
 */
export const isValidUrl = (value: unknown) => parseSafeExternalUrl(value) !== null;
