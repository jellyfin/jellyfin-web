import type { AxiosRequestConfig } from 'axios';
import { TimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useQuery } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';
import datetime from 'scripts/datetime';

export type GroupsTimers = {
    name: string;
    timerInfo: TimerInfoDto[];
};

function groupsTimers(timers: TimerInfoDto[], indexByDate?: boolean) {
    const items = timers.map(function (t) {
        t.Type = 'Timer';
        return t;
    });
    const groups: GroupsTimers[] = [];
    let currentGroupName = '';
    let currentGroup: TimerInfoDto[] = [];

    for (const item of items) {
        let dateText = '';

        if (indexByDate !== false && item.StartDate) {
            try {
                const premiereDate = datetime.parseISO8601Date(
                    item.StartDate,
                    true
                );
                dateText = datetime.toLocaleDateString(premiereDate, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (err) {
                console.error(
                    'error parsing premiereDate:'
                        + item.StartDate
                        + '; error: '
                        + err
                );
            }
        }

        if (dateText != currentGroupName) {
            if (currentGroup.length) {
                groups.push({
                    name: currentGroupName,
                    timerInfo: currentGroup
                });
            }

            currentGroupName = dateText;
            currentGroup = [item];
        } else {
            currentGroup.push(item);
        }
    }

    if (currentGroup.length) {
        groups.push({
            name: currentGroupName,
            timerInfo: currentGroup
        });
    }
    return groups;
}

const fetchGetTimers = async (
    currentApi: JellyfinApiContext,
    indexByDate?: boolean,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getLiveTvApi(api).getTimers(
            {
                isActive: false,
                isScheduled: true
            },
            {
                signal: options?.signal
            }
        );

        const timers = response.data.Items ?? [];

        return groupsTimers(timers, indexByDate);
    }
};

export const useGetTimers = (
    isUpcomingRecordingsEnabled: boolean,
    indexByDate?: boolean
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Timers', { isUpcomingRecordingsEnabled, indexByDate }],
        queryFn: ({ signal }) =>
            isUpcomingRecordingsEnabled ?
                fetchGetTimers(currentApi, indexByDate, { signal }) :
                []
    });
};
