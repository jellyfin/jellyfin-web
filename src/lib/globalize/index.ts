import { isEmpty } from '../../utils/lodashUtils';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import Events from 'utils/events';
import { updateLocale } from 'utils/dateFnsLocale';
import { logger } from '../../utils/logger';

const Direction = {
    rtl: 'rtl',
    ltr: 'ltr'
} as const;

export const FALLBACK_CULTURE = 'en-us';
const RTL_LANGS = ['ar', 'fa', 'ur', 'he'];

const stringModules = import.meta.glob('../../strings/*.json');

interface TranslationInfo {
    translations: { lang: string; path: string }[];
    dictionaries: Record<string, Record<string, string>>;
}

const allTranslations: Record<string, TranslationInfo> = {};
let currentCulture: string;
let currentDateTimeCulture: string;
let isRTL = false;

export function getCurrentLocale(): string {
    return currentCulture;
}

export function getCurrentDateTimeLocale(): string {
    return currentDateTimeCulture;
}

export function getDefaultLanguage(): string {
    const culture = document.documentElement.getAttribute('data-culture');
    if (culture) {
        return culture;
    }

    if (navigator.language) {
        return navigator.language;
    }
    const nav: any = navigator;
    if (nav.userLanguage) {
        return nav.userLanguage;
    }
    if (navigator.languages?.length) {
        return navigator.languages[0];
    }

    return FALLBACK_CULTURE;
}

