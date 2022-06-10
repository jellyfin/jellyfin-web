import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createButtonElement = ({ type, className, title, leftIcon, rightIcon }: { type?: string, className?: string, title?: string, leftIcon?: string, rightIcon?: string }) => ({
    __html: `<button
        is="emby-button"
        type="${type}"
        class="${className}"
        >
        ${leftIcon}
        <span>${title}</span>
        ${rightIcon}
    </button>`
});

type IProps = {
    type?: string;
    className?: string;
    title?: string;
    leftIcon?: string;
    rightIcon?: string;
}

const ButtonElement: FunctionComponent<IProps> = ({ type, className, title, leftIcon, rightIcon }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                type: type,
                className: className,
                title: globalize.translate(title),
                leftIcon: leftIcon ? `<span class="material-icons ${leftIcon}" aria-hidden="true"></span>` : '',
                rightIcon: rightIcon ? `<span class="material-icons ${rightIcon}" aria-hidden="true"></span>` : ''
            })}
        />
    );
};

export default ButtonElement;
