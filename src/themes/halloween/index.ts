import { buildCustomColorScheme } from 'themes/utils';

/** The Halloween creepy color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        mode: 'light',
        background: {
            default: '#F87A0B',
            paper: '#EF9637'
		},
		primary: {
			contrastText: '#834c05',
			dark: '#5a2d12',
			main: '#a44d00'
        },
		secondary: {
			main: '#f3c282'
		},
		error: {
			main: '#ff3c00'
		},
        // MUI's default light palette sets text.secondary to rgba(0,0,0,0.6).
        text: {
            primary: '#f7ff9a',
            secondary: '#241602'
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
            defaultBg: '#e4700a'
        },
        Button: {
            inheritContainedBg: '#E0650B',
            inheritContainedHoverBg: '#EF9637'
        },
        FilledInput: {
            bg: '#EF9637'
        },
        SnackbarContent: {
            bg: '#303030',
            color: 'rgba(255, 255, 255, 0.87)'
        }
    }
});

export default theme;
