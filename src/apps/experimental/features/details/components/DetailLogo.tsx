import React, { type FC, useMemo } from 'react';
import { useApi } from 'hooks/useApi';
import { getCardLogoUrl } from 'components/cardbuilder/Card/cardHelper';
import Image from 'components/common/image/Image';
import type { ItemDto } from 'types/base/models/item-dto';

interface DetailLogoProps {
    item: ItemDto;
}

const DetailLogo: FC<DetailLogoProps> = ({ item }) => {
    const { api } = useApi();
    const { logoUrl } = useMemo(
        () =>
            getCardLogoUrl(item, api, {
                showLogo: true,
                height: 310
            }),
        [item, api]
    );

    return logoUrl && (
        <div className='item-logo'>
            <Image imgUrl={logoUrl} className='item-logo__container' containImage />
        </div>
    );
};
export default DetailLogo;
