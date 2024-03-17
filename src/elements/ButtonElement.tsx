import React, { type FC } from 'react';
import globalize from '../scripts/globalize';

const createButtonElement = ({ type, id, className, title, leftIcon, rightIcon }: ButtonElementProps) => ({
    __html: `<button
        is="emby-button"
        type="${type}"
        ${id}
        class="${className}"
        >
        ${leftIcon}
        <span>${title}</span>
        ${rightIcon}
    </button>`
});

interface ButtonElementProps {
    type?: string;
    id?: string;
    className?: string;
    title?: string;
    leftIcon?: string;
    rightIcon?: string;
}

const ButtonElement: FC<ButtonElementProps> = ({ type, id, className, title, leftIcon, rightIcon }) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                type: type,
                id: id ? `id="${id}"` : '',
                className: className,
                title: globalize.translate(title),
                leftIcon: leftIcon ? `<span class="material-icons ${leftIcon}" aria-hidden="true"></span>` : '',
                rightIcon: rightIcon ? `<span class="material-icons ${rightIcon}" aria-hidden="true"></span>` : ''
            })}
        />
    );
};

export default ButtonElement;
