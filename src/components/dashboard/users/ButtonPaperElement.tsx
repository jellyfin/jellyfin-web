import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

const createButtonElement = ({ is, className, title, icon }) => ({
    __html: `<button
        is="${is}"
        class="${className}"
        title="${title}">
        <span class="material-icons ${icon}"></span>
    </button>`
});

type IProps = {
    is?: string;
    title?: string;
    className?: string;
    icon?: string,
}

const ButtonPaperElement: FunctionComponent<IProps> = ({ is, className, title, icon }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                is: is,
                className: className,
                title: globalize.translate(title),
                icon: icon
            })}
        />
    );
};

export default ButtonPaperElement;
