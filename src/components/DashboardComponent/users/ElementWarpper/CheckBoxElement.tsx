import React, { FunctionComponent } from 'react';
import globalize from '../../../../scripts/globalize';

type IProps = {
    type: string;
    className: string;
    title: string
}

const createCheckBoxElement = ({ type, className, title }) => ({
    __html: `<label>
        <input
            is="emby-checkbox"
            type="${type}"
            class="${className}"
        />
        <span>${globalize.translate(title)}</span>
    </label>`
});

const CheckBoxElement: FunctionComponent<IProps> = ({ type, className, title }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createCheckBoxElement({
                type: type,
                className: className,
                title: title
            })}
        />
    );
};

export default CheckBoxElement;
