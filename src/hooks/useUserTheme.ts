import { useThemes } from './useThemes';
import { useUserSettings } from './useUserSettings';

const FALLBACK_THEME_ID = 'dark';

export function useUserTheme() {
    const { theme, dashboardTheme } = useUserSettings();
    const { defaultTheme } = useThemes();

    return {
        theme: theme || defaultTheme?.id || FALLBACK_THEME_ID,
        dashboardTheme: dashboardTheme || defaultTheme?.id || FALLBACK_THEME_ID
    };
}
