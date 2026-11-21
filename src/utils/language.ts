/**
 * Language code helpers.
 *
 * Media streams carry BCP 47 / ISO 639 codes in whichever form the muxer was
 * configured with ("ro", "ron" or the bibliographic "rum"), while browsers
 * report the language of a media track in their own normalized form. Comparing
 * the raw strings therefore fails for perfectly valid pairs like "ro"/"rum".
 */

const ISO_639_2_B_TO_T: Readonly<Record<string, string>> = {
    alb: 'sqi',
    arm: 'hye',
    baq: 'eus',
    bur: 'mya',
    chi: 'zho',
    cze: 'ces',
    dut: 'nld',
    fre: 'fra',
    geo: 'kat',
    ger: 'deu',
    gre: 'ell',
    ice: 'isl',
    mac: 'mkd',
    mao: 'mri',
    may: 'msa',
    per: 'fas',
    rum: 'ron',
    slo: 'slk',
    tib: 'bod',
    wel: 'cym'
};

const IntlLocale = (Intl as unknown as {
    Locale?: new (tag: string) => { language?: string }
}).Locale;

/**
 * Normalizes an ISO 639-1/639-2/BCP 47 language code to a comparable short
 * form, e.g. "rum", "ron", "ro" and "ro-RO" all become "ro".
 * Returns an empty string for unknown or undetermined languages.
 */
export function normalizeLanguage(language?: string | null): string {
    if (!language) return '';

    const code = language.trim().toLowerCase();

    if (!code || code === 'und') return '';

    if (IntlLocale) {
        try {
            // The browser canonicalizes deprecated and bibliographic codes
            // ("rum" -> "ro", "ger" -> "de") for us.
            return new IntlLocale(code).language ?? '';
        } catch {
            // Not a valid BCP 47 tag, fall back to a plain comparison below.
        }
    }

    return ISO_639_2_B_TO_T[code] ?? code;
}

/**
 * Checks whether two language codes refer to the same language.
 * Unknown/empty codes never match.
 */
export function isSameLanguage(left?: string | null, right?: string | null): boolean {
    const normalizedLeft = normalizeLanguage(left);

    return normalizedLeft !== '' && normalizedLeft === normalizeLanguage(right);
}
