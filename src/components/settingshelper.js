import globalize from 'lib/globalize';

/**
 * Helper for handling settings.
 * @module components/settingsHelper
 */

export function populateLanguages(select, languages) {
    let html = '';

    html +=
        "<option value=''>" + globalize.translate('AnyLanguage') + '</option>';
    for (let i = 0, length = languages.length; i < length; i++) {
        const culture = languages[i];
        html +=
            "<option value='" +
            culture.ThreeLetterISOLanguageName +
            "'>" +
            culture.DisplayName +
            '</option>';
    }

    select.innerHTML = html;
}

export default {
    populateLanguages: populateLanguages
};
