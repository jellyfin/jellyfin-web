import React, { FunctionComponent } from 'react';

const createButtonElement = ({ id, className }: IProps) => ({
    __html: `<div
        is="emby-itemscontainer"
        id="${id}"
        class="${className}"
    >
    </div>`
});

type IProps = {
    id?: string;
    className?: string;
}

const ItemsContainerElement: FunctionComponent<IProps> = ({ id, className }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                id: id,
                className: className
            })}
        />
    );
};

export default ItemsContainerElement;
