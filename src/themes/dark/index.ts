import type { ColorSystemOptions } from '@mui/material/styles';
import merge from 'lodash-es/merge';

import { DEFAULT_COLOR_SCHEME } from '../_base/theme';

/** The default "Dark" color scheme. */
const theme = merge<ColorSystemOptions, ColorSystemOptions, ColorSystemOptions>(
    {},
    DEFAULT_COLOR_SCHEME,
    {
        palette: {
            SnackbarContent: {
                bg: '#303030',
                color: 'rgba(255, 255, 255, 0.87)'
            }
        }
    }
);

export default theme;
