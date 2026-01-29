import { createGlobalTheme, createThemeContract, globalStyle } from '@vanilla-extract/css';

const themeContract = createThemeContract({
    colors: {
        primary: null,
        primaryHover: null,
        primaryActive: null,
        primaryLight: null,
        secondary: null,
        secondaryHover: null,
        background: null,
        backgroundAlt: null,
        surface: null,
        surfaceHover: null,
        surfaceActive: null,
        surfaceLight: null,
        surfaceVariant: null,
        text: null,
        textSecondary: null,
        textMuted: null,
        textDisabled: null,
        textInverse: null,
        error: null,
        errorHover: null,
        errorLight: null,
        success: null,
        successHover: null,
        successLight: null,
        warning: null,
        warningHover: null,
        warningLight: null,
        info: null,
        infoHover: null,
        infoLight: null,
        divider: null,
        dividerLight: null,
        overlay: null,
        backdrop: null,
        focus: null,
        focusRing: null,
        waveformWave: null,
        waveformProgress: null,
        link: null,
        linkHover: null,
        visited: null,
        backgroundLevel2: null,
        border: null
    },
    spacing: {
        '1': null,
        '2': null,
        '3': null,
        '4': null,
        '5': null,
        '6': null,
        '7': null,
        '8': null,
        '9': null,
        xs: null,
        sm: null,
        md: null,
        lg: null,
        xl: null,
        xxl: null,
        xxxl: null
    },
    typography: {
        '1': { fontSize: null, lineHeight: null },
        '2': { fontSize: null, lineHeight: null },
        '3': { fontSize: null, lineHeight: null },
        '4': { fontSize: null, lineHeight: null },
        '5': { fontSize: null, lineHeight: null },
        '6': { fontSize: null, lineHeight: null },
        '7': { fontSize: null, lineHeight: null },
        '8': { fontSize: null, lineHeight: null },
        '9': { fontSize: null, lineHeight: null },
        fontFamily: null,
        fontFamilyMono: null,
        fontSizeXs: null,
        fontSizeSm: null,
        fontSizeMd: null,
        fontSizeLg: null,
        fontSizeXl: null,
        fontSizeXxl: null,
        fontSizeDisplay: null,
        fontSizeH1: null,
        fontSizeH2: null,
        fontSizeH3: null,
        fontSizeH4: null,
        fontSizeH5: null,
        fontSizeH6: null,
        fontWeightNormal: null,
        fontWeightMedium: null,
        fontWeightBold: null,
        lineHeightNormal: null,
        lineHeightCompact: null,
        lineHeightHeading: null,
        letterSpacingTight: null,
        letterSpacingNormal: null,
        letterSpacingWide: null
    },
    borderRadius: {
        none: null,
        sm: null,
        md: null,
        lg: null,
        xl: null,
        full: null
    },
    shadows: {
        none: null,
        sm: null,
        md: null,
        lg: null,
        xl: null,
        inner: null,
        outline: null
    },
    transitions: {
        instant: null,
        fast: null,
        normal: null,
        slow: null
    },
    zIndex: {
        hide: null,
        base: null,
        dropdown: null,
        sticky: null,
        fixed: null,
        banner: null,
        overlay: null,
        modalBackdrop: null,
        modal: null,
        popover: null,
        toast: null,
        tooltip: null
    },
    opacity: {
        disabled: null,
        muted: null,
        semi: null
    },
    breakpoints: {
        xs: null,
        sm: null,
        md: null,
        lg: null,
        xl: null,
        xxl: null
    },
    aspectRatios: {
        square: null,
        landscape: null,
        portrait: null,
        video: null,
        photo: null
    }
});

