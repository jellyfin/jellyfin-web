import { buildCustomColorScheme } from 'themes/utils';

/** The Apple TV inspired color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        mode: 'light',
        background: {
            default: '#d5e9f2',
            paper: '#eaeaea'
        },
        // MUI's default light palette sets text.secondary to rgba(0,0,0,0.6).
        // Override both to match the appletv theme's intended opacity.
        text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.87)'
        },
        action: {
            focus: 'rgba(0, 0, 0, 0.2)',
            hover: 'rgba(0, 0, 0, 0.1)'
        },
        divider: 'rgba(0, 0, 0, 0.158)',
        Alert: {
            infoFilledBg: '#fff3a5',
            infoFilledColor: '#000'
        },
        AppBar: {
            defaultBg: '#bcbcbc'
        },
        Button: {
            inheritContainedBg: 'rgba(0, 0, 0, 0.14)',
            inheritContainedHoverBg: 'rgba(0, 0, 0, 0.24)'
        },
        FilledInput: {
            bg: 'rgba(255, 255, 255, 0.9)'
        },
        SnackbarContent: {
            bg: '#303030',
            color: 'rgba(255, 255, 255, 0.87)'
        }
    }
});

export default theme;
