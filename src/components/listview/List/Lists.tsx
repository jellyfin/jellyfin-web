import React, { type FC } from 'react';
import { groupBy } from '../../../utils/lodashUtils';
import { Box } from 'ui-primitives';
import { getIndex } from './listHelper';
import ListGroupHeaderWrapper from './ListGroupHeaderWrapper';
import List from './List';

import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';
import '../listview.css.ts';

interface ListsProps {
    items: ItemDto[];
    listOptions?: ListOptions;
}

const Lists: FC<ListsProps> = ({ items = [], listOptions = {} }) => {
    const groupedData = groupBy(items, item => {
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
                        <ListGroupHeaderWrapper index={groupIndex}>{itemGroupTitle}</ListGroupHeaderWrapper>
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
