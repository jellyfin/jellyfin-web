import React, { FunctionComponent } from 'react';

import globalize from 'lib/globalize';

const createSelectElement = ({
    name,
    id,
    required,
    label,
    option
}: {
    name?: string;
    id?: string;
    required?: string;
    label?: string;
    option?: React.ReactNode;
}) => ({
    __html: `<select
        is="emby-select"
        ${name}
        id="${id}"
        ${required}
        label="${label}"
    >
        ${option}
    </select>`
});

type IProps = {
    name?: string;
    id?: string;
    required?: string;
    label?: string;
    children?: React.ReactNode;
};

const SelectElement: FunctionComponent<IProps> = ({ name, id, required, label, children }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                name: name ? `name='${name}'` : '',
                id: id,
                required: required ? `required='${required}'` : '',
                label: globalize.translate(label || ''),
                option: children
            })}
        />
    );
};

export default SelectElement;
