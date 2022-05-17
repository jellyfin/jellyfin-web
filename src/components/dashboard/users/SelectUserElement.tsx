import { UserDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import escapeHtml from 'escape-html';
import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createSelectElement = ({ id, label, option }: { id?: string, label: string, option: string }) => ({
    __html: `<select
        id="${id}"
        is="emby-select"
        label="${label}"
    >
    <option value=''></option>
        ${option}
    </select>`
});

type IProps = {
    id?: string;
    label?: string;
    users: UserDto[];
}

const SelectUserElement: FunctionComponent<IProps> = ({ id, label, users }: IProps) => {
    const renderOption = () => {
        let content = '';
        for (const user of users) {
            content += `<option value='${user.Id}'>${escapeHtml(user.Name)}</option>`;
        }
        return content;
    };

    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                id: id,
                label: globalize.translate(label),
                option: renderOption()
            })}
        />
    );
};

export default SelectUserElement;
