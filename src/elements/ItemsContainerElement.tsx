import React, { FC } from 'react';

const createElement = ({ className }: IProps) => ({
    __html: `<div
        is="emby-itemscontainer"
        class="${className}"
    >
    </div>`
});

interface IProps {
    className?: string;
}

const ItemsContainerElement: FC<IProps> = ({ className }) => {
    return (
        <div
            dangerouslySetInnerHTML={createElement({
                className: className
            })}
        />
    );
};

export default ItemsContainerElement;
