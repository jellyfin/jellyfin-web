import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC } from 'react';
import Icon from '@mui/material/Icon';
import imageHelper from 'utils/image';
import DefaultName from './DefaultName';
import type { ItemDto } from 'types/base/models/item-dto';

interface DefaultIconTextProps {
    item: ItemDto;
    defaultCardImageIcon?: string;
}

const DefaultIconText: FC<DefaultIconTextProps> = ({
    item,
    defaultCardImageIcon
}) => {
    if (item.CollectionType) {
        return (
            <Icon
                className='cardImageIcon'
                sx={{ color: 'inherit', fontSize: '5em' }}
                aria-hidden='true'
            >
                {imageHelper.getLibraryIcon(item.CollectionType)}
            </Icon>
        );
    }

    if (item.Type && !(item.Type === BaseItemKind.TvChannel || item.Type === BaseItemKind.Studio )) {
        return (
            <Icon
                className='cardImageIcon'
                sx={{ color: 'inherit', fontSize: '5em' }}
                aria-hidden='true'
            >
                {imageHelper.getItemTypeIcon(item.Type)}
            </Icon>
        );
    }

    if (defaultCardImageIcon) {
        return (
            <Icon
                className='cardImageIcon'
                sx={{ color: 'inherit', fontSize: '5em' }}
                aria-hidden='true'
            >
                {defaultCardImageIcon}
            </Icon>
        );
    }

    return <DefaultName item={item} />;
};

export default DefaultIconText;
