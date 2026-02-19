import globalize from './index';
import locales from './locales';

export function loadCoreDictionary() {
    globalize.defaultModule('core');
    return globalize.loadStrings({
        name: 'core',
        translations: locales
    });
}
