import { style } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const sliderRoot = style({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    touchAction: 'none',
    width: '100%',
    height: vars.spacing.md
});

export const sliderTrack = style({
    backgroundColor: vars.colors.surfaceHover,
    position: 'relative',
    flexGrow: 1,
    borderRadius: vars.borderRadius.full,
    height: vars.spacing.xs
});

export const sliderRange = style({
    position: 'absolute',
    backgroundColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    height: '100%'
});

export const sliderThumb = style({
    display: 'block',
    width: vars.spacing.md,
    height: vars.spacing.md,
    backgroundColor: vars.colors.text,
    boxShadow: vars.shadows.md,
    borderRadius: vars.borderRadius.full,
    transition: vars.transitions.fast,
    ':hover': {
        backgroundColor: vars.colors.primary
    },
    ':focus': {
        outline: 'none',
        boxShadow: `0 0 0 2px ${vars.colors.primary}`
    }
});

