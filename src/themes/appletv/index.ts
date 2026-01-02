import { buildCustomColorScheme } from '@/themes/utils';

/** The Apple TV inspired color scheme. */
const theme = buildCustomColorScheme({
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

export default theme;
