import { buildCustomColorScheme } from '@/themes/utils';

/** The "Purple Haze" color scheme. */
const theme = buildCustomColorScheme({
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

export default theme;
