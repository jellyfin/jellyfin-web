import { default as globalize, type Translation } from './index';

const languages = [
    'af',
    'ar',
    'be-by',
    'bg-bg',
    'bn_bd',
    'ca',
    'cs',
    'cy',
    'da',
    'de',
    'el',
    'en-gb',
    'en-us',
    'eo',
    'es',
    'es_419',
    'es-ar',
    'es_do',
    'es-mx',
    'et',
    'eu',
    'fa',
    'fi',
    'fil',
    'fr',
    'fr-ca',
    'gl',
    'gsw',
    'he',
    'hi-in',
    'hr',
    'hu',
    'id',
    'it',
    'ja',
    'kk',
    'ko',
    'lt-lt',
    'lv',
    'mr',
    'ms',
    'nb',
    'nl',
    'nn',
    'pl',
    'pr',
    'pt',
    'pt-br',
    'pt-pt',
    'ro',
    'ru',
    'sk',
    'sl-si',
    'sq',
    'sv',
    'ta',
    'th',
    'tr',
    'uk',
    'ur_pk',
    'vi',
    'zh-cn',
    'zh-hk',
    'zh-tw'
];

const locales: Translation[] = languages.map(lang => ({
    lang,
    path: `${lang}.json`
}));

export function loadCoreDictionary() {
    globalize.defaultModule('core');
    return globalize.loadStrings({
        name: 'core',
        translations: locales
    });
}
