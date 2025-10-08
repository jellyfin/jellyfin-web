import type { ColorSystemOptions, ThemeOptions } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';

const LIST_ICON_WIDTH = 36;

/** The default "Dark" color scheme. */
export const DEFAULT_COLOR_SCHEME: ColorSystemOptions = {
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
            main: '#c62828' // Red color
        }
    }
};

/** The default customizations to the default MUI theme. */
export const DEFAULT_THEME_OPTIONS: ThemeOptions = {
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
        MuiAlert: {
            styleOverrides: {
                message: {
                    // NOTE: This seems like a bug. Block content does not fill the container width.
                    flexGrow: 1
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                colorTransparent: ({ theme }) => ({
                    color: theme.vars.palette.text.primary
                })
            }
        },
        MuiButton: {
            defaultProps: {
                variant: 'contained'
            },
            variants: [
                {
                    props: {
                        size: 'large'
                    },
                    style: {
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    }
                }
            ]
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
};
