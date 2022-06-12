import { UserDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import escapeHtml from 'escape-html';
import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createSelectElement = ({ name, id, label, option }: { name?: string, id?: string, label: string, option: string }) => ({
    __html: `<select
        is="emby-select"
        ${name}
        id="${id}"
        label="${label}"
    >
        ${option}
    </select>`
});

type IProps = {
    name?: string;
    id?: string;
    label?: string;
    users: UserDto[];
}

const SelectUserElement: FunctionComponent<IProps> = ({ name, id, label, users }: IProps) => {
    const renderOption = () => {
        let content = '';
        content += `<option value='' selected='selected'>${globalize.translate('None')}</option>`;
        for (const user of users) {
            content += `<option value='${user.Id}'>${escapeHtml(user.Name)}</option>`;
        }
        return content;
    };

    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                name: name ? `name='${name}'` : '',
                id: id,
                label: globalize.translate(label),
                option: renderOption()
            })}
        />
    );
};

export default SelectUserElement;
