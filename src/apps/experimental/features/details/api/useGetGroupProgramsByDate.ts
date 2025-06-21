import type { AxiosRequestConfig } from 'axios';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useQuery } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';
import datetime from 'scripts/datetime';
import type { NullableString } from 'types/base/common/shared/types';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';
import type { ItemDto } from 'types/base/models/item-dto';
import { safeParseDate } from 'utils/safeParseDate';

export type GroupsProgram = {
    name: string;
    items: ItemDto[];
};

const formatGroupDate = (date: Date): string =>
    datetime.toLocaleDateString(date, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

function groupProgramsByDate(items: ItemDto[]): GroupsProgram[] {
    return items.reduce<GroupsProgram[]>((groups, item) => {
        const date = safeParseDate(item.StartDate);

        if (!date) {
            console.warn('Skipping item with invalid date:', item.Id);
            return groups;
        }

        const name = formatGroupDate(date);
        const lastGroup = groups[groups.length - 1];

        if (!lastGroup || lastGroup.name !== name) {
            groups.push({
                name,
                items: [item]
            });
        } else {
            lastGroup.items.push(item);
        }

        return groups;
    }, []);
}

const getLiveTvPrograms = async (
    apiContext: JellyfinApiContext,
    channelIds: NullableString,
    options?: AxiosRequestConfig
) => {
    const { api, user } = apiContext;
    if (!api) throw new Error('No API instance available');
    if (!user?.Id) throw new Error('No item User ID provided');
    if (!channelIds) throw new Error('No channel IDs provided');

    const response = await getLiveTvApi(api).getLiveTvPrograms(
        {
            userId: user.Id,
            enableTotalRecordCount: false,
            channelIds: [channelIds],
            hasAired: false,
            sortBy: [ItemSortBy.StartDate],
            enableImages: false,
            imageTypeLimit: 0,
            enableUserData: false
        },
        options
    );

    const itemResult = response.data as ItemDtoQueryResult;
    const items = itemResult.Items || [];

    return groupProgramsByDate(items);
};

export const useGetGroupProgramsByDate = (channelIds: NullableString) => {
    const apiContext = useApi();
    return useQuery({
        queryKey: ['GroupProgramsByDate', channelIds],
        queryFn: ({ signal }) =>
            getLiveTvPrograms(apiContext, channelIds, { signal }),
        enabled: !!apiContext.api && !!apiContext.user?.Id && !!channelIds
    });
};
