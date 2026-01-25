import { useEffect } from 'react';
import themeManager from '../../scripts/themeManager';
import { useUserTheme } from '../../hooks/useUserTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme } = useUserTheme();

    useEffect(() => {
        void themeManager.setTheme(theme);
    }, [theme]);

    return <>{children}</>;
}
