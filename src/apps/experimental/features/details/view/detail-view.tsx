import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import React, { useRef, type FC } from 'react';
import { useApi } from 'hooks/useApi';
import Box from '@mui/material/Box';
import ItemBackdrop from '../components/ItemBackdrop';
import ItemLogo from '../components/ItemLogo';
import { TrackSelectionsProvider } from '../components/track-selections';
import DetailPrimaryContainer from '../components/DetailPrimaryContainer';
import DetailSecondaryContainer from '../components/DetailSecondaryContainer';
import type { ItemDto } from 'types/base/models/item-dto';

import './details.scss';

interface DetailViewProps {
    item: ItemDto;
    paramId: string | null;
    context?: CollectionType;
}

export const DetailView: FC<DetailViewProps> = ({ item, paramId, context }) => {
    const { user } = useApi();
    const detailContainerRef = useRef<HTMLDivElement | null>(null);
    return (
        <Box ref={detailContainerRef} className='detail-container'>
            <ItemBackdrop item={item} detailContainerRef={detailContainerRef} />
            <ItemLogo item={item} />
            <TrackSelectionsProvider item={item}>
                <Box className='detailPageWrapperContainer'>
                    <DetailPrimaryContainer item={item} paramId={paramId} />
                    <Box className='detailPageSecondaryContainer padded-bottom-page'>
                        <Box className='detailPageContent'>
                            <DetailSecondaryContainer
                                item={item}
                                context={context}
                                user={user}
                            />
                        </Box>
                    </Box>
                </Box>
            </TrackSelectionsProvider>
        </Box>
    );
};
