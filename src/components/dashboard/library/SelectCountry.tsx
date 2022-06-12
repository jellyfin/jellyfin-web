import { CountryInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import escapeHtml from 'escape-html';
import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createSelectElement = ({ id, required, label, option }: { id?: string, required?: string, label?: string, option?: string }) => ({
    __html: `<select
        id="${id}"
        is="emby-select"
        required="${required}"
        label="${label}"
    >
        ${option}
    </select>`
});

type IProps = {
    id?: string;
    required?: string;
    label?: string;
    countries: CountryInfo[];
}

const SelectCountry: FunctionComponent<IProps> = ({ id, required, label, countries }: IProps) => {
    const renderOption = () => {
        let content = '';
        content += '<option value=\'\'></option>';
        for (const culture of countries) {
            content += `<option value='${culture.TwoLetterISORegionName}'>${escapeHtml(culture.DisplayName)}</option>`;
        }
        return content;
    };

    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                id: id,
                required: required,
                label: globalize.translate(label),
                option: renderOption()
            })}
        />
    );
};

export default SelectCountry;
