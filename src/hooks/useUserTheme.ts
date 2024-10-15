import { useThemes } from './useThemes';
import { useUserSettings } from './useUserSettings';

export function useUserTheme() {
    const { theme, dashboardTheme } = useUserSettings();
    const { defaultTheme } = useThemes();

    return {
        theme: theme || defaultTheme?.id,
        dashboardTheme: dashboardTheme || defaultTheme?.id
    };
}
