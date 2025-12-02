import { buildCustomColorScheme } from 'themes/utils';

/** The "Blue Radiance" color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        background: {
            paper: '#011432'
        },
        AppBar: {
            defaultBg: '#011432'
        }
    }
});

export default theme;
