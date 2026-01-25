import React, { FC } from 'react';

const createScroller = ({
    scrollerclassName,
    dataHorizontal,
    dataMousewheel,
    dataCenterfocus,
    dataId,
    className
}: IProps) => ({
    __html: `<div is="emby-scroller"
    class="${scrollerclassName}"
    ${dataHorizontal}
    ${dataMousewheel}
    ${dataCenterfocus}
    >
        <div
            is="emby-itemscontainer"
            class="${className}"
            ${dataId}
        >
        </div>
    </div>`
});

interface IProps {
    scrollerclassName?: string;
    dataHorizontal?: string;
    dataMousewheel?: string;
    dataCenterfocus?: string;
    dataId?: string;
    className?: string;
}

const ItemsScrollerContainerElement: FC<IProps> = ({
    scrollerclassName,
    dataHorizontal,
    dataMousewheel,
    dataCenterfocus,
    dataId,
    className
}) => {
    return (
        <div
            dangerouslySetInnerHTML={createScroller({
                scrollerclassName: scrollerclassName,
                dataHorizontal: dataHorizontal ? `data-horizontal="${dataHorizontal}"` : '',
                dataMousewheel: dataMousewheel ? `data-mousewheel="${dataMousewheel}"` : '',
                dataCenterfocus: dataCenterfocus ? `data-centerfocus="${dataCenterfocus}"` : '',
                dataId: dataId ? `data-id="${dataId}"` : '',
                className: className
            })}
        />
    );
};

export default ItemsScrollerContainerElement;
