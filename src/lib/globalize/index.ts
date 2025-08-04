import isEmpty from 'lodash-es/isEmpty';

import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import Events from 'utils/events';
import { updateLocale } from 'utils/dateFnsLocale';

export interface Translation {
    lang: string;
    path: string;
}

const Direction = {
    rtl: 'rtl',
    ltr: 'ltr'
};

export const FALLBACK_CULTURE = 'en-us';
const RTL_LANGS = ['ar', 'fa', 'ur', 'he'];

const allTranslations: Record<string, { translations: Translation[], dictionaries: Record<string, Record<string, string>> }> = {};
let currentCulture: string;
let currentDateTimeCulture: string;
let isRTL = false;

export function getCurrentLocale() {
    return currentCulture;
}

export function getCurrentDateTimeLocale() {
    return currentDateTimeCulture;
}

export function getDefaultLanguage() {
    const culture = document.documentElement.getAttribute('data-culture');
    if (culture) {
        return culture;
    }

    if (navigator.language) {
        return navigator.language;
    }
    const userLanguage = (navigator as unknown as { userLanguage: string }).userLanguage;
    if (userLanguage) {
        return userLanguage;
    }
    if (navigator.languages?.length) {
        return navigator.languages[0];
    }

    return FALLBACK_CULTURE;
}

export function getIsRTL() {
    return isRTL;
}

function checkAndProcessDir(culture: string) {
    isRTL = false;
    for (const lang of RTL_LANGS) {
        if (culture.includes(lang)) {
            isRTL = true;
            break;
        }
    }

    setDocumentDirection(isRTL ? Direction.rtl : Direction.ltr);
}

function setDocumentDirection(direction: string) {
    document.getElementsByTagName('body')[0].setAttribute('dir', direction);
    document.getElementsByTagName('html')[0].setAttribute('dir', direction);
    // if (direction === Direction.rtl) {
    //     import('../../styles/rtl.scss');
    // }
}

