import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const image = style({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: vars.borderRadius.md,
    transition: `opacity ${vars.transitions.fast}`
});

export const placeholder = style({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.md,
    color: vars.colors.textSecondary,
    fontSize: vars.typography.fontSizeXs
});

export const container = style({
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: vars.colors.surface
});
