import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const seekerContainer = style({
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
});

export const timeDisplay = style({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: vars.typography.fontSizeXs,
    color: vars.colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none'
});

export const progressBar = style({
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

export const progressFill = style({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    pointerEvents: 'none',
    transition: `width ${vars.transitions.fast}`
});

export const buffered = style({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: vars.colors.textSecondary,
    opacity: 0.3,
    borderRadius: vars.borderRadius.full,
    pointerEvents: 'none'
});

export const handle = style({
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
        [`${progressBar}:hover &`]: {
            opacity: 1
        }
    }
});

export const waveformContainer = style({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: vars.borderRadius.full,
    opacity: 0.6
});
