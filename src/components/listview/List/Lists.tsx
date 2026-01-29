import React, { type FC } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';
import { Box } from 'ui-primitives';
import { groupBy } from '../../../utils/lodashUtils';
import List from './List';
import ListGroupHeaderWrapper from './ListGroupHeaderWrapper';
import { getIndex } from './listHelper';
import '../listview.css.ts';

interface ListsProps {
    items: ItemDto[];
    listOptions?: ListOptions;
}

const Lists: FC<ListsProps> = ({ items = [], listOptions = {} }) => {
    const groupedData = groupBy(items, (item) => {
        if (listOptions.showIndex) {
            return getIndex(item, listOptions);
        }
        return '';
    });

    return (
        <>
            {Object.entries(groupedData).map(([itemGroupTitle, groupItems], groupIndex) => (
                <Box key={itemGroupTitle || `group-${groupIndex}`}>
                    {itemGroupTitle && (
                        <ListGroupHeaderWrapper index={groupIndex}>
                            {itemGroupTitle}
                        </ListGroupHeaderWrapper>
                    )}
                    {groupItems.map((item, itemIndex) => (
                        <List
                            key={item.Id ?? `item-${groupIndex}-${itemIndex}`}
                            index={itemIndex}
                            item={item}
                            listOptions={listOptions}
                        />
                    ))}
                </Box>
            ))}
        </>
    );
};

export default Lists;
