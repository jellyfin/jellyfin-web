import { SubtitleStylingOption } from 'apps/stable/features/playback/constants/subtitleStylingOption';
import browser from 'scripts/browser';
import type { UserSettings } from 'scripts/settings/userSettings';

// TODO: This type override should be removed when userSettings are properly typed
interface SubtitleAppearanceSettings {
    subtitleStyling: SubtitleStylingOption
}

export function useCustomSubtitles(userSettings: UserSettings) {
    const subtitleAppearance = userSettings.getSubtitleAppearanceSettings() as unknown as SubtitleAppearanceSettings;
    switch (subtitleAppearance.subtitleStyling) {
        case SubtitleStylingOption.Native:
            return false;
        case SubtitleStylingOption.Custom:
            return true;
        default:
            // after a system update, ps4 isn't showing anything when creating a track element dynamically
            // going to have to do it ourselves
            if (browser.ps4) {
                return true;
            }

            // Tizen 5 doesn't support displaying secondary subtitles
            if ((browser.tizenVersion && Number(browser.tizenVersion) >= 5) || browser.web0s) {
                return true;
            }

            if (browser.edge) {
                return true;
            }

            // font-size styling does not seem to work natively in firefox. Switching to custom subtitles element for firefox.
            if (browser.firefox) {
                return true;
            }

            // iOS/macOS global caption settings are causing huge font-size and margins
            if (browser.safari) return true;

            return false;
    }
}
