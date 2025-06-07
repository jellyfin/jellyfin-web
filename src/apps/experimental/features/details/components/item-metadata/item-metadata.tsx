import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useItemMetadata } from './hooks';
import globalize from 'lib/globalize';
import CompactMenu from '../CompactMenu';
import type { ItemDto } from 'types/base/models/item-dto';
import type { MetadataItem } from './types';

interface ItemMetadataProps {
    className?: string;
    item: ItemDto;
    context?: CollectionType;
}

export const ItemMetadata: FC<ItemMetadataProps> = ({
    className,
    item,
    context
}) => {
    const metadataItems = useItemMetadata({
        itemType: item.Type,
        productionLocations: item.ProductionLocations || [],
        externalUrls: item.ExternalUrls || [],
        studios: item.Studios || [],
        tags: item.Tags || [],
        genreItems: item.GenreItems || [],
        people: item.People || [],
        airDays: item.AirDays || [],
        airTime: item.AirTime,
        status: item.Status,
        premiereDate: item.PremiereDate,
        endDate: item.EndDate,
        serverId: item.ServerId,
        context
    });

    const renderMetadataItem = (metadataItem: MetadataItem) => {
        const { labelKey, text, linkItems } = metadataItem;
        if (text || linkItems?.length) {
            return (
                <Box key={labelKey} className='detailsGroupItem'>
                    <Typography className='label'>
                        {globalize.translate(labelKey)}
                    </Typography>
                    <Box className='content'>
                        {text ? (
                            <Typography component={'span'}>{text}</Typography>
                        ) : (
                            <CompactMenu linkItems={linkItems || []} />
                        )}
                    </Box>
                </Box>
            );
        }
    };

    return (
        <Box className={className}>
            {metadataItems.map((metadataItem) => renderMetadataItem(metadataItem))}
        </Box>
    );
};
