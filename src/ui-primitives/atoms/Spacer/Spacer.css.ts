import { styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const spacerSizes = styleVariants({
    xs: { height: vars.spacing.xs },
    sm: { height: vars.spacing.sm },
    md: { height: vars.spacing.md },
    lg: { height: vars.spacing.lg },
    xl: { height: vars.spacing.xl },
    xxl: { height: vars.spacing.xxl }
});
