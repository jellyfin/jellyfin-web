/**
 * Validates and sanitizes a locale string for use with Intl APIs.
 * @param {string | undefined} locale The locale to validate.
 * @returns {string | undefined} The validated locale, 'en-US' fallback, or undefined.
 */
export function getSafeLocale(locale: string | undefined): string | undefined {
    if (!locale) {
        return undefined;
    }

    try {
        const canonicalLocales = Intl.getCanonicalLocales(locale);
        if (canonicalLocales.length > 0) {
            return canonicalLocales[0];
        }
    } catch (e) {
        if (e instanceof RangeError) {
            return 'en-US';
        }
        throw e;
    }

    return 'en-US';
}
