import createTheme, { type ThemeOptions } from '@mui/material/styles/createTheme';
import merge from 'lodash-es/merge';

import { DEFAULT_THEME_OPTIONS } from 'themes/defaults';

const themeOptions: ThemeOptions = {
    palette: {
        mode: 'light',
        background: {
            default: '#d5e9f2',
            paper: '#fff'
        }
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                colorPrimary: {
                    backgroundColor: '#bcbcbc'
                }
            }
        }
    }
};

const theme = createTheme(merge({}, DEFAULT_THEME_OPTIONS, themeOptions));

export default theme;
