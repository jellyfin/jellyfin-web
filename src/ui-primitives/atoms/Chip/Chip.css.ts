import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const chipStyles = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.spacing.xs,
    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
    fontSize: vars.typography.fontSizeSm,
    borderRadius: vars.borderRadius.full,
    fontWeight: vars.typography.fontWeightMedium,
    cursor: 'default'
});

export const chipVariants = styleVariants({
    primary: {
        backgroundColor: vars.colors.primary,
        color: vars.colors.text
    },
    secondary: {
        backgroundColor: vars.colors.surface,
        color: vars.colors.text
    },
    neutral: {
        backgroundColor: vars.colors.surfaceHover,
        color: vars.colors.textSecondary
    },
    error: {
        backgroundColor: vars.colors.error,
        color: vars.colors.text
    },
    success: {
        backgroundColor: vars.colors.success,
        color: vars.colors.text
    },
    warning: {
        backgroundColor: vars.colors.warning,
        color: vars.colors.text
    },
    info: {
        backgroundColor: vars.colors.info,
        color: vars.colors.text
    },
    soft: {
        backgroundColor: vars.colors.surface,
        color: vars.colors.text
    }
});

export const chipSizes = styleVariants({
    sm: {
        padding: `2px ${vars.spacing.sm}`,
        fontSize: vars.typography.fontSizeXs
    },
    md: {
        padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
        fontSize: vars.typography.fontSizeSm
    },
    lg: {
        padding: `${vars.spacing.sm} ${vars.spacing.md}`,
        fontSize: vars.typography.fontSizeMd
    }
});
