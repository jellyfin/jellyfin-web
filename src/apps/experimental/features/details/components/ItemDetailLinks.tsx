import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import useItemDetailLinks from '../hooks/useItemDetailLinks';
import globalize from 'lib/globalize';
import CompactMenu from './CompactMenu';
import type { ItemDto } from 'types/base/models/item-dto';
import type { LinkItemList } from '../types/LinkItemList';

interface ItemDetailLinksProps {
    className?: string;
    item: ItemDto;
    context?: CollectionType;
}

const ItemDetailLinks: FC<ItemDetailLinksProps> = ({
    className,
    item,
    context
}) => {
    const itemLinks = useItemDetailLinks({ item, context });

    const renderLinkItem = (itemLink: LinkItemList) => {
        const { label, text, links } = itemLink;
        if (text || links?.length) {
            return (
                <Box
                    key={label}
                    display='flex'
                    maxWidth='44em'
                    mb='0.5em'
                    alignItems='center'
                >
                    <Typography
                        sx={{
                            cursor: 'default',
                            flexGrow: 0,
                            flexShrink: 0,
                            margin: '0 0.6em 0 0',
                            flexBasis: {
                                xs: '4.5em',
                                md: '6.25em'
                            }
                        }}
                    >
                        {globalize.translate(label)}
                    </Typography>
                    {text ? (
                        <Typography component={'span'}>{text}</Typography>
                    ) : (
                        <CompactMenu links={links || []} />
                    )}
                </Box>
            );
        }
    };

    return (
        <Box className={className}>
            {itemLinks.map((itemLink) => renderLinkItem(itemLink))}
        </Box>
    );
};

export default ItemDetailLinks;
