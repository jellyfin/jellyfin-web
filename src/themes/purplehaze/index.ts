import createTheme, { type ThemeOptions } from '@mui/material/styles/createTheme';
import merge from 'lodash-es/merge';

import { DEFAULT_THEME_OPTIONS } from 'themes/defaults';

const options: ThemeOptions = {
    palette: {
        background: {
            paper: '#000420'
        },
        primary: {
            main: '#48c3c8'
        },
        secondary: {
            main: '#ff77f1'
        }
    }
};

const theme = createTheme(merge({}, DEFAULT_THEME_OPTIONS, options));

export default theme;