export function getIsRTL(): boolean {
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

function setDocumentDirection(direction: 'rtl' | 'ltr') {
    document.getElementsByTagName('body')[0].setAttribute('dir', direction);
    document.getElementsByTagName('html')[0].setAttribute('dir', direction);
    if (direction === Direction.rtl) {
        import('../../styles/rtl.css.ts');
    }
}

export function getIsElementRTL(element: HTMLElement): boolean {
    if (window.getComputedStyle) {
        return window.getComputedStyle(element, null).getPropertyValue('direction') === 'rtl';
    }
    return (element as any).currentStyle?.direction === 'rtl';
}

export function updateCurrentCulture() {
    let culture: string | undefined;
    try {
        culture = userSettings.language();
    } catch {
        logger.error('No language set in user settings', { component: 'globalize' });
    }
    culture = culture || getDefaultLanguage();
    checkAndProcessDir(culture);

    currentCulture = normalizeLocaleName(culture);

    document.documentElement.setAttribute('lang', currentCulture);

    let dateTimeCulture: string | undefined;
    try {
        dateTimeCulture = userSettings.dateTimeLocale();
    } catch {
        logger.error('No date format set in user settings', { component: 'globalize' });
    }

    if (dateTimeCulture) {
        currentDateTimeCulture = normalizeLocaleName(dateTimeCulture);
    } else {
        currentDateTimeCulture = currentCulture;
    }
    updateLocale(currentDateTimeCulture);

    ensureTranslations(currentCulture);
}

function ensureTranslations(culture: string) {
    for (const i in allTranslations) {
        ensureTranslation(allTranslations[i], culture);
    }
    if (culture !== FALLBACK_CULTURE) {
        for (const i in allTranslations) {
            ensureTranslation(allTranslations[i], FALLBACK_CULTURE);
        }
    }
}

function ensureTranslation(translationInfo: TranslationInfo, culture: string): Promise<void> {
    if (translationInfo.dictionaries[culture]) {
        return Promise.resolve();
    }

    return loadTranslation(translationInfo.translations, culture).then(dictionary => {
        translationInfo.dictionaries[culture] = dictionary || {};
    });
}

export function normalizeLocaleName(culture: string): string {
    return culture.replace('_', '-').toLowerCase();
}

function getDictionary(module: string | undefined, locale: string): Record<string, string> {
    if (!module) {
        module = defaultModule();
    }

    if (!module) return {};

    const translations = allTranslations[module];
    if (!translations) {
        return {};
    }

    return translations.dictionaries[locale];
}

export function register(options: { name: string; strings?: any[]; translations?: any[] }) {
    allTranslations[options.name] = {
        translations: options.strings || options.translations || [],
        dictionaries: {}
    };
}

export function loadStrings(options: string | { name: string; strings?: any[]; translations?: any[] }): Promise<any> {
    const locale = getCurrentLocale();
    const promises = [];
    let optionsName: string;
    if (typeof options === 'string') {
        optionsName = options;
    } else {
        optionsName = options.name;
        register(options);
    }

    if (allTranslations[optionsName]) {
        promises.push(ensureTranslation(allTranslations[optionsName], locale));
        promises.push(ensureTranslation(allTranslations[optionsName], FALLBACK_CULTURE));
    }

    return Promise.all(promises);
}

function loadTranslation(
    translations: { lang: string; path: string }[],
    lang: string
): Promise<Record<string, string> | undefined> {
    lang = normalizeLocaleName(lang);

    let filtered = translations.filter(t => {
        return normalizeLocaleName(t.lang) === lang;
    });

    if (!filtered.length) {
        lang = lang.replace(/-.*/, '');

        filtered = translations.filter(t => {
            return normalizeLocaleName(t.lang) === lang;
        });

        if (!filtered.length) {
            filtered = translations.filter(t => {
                return normalizeLocaleName(t.lang) === FALLBACK_CULTURE;
            });
        }
    }

    if (!filtered.length) {
        return Promise.resolve(undefined);
    }

    const url = filtered[0].path;
    const moduleLoader = stringModules[`../../strings/${url}`];

    if (!moduleLoader) {
        return Promise.resolve({});
    }

    return moduleLoader()
        .then((fileContent: any) => {
            return fileContent.default || fileContent;
        })
        .catch(() => {
            return {};
        });
}

function translateKey(key: string): string {
    const parts = key.split('#');
    let module: string | undefined;

    if (parts.length > 1) {
        module = parts[0];
        key = parts[1];
    }

    return translateKeyFromModule(key, module);
}

function translateKeyFromModule(key: string, module: string | undefined): string {
    let dictionary = getDictionary(module, getCurrentLocale());
    if (dictionary?.[key]) {
        return dictionary[key];
    }

    dictionary = getDictionary(module, FALLBACK_CULTURE);
    if (dictionary?.[key]) {
        return dictionary[key];
    }

    if (!dictionary || isEmpty(dictionary)) {
        logger.warn('Translation dictionary is empty', { component: 'globalize' });
    } else {
        logger.error(`Translation key is missing from dictionary: ${key}`, { component: 'globalize' });
    }

    return key;
}

export function translate(key: string, ...args: any[]): string {
    let val = translateKey(key);
    for (let i = 0; i < args.length; i++) {
        val = val.replaceAll('{' + i + '}', args[i]?.toLocaleString(currentCulture) || '');
    }
    return val;
}

export function translateHtml(html: any, module?: string): string {
    let htmlStr: string = html.default || html;

    if (!module) {
        module = defaultModule();
    }
    if (!module) {
        throw new Error('module cannot be null or empty');
    }

    let startIndex = htmlStr.indexOf('${');
    if (startIndex === -1) {
        return htmlStr;
    }

    startIndex += 2;
    const endIndex = htmlStr.indexOf('}', startIndex);
    if (endIndex === -1) {
        return htmlStr;
    }

    const key = htmlStr.substring(startIndex, endIndex);
    const val = translateKeyFromModule(key, module);

    htmlStr = htmlStr.replace('${' + key + '}', val);
    return translateHtml(htmlStr, module);
}

let _defaultModule: string | undefined;
export function defaultModule(val?: string): string | undefined {
    if (val) {
        _defaultModule = val;
    }
    return _defaultModule;
}

updateCurrentCulture();

Events.on(userSettings, 'change', (e: any, name: string) => {
    if (name === 'language' || name === 'datetimelocale') {
        updateCurrentCulture();
    }
});

const globalize = {
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

export default globalize;
