import { style, keyframes } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

const pulse = keyframes({
    '0%, 100%': {
        opacity: 0.6
    },
    '50%': {
        opacity: 0.3
    }
});

const wave = keyframes({
    '100%': {
        transform: 'translateX(100%)'
    }
});

export const skeletonRoot = style({
    display: 'inline-block',
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.sm,
    opacity: 0.6,
    animation: `${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`
});

export const skeletonWave = style({
    position: 'relative',
    overflow: 'hidden',
    '::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        transform: 'translateX(-100%)',
        backgroundImage: `linear-gradient(90deg, transparent, ${vars.colors.surfaceHover}, transparent)`,
        animation: `${wave} 2s infinite`
    }
});
