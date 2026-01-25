import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const avatarStyles = style({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: vars.colors.text,
    fontSize: vars.typography.fontSizeLg,
    fontWeight: vars.typography.fontWeightMedium,
    overflow: 'hidden',
    flexShrink: 0
});

export const avatarVariants = styleVariants({
    plain: {
        backgroundColor: 'transparent'
    },
    soft: {
        backgroundColor: vars.colors.surfaceHover
    },
    solid: {
        backgroundColor: vars.colors.primary,
        color: vars.colors.text
    }
});

export const avatarColors = styleVariants({
    primary: {
        backgroundColor: vars.colors.primary,
        color: vars.colors.text
    },
    neutral: {
        backgroundColor: vars.colors.surfaceHover,
        color: vars.colors.textSecondary
    },
    danger: {
        backgroundColor: vars.colors.error,
        color: vars.colors.text
    },
    warning: {
        backgroundColor: vars.colors.warning,
        color: vars.colors.text
    },
    success: {
        backgroundColor: vars.colors.success,
        color: vars.colors.text
    },
    info: {
        backgroundColor: vars.colors.info,
        color: vars.colors.text
    }
});

export const avatarImage = style({
    width: '100%',
    height: '100%',
    objectFit: 'cover'
});
