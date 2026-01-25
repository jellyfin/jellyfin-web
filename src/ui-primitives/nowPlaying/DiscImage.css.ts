import { style, keyframes } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

const spin = keyframes({
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' }
});

export const discContainer = style({
    position: 'relative',
    borderRadius: '50%',
    overflow: 'hidden',
    transition: `transform ${vars.transitions.slow}`
});

export const discSpindle = style({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '15%',
    height: '15%',
    backgroundColor: vars.colors.background,
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1
});

export const discGroove = style({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '85%',
    height: '85%',
    borderRadius: '50%',
    border: `1px solid ${vars.colors.textSecondary}22`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
});

export const spinning = style({
    animationName: spin,
    animationDuration: '3s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite'
});
