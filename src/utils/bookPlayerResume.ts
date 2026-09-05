import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import type { ApiClient } from 'jellyfin-apiclient';
import { toApi } from './jellyfin-apiclient/compat';

/** Resolve Resume against current user data, preserving explicit start positions. */
export async function getBookResumePosition(
    apiClient: ApiClient,
    item: BaseItemDto,
    startPositionTicks = 0
): Promise<number> {
    if (!item.Id || !startPositionTicks
        || startPositionTicks !== item.UserData?.PlaybackPositionTicks) {
        return startPositionTicks;
    }

    // Restored details views can miss the stop notification and retain an old page.
    const { data } = await getLibraryApi(toApi(apiClient)).getItem({
        itemId: item.Id,
        userId: apiClient.getCurrentUserId()
    });
    return data.UserData?.PlaybackPositionTicks ?? 0;
}
