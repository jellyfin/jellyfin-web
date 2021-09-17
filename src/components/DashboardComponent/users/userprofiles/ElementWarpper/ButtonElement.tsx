import React, { FunctionComponent } from 'react';
import globalize from '../../../../../scripts/globalize';

type IProps = {
    type: string;
    id: string;
    className: string;
    title: string
}

const createButtonElement = ({ type, id, className, title }) => ({
    __html: `<button
        is="emby-button"
        type="${type}"
        id="${id}"
        class="${className}"
        >
        <span>${globalize.translate(title)}</span>
    </button>`
});

const ButtonElement: FunctionComponent<IProps> = ({ type, id, className, title }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                type: type,
                id: id,
                className: className,
                title: title
            })}
        />
    );
};

export default ButtonElement;
