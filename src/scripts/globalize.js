import * as userSettings from './settings/userSettings';
import { Events } from 'jellyfin-apiclient';

/* eslint-disable indent */

    const fallbackCulture = 'en-us';

    const allTranslations = {};
    let currentCulture;
    let currentDateTimeCulture;

    export function getCurrentLocale() {
        return currentCulture;
    }

    export function getCurrentDateTimeLocale() {
        return currentDateTimeCulture;
    }

    function getDefaultLanguage() {
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
        if (navigator.languages && navigator.languages.length) {
            return navigator.languages[0];
        }

        return fallbackCulture;
    }

    export function updateCurrentCulture() {
        let culture;
        try {
            culture = userSettings.language();
        } catch (err) {
            console.error('no language set in user settings');
        }
        culture = culture || getDefaultLanguage();

        currentCulture = normalizeLocaleName(culture);

        let dateTimeCulture;
        try {
            dateTimeCulture = userSettings.dateTimeLocale();
        } catch (err) {
            console.error('no date format set in user settings');
        }

        if (dateTimeCulture) {
            currentDateTimeCulture = normalizeLocaleName(dateTimeCulture);
        } else {
            currentDateTimeCulture = currentCulture;
        }
        ensureTranslations(currentCulture);
    }

    function ensureTranslations(culture) {
        for (const i in allTranslations) {
            ensureTranslation(allTranslations[i], culture);
        }
        if (culture !== fallbackCulture) {
            for (const i in allTranslations) {
                ensureTranslation(allTranslations[i], fallbackCulture);
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

    function normalizeLocaleName(culture) {
        // TODO remove normalizations
        culture = culture.replace('_', '-');

        // convert de-DE to de
        const parts = culture.split('-');
        if (parts.length === 2) {
            if (parts[0].toLowerCase() === parts[1].toLowerCase()) {
                culture = parts[0].toLowerCase();
            }
        }

        const lower = culture.toLowerCase();
        if (lower === 'ca-es') {
            return 'ca';
        }

        // normalize Swedish
        if (lower === 'sv-se') {
            return 'sv';
        }

        return lower;
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
        promises.push(ensureTranslation(allTranslations[optionsName], fallbackCulture));
        return Promise.all(promises);
    }

    function loadTranslation(translations, lang) {
        lang = normalizeLocaleName(lang);
        let filtered = translations.filter(function (t) {
            return normalizeLocaleName(t.lang) === lang;
        });

        if (!filtered.length) {
            filtered = translations.filter(function (t) {
                return normalizeLocaleName(t.lang) === fallbackCulture;
            });
        }

        return new Promise(function (resolve) {
            if (!filtered.length) {
                resolve();
                return;
            }

            const url = filtered[0].path;

            import(`../strings/${url}`).then((fileContent) => {
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
        if (!dictionary || !dictionary[key]) {
            dictionary = getDictionary(module, fallbackCulture);
        }
        if (!dictionary) {
            return key;
        }
        return dictionary[key] || key;
    }

    function replaceAll(str, find, replace) {
        return str.split(find).join(replace);
    }

    export function translate(key) {
        let val = translateKey(key);
        for (let i = 1; i < arguments.length; i++) {
            val = replaceAll(val, '{' + (i - 1) + '}', arguments[i]);
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
    updateCurrentCulture
};

/* eslint-enable indent */
