import { Theme } from '@radix-ui/themes';
import { useEffect, useMemo } from 'react';
import themeManager from '../../scripts/themeManager';
import { useUserTheme } from '../../hooks/useUserTheme';

type RadixTheme = 'light' | 'dark';

interface ThemeProviderProps {
    readonly children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
    const { theme } = useUserTheme();

    // Map Jellyfin theme to Radix UI theme
    const radixTheme = useMemo<RadixTheme>(() => {
        if (typeof theme === 'string') {
            return theme.toLowerCase().includes('dark') ? 'dark' : 'light';
        }

        return 'light';
    }, [theme]);

    useEffect(() => {
        void themeManager.setTheme(theme);
    }, [theme]);

    return (
        <Theme appearance={radixTheme} accentColor="jade" grayColor="sage" radius="medium" scaling="100%">
            {children}
        </Theme>
    );
}
