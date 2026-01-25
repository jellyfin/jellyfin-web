import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const container = style({
    position: 'relative',
    width: '100%',
    cursor: 'pointer',
    selectors: {
        '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: vars.colors.background,
            opacity: 0.3,
            borderRadius: vars.borderRadius.md,
            pointerEvents: 'none',
            zIndex: -1
        }
    }
});

export const bufferedOverlay = style({
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    borderRadius: vars.borderRadius.md,
    overflow: 'hidden'
});

export const bufferedSegment = style({
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: vars.colors.textSecondary,
    opacity: 0.2,
    pointerEvents: 'none'
});

export const crossfadingOverlay = style({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `${vars.colors.primary}11`,
    pointerEvents: 'none',
    borderRadius: vars.borderRadius.md,
    overflow: 'hidden'
});

export const crossfadingText = style({
    color: vars.colors.primary,
    fontSize: vars.typography.fontSizeXs,
    fontWeight: vars.typography.fontWeightMedium,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
});

