import { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';
import { describe, expect, it, vi } from 'vitest';

import type { UserSettings } from 'scripts/settings/userSettings';

import { getId, getMediaSegmentAction } from './mediaSegmentSettings';
import { MediaSegmentAction } from '../constants/mediaSegmentAction';

const TEST_SEGMENT_TYPES = [
    ...Object.values(MediaSegmentType),
    'FutureSegmentType' as MediaSegmentType
];

function createUserSettings(action?: string | null) {
    const get = vi.fn().mockReturnValue(action);
    const set = vi.fn();

    return {
        settings: { get, set } as unknown as UserSettings,
        get,
        set
    };
}

describe('getId()', () => {
    it.each(TEST_SEGMENT_TYPES)('Should preserve the existing preference key for %s', type => {
        expect(getId(type)).toBe(`segmentTypeAction__${type}`);
    });
});

describe('getMediaSegmentAction()', () => {
    describe.each(TEST_SEGMENT_TYPES)('%s', type => {
        it.each([undefined, null, ''])('Should ask to skip when the stored value is %s', value => {
            const { settings, get, set } = createUserSettings(value);

            expect(getMediaSegmentAction(settings, type)).toBe(MediaSegmentAction.AskToSkip);
            expect(get).toHaveBeenCalledWith(getId(type), false);
            expect(set).not.toHaveBeenCalled();
        });

        it.each(Object.values(MediaSegmentAction))('Should preserve a saved %s', action => {
            const { settings, get, set } = createUserSettings(action);

            expect(getMediaSegmentAction(settings, type)).toBe(action);
            expect(get).toHaveBeenCalledWith(getId(type), false);
            expect(set).not.toHaveBeenCalled();
        });
    });
});
