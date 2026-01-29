import React, { type FC } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';
import ListContent from './ListContent';
import ListWrapper from './ListWrapper';
import useList from './useList';
import '../../mediainfo/mediainfo.scss';
import '../../guide/programs.scss';

interface ListProps {
    index: number;
    item: ItemDto;
    listOptions?: ListOptions;
}

const List: FC<ListProps> = ({ index, item, listOptions = {} }) => {
    const { getListdWrapperProps, getListContentProps } = useList({ item, listOptions });
    const listWrapperProps = getListdWrapperProps();
    const listContentProps = getListContentProps();

    return (
        <ListWrapper index={index} {...listWrapperProps}>
            <ListContent {...listContentProps} />
        </ListWrapper>
    );
};

export default List;
