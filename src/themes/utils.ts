import { type ColorSystemOptions, extendTheme } from '@mui/material/styles';
import merge from 'lodash-es/merge';

import { DEFAULT_COLOR_SCHEME } from './_base/theme';

/** The default built-in MUI theme. */
const defaultMuiTheme = extendTheme({
    // @ts-expect-error The default theme does not include our custom color schemes
    colorSchemes: { dark: true, light: true }
});

/**
 * Default color schemes ('dark' or 'light') will automatically be merged with MUI's corresponding default color
 * scheme. For custom schemes, we need to merge these manually.
 */
export const buildCustomColorScheme = (options: ColorSystemOptions) =>
    merge<ColorSystemOptions, ColorSystemOptions | undefined, ColorSystemOptions, ColorSystemOptions>(
        {},
        options.palette?.mode === 'light' ? defaultMuiTheme.colorSchemes.light : defaultMuiTheme.colorSchemes.dark,
        DEFAULT_COLOR_SCHEME,
        options
    );
