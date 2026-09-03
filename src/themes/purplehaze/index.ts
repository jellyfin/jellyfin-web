import { buildCustomColorScheme } from 'themes/utils';

/** The "Purple Haze" color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        background: {
            default: '#230c33',
            paper: '#230c33'
        },
        primary: {
            main: '#48c3c8'
        },
        secondary: {
            main: '#ff77f1'
        },
        text: {
            primary: '#f8f8fe',
            secondary: 'rgba(248, 248, 254, 0.973)'
        },
        action: {
            focus: 'rgba(0, 0, 0, 0.3)',
            hover: '#12122f'
        },
        divider: 'rgba(255, 255, 255, 0.14)',
        Alert: {
            infoFilledBg: '#dbe6ff',
            infoFilledColor: '#0e0f2d'
        },
        AppBar: {
            defaultBg: '#230c33'
        },
        Button: {
            inheritContainedBg: 'rgba(0, 0, 0, 0.5)',
            inheritContainedHoverBg: 'rgb(12, 232, 214)'
        },
        FilledInput: {
            bg: 'rgba(0, 0, 0, 0.5)'
        },
        SnackbarContent: {
            bg: '#303030',
            color: 'rgba(255, 255, 255, 0.87)'
        }
    }
});

export default theme;
