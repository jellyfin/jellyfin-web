import { createTheme } from '@mui/material/styles';

/** The default Jellyfin app theme for mui */
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00a4dc'
        },
        secondary: {
            main: '#aa5cc3'
        },
        background: {
            default: '#101010',
            paper: '#202020'
        },
        action: {
            selectedOpacity: 0.2
        }
    },
    typography: {
        fontFamily: '"Noto Sans", sans-serif',
        button: {
            textTransform: 'none'
        },
        h1: {
            fontSize: '1.8rem'
        },
        h2: {
            fontSize: '1.5rem'
        },
        h3: {
            fontSize: '1.17rem'
        }
    },
    components: {
        MuiButton: {
            defaultProps: {
                variant: 'contained'
            }
        },
        MuiFormControl: {
            defaultProps: {
                variant: 'filled'
            }
        },
        MuiTextField: {
            defaultProps: {
                variant: 'filled'
            }
        },
        MuiListSubheader: {
            styleOverrides: {
                root: {
                    // NOTE: Added for drawer subheaders, but maybe it won't work in other cases?
                    backgroundColor: 'inherit'
                }
            }
        }
    }
});

export default theme;
