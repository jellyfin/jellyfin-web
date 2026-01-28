import { style as vanillaStyle, keyframes } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const spin = keyframes({
    '0%': { transform: 'rotate(0deg)' },

    '100%': { transform: 'rotate(360deg)' }
});

export const seekSliderContainer = vanillaStyle({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['2'],
    width: '100%'
});

export const seekSliderTimeDisplay = vanillaStyle({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: vars.typography['1'].fontSize,
    color: vars.colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none'
});

export const seekSliderTrack = vanillaStyle({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    touchAction: 'none',
    width: '100%',
    cursor: 'pointer'
});

export const seekSliderTrackInner = vanillaStyle({
    position: 'relative',
    flexGrow: 1,
    borderRadius: vars.borderRadius.full,
    backgroundColor: vars.colors.surface
});

export const seekSliderProgress = vanillaStyle({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    pointerEvents: 'none',
    transition: `width ${vars.transitions.fast}`
});

export const seekSliderBuffered = vanillaStyle({
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: vars.colors.textSecondary,
    opacity: 0.3,
    borderRadius: vars.borderRadius.full,
    pointerEvents: 'none'
});

export const seekSliderThumb = vanillaStyle({
    display: 'block',
    backgroundColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    boxShadow: vars.shadows.sm,
    transition: vars.transitions.fast,
    selectors: {
        '&:hover': {
            transform: 'scale(1.1)'
        },
        '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${vars.colors.primary}`
        }
    }
});

export const seekSliderThumbVisible = vanillaStyle({
    opacity: 1
});

export const seekSliderThumbSpinning = vanillaStyle({
    animation: `${spin} 0.4s ease-out`
});
