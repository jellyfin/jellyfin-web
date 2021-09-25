import React, { FunctionComponent } from 'react';
import globalize from '../../../../scripts/globalize';

type IProps = {
    type: string;
    className: string;
    title: string
}

const createButtonElement = ({ type, className, title }) => ({
    __html: `<button
        is="emby-button"
        type="${type}"
        class="${className}"
        >
        <span>${globalize.translate(title)}</span>
    </button>`
});

const ButtonElement: FunctionComponent<IProps> = ({ type, className, title }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                type: type,
                className: className,
                title: title
            })}
        />
    );
};

export default ButtonElement;
