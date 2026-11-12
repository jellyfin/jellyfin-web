import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

export interface PlaylistResumePoint {
    index: number;
    startPositionTicks?: number;
}

/**
 * Returns the position to resume a playlist from: the first entry the user has
 * not finished, or the first entry when every entry is played.
 */
export const getPlaylistResumePoint = (items: BaseItemDto[]): PlaylistResumePoint => {
    const index = items.findIndex((item) => !item.UserData?.Played);

    if (index === -1) {
        return { index: 0 };
    }

    return {
        index,
        startPositionTicks: items[index].UserData?.PlaybackPositionTicks || undefined
    };
};
