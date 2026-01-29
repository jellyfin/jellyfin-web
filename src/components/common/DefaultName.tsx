import itemHelper from 'components/itemHelper';
import React, { type FC } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import { Box } from 'ui-primitives';
import { isUsingLiveTvNaming } from '../cardbuilder/cardBuilderUtils';

interface DefaultNameProps {
    item: ItemDto;
}

const DefaultName: FC<DefaultNameProps> = ({ item }) => {
    const defaultName = isUsingLiveTvNaming(item.Type)
        ? item.Name
        : itemHelper.getDisplayName(item as any);
    return <Box className="cardText cardDefaultText">{defaultName}</Box>;
};

export default DefaultName;
