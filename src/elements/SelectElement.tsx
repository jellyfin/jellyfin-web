import React, { FC } from 'react';

import globalize from 'lib/globalize';

const createSelectElement = ({ name, id, required, label, options }: { name?: string, id?: string, required?: string, label?: string, options?: string | string[] }) => ({
    __html: `<select
        is="emby-select"
        ${name}
        id="${id}"
        ${required}
        label="${label}"
    >
        ${options}
    </select>`
});

type SelectElementProps = {
    name?: string;
    id?: string;
    required?: boolean;
    label: string;
    children?: string | string[];
};

const SelectElement: FC<SelectElementProps> = ({ name, id, required, label, children }) => {
    return (
        <div
            dangerouslySetInnerHTML={createSelectElement({
                name: name ? `name="${name}"` : '',
                id,
                required: required ? 'required="required"' : '',
                label: globalize.translate(label),
                options: children
            })}
        />
    );
};

export default SelectElement;
