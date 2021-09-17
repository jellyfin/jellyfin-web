import React, { FunctionComponent } from 'react';
import globalize from '../../../../../scripts/globalize';

type IProps = {
    type: string;
    id: string;
    label: string;
    autoComplete: string;
    options: string
}

const createInputElement = ({ type, id, label, autoComplete, options }) => ({
    __html: `<input
        is="emby-input"
        type="${type}"
        id="${id}"
        label="${globalize.translate(label)}"
        autocomplete="${autoComplete}"
        ${options}
    />`
});

const InputElement: FunctionComponent<IProps> = ({ type, id, label, autoComplete, options }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createInputElement({
                type: type,
                id: id,
                label: label,
                autoComplete: autoComplete,
                options: options
            })}
        />
    );
};

export default InputElement;
