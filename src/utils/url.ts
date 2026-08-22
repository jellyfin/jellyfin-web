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
 * Replaces a search parameter in the current url without navigating.
 *
 * The app router reloads a legacy view whenever the search string changes, so page
 * state that belongs in the url has to be written to the history entry directly.
 * The existing history state is preserved, since the router keys its own location
 * tracking off it.
 *
 * @param name The parameter name.
 * @param value The parameter value. A nullish or empty value removes the parameter.
 * @returns The updated router url, in the `pathname + search` form the view manager
 * records for a page.
 */
export const replaceLocationSearchParam = (name: string, value?: string | null) => {
    const params = new URLSearchParams(getLocationSearch());

    if (value) {
        params.set(name, value);
    } else {
        params.delete(name);
    }

    const hashIndex = window.location.hash.indexOf('?');
    const hashPath = hashIndex === -1 ?
        window.location.hash :
        window.location.hash.substring(0, hashIndex);

    const search = params.toString();
    const hash = search ? `${hashPath}?${search}` : hashPath;

    window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}${hash}`
    );

    // The router treats the hash as the path, so strip the leading '#'
    return search ? `${hashPath.substring(1)}?${search}` : hashPath.substring(1);
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
 * Test if a string is a valid http or https URL.
 * @param value The value to test.
 * @returns Whether the value is a URL or not.
 */
export const isValidUrl = (value: string) => {
    let url;

    try {
        url = new URL(value);
    } catch {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
};
