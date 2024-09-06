import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import React, { useRef, type FC } from 'react';
import { useApi } from 'hooks/useApi';
import Box from '@mui/material/Box';
import ItemBackdrop from '../components/ItemBackdrop';
import ItemLogo from '../components/ItemLogo';
import { TrackSelectionsProvider } from '../components/track-selections';
import DetailPrimaryContainer from '../components/DetailPrimaryContainer';
import DetailSecondaryContainer from '../components/DetailSecondaryContainer';

import SeriesTimerSchedule from '../components/section/SeriesTimerSchedule';
import NextUp from '../components/section/NextUp';

import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';

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

                            {item.Id
                                && item.Type === ItemKind.SeriesTimer
                                && user?.Policy?.EnableLiveTvManagement && (
                                <SeriesTimerSchedule
                                    seriesTimerId={item.Id}
                                />
                            )}

                            {item.Id && item.Type === ItemKind.Series && (
                                <NextUp seriesId={item.Id} userId={user?.Id} />
                            )}
                        </Box>
                    </Box>
                </Box>
            </TrackSelectionsProvider>
        </Box>
    );
};
