import React, { useEffect, type FC } from 'react';
import Box from '@mui/material/Box';
import { useApi } from 'hooks/useApi';
import * as userSettings from 'scripts/settings/userSettings';
import dom from 'scripts/dom';
import layoutManager from 'components/layoutManager';
import { clearBackdrop, setBackdrops } from 'components/backdrop/backdrop';
import { getItemBackdropImageUrl } from '../utils/items';
import Image from 'components/common/image/Image';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';

interface DetailsBannerProps {
    item: ItemDto;
    detailContainerRef: React.RefObject<HTMLDivElement>;
}

const DetailsBanner: FC<DetailsBannerProps> = ({ item, detailContainerRef }) => {
    const { api } = useApi();
    const imgInfo = getItemBackdropImageUrl(item, api, false, {
        maxWidth: dom.getScreenWidth()
    });

    const imgUrl = imgInfo.imgUrl;

    useEffect(() => {
        const detailContainer = detailContainerRef.current as HTMLDivElement;
        if (!layoutManager.mobile && dom.getWindowSize().innerWidth >= 1000) {
            const isBannerEnabled =
                !layoutManager.tv && userSettings.detailsBanner();

            detailContainer.classList.toggle(
                'noBackdropTransparency',
                isBannerEnabled && !userSettings.enableBackdrops()
            );
            setBackdrops([item], null, null, isBannerEnabled);
        } else {
            clearBackdrop();
        }
    }, [detailContainerRef, item]);

    return (
        <Box className='item-backdrop'>
            {layoutManager.mobile
                && userSettings.detailsBanner()
                && !( item.Type === ItemKind.Person || item.Type === ItemKind.Book )
                && imgUrl && (
                <Image
                    className='item-backdrop__container'
                    imgUrl={imgUrl}
                />
            )}
        </Box>
    );
};
export default DetailsBanner;
