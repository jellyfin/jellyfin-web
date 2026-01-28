import { style as vanillaStyle, keyframes } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const spin = keyframes({
    '0%': { transform: 'rotate(0deg)' },

    '100%': { transform: 'rotate(360deg)' }
});

export const volumeSliderContainer = vanillaStyle({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['2']
});

export const volumeSliderTrack = vanillaStyle({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    touchAction: 'none',
    width: '80px',
    height: vars.spacing['5']
});

export const volumeSliderTrackInner = vanillaStyle({
    backgroundColor: vars.colors.surfaceHover,
    position: 'relative',
    flexGrow: 1,
    borderRadius: vars.borderRadius.full,
    height: vars.spacing['2']
});

export const volumeSliderRange = vanillaStyle({
    position: 'absolute',
    backgroundColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    height: '100%'
});

export const volumeSliderThumb = vanillaStyle({
    display: 'block',
    width: vars.spacing['5'],
    height: vars.spacing['5'],
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

export const volumeSliderMuteButton = vanillaStyle({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

export const volumeSliderMuteButtonSpinning = vanillaStyle({
    animation: `${spin} 0.3s ease-out`
});
