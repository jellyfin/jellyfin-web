import React, { FunctionComponent } from 'react';

import globalize from 'lib/globalize';

const createButtonElement = ({ type, id, className, title, leftIcon, rightIcon }: IProps) => ({
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

type IProps = {
    type?: string;
    id?: string;
    className?: string;
    title?: string;
    leftIcon?: string;
    rightIcon?: string;
    onClick?: () => void;
};

const ButtonElement: FunctionComponent<IProps> = ({ type, id, className, title, leftIcon, rightIcon, onClick }: IProps) => {
    const button = createButtonElement({
        type: type,
        id: id ? `id="${id}"` : '',
        className: className,
        title: globalize.translate(title),
        leftIcon: leftIcon ? `<span class="material-icons ${leftIcon}" aria-hidden="true"></span>` : '',
        rightIcon: rightIcon ? `<span class="material-icons ${rightIcon}" aria-hidden="true"></span>` : ''
    });

    if (onClick !== undefined) {
        return (
            <button
                style={{ all: 'unset' }}
                dangerouslySetInnerHTML={button}
                onClick={onClick}
            />
        );
    }

    return (
        <div
            dangerouslySetInnerHTML={button}
        />
    );
};

export default ButtonElement;
