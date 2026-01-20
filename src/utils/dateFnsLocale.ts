import enUS from 'date-fns/esm/locale/en-US';
import { logger } from './logger';

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

const localeModules = import.meta.glob('../../node_modules/date-fns/esm/locale/*/index.js');

export async function fetchLocale(localeName: string) {
    const path = `../../node_modules/date-fns/esm/locale/${localeName}/index.js`;
    const loader = localeModules[path];

    if (loader) {
        const m = await loader() as any;
        return m.default || m;
    }

    return enUS;
}

export function normalizeLocale(localeName: string) {
    return LOCALE_MAP[localeName]
        || LOCALE_MAP[localeName.replace(/-.*/, '')]
        || DEFAULT_LOCALE;
}

export async function updateLocale(newLocale: string) {
    logger.debug('[dateFnsLocale] updating date-fns locale', { component: 'dateFnsLocale', newLocale });
    localeString = normalizeLocale(newLocale);
    logger.debug('[dateFnsLocale] mapped to date-fns locale', { component: 'dateFnsLocale', localeString });
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