import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import * as settings from './userSettings';

type SettingFunc<T> = (val?: T) => T | void;

describe('UserSettings', () => {
    beforeAll(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    function testBoolean(func: SettingFunc<boolean>, defaultValue: boolean) {
        describe(func.name, () => {
            it(`defaults to ${JSON.stringify(defaultValue)}`, () => {
                expect(func()).toBe(defaultValue);
            });

            it('can save then load', () => {
                func(true);
                expect(func()).toBe(true);

                func(false);
                expect(func()).toBe(false);
            });

            it(`loads broken values as ${JSON.stringify(defaultValue)}`, () => {
                vi.spyOn(settings, 'get').mockReturnValueOnce('broken');
                expect(func()).toBe(defaultValue);
            });
        });
    }
    function testNumber(func: SettingFunc<number>, defaultValue: number) {
        describe(func.name, () => {
            it(`defaults to ${JSON.stringify(defaultValue)}`, () => {
                expect(func()).toBe(defaultValue);
            });

            it('can save then load', () => {
                func(45);
                expect(func()).toBe(45);
            });

            it('supports setting 0', () => {
                func(0);
                expect(func()).toBe(0);
            });

            it(`loads broken values as ${JSON.stringify(defaultValue)}`, () => {
                vi.spyOn(settings, 'get').mockReturnValueOnce('broken');
                expect(func()).toBe(defaultValue);
            });
        });
    }

    function testString(func: SettingFunc<string | null>, defaultValue?: string | null) {
        defaultValue ??= null;

        describe(func.name, () => {
            it(`defaults to ${JSON.stringify(defaultValue)}`, () => {
                expect(func()).toBe(defaultValue);
            });

            it('can save then load', () => {
                func('hello');
                expect(func()).toBe('hello');
            });

            if (defaultValue) {
                it(`empty string becomes ${JSON.stringify(defaultValue)}`, () => {
                    func('');
                    expect(func()).toBe(defaultValue);
                });
            } else {
                it('empty string becomes is supported', () => {
                    func('');
                    expect(func()).toBe('');
                });
            }
        });
    }

    testString(settings.allowedAudioChannels, '-1');
    testBoolean(settings.preferFmp4HlsContainer, false);
    testBoolean(settings.enableCinemaMode, true);
    testString(settings.selectAudioNormalization, 'TrackGain');
    testBoolean(settings.enableNextVideoInfoOverlay, true);
    testBoolean(settings.enableVideoRemainingTime, true);
    testBoolean(settings.enableThemeSongs, false);
    testBoolean(settings.enableThemeVideos, false);
    testBoolean(settings.enableFastFadein, true);
    testBoolean(settings.enableBlurhash, true);
    testBoolean(settings.enableBackdrops, false);
    testBoolean(settings.disableCustomCss, false);
    testString(settings.customCss);
    testBoolean(settings.detailsBanner, true);
    testBoolean(settings.useEpisodeImagesInNextUpAndResume, false);
    testString(settings.language);
    testString(settings.dateTimeLocale);
    testNumber(settings.skipBackLength, 10000);
    testNumber(settings.skipForwardLength, 30000);
    testString(settings.dashboardTheme);
    testString(settings.skin);
    testString(settings.theme);
    testString(settings.screensaver);
    testNumber(settings.backdropScreensaverInterval, 5);
    testNumber(settings.libraryPageSize, 100);
    testNumber(settings.maxDaysForNextUp, 365);
    testBoolean(settings.enableRewatchingInNextUp, false);
    testString(settings.soundEffects);
});
