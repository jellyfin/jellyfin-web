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
const buildCustomColorScheme = (options: ColorSystemOptions) => merge(
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

/** The "Light" color scheme. */
const light = merge({}, DEFAULT_COLOR_SCHEME, {
    palette: {
        mode: 'light',
        background: {
            default: '#f2f2f2',
            // NOTE: The original theme uses #303030 for the drawer and app bar but we would need the drawer to use
            // dark mode for a color that dark to work properly which would require a separate ThemeProvider just for
            // the drawer... which is not worth the trouble in my opinion
            paper: '#e8e8e8'
        },
        AppBar: {
            defaultBg: '#e8e8e8'
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
    dark: DEFAULT_COLOR_SCHEME,
    light,
    purplehaze,
    wmc
};

/** The default theme containing all color scheme variants. */
const DEFAULT_THEME = createTheme({
    cssVariables: {
        cssVarPrefix: 'jf',
        colorSchemeSelector: 'data',
        disableCssColorScheme: true
    },
    defaultColorScheme: 'dark',
    ...DEFAULT_THEME_OPTIONS,
    colorSchemes: COLOR_SCHEMES
});

export default DEFAULT_THEME;
