import React, { FunctionComponent } from 'react';
import globalize from '../scripts/globalize';

const createInputElement = ({ type, id, label, options }: { type?: string, id?: string, label?: string, options?: string }) => ({
    __html: `<input
        is="emby-input"
        type="${type}"
        id="${id}"
        label="${label}"
        ${options}
    />`
});

type IProps = {
    type?: string;
    id?: string;
    label?: string;
    options?: string
};

const InputElement: FunctionComponent<IProps> = ({ type, id, label, options }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createInputElement({
                type: type,
                id: id,
                label: globalize.translate(label),
                options: options ? options : ''
            })}
        />
    );
};

export default InputElement;
