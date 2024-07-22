import React, { useEffect, type FC } from 'react';
import { useApi } from 'hooks/useApi';
import * as userSettings from 'scripts/settings/userSettings';
import dom from 'scripts/dom';
import layoutManager from 'components/layoutManager';
import { clearBackdrop, setBackdrops } from 'components/backdrop/backdrop';
import { getItemBackdropImageUrl } from '../utils/items';
import Image from 'components/common/Image';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';

interface DetailsBannerProps {
    item: ItemDto;
}

const DetailsBanner: FC<DetailsBannerProps> = ({ item }) => {
    const { api } = useApi();
    const imgInfo = getItemBackdropImageUrl(item, api, false, {
        maxWidth: dom.getScreenWidth()
    });

    const imgUrl = imgInfo.imgUrl;

    useEffect(() => {
        if (!layoutManager.mobile && dom.getWindowSize().innerWidth >= 1000) {
            const isBannerEnabled =
            !layoutManager.tv && userSettings.detailsBanner();
            setBackdrops([item], null, isBannerEnabled);
        } else {
            clearBackdrop();
        }
    }, [item]);

    return (
        <div className='item-backdrop'>
            {layoutManager.mobile
                && userSettings.detailsBanner()
                && !(
                    item.Type === ItemKind.Person || item.Type === ItemKind.Book
                )
                && Boolean(imgUrl) && (
                <Image className='item-backdrop-container' imgUrl={imgUrl || ''} containImage={false} />
            )}
        </div>
    );
};
export default DetailsBanner;
