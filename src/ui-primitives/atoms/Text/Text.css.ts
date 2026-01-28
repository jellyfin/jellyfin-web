import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const textStyles = style({
    margin: 0,
    fontFamily: vars.typography.fontFamily,
    color: vars.colors.text
});

export const textSizes = styleVariants({
    '1': { fontSize: vars.typography['1'].fontSize },
    '2': { fontSize: vars.typography['2'].fontSize },
    '3': { fontSize: vars.typography['3'].fontSize },
    '4': { fontSize: vars.typography['4'].fontSize },
    '5': { fontSize: vars.typography['5'].fontSize },
    '6': { fontSize: vars.typography['6'].fontSize },
    '7': { fontSize: vars.typography['7'].fontSize },
    '8': { fontSize: vars.typography['8'].fontSize },
    '9': { fontSize: vars.typography['9'].fontSize },
    xs: { fontSize: vars.typography['1'].fontSize },
    sm: { fontSize: vars.typography['3'].fontSize },
    md: { fontSize: vars.typography['6'].fontSize },
    lg: { fontSize: vars.typography['7'].fontSize },
    xl: { fontSize: vars.typography['8'].fontSize },
    xxl: { fontSize: vars.typography['9'].fontSize },
    display: { fontSize: vars.typography.fontSizeDisplay }
});

export const textWeights = styleVariants({
    normal: { fontWeight: vars.typography.fontWeightNormal },
    medium: { fontWeight: vars.typography.fontWeightMedium },
    bold: { fontWeight: vars.typography.fontWeightBold }
});

export const textColors = styleVariants({
    primary: { color: vars.colors.text },
    secondary: { color: vars.colors.textSecondary },
    muted: { color: vars.colors.textMuted },
    error: { color: vars.colors.error },
    success: { color: vars.colors.success },
    warning: { color: vars.colors.warning },
    info: { color: vars.colors.info },
    inherit: { color: 'inherit' }
});

export const textAlignments = styleVariants({
    left: { textAlign: 'left' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' }
});
