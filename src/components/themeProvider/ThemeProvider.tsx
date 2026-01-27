import { Theme } from '@radix-ui/themes';
import { useEffect, useMemo } from 'react';
import { useUserTheme } from '../../hooks/useUserTheme';
import themeManager from '../../scripts/themeManager';

type RadixTheme = 'light' | 'dark';

interface ThemeProviderProps {
    readonly children: React.ReactNode;
}

type ScalingValue = '90%' | '95%' | '100%' | '105%' | '110%';

/**
 * Calculate scaling factor based on device pixel ratio
 * Radix UI scaling prop accepts: "90%", "95%", "100%", "105%", "110%"
 *
 * Device pixel ratios:
 * - 1x: Standard displays (100%)
 * - 1.5x: Some tablets (95%)
 * - 2x: MacBook Pro, modern phones (90%)
 * - 3x: High-end phones (90%)
 */
function getScalingForDPI(): ScalingValue {
    if (typeof window === 'undefined') {
        return '100%';
    }

    const dpr = window.devicePixelRatio || 1;

    // Adjust scaling to account for high pixel density
    // This makes UI elements appropriately sized on retina/high-DPI displays
    if (dpr >= 2) {
        return '90%'; // High DPI (2x+) - MacBook Pro, modern phones, ultra-high displays
    }
    if (dpr >= 1.5) {
        return '95%'; // Medium DPI (1.5x) - Some tablets
    }
    return '100%'; // Standard DPI (1x)
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

    // Calculate appropriate scaling for device's pixel density
    const scaling = useMemo(() => getScalingForDPI(), []);

    useEffect(() => {
        void themeManager.setTheme(theme);
    }, [theme]);

    return (
        <Theme
            appearance={radixTheme}
            accentColor="jade"
            grayColor="sage"
            radius="medium"
            scaling={scaling}
        >
            {children}
        </Theme>
    );
}