const baseTheme = {
    colors: {
        primary: '#aa5eaa',
        primaryHover: '#9a4f9a',
        primaryActive: '#7a3f7a',
        primaryLight: 'rgba(170, 94, 170, 0.15)',
        secondary: '#00a4dc',
        secondaryHover: '#0088b8',
        background: '#101010',
        backgroundAlt: '#1a1a1a',
        surface: '#252525',
        surfaceHover: '#2f2f2f',
        surfaceActive: '#3a3a3a',
        surfaceLight: 'rgba(255, 255, 255, 0.05)',
        surfaceVariant: '#303030',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        textMuted: '#707070',
        textDisabled: 'rgba(255, 255, 255, 0.3)',
        textInverse: '#000000',
        error: '#f44336',
        errorHover: '#d32f2f',
        errorLight: 'rgba(244, 67, 54, 0.15)',
        success: '#4caf50',
        successHover: '#388e3c',
        successLight: 'rgba(76, 175, 80, 0.15)',
        warning: '#ff9800',
        warningHover: '#f57c00',
        warningLight: 'rgba(255, 152, 0, 0.15)',
        info: '#2196f3',
        infoHover: '#1976d2',
        infoLight: 'rgba(33, 150, 243, 0.15)',
        divider: '#333333',
        dividerLight: 'rgba(255, 255, 255, 0.1)',
        overlay: 'rgba(0, 0, 0, 0.7)',
        backdrop: 'rgba(0, 0, 0, 0.5)',
        focus: '#aa5eaa',
        focusRing: '0 0 0 3px rgba(170, 94, 170, 0.4)',
        waveformWave: '#4caf50',
        waveformProgress: '#aa5eaa',
        link: '#aa5eaa',
        linkHover: '#9a4f9a',
        visited: '#9c27b0',
        backgroundLevel2: '#1a1a1a',
        border: '#333333'
    },
    spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.5rem',
        '6': '2rem',
        '7': '2.5rem',
        '8': '3rem',
        '9': '4rem',
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        xxl: '3rem',
        xxxl: '4rem'
    },
    typography: {
        '1': { fontSize: '0.75rem', lineHeight: '1rem' },
        '2': { fontSize: '0.875rem', lineHeight: '1.25rem' },
        '3': { fontSize: '1rem', lineHeight: '1.5rem' },
        '4': { fontSize: '1.125rem', lineHeight: '1.75rem' },
        '5': { fontSize: '1.25rem', lineHeight: '1.75rem' },
        '6': { fontSize: '1.5rem', lineHeight: '2rem' },
        '7': { fontSize: '1.875rem', lineHeight: '2.25rem' },
        '8': { fontSize: '2.25rem', lineHeight: '2.5rem' },
        '9': { fontSize: '3rem', lineHeight: '1' },
        fontFamily: '"InterVariable", "Inter var", "Inter", system-ui, sans-serif',
        fontFamilyMono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
        fontSizeXs: '0.5rem',
        fontSizeSm: '1rem',
        fontSizeMd: '1.5rem',
        fontSizeLg: '2rem',
        fontSizeXl: '2.5rem',
        fontSizeXxl: '3rem',
        fontSizeDisplay: '4rem',
        fontSizeH1: '4rem',
        fontSizeH2: '3.5rem',
        fontSizeH3: '3rem',
        fontSizeH4: '2.5rem',
        fontSizeH5: '2rem',
        fontSizeH6: '1.5rem',
        fontWeightNormal: '400',
        fontWeightMedium: '500',
        fontWeightBold: '700',
        lineHeightNormal: '1.5',
        lineHeightCompact: '1.3333',
        lineHeightHeading: '1.2',
        letterSpacingTight: '-0.02em',
        letterSpacingNormal: '0em',
        letterSpacingWide: '0.04em'
    },
    borderRadius: {
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px'
    },
    shadows: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        outline: '0 0 0 3px rgba(170, 94, 170, 0.4)'
    },
    transitions: {
        instant: '0s',
        fast: '0.15s ease',
        normal: '0.25s ease',
        slow: '0.4s ease'
    },
    zIndex: {
        hide: '-1',
        base: '0',
        dropdown: '1000',
        sticky: '1020',
        fixed: '100',
        banner: '1030',
        overlay: '1040',
        modalBackdrop: '1050',
        modal: '1060',
        popover: '1070',
        toast: '1080',
        tooltip: '1090'
    },
    opacity: {
        disabled: '0.5',
        muted: '0.4',
        semi: '0.6'
    },
    breakpoints: {
        xs: '0',
        sm: '600px',
        md: '960px',
        lg: '1280px',
        xl: '1920px',
        xxl: '2560px'
    },
    aspectRatios: {
        square: '1 / 1',
        landscape: '4 / 3',
        portrait: '3 / 4',
        video: '16 / 9',
        photo: '3 / 2'
    }
};

