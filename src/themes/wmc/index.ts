import { buildCustomColorScheme } from 'themes/utils';

/** The Windows Media Center inspired color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        background: {
            default: '#0f3562',
            paper: '#0c2450'
        },
        text: {
            primary: '#eee',
            secondary: 'rgba(255, 255, 255, 0.9)'
        },
        action: {
            focus: '#00a4dc',
            hover: 'rgba(0, 164, 220, 0.2)'
        },
        Alert: {
            infoFilledBg: '#fff3a5',
            infoFilledColor: '#000'
        },
        AppBar: {
            defaultBg: '#0c2450'
        },
        Button: {
            inheritContainedBg: '#082845',
            inheritContainedHoverBg: '#143451'
        }
    }
});

export default theme;
