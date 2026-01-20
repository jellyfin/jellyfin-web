import { CssVarsProvider, extendTheme } from '@mui/joy/styles';
import React from 'react';

const JELLYFIN_PRIMARY = '#aa5c8f';
const JELLYFIN_PRIMARY_DARK = '#8a4a75';
const JELLYFIN_BACKGROUND = '#101010';
const JELLYFIN_SURFACE = '#1a1a1a';
const JELLYFIN_TEXT = '#ffffff';
const JELLYFIN_TEXT_SECONDARY = '#aaaaaa';

const joyTheme = extendTheme({
  cssVarPrefix: 'jf',
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#f5e6ef',
          100: '#e6c8dc',
          200: '#d6a9c9',
          300: '#c68ab6',
          400: '#b66ba3',
          500: JELLYFIN_PRIMARY,
          600: '#8a4a75',
          700: '#6d3a5e',
          800: '#512a47',
          900: '#361a30',
        },
        neutral: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
        },
        background: {
          body: '#f2f2f2',
          surface: '#ffffff',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#666666',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          50: '#361a30',
          100: '#512a47',
          200: '#6d3a5e',
          300: '#8a4a75',
          400: '#b66ba3',
          500: JELLYFIN_PRIMARY,
          600: '#c68ab6',
          700: '#d6a9c9',
          800: '#e6c8dc',
          900: '#f5e6ef',
        },
        neutral: {
          50: '#3d3d3d',
          100: '#454545',
          200: '#4f4f4f',
          300: '#5d5d5d',
          400: '#6d6d6d',
          500: '#888888',
          600: '#b0b0b0',
          700: '#d1d1d1',
          800: '#e8e8e8',
          900: '#f5f5f5',
        },
        background: {
          body: JELLYFIN_BACKGROUND,
          surface: JELLYFIN_SURFACE,
        },
        text: {
          primary: JELLYFIN_TEXT,
          secondary: JELLYFIN_TEXT_SECONDARY,
        },
      },
    },
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
  },
  typography: {
    fontFamily: '"Noto Sans", sans-serif',
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: {
          borderRadius: 'sm',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    JoySheet: {
      styleOverrides: {
        root: {
          backgroundColor: 'background.surface',
          borderRadius: 'md',
        },
      },
    },
    JoyChip: {
      styleOverrides: {
        root: {
          borderRadius: 'sm',
        },
      },
    },
  },
});

export const JoyThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <CssVarsProvider theme={joyTheme} defaultMode="dark">
      {children}
    </CssVarsProvider>
  );
};

export { joyTheme, JELLYFIN_PRIMARY, JELLYFIN_PRIMARY_DARK };
export default joyTheme;