const withColors = (colors: Partial<typeof baseTheme.colors>) => ({
    ...baseTheme,
    colors: {
        ...baseTheme.colors,
        ...colors
    }
});

export const vars = themeContract;

createGlobalTheme(':root', vars, baseTheme);

createGlobalTheme(
    ':root[data-theme="light"]',
    themeContract,
    withColors({
        background: '#f2f2f2',
        backgroundAlt: '#e8e8e8',
        surface: '#e8e8e8',
        surfaceHover: '#dcdcdc',
        surfaceActive: '#cfcfcf',
        surfaceLight: 'rgba(0, 0, 0, 0.05)',
        surfaceVariant: '#e0e0e0',
        text: '#000000',
        textSecondary: 'rgba(0, 0, 0, 0.87)',
        textMuted: 'rgba(0, 0, 0, 0.6)',
        textDisabled: 'rgba(0, 0, 0, 0.3)',
        textInverse: '#ffffff',
        divider: '#d0d0d0',
        dividerLight: 'rgba(0, 0, 0, 0.1)',
        overlay: 'rgba(0, 0, 0, 0.3)',
        backdrop: 'rgba(255, 255, 255, 0.8)',
        focus: '#aa5eaa',
        focusRing: '0 0 0 3px rgba(170, 94, 170, 0.4)',
        waveformWave: '#2e7d32',
        waveformProgress: '#2e7d32',
        link: '#aa5eaa',
        linkHover: '#9a4f9a',
        backgroundLevel2: '#e0e0e0',
        border: '#d0d0d0'
    })
);

createGlobalTheme(
    ':root[data-theme="appletv"]',
    themeContract,
    withColors({
        background: '#d5e9f2',
        backgroundAlt: '#c8dce6',
        surface: '#ffffff',
        surfaceHover: '#f3f7fa',
        surfaceActive: '#e8eef4',
        surfaceLight: 'rgba(0, 0, 0, 0.05)',
        surfaceVariant: '#f0f0f0',
        text: '#0b0b0b',
        textSecondary: '#3a3a3a',
        textMuted: 'rgba(0, 0, 0, 0.6)',
        textDisabled: 'rgba(0, 0, 0, 0.3)',
        textInverse: '#ffffff',
        divider: '#bcbcbc',
        dividerLight: 'rgba(0, 0, 0, 0.1)',
        overlay: 'rgba(213, 233, 242, 0.6)',
        backdrop: 'rgba(213, 233, 242, 0.8)',
        focus: '#006a93',
        focusRing: '0 0 0 3px rgba(0, 106, 147, 0.4)',
        waveformWave: '#0b7a5a',
        waveformProgress: '#006a93',
        link: '#006a93',
        linkHover: '#004d6b',
        backgroundLevel2: '#f0f0f0',
        border: '#bcbcbc'
    })
);

createGlobalTheme(
    ':root[data-theme="blueradiance"]',
    themeContract,
    withColors({
        background: '#011432',
        backgroundAlt: '#0b1e3d',
        surface: '#011432',
        surfaceHover: '#0b1e3d',
        surfaceActive: '#142d52',
        surfaceLight: 'rgba(255, 255, 255, 0.05)',
        surfaceVariant: '#0a1833',
        text: '#ffffff',
        textSecondary: '#c8d4f0',
        textMuted: 'rgba(200, 212, 240, 0.6)',
        textDisabled: 'rgba(255, 255, 255, 0.3)',
        textInverse: '#000000',
        divider: '#0e2a5c',
        dividerLight: 'rgba(255, 255, 255, 0.1)',
        overlay: 'rgba(1, 20, 50, 0.7)',
        backdrop: 'rgba(1, 20, 50, 0.8)',
        focus: '#6aa9ff',
        focusRing: '0 0 0 3px rgba(106, 169, 255, 0.4)',
        waveformWave: '#6aa9ff',
        waveformProgress: '#00a4dc',
        link: '#6aa9ff',
        linkHover: '#8bb8ff',
        backgroundLevel2: '#0a1833',
        border: '#0e2a5c'
    })
);

