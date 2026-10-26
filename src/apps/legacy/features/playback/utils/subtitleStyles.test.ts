import { afterEach, describe, expect, it, vi } from 'vitest';

import { SubtitleStylingOption } from 'apps/legacy/features/playback/constants/subtitleStylingOption';
import browser from 'scripts/browser';
import type { UserSettings } from 'scripts/settings/userSettings';

import { useCustomSubtitles } from './subtitleStyles';

const browserMock = vi.hoisted(() => ({ default: {} as typeof browser }));
vi.mock('scripts/browser', () => browserMock);

function userSettingsWith(subtitleStyling: string): UserSettings {
    return {
        getSubtitleAppearanceSettings: () => ({ subtitleStyling })
    } as unknown as UserSettings;
}

function setBrowser(flags: Partial<typeof browser>): void {
    for (const key of Object.keys(browser)) {
        delete (browser as Record<string, unknown>)[key];
    }
    Object.assign(browser, flags);
}

function setElementFullscreenSupport(supported: boolean): void {
    const element = document.documentElement as unknown as Record<string, unknown>;
    if (supported) {
        element.requestFullscreen = () => Promise.resolve();
    } else {
        delete element.requestFullscreen;
    }
}

describe('useCustomSubtitles', () => {
    afterEach(() => {
        setElementFullscreenSupport(false);
    });

    describe('explicit subtitle styling option', () => {
        it('returns false when styling is Native, regardless of browser', () => {
            setBrowser({ safari: true });
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Native))).toBe(false);
        });

        it('returns true when styling is Custom, regardless of browser', () => {
            setBrowser({});
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Custom))).toBe(true);
        });
    });

    describe('Auto styling: browser-based fallback', () => {
        it('returns false when no custom-subtitle browser quirk applies', () => {
            setBrowser({});
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(false);
        });

        it('returns true on PS4', () => {
            setBrowser({ ps4: true });
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(true);
        });

        it('returns true on Tizen 5 and above', () => {
            setBrowser({ tizenVersion: 5 });
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(true);
        });

        it('returns false on Tizen versions below 5', () => {
            setBrowser({ tizenVersion: 4 });
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(false);
        });

        it('returns true on webOS', () => {
            setBrowser({ web0s: true });
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(true);
        });

        it('returns true on Edge', () => {
            setBrowser({ edge: true });
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(true);
        });

        it('returns true on Firefox', () => {
            setBrowser({ firefox: true });
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(true);
        });

        it('returns true on Safari when an element can go fullscreen', () => {
            setBrowser({ safari: true, osx: true });
            setElementFullscreenSupport(true);
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(true);
        });

        it('returns false on Safari when only the video can go fullscreen', () => {
            setBrowser({ safari: true, iOS: true });
            setElementFullscreenSupport(false);
            expect(useCustomSubtitles(userSettingsWith(SubtitleStylingOption.Auto))).toBe(false);
        });
    });
});
