import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const textStyles = style({
    margin: 0,
    fontFamily: vars.typography.fontFamily,
    color: vars.colors.text
});

export const textSizes = styleVariants({
    xs: { fontSize: vars.typography.fontSizeXs },
    sm: { fontSize: vars.typography.fontSizeSm },
    md: { fontSize: vars.typography.fontSizeMd },
    lg: { fontSize: vars.typography.fontSizeLg },
    xl: { fontSize: vars.typography.fontSizeXl },
    xxl: { fontSize: vars.typography.fontSizeXxl },
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
    info: { color: vars.colors.info }
});

export const textAlignments = styleVariants({
    left: { textAlign: 'left' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' }
});
