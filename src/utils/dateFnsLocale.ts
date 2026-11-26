import type { Locale } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

export const LOCALE_MAP: Readonly<Record<string, string>> = {
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

// One explicit import per LOCALE_MAP target (keep both in sync): the bundler emits one chunk per
// locale instead of one for every locale date-fns ships, and the dev server can pre-bundle them.
/* eslint-disable @typescript-eslint/naming-convention -- keys are date-fns locale codes */
const LOCALE_IMPORTERS: Record<string, () => Promise<{ default: Locale }>> = {
    af: () => import('date-fns/locale/af/index.js'),
    'ar-DZ': () => import('date-fns/locale/ar-DZ/index.js'),
    be: () => import('date-fns/locale/be/index.js'),
    bg: () => import('date-fns/locale/bg/index.js'),
    bn: () => import('date-fns/locale/bn/index.js'),
    ca: () => import('date-fns/locale/ca/index.js'),
    cs: () => import('date-fns/locale/cs/index.js'),
    cy: () => import('date-fns/locale/cy/index.js'),
    da: () => import('date-fns/locale/da/index.js'),
    de: () => import('date-fns/locale/de/index.js'),
    el: () => import('date-fns/locale/el/index.js'),
    'en-GB': () => import('date-fns/locale/en-GB/index.js'),
    // The default locale is already bundled through the static import above.
    'en-US': () => Promise.resolve({ default: enUS }),
    eo: () => import('date-fns/locale/eo/index.js'),
    es: () => import('date-fns/locale/es/index.js'),
    et: () => import('date-fns/locale/et/index.js'),
    eu: () => import('date-fns/locale/eu/index.js'),
    'fa-IR': () => import('date-fns/locale/fa-IR/index.js'),
    fi: () => import('date-fns/locale/fi/index.js'),
    fr: () => import('date-fns/locale/fr/index.js'),
    'fr-CA': () => import('date-fns/locale/fr-CA/index.js'),
    gl: () => import('date-fns/locale/gl/index.js'),
    he: () => import('date-fns/locale/he/index.js'),
    hi: () => import('date-fns/locale/hi/index.js'),
    hr: () => import('date-fns/locale/hr/index.js'),
    hu: () => import('date-fns/locale/hu/index.js'),
    id: () => import('date-fns/locale/id/index.js'),
    is: () => import('date-fns/locale/is/index.js'),
    it: () => import('date-fns/locale/it/index.js'),
    ja: () => import('date-fns/locale/ja/index.js'),
    kk: () => import('date-fns/locale/kk/index.js'),
    ko: () => import('date-fns/locale/ko/index.js'),
    lt: () => import('date-fns/locale/lt/index.js'),
    lv: () => import('date-fns/locale/lv/index.js'),
    ms: () => import('date-fns/locale/ms/index.js'),
    nb: () => import('date-fns/locale/nb/index.js'),
    nl: () => import('date-fns/locale/nl/index.js'),
    nn: () => import('date-fns/locale/nn/index.js'),
    pl: () => import('date-fns/locale/pl/index.js'),
    pt: () => import('date-fns/locale/pt/index.js'),
    'pt-BR': () => import('date-fns/locale/pt-BR/index.js'),
    ro: () => import('date-fns/locale/ro/index.js'),
    ru: () => import('date-fns/locale/ru/index.js'),
    sk: () => import('date-fns/locale/sk/index.js'),
    sl: () => import('date-fns/locale/sl/index.js'),
    sv: () => import('date-fns/locale/sv/index.js'),
    ta: () => import('date-fns/locale/ta/index.js'),
    th: () => import('date-fns/locale/th/index.js'),
    tr: () => import('date-fns/locale/tr/index.js'),
    uk: () => import('date-fns/locale/uk/index.js'),
    vi: () => import('date-fns/locale/vi/index.js'),
    'zh-CN': () => import('date-fns/locale/zh-CN/index.js'),
    'zh-HK': () => import('date-fns/locale/zh-HK/index.js'),
    'zh-TW': () => import('date-fns/locale/zh-TW/index.js')
};
/* eslint-enable @typescript-eslint/naming-convention */

let localeString = DEFAULT_LOCALE;
let locale = enUS;

export async function fetchLocale(localeName: string): Promise<Locale> {
    const importLocale = LOCALE_IMPORTERS[localeName];
    if (!importLocale) throw new Error(`Unsupported date-fns locale: ${localeName}`);
    return (await importLocale()).default;
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
