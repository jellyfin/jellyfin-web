import React, { FunctionComponent } from 'react';

const createScroller = ({ scrollerclassName, dataHorizontal, dataMousewheel, dataCenterfocus, id, className }: IProps) => ({
    __html: `<div is="emby-scroller"
    class="${scrollerclassName}"
    ${dataHorizontal}
    ${dataMousewheel}
    ${dataCenterfocus}
    >
    <div
        is="emby-itemscontainer"
        ${id}
        class="${className}"
    >
    </div>
    </div>`
});

type IProps = {
    scrollerclassName?: string;
    dataHorizontal?: string;
    dataMousewheel?: string;
    dataCenterfocus?: string;
    id?: string;
    className?: string;
}

const ItemsScrollerContainerElement: FunctionComponent<IProps> = ({ scrollerclassName, dataHorizontal, dataMousewheel, dataCenterfocus, id, className }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createScroller({
                scrollerclassName: scrollerclassName,
                dataHorizontal: dataHorizontal ? `data-horizontal="${dataHorizontal}"` : '',
                dataMousewheel: dataMousewheel ? `data-mousewheel="${dataMousewheel}"` : '',
                dataCenterfocus: dataCenterfocus ? `data-centerfocus="${dataCenterfocus}"` : '',
                id: id ? `id='${id}'` : '',
                className: className
            })}
        />
    );
};

export default ItemsScrollerContainerElement;
