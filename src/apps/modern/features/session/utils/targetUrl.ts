const DEFAULT_TARGET_URL = '/home';
/** Control characters, spaces and backslashes, which browsers strip or normalize when parsing urls */
// eslint-disable-next-line no-control-regex -- matching control characters is intended
const UNSAFE_CHARACTERS = /[\x00-\x20\x7f\\]/;

/**
 * Gets the URL to navigate to after logging in. Only app-relative paths are allowed so the
 * `url` query parameter cannot redirect to another site.
 */
export const getTargetUrl = (url?: string | null) => {
    // Reject `//host` and `/\host`, which browsers treat as protocol-relative urls, and characters that can be
    // stripped to form one, e.g. `/\t/host`
    if (url && /^\/(?![/\\])/.test(url) && !UNSAFE_CHARACTERS.test(url)) {
        return url;
    }

    return DEFAULT_TARGET_URL;
};
