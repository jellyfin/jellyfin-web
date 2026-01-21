import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const card = style({
    height: '100%',
    transition: 'transform 0.2s',
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: vars.shadows.md,
    },
});

export const cardDisabled = style({
    filter: 'grayscale(1)',
    opacity: 0.7,
});

export const imageContainer = style({
    position: 'relative',
});

export const aspectRatio = style({
    aspectRatio: '1',
});

export const disabledOverlay = style({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
});

export const disabledText = style({
    color: 'white',
    fontWeight: 'bold',
});

export const cardContent = style({
    paddingTop: vars.spacing.sm,
});

export const headerRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
});

export const titleContainer = style({
    flexGrow: 1,
    minWidth: 0,
});

export const userImage = style({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
});

export const avatarPlaceholder = style({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vars.colors.primary,
    color: 'white',
    fontSize: '64px',
});

export const userName = style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

export const lastSeen = style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});
