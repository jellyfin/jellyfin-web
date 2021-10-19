import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createCheckBoxElement = ({ type, className, title }) => ({
    __html: `<label>
        <input
            is="emby-checkbox"
            type="${type}"
            class="${className}"
        />
        <span>${title}</span>
    </label>`
});

type IProps = {
    type?: string;
    className?: string;
    title?: string
}

const CheckBoxElement: FunctionComponent<IProps> = ({ type, className, title }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createCheckBoxElement({
                type: type,
                className: className,
                title: globalize.translate(title)
            })}
        />
    );
};

export default CheckBoxElement;
