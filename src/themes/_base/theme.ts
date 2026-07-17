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
        },
        AppBar: {
            defaultBg: '#202020'
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
            fontSize: '1.8rem',
            fontWeight: 700
        },
        h2: {
            fontSize: '1.5rem',
            fontWeight: 700
        },
        h3: {
            fontSize: '1.17rem',
            fontWeight: 600
        }
    },
    components: {
        MuiAlert: {
            styleOverrides: {
                message: {
                    // NOTE: This seems like a bug. Block content does not fill the container width.
                    flexGrow: 1
                },
                root: {
                    borderRadius: 'var(--jf-radius-md, 0.5em)',
                    backdropFilter: 'blur(var(--jf-glass-blur, 20px))',
                    WebkitBackdropFilter: 'blur(var(--jf-glass-blur, 20px))'
                }
            }
        },
        MuiAppBar: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                colorTransparent: ({ theme }) => ({
                    color: theme.vars.palette.text.primary,
                    backdropFilter: 'blur(var(--jf-glass-blur-subtle, 12px))',
                    WebkitBackdropFilter: 'blur(var(--jf-glass-blur-subtle, 12px))',
                    backgroundColor: 'var(--jf-glass-bg, rgba(28, 28, 32, 0.65))',
                    borderBottom: '1px solid var(--jf-glass-border, transparent)',
                    transition: [
                        'background-color var(--jf-dur-mid, 240ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))',
                        'backdrop-filter var(--jf-dur-mid, 240ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))',
                        'box-shadow var(--jf-dur-mid, 240ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                    ].join(', ')
                }),
                root: {
                    backgroundImage: 'none'
                }
            }
        },
        MuiButton: {
            defaultProps: {
                variant: 'contained',
                disableElevation: true
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
            ],
            styleOverrides: {
                root: {
                    borderRadius: 'var(--jf-radius-md, 0.5em)',
                    transition: [
                        'background-color var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))',
                        'box-shadow var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))',
                        'transform var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                    ].join(', ')
                }
            }
        },
        MuiCard: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                root: {
                    borderRadius: 'var(--jf-radius-lg, 0.75em)',
                    backgroundColor: 'var(--jf-glass-bg, rgba(28, 28, 32, 0.65))',
                    backdropFilter: 'blur(var(--jf-glass-blur, 20px))',
                    WebkitBackdropFilter: 'blur(var(--jf-glass-blur, 20px))',
                    border: '1px solid var(--jf-glass-border, transparent)',
                    boxShadow: 'var(--jf-shadow-1, 0 2px 8px rgba(0, 0, 0, 0.18))',
                    transition: [
                        'box-shadow var(--jf-dur-mid, 240ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))',
                        'transform var(--jf-dur-mid, 240ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))',
                        'border-color var(--jf-dur-mid, 240ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                    ].join(', ')
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 'var(--jf-radius-lg, 0.75em)',
                    backgroundColor: 'var(--jf-glass-bg-strong, rgba(22, 22, 26, 0.82))',
                    backdropFilter: 'blur(var(--jf-glass-blur-strong, 32px))',
                    WebkitBackdropFilter: 'blur(var(--jf-glass-blur-strong, 32px))',
                    border: '1px solid var(--jf-glass-border, transparent)',
                    boxShadow: 'var(--jf-shadow-3, 0 8px 32px rgba(0, 0, 0, 0.28))'
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'var(--jf-glass-bg-strong, rgba(22, 22, 26, 0.82))',
                    backdropFilter: 'blur(var(--jf-glass-blur, 20px))',
                    WebkitBackdropFilter: 'blur(var(--jf-glass-blur, 20px))',
                    borderRight: '1px solid var(--jf-glass-border, transparent)'
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none'
                }
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 'var(--jf-radius-md, 0.5em)',
                    transition: [
                        'background-color var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))',
                        'color var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                    ].join(', ')
                }
            }
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    transition: 'background-color var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 'var(--jf-radius-md, 0.5em)',
                    transition: [
                        'background-color var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                    ].join(', ')
                }
            }
        },
        MuiTextField: {
            defaultProps: {
                variant: 'filled'
            }
        },
        MuiFormControl: {
            defaultProps: {
                variant: 'filled'
            }
        },
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    borderRadius: 'var(--jf-radius-sm, 0.3em)',
                    '&::before': {
                        borderBottom: 'none'
                    },
                    '&::after': {
                        borderBottomColor: 'var(--jf-palette-primary-main, #00a4dc)'
                    }
                }
            }
        },
        MuiFormHelperText: {
            styleOverrides: {
                root: {
                    fontSize: '1rem'
                }
            }
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    minHeight: 'auto'
                },
                indicator: {
                    height: '3px',
                    borderRadius: 'var(--jf-radius-pill, 999px)',
                    transition: 'all var(--jf-dur-mid, 240ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                }
            }
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    minHeight: 'auto',
                    paddingTop: '0.6em',
                    paddingBottom: '0.6em',
                    transition: 'color var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 'var(--jf-radius-sm, 0.3em)',
                    backgroundColor: 'var(--jf-glass-bg-strong, rgba(22, 22, 26, 0.82))',
                    backdropFilter: 'blur(var(--jf-glass-blur, 20px))',
                    WebkitBackdropFilter: 'blur(var(--jf-glass-blur, 20px))',
                    border: '1px solid var(--jf-glass-border, transparent)',
                    fontSize: '0.85rem',
                    padding: '0.5em 0.8em'
                }
            }
        },
        MuiSnackbar: {
            styleOverrides: {
                root: {
                    transition: 'transform var(--jf-dur-mid, 240ms) var(--jf-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))'
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 'var(--jf-radius-pill, 999px)',
                    transition: 'background-color var(--jf-dur-fast, 140ms) var(--jf-ease-out, cubic-bezier(0.16, 1, 0.3, 1))'
                }
            }
        },
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    '&.Mui-checked + .MuiSwitch-track': {
                        opacity: 0.5
                    }
                }
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
