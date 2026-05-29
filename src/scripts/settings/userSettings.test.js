import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/events.ts', () => ({ default: { trigger: vi.fn() } }));
vi.mock('../browser', () => ({ default: {} }));
vi.mock('./appSettings', () => ({ default: { get: vi.fn(), set: vi.fn() } }));

import appSettings from './appSettings';
import { UserSettings } from './userSettings';

describe('UserSettings', () => {
    let settings;

    beforeEach(() => {
        settings = new UserSettings();
        vi.clearAllMocks();
    });

    describe('shouldUseOriginalTitles', () => {
        it('reads from server display preferences when they are loaded', () => {
            settings.displayPrefs = { CustomPrefs: { useOriginalTitles: 'true' } };

            expect(settings.shouldUseOriginalTitles()).toBe(true);
            expect(appSettings.get).not.toHaveBeenCalled();
        });

        it('reads false from server display preferences when set to false', () => {
            settings.displayPrefs = { CustomPrefs: { useOriginalTitles: 'false' } };

            expect(settings.shouldUseOriginalTitles()).toBe(false);
            expect(appSettings.get).not.toHaveBeenCalled();
        });

        it('server preference takes precedence over local storage value', () => {
            settings.displayPrefs = { CustomPrefs: { useOriginalTitles: 'true' } };
            appSettings.get.mockReturnValue('false');

            expect(settings.shouldUseOriginalTitles()).toBe(true);
        });

        it('falls back to local storage when server preferences are not loaded', () => {
            settings.displayPrefs = null;
            appSettings.get.mockReturnValue('true');

            expect(settings.shouldUseOriginalTitles()).toBe(true);
            expect(appSettings.get).toHaveBeenCalled();
        });
    });
});
