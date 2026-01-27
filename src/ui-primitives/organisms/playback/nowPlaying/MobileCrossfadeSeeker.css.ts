import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/tokens.css';

export const seekerContainer = style({
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
});

export const timeDisplay = style({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
    padding: '0 4px'
});

export const progressBarContainer = style({
    position: 'relative',
    padding: '20px 0',
    margin: '-20px 0'
});

export const progressBar = style({
    position: 'relative',
    height: '8px',
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.full,
    cursor: 'pointer',
    touchAction: 'none'
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
    width: '24px',
    height: '24px',
    backgroundColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    transform: 'translate(-50%, -50%)',
    boxShadow: vars.shadows.md,
    opacity: 1,
    pointerEvents: 'none',
    transition: `transform ${vars.transitions.fast}, opacity ${vars.transitions.fast}`
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

export const swipeHintLeft = style({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textSecondary,
    opacity: 0.5,
    pointerEvents: 'none',
    transition: `opacity ${vars.transitions.fast}`,
    '@media': {
        '(pointer: fine)': {
            opacity: 0
        }
    }
});

export const swipeHintRight = style({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textSecondary,
    opacity: 0.5,
    pointerEvents: 'none',
    transition: `opacity ${vars.transitions.fast}`,
    right: '8px',
    '@media': {
        '(pointer: fine)': {
            opacity: 0
        }
    }
});
