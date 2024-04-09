import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    starIcon: Palette['primary'];
  }

  interface PaletteOptions {
    starIcon?: PaletteOptions['primary'];
  }
}

const LIST_ICON_WIDTH = 36;

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
        },
        starIcon: {
            main: '#f2b01e' // Yellow color
        },
        error: {
            main: '#cb272a' // Red color
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
        MuiFormHelperText: {
            styleOverrides: {
                root: {
                    fontSize: '1rem'
                }
            }
        },
        MuiTextField: {
            defaultProps: {
                variant: 'filled'
            }
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    minWidth: LIST_ICON_WIDTH
                }
            }
        },
        MuiListSubheader: {
            styleOverrides: {
                root: {
                    // NOTE: Added for drawer subheaders, but maybe it won't work in other cases?
                    backgroundColor: 'inherit',
                    position: 'initial'
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                inset: {
                    paddingLeft: LIST_ICON_WIDTH
                }
            }
        }
    }
});

export default theme;
