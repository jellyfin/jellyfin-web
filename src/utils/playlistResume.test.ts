import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { describe, expect, it } from 'vitest';

import { getPlaylistResumePoint } from './playlistResume';

const item = (played?: boolean, position?: number) => ({
    UserData: {
        Played: played,
        PlaybackPositionTicks: position
    }
}) as BaseItemDto;

describe('getPlaylistResumePoint', () => {
    it('should start at the first entry when nothing is played', () => {
        const point = getPlaylistResumePoint([item(false), item(false), item(false)]);

        expect(point.index).toBe(0);
        expect(point.startPositionTicks).toBeUndefined();
    });

    it('should skip played entries', () => {
        const point = getPlaylistResumePoint([item(true), item(true), item(false), item(false)]);

        expect(point.index).toBe(2);
        expect(point.startPositionTicks).toBeUndefined();
    });

    it('should resume an entry that was stopped part way through', () => {
        const point = getPlaylistResumePoint([item(true), item(false, 1234), item(false)]);

        expect(point.index).toBe(1);
        expect(point.startPositionTicks).toBe(1234);
    });

    it('should start at the first entry when every entry is played', () => {
        const point = getPlaylistResumePoint([item(true), item(true)]);

        expect(point.index).toBe(0);
        expect(point.startPositionTicks).toBeUndefined();
    });

    it('should treat an entry without user data as unplayed', () => {
        const point = getPlaylistResumePoint([item(true), {} as BaseItemDto]);

        expect(point.index).toBe(1);
    });
});
