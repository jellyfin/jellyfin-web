import React, { FC } from 'react';

const createScroller = ({ scrollerclassName, dataHorizontal, dataMousewheel, dataCenterfocus, className }: IProps) => ({
    __html: `<div is="emby-scroller"
    class="${scrollerclassName}"
    ${dataHorizontal}
    ${dataMousewheel}
    ${dataCenterfocus}
    >
        <div
            is="emby-itemscontainer"
            class="${className}"
        >
        </div>
    </div>`
});

interface IProps {
    scrollerclassName?: string;
    dataHorizontal?: string;
    dataMousewheel?: string;
    dataCenterfocus?: string;
    className?: string;
}

const ItemsScrollerContainerElement: FC<IProps> = ({ scrollerclassName, dataHorizontal, dataMousewheel, dataCenterfocus, className }) => {
    return (
        <div
            dangerouslySetInnerHTML={createScroller({
                scrollerclassName: scrollerclassName,
                dataHorizontal: dataHorizontal ? `data-horizontal="${dataHorizontal}"` : '',
                dataMousewheel: dataMousewheel ? `data-mousewheel="${dataMousewheel}"` : '',
                dataCenterfocus: dataCenterfocus ? `data-centerfocus="${dataCenterfocus}"` : '',
                className: className
            })}
        />
    );
};

export default ItemsScrollerContainerElement;
