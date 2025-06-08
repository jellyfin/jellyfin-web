import isEmpty from 'lodash-es/isEmpty';

import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import Events from 'utils/events';
import { updateLocale } from 'utils/dateFnsLocale';

const Direction = {
    rtl: 'rtl',
    ltr: 'ltr'
};

export const FALLBACK_CULTURE = 'en-us';
const RTL_LANGS = ['ar', 'fa', 'ur', 'he'];

const allTranslations = {};
let currentCulture;
let currentDateTimeCulture;
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
    if (navigator.userLanguage) {
        return navigator.userLanguage;
    }
    if (navigator.languages?.length) {
        return navigator.languages[0];
    }

    return FALLBACK_CULTURE;
}

export function getIsRTL() {
    return isRTL;
}

function checkAndProcessDir(culture) {
    isRTL = false;
    for (const lang of RTL_LANGS) {
        if (culture.includes(lang)) {
            isRTL = true;
            break;
        }
    }

    setDocumentDirection(isRTL ? Direction.rtl : Direction.ltr);
}

function setDocumentDirection(direction) {
    document.getElementsByTagName('body')[0].setAttribute('dir', direction);
    document.getElementsByTagName('html')[0].setAttribute('dir', direction);
    if (direction === Direction.rtl) {
        import('../../styles/rtl.scss');
    }
}

export function getIsElementRTL(element) {
    if (window.getComputedStyle) { // all browsers
        return window.getComputedStyle(element, null).getPropertyValue('direction') == 'rtl';
    }
    return element.currentStyle.direction == 'rtl';
}

export function updateCurrentCulture() {
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
    updateLocale(currentDateTimeCulture);

    ensureTranslations(currentCulture);
}

function ensureTranslations(culture) {
    for (const i in allTranslations) {
        ensureTranslation(allTranslations[i], culture);
    }
    if (culture !== FALLBACK_CULTURE) {
        for (const i in allTranslations) {
            ensureTranslation(allTranslations[i], FALLBACK_CULTURE);
        }
    }
}

function ensureTranslation(translationInfo, culture) {
    if (translationInfo.dictionaries[culture]) {
        return Promise.resolve();
    }

    return loadTranslation(translationInfo.translations, culture).then(function (dictionary) {
        translationInfo.dictionaries[culture] = dictionary;
    });
}

export function normalizeLocaleName(culture) {
    return culture.replace('_', '-').toLowerCase();
}

function getDictionary(module, locale) {
    if (!module) {
        module = defaultModule();
    }

    const translations = allTranslations[module];
    if (!translations) {
        return {};
    }

    return translations.dictionaries[locale];
}

export function register(options) {
    allTranslations[options.name] = {
        translations: options.strings || options.translations,
        dictionaries: {}
    };
}

export function loadStrings(options) {
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

function loadTranslation(translations, lang) {
    lang = normalizeLocaleName(lang);

    let filtered = translations.filter(function (t) {
        return normalizeLocaleName(t.lang) === lang;
    });

    if (!filtered.length) {
        lang = lang.replace(/-.*/, '');

        filtered = translations.filter(function (t) {
            return normalizeLocaleName(t.lang) === lang;
        });

        if (!filtered.length) {
            filtered = translations.filter(function (t) {
                return normalizeLocaleName(t.lang) === FALLBACK_CULTURE;
            });
        }
    }

    return new Promise(function (resolve) {
        if (!filtered.length) {
            resolve();
            return;
        }

        const url = filtered[0].path;

        import(/* webpackChunkName: "[request]" */ `../../strings/${url}`).then((fileContent) => {
            resolve(fileContent);
        }).catch(() => {
            resolve({});
        });
    });
}

function translateKey(key) {
    const parts = key.split('#');
    let module;

    if (parts.length > 1) {
        module = parts[0];
        key = parts[1];
    }

    return translateKeyFromModule(key, module);
}

function translateKeyFromModule(key, module) {
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

export function translate(key) {
    let val = translateKey(key);
    for (let i = 1; i < arguments.length; i++) {
        val = val.replaceAll('{' + (i - 1) + '}', arguments[i].toLocaleString(currentCulture));
    }
    return val;
}

export function translateHtml(html, module) {
    html = html.default || html;

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

let _defaultModule;
export function defaultModule(val) {
    if (val) {
        _defaultModule = val;
    }
    return _defaultModule;
}

updateCurrentCulture();

Events.on(userSettings, 'change', function (e, name) {
    if (name === 'language' || name === 'datetimelocale') {
        updateCurrentCulture();
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

