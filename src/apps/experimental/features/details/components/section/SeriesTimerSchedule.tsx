import React, { useMemo, type FC } from 'react';

import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import { useGetTimers } from 'hooks/api/liveTvHooks';
import SectionContainer from 'components/common/SectionContainer';

import type { ItemDto } from 'types/base/models/item-dto';

interface SeriesTimerScheduleProps {
    seriesTimerId?: string | null;
}

const SeriesTimerSchedule: FC<SeriesTimerScheduleProps> = ({
    seriesTimerId
}) => {
    const { isLoading, data: timerInfoResult, refetch } = useGetTimers({
        seriesTimerId: seriesTimerId || ''
    });

    const timers = timerInfoResult?.Items as ItemDto[];

    const items = useMemo(() => (
        (timers?.[0]?.SeriesTimerId === seriesTimerId) ? timers : []
    ), [seriesTimerId, timers]);

    if (isLoading) return <Loading />;

    if (!items?.length) return null;

    return (
        <SectionContainer
            isListMode
            sectionHeaderProps={{
                title: globalize.translate('Schedule')
            }}
            itemsContainerProps={{
                className: 'vertical-list',
                queryKey: ['Timers'],
                reloadItems: refetch
            }}
            items={items}
            listOptions={{
                items: items,
                enableUserDataButtons: false,
                image: true,
                imageSource: 'channel',
                showProgramDateTime: true,
                showChannel: false,
                showMediaInfo: true,
                showRuntime: false,
                action: 'none',
                moreButton: false,
                recordButton: false,
                queryKey: ['Timers']
            }}
        />
    );
};

export default SeriesTimerSchedule;
