import enUS from 'date-fns/locale/en-US';

const LOCALE_MAP: Record<string, string> = {
    'af': 'af',
    'ar': 'ar-DZ',
    'be-by': 'be',
    'bg-bg': 'bg',
    'bn': 'bn',
    'ca': 'ca',
    'cs': 'cs',
    'cy': 'cy',
    'da': 'da',
    'de': 'de',
    'el': 'el',
    'en-gb': 'en-GB',
    'en-us': 'en-US',
    'eo': 'eo',
    'es': 'es',
    'es-ar': 'es',
    'es-do': 'es',
    'es-mx': 'es',
    'et': 'et',
    'eu': 'eu',
    'fa': 'fa-IR',
    'fi': 'fi',
    'fr': 'fr',
    'fr-ca': 'fr-CA',
    'gl': 'gl',
    'gsw': 'de',
    'he': 'he',
    'hi-in': 'hi',
    'hr': 'hr',
    'hu': 'hu',
    'id': 'id',
    'is': 'is',
    'it': 'it',
    'ja': 'ja',
    'kk': 'kk',
    'ko': 'ko',
    'lt-lt': 'lt',
    'lv': 'lv',
    'ms': 'ms',
    'nb': 'nb',
    'nl': 'nl',
    'nn': 'nn',
    'pl': 'pl',
    'pt': 'pt',
    'pt-br': 'pt-BR',
    'pt-pt': 'pt',
    'ro': 'ro',
    'ru': 'ru',
    'sk': 'sk',
    'sl-si': 'sl',
    'sv': 'sv',
    'ta': 'ta',
    'th': 'th',
    'tr': 'tr',
    'uk': 'uk',
    'vi': 'vi',
    'zh-cn': 'zh-CN',
    'zh-hk': 'zh-HK',
    'zh-tw': 'zh-TW'
};

const DEFAULT_LOCALE = 'en-US';

let localeString = DEFAULT_LOCALE;
let locale = enUS;

export function fetchLocale(localeName: string) {
    return import(`date-fns/locale/${localeName}/index.js`);
}

export function normalizeLocale(localeName: string) {
    return LOCALE_MAP[localeName]
        || LOCALE_MAP[localeName.replace(/-.*/, '')]
        || DEFAULT_LOCALE;
}

export async function updateLocale(newLocale: string) {
    console.debug('[dateFnsLocale] updating date-fns locale', newLocale);
    localeString = normalizeLocale(newLocale);
    console.debug('[dateFnsLocale] mapped to date-fns locale', localeString);
    locale = await fetchLocale(localeString);
}

export function getLocale() {
    return locale;
}

export function getLocaleWithSuffix() {
    return {
        addSuffix: true,
        locale
    };
}