export function getIsElementRTL(element: HTMLElement) {
    if (window.getComputedStyle) { // all browsers
        return window.getComputedStyle(element, null).getPropertyValue('direction') == 'rtl';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (element as any).currentStyle.direction == 'rtl';
}

export async function updateCurrentCulture() {
    let culture;
    try {
        culture = userSettings.language();
    } catch {
        console.error('no language set in user settings');
    }
    culture = culture || getDefaultLanguage();
    checkAndProcessDir(culture);

    currentCulture = normalizeLocaleName(culture);

    document.documentElement.setAttribute('lang', currentCulture);

    let dateTimeCulture;
    try {
        dateTimeCulture = userSettings.dateTimeLocale();
    } catch {
        console.error('no date format set in user settings');
    }

    if (dateTimeCulture) {
        currentDateTimeCulture = normalizeLocaleName(dateTimeCulture);
    } else {
        currentDateTimeCulture = currentCulture;
    }
    await updateLocale(currentDateTimeCulture);

    await ensureTranslations(currentCulture);
}

async function ensureTranslations(culture: string) {
    for (const translation of Object.values(allTranslations)) {
        await ensureTranslation(translation, culture);
    }
    if (culture !== FALLBACK_CULTURE) {
        for (const translation of Object.values(allTranslations)) {
            await ensureTranslation(translation, FALLBACK_CULTURE);
        }
    }
}

function ensureTranslation(translationInfo: { dictionaries: Record<string, unknown>, translations: Translation[] }, culture: string) {
    if (translationInfo.dictionaries[culture]) {
        return Promise.resolve();
    }

    return loadTranslation(translationInfo.translations, culture).then((dictionary) => {
        translationInfo.dictionaries[culture] = dictionary;
    });
}

export function normalizeLocaleName(culture: string) {
    return culture.replace('_', '-').toLowerCase();
}

function getDictionary(module: string | null, locale: string) {
    if (!module) {
        module = defaultModule();
    }

    const translations = allTranslations[module];
    if (!translations) {
        return {};
    }

    return translations.dictionaries[locale];
}

export function register(options: { name: string, strings?: Translation[], translations?: Translation[] }) {
    allTranslations[options.name] = {
        translations: (options.strings || options.translations) as Translation[],
        dictionaries: {}
    };
}

export function loadStrings(options: { name: string, translations: Translation[] }) {
    const locale = getCurrentLocale();
    const promises = [];
    let optionsName;
    if (typeof options === 'string') {
        optionsName = options;
    } else {
        optionsName = options.name;
        register(options);
    }
    promises.push(ensureTranslation(allTranslations[optionsName], locale));
    promises.push(ensureTranslation(allTranslations[optionsName], FALLBACK_CULTURE));
    return Promise.all(promises);
}

async function loadTranslation(translations: { lang: string, path: string }[], lang: string) {
    lang = normalizeLocaleName(lang);

    let filtered = translations.filter((t) =>{
        return normalizeLocaleName(t.lang) === lang;
    });

    if (!filtered.length) {
        lang = lang.replace(/-.*/, '');

        filtered = translations.filter( (t) => {
            return normalizeLocaleName(t.lang) === lang;
        });

        if (!filtered.length) {
            filtered = translations.filter( (t) => {
                return normalizeLocaleName(t.lang) === FALLBACK_CULTURE;
            });
        }
    }

    return new Promise<void>( (resolve) => {
        if (!filtered.length) {
            resolve();
            return;
        }

        const url = filtered[0].path;

        import(/* webpackChunkName: "[request]" */ `../../strings/${url}`).then((fileContent) => {
            resolve(fileContent);
        }).catch(() => {
            resolve();
        });
    });
}

function translateKey(key: string) {
    const parts = key.split('#');
    let module = null;

    if (parts.length > 1) {
        module = parts[0];
        key = parts[1];
    }

    return translateKeyFromModule(key, module);
}

function translateKeyFromModule(key: string, module: string | null) {
    let dictionary = getDictionary(module, getCurrentLocale());
    if (dictionary?.[key]) {
        return dictionary[key];
    }

    dictionary = getDictionary(module, FALLBACK_CULTURE);
    if (dictionary?.[key]) {
        return dictionary[key];
    }

    if (!dictionary || isEmpty(dictionary)) {
        console.warn('Translation dictionary is empty.');
    } else {
        console.error(`Translation key is missing from dictionary: ${key}`);
    }

    return key;
}

export function translate(key: string, ...args: unknown[]) {
    let val = translateKey(key);
    for (const [index, arg] of args.entries()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val = (val as any).replaceAll(`{${index}}`, (arg as number).toLocaleString(currentCulture));
    }
    return val;
}

export function translateHtml(html: string, module: string | null) {
    html = (html as unknown as { default: string }).default || html;

    if (!module) {
        module = defaultModule();
    }
    if (!module) {
        throw new Error('module cannot be null or empty');
    }

    let startIndex = html.indexOf('${');
    if (startIndex === -1) {
        return html;
    }

    startIndex += 2;
    const endIndex = html.indexOf('}', startIndex);
    if (endIndex === -1) {
        return html;
    }

    const key = html.substring(startIndex, endIndex);
    const val = translateKeyFromModule(key, module);

    html = html.replace('${' + key + '}', val);
    return translateHtml(html, module);
}

let _defaultModule: string | null = null;
export function defaultModule(val?: string): string {
    if (val) {
        _defaultModule = val;
    }
    return _defaultModule as string;
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
updateCurrentCulture();

Events.on(userSettings, 'change', async (e, name) => {
    if (name === 'language' || name === 'datetimelocale') {
        await updateCurrentCulture();
    }
});

export default {
    translate,
    translateHtml,
    loadStrings,
    defaultModule,
    getCurrentLocale,
    getCurrentDateTimeLocale,
    register,
    updateCurrentCulture,
    getIsRTL,
    getIsElementRTL
};

