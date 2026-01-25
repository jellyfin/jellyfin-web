import { style } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const scrollAreaRoot = style({
    width: '100%',
    height: '100%',
    overflow: 'hidden'
});

export const scrollAreaViewport = style({
    width: '100%',
    height: '100%',
    borderRadius: 'inherit'
});

export const scrollAreaScrollbar = style({
    display: 'flex',
    userSelect: 'none',
    touchAction: 'none',
    padding: vars.spacing.xs,
    background: vars.colors.surface,
    transition: `background ${vars.transitions.fast}`,
    selectors: {
        '&[data-orientation="vertical"]': {
            width: vars.spacing.sm
        },
        '&[data-orientation="horizontal"]': {
            height: vars.spacing.sm,
            flexDirection: 'row'
        }
    }
});

export const scrollAreaThumb = style({
    flex: 1,
    background: vars.colors.textMuted,
    borderRadius: vars.borderRadius.full,
    position: 'relative',
    '::before': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        minWidth: 44,
        minHeight: 44
    },
    selectors: {
        '&[data-state="scroll"]': {
            background: vars.colors.textSecondary
        }
    }
});

export const scrollAreaCorner = style({
    background: vars.colors.surface
});

