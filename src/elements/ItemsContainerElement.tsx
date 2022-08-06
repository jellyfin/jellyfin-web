import React, { FunctionComponent } from 'react';

const createElement = ({ id, className }: IProps) => ({
    __html: `<div
        is="emby-itemscontainer"
        ${id}
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
            dangerouslySetInnerHTML={createElement({
                id: id ? `id='${id}'` : '',
                className: className
            })}
        />
    );
};

export default ItemsContainerElement;
