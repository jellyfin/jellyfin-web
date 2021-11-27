import React, { FunctionComponent } from 'react';

const createItemsContainerElement = ({ is, className, style }) => ({
    __html: `<div
        is="${is}"
        class="${className}"
        style="${style}">
    </div>`
});

type IProps = {
    is?: string;
    style?: string;
    className?: string;
}

const ItemsContainerElement: FunctionComponent<IProps> = ({ is, className, style }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createItemsContainerElement({
                is: is,
                className: className,
                style: style
            })}
        />
    );
};

export default ItemsContainerElement;
