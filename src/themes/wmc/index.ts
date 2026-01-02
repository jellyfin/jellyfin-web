import { buildCustomColorScheme } from '@/themes/utils';

/** The Windows Media Center inspired color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        background: {
            paper: '#0c2450'
        },
        AppBar: {
            defaultBg: '#0c2450'
        }
    }
});

export default theme;
