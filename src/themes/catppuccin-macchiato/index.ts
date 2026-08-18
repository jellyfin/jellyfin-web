import { buildCustomColorScheme } from 'themes/utils';

/** The Catppuccin Macchiato color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        background: {
            default: '#24273a',
            paper: '#1e2030'
        },
        primary: {
            main: '#7dc4e4'
        },
        secondary: {
            main: '#7dc4e4'
        },
        text: {
            primary: '#cad3f5',
            secondary: '#b8c0e0'
        },
        // action: {
        //     focus: '#7dc4e4',
        //     hover: 'rgba(#7dc4e4, 0.2)'
        // },
        Alert: {
            infoFilledBg: '#8aadf4',
            infoFilledColor: '#181926'
        },
        AppBar: {
            defaultBg: '#181926'
        }
        // Button: {
        //     inheritContainedBg: '#082845',
        //     inheritContainedHoverBg: '#143451'
        // }
    }
});

export default theme;
