import { style, keyframes } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

const spin = keyframes({

    '0%': { transform: 'rotate(0deg)' },

    '100%': { transform: 'rotate(360deg)' }
});

export const seekerContainer = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.xs
});

export const seekerTimeDisplay = style({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: vars.typography.fontSizeXs,
    color: vars.colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none'
});

export const seekerTrack = style({
    position: 'relative',
    height: '4px',
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.full,
    cursor: 'pointer',
    selectors: {
        '&:hover': {
            height: '6px'
        }
    }
});

export const seekerTrackHover = style({
    height: '6px'
});

export const seekerProgress = style({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    pointerEvents: 'none',
    transition: `width ${vars.transitions.fast}`
});

export const seekerBuffered = style({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: vars.colors.textSecondary,
    opacity: 0.3,
    borderRadius: vars.borderRadius.full,
    pointerEvents: 'none'
});

export const seekerThumb = style({
    position: 'absolute',
    top: '50%',
    width: '12px',
    height: '12px',
    backgroundColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    transform: 'translate(-50%, -50%)',
    boxShadow: vars.shadows.sm,
    opacity: 0,
    transition: `opacity ${vars.transitions.fast}`,
    pointerEvents: 'none',
    selectors: {
        [`${seekerTrack}:hover &`]: {
            opacity: 1
        }
    }
});

export const seekerThumbVisible = style({
    opacity: 1
});

export const seekerThumbSpinning = style({
    animation: `${spin} 0.4s ease-out`
});

export const seekerPausedButton = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    backgroundColor: vars.colors.primary,
    border: 'none',
    borderRadius: vars.borderRadius.full,
    cursor: 'pointer',
    transition: vars.transitions.fast,
    selectors: {
        '&:hover': {
            transform: 'scale(1.1)'
        }
    }
});

export const seekerPausedButtonSpinning = style({
    animation: `${spin} 0.4s ease-out`
});