createGlobalTheme(
    ':root[data-theme="purplehaze"]',
    themeContract,
    withColors({
        primary: '#48c3c8',
        primaryHover: '#38aab0',
        primaryActive: '#288a92',
        primaryLight: 'rgba(72, 195, 200, 0.15)',
        secondary: '#ff77f1',
        secondaryHover: '#ff5de8',
        background: '#000420',
        backgroundAlt: '#0a0f33',
        surface: '#0a0f33',
        surfaceHover: '#12183f',
        surfaceActive: '#18214d',
        surfaceLight: 'rgba(255, 255, 255, 0.05)',
        surfaceVariant: '#08071f',
        text: '#ffffff',
        textSecondary: '#b6b8ff',
        textMuted: 'rgba(182, 184, 255, 0.6)',
        textDisabled: 'rgba(255, 255, 255, 0.3)',
        textInverse: '#000000',
        divider: '#1b1f44',
        dividerLight: 'rgba(255, 255, 255, 0.1)',
        overlay: 'rgba(0, 4, 32, 0.7)',
        backdrop: 'rgba(0, 4, 32, 0.8)',
        focus: '#48c3c8',
        focusRing: '0 0 0 3px rgba(72, 195, 200, 0.4)',
        waveformWave: '#6ff0b5',
        waveformProgress: '#48c3c8',
        link: '#48c3c8',
        linkHover: '#38aab0',
        visited: '#ff77f1',
        backgroundLevel2: '#08071f',
        border: '#1b1f44'
    })
);

createGlobalTheme(
    ':root[data-theme="wmc"]',
    themeContract,
    withColors({
        background: '#0c2450',
        backgroundAlt: '#0f2a5e',
        surface: '#0c2450',
        surfaceHover: '#133061',
        surfaceActive: '#1a3a72',
        surfaceLight: 'rgba(255, 255, 255, 0.05)',
        surfaceVariant: '#0a1e40',
        text: '#ffffff',
        textSecondary: '#c8d2e8',
        textMuted: 'rgba(200, 210, 232, 0.6)',
        textDisabled: 'rgba(255, 255, 255, 0.3)',
        textInverse: '#000000',
        divider: '#1f3b6f',
        dividerLight: 'rgba(255, 255, 255, 0.1)',
        overlay: 'rgba(12, 36, 80, 0.7)',
        backdrop: 'rgba(12, 36, 80, 0.8)',
        focus: '#7fd0ff',
        focusRing: '0 0 0 3px rgba(127, 208, 255, 0.4)',
        waveformWave: '#7fd0ff',
        waveformProgress: '#00a4dc',
        link: '#7fd0ff',
        linkHover: '#a0d8ff',
        visited: '#b088d8',
        backgroundLevel2: '#0a1e40',
        border: '#1f3b6f'
    })
);

globalStyle('*, *::before, *::after', {
    boxSizing: 'border-box'
});

globalStyle('html, body', {
    margin: 0,
    padding: 0,
    fontFamily: vars.typography.fontFamily,
    // Base body text should be normal reading size (Radix/Tailwind-ish), not heading-sized.
    fontSize: vars.typography['3'].fontSize,
    lineHeight: vars.typography['3'].lineHeight,
    color: vars.colors.text,
    backgroundColor: vars.colors.background,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
});

globalStyle('a', {
    color: vars.colors.link,
    textDecoration: 'none',
    transition: vars.transitions.fast
});

