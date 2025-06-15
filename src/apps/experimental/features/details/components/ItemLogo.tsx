import React, { type FC, useMemo } from 'react';
import Box from '@mui/material/Box';
import { useApi } from 'hooks/useApi';
import { getCardLogoUrl } from 'components/cardbuilder/Card/cardHelper';
import { Image } from 'components/common/image';
import type { ItemDto } from 'types/base/models/item-dto';

interface ItemLogoProps {
    item: ItemDto;
}

const ItemLogo: FC<ItemLogoProps> = ({ item }) => {
    const { api } = useApi();
    const { logoUrl } = useMemo(
        () =>
            getCardLogoUrl(item, api, {
                showLogo: true,
                height: 310
            }),
        [item, api]
    );

    if (!logoUrl) return null;

    return (
        <Box className='item-logo'>
            <Image imgUrl={logoUrl} className='item-logo__container' containImage />
        </Box>
    );
};

export default ItemLogo;
