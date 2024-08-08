import type { AxiosRequestConfig } from 'axios';
import {
    BaseItemDto,
    ItemFields,
    ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { useQuery } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';
import datetime from 'scripts/datetime';
import globalize from 'scripts/globalize';
import { ParentId } from 'types/library';

type GroupsUpcomingEpisodes = {
    name: string;
    items: BaseItemDto[];
};

function groupsUpcomingEpisodes(items: BaseItemDto[]) {
    const groups: GroupsUpcomingEpisodes[] = [];
    let currentGroupName = '';
    let currentGroup: BaseItemDto[] = [];

    for (const item of items) {
        let dateText = '';

        if (item.PremiereDate) {
            try {
                const premiereDate = datetime.parseISO8601Date(
                    item.PremiereDate,
                    true
                );
                dateText = datetime.isRelativeDay(premiereDate, -1) ?
                    globalize.translate('Yesterday') :
                    datetime.toLocaleDateString(premiereDate, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    });
            } catch (err) {
                console.error('error parsing timestamp for upcoming tv shows');
            }
        }

        if (dateText != currentGroupName) {
            if (currentGroup.length) {
                groups.push({
                    name: currentGroupName,
                    items: currentGroup
                });
            }

            currentGroupName = dateText;
            currentGroup = [item];
        } else {
            currentGroup.push(item);
        }
    }
    return groups;
}

const fetchGetGroupsUpcomingEpisodes = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getTvShowsApi(api).getUpcomingEpisodes(
            {
                userId: user.Id,
                limit: 25,
                fields: [ItemFields.AirTime],
                parentId: parentId ?? undefined,
                imageTypeLimit: 1,
                enableImageTypes: [
                    ImageType.Primary,
                    ImageType.Backdrop,
                    ImageType.Thumb
                ]
            },
            {
                signal: options?.signal
            }
        );
        const items = response.data.Items ?? [];

        return groupsUpcomingEpisodes(items);
    }
};

export const useGetGroupsUpcomingEpisodes = (parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['GroupsUpcomingEpisodes', parentId],
        queryFn: ({ signal }) =>
            fetchGetGroupsUpcomingEpisodes(currentApi, parentId, { signal }),
        enabled: !!parentId
    });
};
