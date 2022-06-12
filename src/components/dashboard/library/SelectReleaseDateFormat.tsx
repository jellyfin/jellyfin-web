import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createSelectElement = ({ name, id, label }: { name?: string, id?: string, label: string }) => ({
    __html: `<select
        is="emby-select"
        ${name}
        id="${id}"
        label="${label}"
    >
    <option value="yyyy-MM-dd">yyyy-MM-dd</option>
    </select>`
});

type IProps = {
    name?: string;
    id?: string;
    label?: string
}

const SelectReleaseDateFormat: FunctionComponent<IProps> = ({ name, id, label }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                name: name ? `name='${name}'` : '',
                id: id,
                label: globalize.translate(label)
            })}
        />
    );
};

export default SelectReleaseDateFormat;
