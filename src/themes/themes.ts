import { type Theme } from '@mui/material/styles';

import isweetav from './isweetav';

declare module '@mui/material/styles' {
    interface Palette {
        starIcon: Palette['primary'];
    }

    interface PaletteOptions {
        starIcon?: PaletteOptions['primary'];
    }
}

const ALL_THEMES = {
    isweetav
};

/** The default theme if a user has not selected a preferred theme. */
export const DEFAULT_THEME = isweetav;

/**
 * Gets a MUI Theme by its string id. Returns the default theme if no matching theme is found.
 */
export function getTheme(id?: string): Theme {
    if (!id) {
        console.info('[getTheme] no theme id; returning default theme');
        return DEFAULT_THEME;
    }

    console.info('[getTheme] getting theme "%s"', id);
    if (Object.keys(ALL_THEMES).includes(id)) {
        return ALL_THEMES[id as keyof typeof ALL_THEMES];
    }

    console.warn('[getTheme] theme "%s" not found; returning default theme', id);
    return DEFAULT_THEME;
}