globalStyle('a:hover', {
    color: vars.colors.linkHover
});

globalStyle('a:focus-visible', {
    outline: 'none',
    boxShadow: vars.shadows.outline,
    borderRadius: vars.borderRadius.sm
});

globalStyle('button', {
    fontFamily: 'inherit',
    cursor: 'pointer'
});

globalStyle('input, textarea, select', {
    fontFamily: 'inherit'
});

globalStyle('img, video', {
    maxWidth: '100%',
    height: 'auto'
});

globalStyle('::-webkit-scrollbar', {
    width: vars.spacing.sm,
    height: vars.spacing.sm
});

globalStyle('::-webkit-scrollbar-track', {
    background: vars.colors.background
});

globalStyle('::-webkit-scrollbar-thumb', {
    background: vars.colors.textMuted,
    borderRadius: vars.borderRadius.full
});

globalStyle('::-webkit-scrollbar-thumb:hover', {
    background: vars.colors.textSecondary
});

globalStyle('::selection', {
    backgroundColor: vars.colors.primaryLight,
    color: vars.colors.text
});

globalStyle(':focus-visible', {
    outline: 'none',
    boxShadow: vars.shadows.outline
});

// Transition helper with deprecation warnings
export const tokens = {
    spacing: {
        '1': vars.spacing['1'],
        '2': vars.spacing['2'],
        '3': vars.spacing['3'],
        '4': vars.spacing['4'],
        '5': vars.spacing['5'],
        '6': vars.spacing['6'],
        '7': vars.spacing['7'],
        '8': vars.spacing['8'],
        '9': vars.spacing['9'],
        get xs() { console.warn('tokens.spacing.xs is deprecated, use tokens.spacing["2"]'); return vars.spacing['2']; },
        get sm() { console.warn('tokens.spacing.sm is deprecated, use tokens.spacing["4"]'); return vars.spacing['4']; },
        get md() { console.warn('tokens.spacing.md is deprecated, use tokens.spacing["5"]'); return vars.spacing['5']; },
        get lg() { console.warn('tokens.spacing.lg is deprecated, use tokens.spacing["6"]'); return vars.spacing['6']; },
        get xl() { console.warn('tokens.spacing.xl is deprecated, use tokens.spacing["7"]'); return vars.spacing['7']; },
        get xxl() { console.warn('tokens.spacing.xxl is deprecated, use tokens.spacing["8"]'); return vars.spacing['8']; },
        get xxxl() { console.warn('tokens.spacing.xxxl is deprecated, use tokens.spacing["9"]'); return vars.spacing['9']; }
    },
    typography: {
        '1': vars.typography['1'],
        '2': vars.typography['2'],
        '3': vars.typography['3'],
        '4': vars.typography['4'],
        '5': vars.typography['5'],
        '6': vars.typography['6'],
        '7': vars.typography['7'],
        '8': vars.typography['8'],
        '9': vars.typography['9'],
        get fontSizeXs() { console.warn('tokens.typography.fontSizeXs is deprecated, use tokens.typography["1"].fontSize'); return vars.typography['1'].fontSize; },
        get fontSizeSm() { console.warn('tokens.typography.fontSizeSm is deprecated, use tokens.typography["3"].fontSize'); return vars.typography['3'].fontSize; },
        get fontSizeMd() { console.warn('tokens.typography.fontSizeMd is deprecated, use tokens.typography["6"].fontSize'); return vars.typography['6'].fontSize; },
        get fontSizeLg() { console.warn('tokens.typography.fontSizeLg is deprecated, use tokens.typography["7"].fontSize'); return vars.typography['7'].fontSize; },
        get fontSizeXl() { console.warn('tokens.typography.fontSizeXl is deprecated, use tokens.typography["8"].fontSize'); return vars.typography['8'].fontSize; },
        get fontSizeXxl() { console.warn('tokens.typography.fontSizeXxl is deprecated, use tokens.typography["9"].fontSize'); return vars.typography['9'].fontSize; }
    }
};