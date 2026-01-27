import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const alertStyles = style({
    padding: '12px 16px',
    borderRadius: vars.borderRadius.md,
    border: `1px solid ${vars.colors.error}`,
    backgroundColor: `${vars.colors.error}15`
});

export const alertVariants = styleVariants({
    error: {
        borderColor: vars.colors.error,
        backgroundColor: `${vars.colors.error}15`,
        color: vars.colors.error
    },
    warning: {
        borderColor: vars.colors.warning,
        backgroundColor: `${vars.colors.warning}15`,
        color: vars.colors.warning
    },
    success: {
        borderColor: vars.colors.success,
        backgroundColor: `${vars.colors.success}15`,
        color: vars.colors.success
    },
    info: {
        borderColor: vars.colors.info,
        backgroundColor: `${vars.colors.info}15`,
        color: vars.colors.info
    },
    primary: {
        borderColor: vars.colors.primary,
        backgroundColor: `${vars.colors.primary}15`,
        color: vars.colors.primary
    },
    neutral: {
        borderColor: vars.colors.textSecondary,
        backgroundColor: `${vars.colors.textSecondary}15`,
        color: vars.colors.textSecondary
    }
});
