import { style, keyframes, globalStyle } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const dialogContainer = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: vars.zIndex.modal,
    contain: 'strict',
    overflow: 'hidden',
    overscrollBehavior: 'contain'
});

export const dialog = style({
    margin: 0,
    borderRadius: '0.2em',
    WebkitFontSmoothing: 'antialiased',
    border: 0,
    padding: 0,
    willChange: 'transform, opacity',
    contain: 'style paint',
    boxShadow: vars.shadows.xl,
    backgroundColor: vars.colors.surface,
    color: vars.colors.text
});

export const dialogFixedSize = style({
    borderRadius: 0,
    maxHeight: 'none',
    maxWidth: 'none',
    contain: 'layout style paint'
});

export const dialogFullscreen = style({
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    margin: 0,
    boxShadow: 'none'
});

export const dialogSmall = style({
    width: '60%',
    height: '80%'
});

export const noScroll = style({
    overflowX: 'hidden',
    overflowY: 'hidden'
});

export const dialogBackdrop = style({
    backgroundColor: '#000',
    opacity: 0,
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    margin: 0,
    zIndex: vars.zIndex.modalBackdrop,
    transition: 'opacity ease-out 0.2s',
    willChange: 'opacity'
});

export const dialogBackdropOpened = style({
    opacity: 0.5
});

const scaleDown = keyframes({
    from: { opacity: 1, transform: 'none' },
    to: { opacity: 0, transform: 'scale(0.5)' }
});

const scaleUp = keyframes({
    from: { transform: 'scale(0.5)', opacity: 0 },
    to: { transform: 'none', opacity: 1 }
});

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 }
});

const fadeOut = keyframes({
    from: { opacity: 1 },
    to: { opacity: 0 }
});

const slideUp = keyframes({
    from: { opacity: 0, transform: 'translate3d(0, 30%, 0)' },
    to: { opacity: 1, transform: 'none' }
});

const slideDown = keyframes({
    from: { opacity: 1, transform: 'none' },
    to: { opacity: 0, transform: 'translate3d(0, 20%, 0)' }
});

export const animations = {
    scaleDown,
    scaleUp,
    fadeIn,
    fadeOut,
    slideUp,
    slideDown
};

export const dialogFullscreenLowres = style({
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    margin: 0,
    boxShadow: 'none',
    width: 'auto',
    height: 'auto'
});
