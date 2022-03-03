import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createButtonElement = ({ type, className, title }: { type?: string, className?: string, title?: string }) => ({
    __html: `<button
        is="emby-button"
        type="${type}"
        class="${className}"
        >
        <span>${title}</span>
    </button>`
});

type IProps = {
    type?: string;
    className?: string;
    title?: string
}

const ButtonElement: FunctionComponent<IProps> = ({ type, className, title }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                type: type,
                className: className,
                title: globalize.translate(title)
            })}
        />
    );
};

export default ButtonElement;
