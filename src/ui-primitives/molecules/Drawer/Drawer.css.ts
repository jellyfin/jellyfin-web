import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const drawerOverlay = style({
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: vars.zIndex.modalBackdrop
});

export const drawerContent = style({
    position: 'fixed',
    top: 0,
    bottom: 0,
    width: '320px',
    maxWidth: '100vw',
    backgroundColor: vars.colors.surface,
    boxShadow: vars.shadows.xl,
    padding: vars.spacing.md,
    overflowY: 'auto',
    zIndex: vars.zIndex.modal,
    transition: `transform ${vars.transitions.fast}`
});

export const drawerAnchor = styleVariants({
    left: {
        left: 0,
        right: 'auto',
        transform: 'translateX(0)'
    },
    right: {
        right: 0,
        left: 'auto',
        transform: 'translateX(0)'
    },
    top: {
        left: 0,
        right: 0,
        height: '45vh'
    },
    bottom: {
        left: 0,
        right: 0,
        bottom: 0,
        height: '45vh'
    }
});
