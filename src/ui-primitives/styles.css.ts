import { style, keyframes } from '@vanilla-extract/css';

const spinClockwise = keyframes({
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' }
});

const spinCounterClockwise = keyframes({
    from: { transform: 'rotate(360deg)' },
    to: { transform: 'rotate(0deg)' }
});

const scratchWobble = keyframes({
    '0%': { transform: 'rotate(0deg)' },
    '25%': { transform: 'rotate(-5deg)' },
    '50%': { transform: 'rotate(3deg)' },
    '75%': { transform: 'rotate(-2deg)' },
    '100%': { transform: 'rotate(0deg)' }
});

const colors = {
    surface: '#252525',
    primary: '#aa5eaa',
    background: '#101010',
    textSecondary: '#b0b0b0'
};

const shadows = {
    md: '0 4px 6px rgba(0, 0, 0, 0.4)'
};

export const rotaryContainer = style({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'transform 0.1s ease-out',
    selectors: {
        '&[data-rotating="true"]': {
            animation: `${spinClockwise} 2s linear infinite`
        },
        '&[data-rotating="reverse"]': {
            animation: `${spinCounterClockwise} 2s linear infinite`
        },
        '&[data-scratching="true"]': {
            animation: `${scratchWobble} 0.15s ease-in-out`
        },
        '&[data-state="playing"]': {
            transform: 'scale(1)'
        },
        '&[data-state="paused"]': {
            transform: 'scale(0.95)'
        },
        '&[data-state="braking"]': {
            transform: 'scale(0.98)'
        },
        '&[data-state="spinning"]': {
            transform: 'scale(1.02)'
        }
    }
});

export const discArt = style({
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    border: `2px solid ${colors.surface}`,
    boxShadow: shadows.md
});

export const discGroove = style({
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background:
        'repeating-radial-gradient(circle at center, transparent 0px, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)',
    pointerEvents: 'none'
});

export const discLabel = style({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '35%',
    height: '35%',
    borderRadius: '50%',
    background: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.surface}`
});

export const centerHole = style({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors.background,
    border: `1px solid ${colors.textSecondary}`
});

export { spinClockwise, spinCounterClockwise, scratchWobble };
