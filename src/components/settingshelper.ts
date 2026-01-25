import globalize from 'lib/globalize';

export interface LanguageCulture {
    ThreeLetterISOLanguageName: string;
    DisplayName: string;
}

/**
 * @deprecated Legacy helper for populating native <select> lists. Prefer React form controls.
 */
export function populateLanguages(select: HTMLSelectElement, languages: LanguageCulture[]): void {
    let html = '';

    html += `<option value=''>${globalize.translate('AnyLanguage')}</option>`;

    for (const culture of languages) {
        html += `<option value='${culture.ThreeLetterISOLanguageName}'>${culture.DisplayName}</option>`;
    }

    select.innerHTML = html;
}

const settingsHelper = {
    populateLanguages
};

export default settingsHelper;
