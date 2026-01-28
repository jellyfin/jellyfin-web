import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const overlayStyle = style({
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'fixed',
    inset: 0,
    zIndex: 999
});

export const contentStyle = style({
    backgroundColor: '#252525',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '400px',
    width: '90%',
    padding: vars.spacing['5'],
    zIndex: 1000
});

export const titleStyle = style({
    margin: 0,
    fontWeight: vars.typography.fontWeightMedium,
    fontSize: vars.typography['6'].fontSize,
    color: vars.colors.text,
    marginBottom: vars.spacing['5']
});

export const closeButtonStyle = style({
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    ':hover': { color: '#fff' }
});

export const labelStyle = style({
    display: 'block',
    marginBottom: '6px',
    fontSize: vars.typography['3'].fontSize,
    color: vars.colors.textSecondary
});

export const selectContainerStyle = style({
    marginBottom: vars.spacing['4']
});

export const errorStyle = style({
    color: vars.colors.error,
    marginBottom: vars.spacing['5'],
    fontSize: vars.typography['3'].fontSize
});
