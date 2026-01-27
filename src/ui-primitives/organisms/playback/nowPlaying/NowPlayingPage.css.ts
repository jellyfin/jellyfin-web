import { style } from '@vanilla-extract/css';
import { vars } from '../../../../styles/tokens.css';

export const pageContainer = style({
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: vars.spacing.xl,
    zIndex: 1000,
    backgroundColor: vars.colors.background
});

export const artworkContainer = style({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '400px',
    maxHeight: '400px',
    marginBottom: vars.spacing.lg
});

export const metadataContainer = style({
    marginBottom: vars.spacing.lg,
    textAlign: 'center'
});

export const seekerContainer = style({
    width: '100%',
    maxWidth: '600px',
    marginBottom: vars.spacing.lg
});

export const visualizerContainer = style({
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    pointerEvents: 'none'
});

export const controlsContainer = style({
    display: 'flex',
    gap: vars.spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
});

export const controlButton = style({
    background: 'none',
    border: 'none',
    color: vars.colors.text,
    cursor: 'pointer',
    padding: vars.spacing.sm,
    borderRadius: vars.borderRadius.full,
    transition: `background-color ${vars.transitions.fast}`,
    selectors: {
        '&:hover': {
            backgroundColor: vars.colors.surface
        },
        '&:active': {
            transform: 'scale(0.95)'
        }
    }
});

export const playButton = style({
    width: '56px',
    height: '56px',
    backgroundColor: vars.colors.primary,
    color: vars.colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    borderRadius: vars.borderRadius.full,
    transition: `background-color ${vars.transitions.fast}`,
    selectors: {
        '&:hover': {
            backgroundColor: vars.colors.primary,
            opacity: 0.9
        },
        '&:active': {
            transform: 'scale(0.95)'
        }
    }
});

export const icon = style({
    width: '24px',
    height: '24px',
    display: 'block'
});
