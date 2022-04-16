import React, { FunctionComponent } from 'react';

const createButtonElement = ({ is, type, className, title, icon }: IProps) => ({
    __html: `<button
        is="${is}"
        type="${type}"
        class="${className}"
        title="${title}"
        >
        <span class="${icon}"></span>
    </button>`
});

type IProps = {
    is?: string;
    type?: string;
    className?: string;
    title?: string
    icon?: string
}

const PaperButtonElement: FunctionComponent<IProps> = ({ is, type, className, title, icon }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                is: is,
                type: type ? type : '',
                className: className,
                title: title,
                icon: icon
            })}
        />
    );
};

export default PaperButtonElement;
