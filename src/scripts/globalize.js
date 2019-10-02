define(['connectionManager', 'userSettings', 'events'], function (connectionManager, userSettings, events) {
    'use strict';
    var fallbackCulture = 'en-us';

    var allTranslations = {};
    var currentCulture;
    var currentDateTimeCulture;

    function getCurrentLocale() {
        return currentCulture;
    }

    function getCurrentDateTimeLocale() {
        return currentDateTimeCulture;
    }

    function getDefaultLanguage() {
        var culture = document.documentElement.getAttribute('data-culture');
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

    function updateCurrentCulture() {
        var culture;
        try {
            culture = userSettings.language();
        } catch (err) {
            console.log('no language set in user settings');
        }
        culture = culture || getDefaultLanguage();

        currentCulture = normalizeLocaleName(culture);

        var dateTimeCulture;
        try {
            dateTimeCulture = userSettings.dateTimeLocale();
        } catch (err) {
            console.log('no date format set in user settings');
        }

        if (dateTimeCulture) {
            currentDateTimeCulture = normalizeLocaleName(dateTimeCulture);
        } else {
            currentDateTimeCulture = currentCulture;
        }
        ensureTranslations(currentCulture);
    }

    function ensureTranslations(culture) {
        for (var i in allTranslations) {
            ensureTranslation(allTranslations[i], culture);
        }
        if (culture !== fallbackCulture) {
            for (var i in allTranslations) {
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
        var parts = culture.split('-');
        if (parts.length === 2) {
            if (parts[0].toLowerCase() === parts[1].toLowerCase()) {
                culture = parts[0].toLowerCase();
            }
        }

        var lower = culture.toLowerCase();
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

        var translations = allTranslations[module];
        if (!translations) {
            return {};
        }

        return translations.dictionaries[locale];
    }

    function register(options) {
        allTranslations[options.name] = {
            translations: options.strings || options.translations,
            dictionaries: {}
        };
    }

    function loadStrings(options) {
        var locale = getCurrentLocale();
        var promises = [];
        var optionsName;
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

    var cacheParam = new Date().getTime();
    function loadTranslation(translations, lang) {
        lang = normalizeLocaleName(lang);
        var filtered = translations.filter(function (t) {
            return normalizeLocaleName(t.lang) === lang;
        });

        if (!filtered.length) {
            filtered = translations.filter(function (t) {
                return normalizeLocaleName(t.lang) === fallbackCulture;
            });
        }

        return new Promise(function (resolve, reject) {
            if (!filtered.length) {
                resolve();
                return;
            }

            var url = filtered[0].path;

            url += url.indexOf('?') === -1 ? '?' : '&';
            url += 'v=' + cacheParam;

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);

            xhr.onload = function (e) {
                if (this.status < 400) {
                    resolve(JSON.parse(this.response));
                } else {
                    resolve({});
                }
            };

            xhr.onerror = function () {
                resolve({});
            };
            xhr.send();
        });
    }

    function translateKey(key) {
        var parts = key.split('#');
        var module;

        if (parts.length > 1) {
            module = parts[0];
            key = parts[1];
        }

        return translateKeyFromModule(key, module);
    }

    function translateKeyFromModule(key, module) {
        var dictionary = getDictionary(module, getCurrentLocale());
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

    function translate(key) {
        var val = translateKey(key);
        for (var i = 1; i < arguments.length; i++) {
            val = replaceAll(val, '{' + (i - 1) + '}', arguments[i]);
        }
        return val;
    }

    function translateHtml(html, module) {
        if (!module) {
            module = defaultModule();
        }
        if (!module) {
            throw new Error('module cannot be null or empty');
        }

        var startIndex = html.indexOf('${');
        if (startIndex === -1) {
            return html;
        }

        startIndex += 2;
        var endIndex = html.indexOf('}', startIndex);
        if (endIndex === -1) {
            return html;
        }

        var key = html.substring(startIndex, endIndex);
        var val = translateKeyFromModule(key, module);

        html = html.replace('${' + key + '}', val);
        return translateHtml(html, module);
    }

    var _defaultModule;
    function defaultModule(val) {
        if (val) {
            _defaultModule = val;
        }
        return _defaultModule;
    }

    updateCurrentCulture();

    events.on(connectionManager, 'localusersignedin', updateCurrentCulture);
    events.on(userSettings, 'change', function (e, name) {
        if (name === 'language' || name === 'datetimelocale') {
            updateCurrentCulture();
        }
    });

    return {
        getString: translate,
        translate: translate,
        translateDocument: translateHtml,
        translateHtml: translateHtml,
        loadStrings: loadStrings,
        defaultModule: defaultModule,
        getCurrentLocale: getCurrentLocale,
        getCurrentDateTimeLocale: getCurrentDateTimeLocale,
        register: register
    };
});
