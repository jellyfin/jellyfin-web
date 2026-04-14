import { buildCustomColorScheme } from 'themes/utils';

/** The "Blue Radiance" color scheme. */
const theme = buildCustomColorScheme({
    palette: {
        background: {
            default: '#033361',
            paper: '#011432'
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
            infoFilledBg: '#111',
            infoFilledColor: '#ddd'
        },
        AppBar: {
            defaultBg: '#011432'
        },
        Button: {
            inheritContainedBg: 'rgba(0, 0, 0, 0.5)',
            inheritContainedHoverBg: 'rgba(0, 0, 0, 0.7)'
        }
    }
});

export default theme;
