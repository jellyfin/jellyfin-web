import createTheme, { type ThemeOptions } from '@mui/material/styles/createTheme';
import merge from 'lodash-es/merge';

import { DEFAULT_THEME_OPTIONS } from 'themes/defaults';

const options: ThemeOptions = {
    palette: {
        mode: 'light',
        background: {
            default: '#f2f2f2',
            // NOTE: The original theme uses #303030 for the drawer and app bar but we would need the drawer to use
            // dark mode for a color that dark to work properly which would require a separate ThemeProvider just for
            // the drawer... which is not worth the trouble in my opinion
            paper: '#e8e8e8'
        }
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                colorPrimary: {
                    backgroundColor: '#e8e8e8'
                }
            }
        }
    }
};

const theme = createTheme(merge({}, DEFAULT_THEME_OPTIONS, options));

export default theme;
