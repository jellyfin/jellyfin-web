import { createTheme } from '@mui/material/styles';

import { DEFAULT_THEME_OPTIONS } from './_base/theme';
import appletv from './appletv';
import blueradiance from './blueradiance';
import catppuccinFrappe from './catppuccin-frappe';
import catppuccinLatte from './catppuccin-latte';
import catppuccinMacchiato from './catppuccin-macchiato';
import catppuccinMocha from './catppuccin-mocha';
import dark from './dark';
import light from './light';
import purplehaze from './purplehaze';
import wmc from './wmc';

/** The default theme containing all color scheme variants. */
const DEFAULT_THEME = createTheme({
    cssVariables: {
        cssVarPrefix: 'jf',
        colorSchemeSelector: '[data-theme="%s"]',
        disableCssColorScheme: true
    },
    defaultColorScheme: 'dark',
    ...DEFAULT_THEME_OPTIONS,
    colorSchemes: {
        appletv,
        blueradiance,
        'catppuccin-frappe': catppuccinFrappe,
        'catppuccin-latte': catppuccinLatte,
        'catppuccin-macchiato': catppuccinMacchiato,
        'catppuccin-mocha': catppuccinMocha,
        dark,
        light,
        purplehaze,
        wmc
    }
});

export default DEFAULT_THEME;
