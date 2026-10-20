import type { PaletteMode } from '@mui/material/styles';

import { buildCustomColorScheme } from 'themes/utils';

interface CatppuccinTheme {
    mode?: PaletteMode;
    rosewater: string;
    flamingo: string;
    pink: string;
    mauve: string;
    red: string;
    maroon: string;
    peach: string;
    yellow: string;
    green: string;
    teal: string;
    sky: string;
    sapphire: string;
    blue: string;
    lavender: string;
    text: string;
    subtext1: string;
    subtext0: string;
    overlay2: string;
    overlay1: string;
    overlay0: string;
    surface2: string;
    surface1: string;
    surface0: string;
    base: string;
    mantle: string;
    crust: string;
}

/** Creates a color scheme from Catpuccin theme colors. */
export const buildCatppuccinColorScheme = (catppuccin: CatppuccinTheme) => buildCustomColorScheme({
    palette: {
        mode: catppuccin.mode,
        background: {
            default: catppuccin.base,
            paper: catppuccin.mantle
        },
        primary: {
            main: catppuccin.sapphire
        },
        secondary: {
            main: catppuccin.sapphire
        },
        error: {
            main: catppuccin.red
        },
        info: {
            main: catppuccin.blue
        },
        success: {
            main: catppuccin.green
        },
        warning: {
            main: catppuccin.yellow
        },
        text: {
            primary: catppuccin.text,
            secondary: catppuccin.subtext1
        },
        Alert: {
            infoFilledBg: catppuccin.blue,
            infoFilledColor: catppuccin.crust
        },
        AppBar: {
            defaultBg: catppuccin.crust
        }
    }
});
