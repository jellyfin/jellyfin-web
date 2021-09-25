import React, { FunctionComponent } from 'react';
import globalize from '../../../../scripts/globalize';

type IProps = {
    type?: string;
    id?: string;
    label?: string;
    options?: string
}

const createInputElement = ({ type, id, label, options }) => ({
    __html: `<input
        is="emby-input"
        type="${type}"
        id="${id}"
        label="${globalize.translate(label)}"
        ${options}
    />`
});

const InputElement: FunctionComponent<IProps> = ({ type, id, label, options }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createInputElement({
                type: type,
                id: id,
                label: label,
                options: options
            })}
        />
    );
};

export default InputElement;
