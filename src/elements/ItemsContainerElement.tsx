import '../elements/emby-itemscontainer/emby-itemscontainer';
import React, { FC } from 'react';

const createElement = ({ className, dataId }: IProps) => ({
    __html: `<div
        is="emby-itemscontainer"
        class="${className}"
        ${dataId}
    >
    </div>`
});

interface IProps {
    className?: string;
    dataId?: string;
}

const ItemsContainerElement: FC<IProps> = ({ className, dataId }) => {
    return (
        <div
            dangerouslySetInnerHTML={createElement({
                className: className,
                dataId: dataId ? `data-id="${dataId}"` : ''
            })}
        />
    );
};

export default ItemsContainerElement;
