import { type ColorSystemOptions, createTheme, extendTheme } from '@mui/material/styles';
import merge from 'lodash-es/merge';

import { DEFAULT_COLOR_SCHEME, DEFAULT_THEME_OPTIONS } from './defaults';

/** Extend MUI types to include our customizations. */
declare module '@mui/material/styles' {
    interface ColorSchemeOverrides {
        appletv: true;
        blueradiance: true;
        purplehaze: true;
        wmc: true;
    }

    interface Palette {
        starIcon: Palette['primary'];
    }

    interface PaletteOptions {
        starIcon?: PaletteOptions['primary'];
    }
}

/** The default built-in MUI theme. */
const defaultMuiTheme = extendTheme({
    // @ts-expect-error The default theme does not include our custom color schemes
    colorSchemes: { dark: true, light: true }
});

/**
 * Default color schemes ('dark' or 'light') will automatically be merged with MUI's corresponding default color
 * scheme. For custom schemes, we need to merge these manually.
 */
const buildCustomColorScheme = (options: ColorSystemOptions) => merge<ColorSystemOptions, ColorSystemOptions | undefined, ColorSystemOptions, ColorSystemOptions>(
    {},
    options.palette?.mode === 'light' ? defaultMuiTheme.colorSchemes.light : defaultMuiTheme.colorSchemes.dark,
    DEFAULT_COLOR_SCHEME,
    options
);

/** The Apple TV inspired color scheme. */
const appletv = buildCustomColorScheme({
    palette: {
        mode: 'light',
        background: {
            default: '#d5e9f2',
            paper: '#fff'
        },
        AppBar: {
            defaultBg: '#bcbcbc'
        }
    }
});

/** The "Blue Radiance" color scheme. */
const blueradiance = buildCustomColorScheme({
    palette: {
        background: {
            paper: '#011432'
        },
        AppBar: {
            defaultBg: '#011432'
        }
    }
});

/** The default "Dark" color scheme. */
const dark = merge({}, DEFAULT_COLOR_SCHEME, {
    palette: {
        SnackbarContent: {
            bg: '#303030',
            color: 'rgba(255, 255, 255, 0.87)'
        }
    }
});

/** The "Light" color scheme. */
const light = merge<ColorSystemOptions, ColorSystemOptions, ColorSystemOptions>({}, DEFAULT_COLOR_SCHEME, {
    palette: {
        mode: 'light',
        background: {
            default: '#f2f2f2',
            paper: '#e8e8e8'
        },
        text: {
            primary: '#000',
            secondary: 'rgba(0, 0, 0, 0.87)'
        },
        action: {
            focus: '#bbb',
            hover: '#ddd'
        },
        Alert: {
            infoFilledBg: '#fff3a5',
            infoFilledColor: '#000'
        },
        AppBar: {
            defaultBg: '#e8e8e8'
        },
        Button: {
            inheritContainedBg: '#d8d8d8',
            inheritContainedHoverBg: '#ccc'
        }
    }
});

/** The "Purple Haze" color scheme. */
const purplehaze = buildCustomColorScheme({
    palette: {
        background: {
            paper: '#000420'
        },
        primary: {
            main: '#48c3c8'
        },
        secondary: {
            main: '#ff77f1'
        },
        AppBar: {
            defaultBg: '#000420'
        }
    }
});

/** The Windows Media Center inspired color scheme. */
const wmc = buildCustomColorScheme({
    palette: {
        background: {
            paper: '#0c2450'
        },
        AppBar: {
            defaultBg: '#0c2450'
        }
    }
});

/** All color scheme variants in the app. */
export const COLOR_SCHEMES = {
    appletv,
    blueradiance,
    dark,
    light,
    purplehaze,
    wmc
};

/** The default theme containing all color scheme variants. */
const DEFAULT_THEME = createTheme({
    cssVariables: {
        cssVarPrefix: 'jf',
        colorSchemeSelector: '[data-theme="%s"]',
        disableCssColorScheme: true
    },
    defaultColorScheme: 'dark',
    ...DEFAULT_THEME_OPTIONS,
    colorSchemes: COLOR_SCHEMES
});

export default DEFAULT_THEME;
