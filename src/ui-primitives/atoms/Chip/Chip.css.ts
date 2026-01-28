import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const chipStyles = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.spacing['2'],
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    fontSize: vars.typography['3'].fontSize,
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
        padding: `2px ${vars.spacing['4']}`,
        fontSize: vars.typography['1'].fontSize
    },
    md: {
        padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
        fontSize: vars.typography['3'].fontSize
    },
    lg: {
        padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
        fontSize: vars.typography['6'].fontSize
    }
});
