import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const toastContainer = style({
    position: 'fixed',
    bottom: '8rem',
    pointerEvents: 'none',
    zIndex: vars.zIndex.toast + 10000,
    padding: '1em',
    display: 'flex',
    flexDirection: 'column',
    left: 0
});

export const toastContainerRtl = style({
    position: 'fixed',
    bottom: '8rem',
    pointerEvents: 'none',
    zIndex: vars.zIndex.toast + 10000,
    padding: '1em',
    display: 'flex',
    flexDirection: 'column',
    right: 0
});

export const toast = style({
    minWidth: '20em',
    boxSizing: 'border-box',
    boxShadow: '0 0.0725em 0.29em 0 rgba(0, 0, 0, 0.37)',
    borderRadius: '0.15em',
    cursor: 'default',
    transition: 'transform 0.3s ease-out',
    minHeight: 'initial',
    padding: '1em 1.5em',
    fontSize: vars.typography['6'].fontSize,
    margin: '0.25em 0',
    marginRight: 'auto',
    pointerEvents: 'initial',
    backgroundColor: vars.colors.surface,
    color: vars.colors.text
});

export const toastFirst = style({
    marginTop: 0
});

export const toastLast = style({
    marginBottom: 0,
    transform: 'translateY(16em)'
});

export const toastVisible = style({
    transform: 'none'
});

export const toastHide = style({
    opacity: 0,
    transition: 'opacity 0.3s ease-out'
});
