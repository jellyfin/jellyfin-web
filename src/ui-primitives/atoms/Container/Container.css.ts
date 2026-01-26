import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const container = style({
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: vars.spacing.md,
    paddingRight: vars.spacing.md
});

export const maxWidth = styleVariants({
    xs: {
        maxWidth: '600px'
    },
    sm: {
        maxWidth: '600px'
    },
    md: {
        maxWidth: '960px'
    },
    lg: {
        maxWidth: '1280px'
    },
    xl: {
        maxWidth: '1920px'
    },
    none: {
        maxWidth: 'none'
    }
});
