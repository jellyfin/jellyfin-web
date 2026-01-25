import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const backdrop = style({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    transform: 'scale(1.1)',
    transition: `opacity ${vars.transitions.slow}, filter ${vars.transitions.slow}`
});

export const blur = style({
    position: 'absolute',
    inset: 0,
    backgroundColor: vars.colors.background,
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)'
});

export const overlay = style({
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(to bottom, ${vars.colors.background}00 0%, ${vars.colors.background} 100%)`
});

