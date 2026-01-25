/**
 * Gets the url search string.
 * This function should be used instead of location.search alone, because the app router
 * includes search parameters in the hash portion of the url.
 * @returns The url search string.
 */
export const getLocationSearch = (): string => {
    // Check location.hash for a search string (this should be the case for our routing library)
    let index = window.location.hash.indexOf('?');
    if (index !== -1) {
        return window.location.hash.substring(index);
    }

    // Return location.search if it exists
    if (window.location.search.length > 0) {
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
export const getParameterByName = (name: string, url?: string | null): string => {
    const searchUrl = url ?? getLocationSearch();

    return new URLSearchParams(searchUrl).get(name) ?? '';
};
