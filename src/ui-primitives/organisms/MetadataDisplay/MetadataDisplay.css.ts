import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const container = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: vars.spacing['2']
});

export const title = style({
    fontWeight: 600,
    fontSize: vars.typography['7'].fontSize,
    lineHeight: 1.2,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
});

export const artist = style({
    color: vars.colors.textSecondary,
    fontSize: vars.typography['6'].fontSize,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
});

export const album = style({
    color: vars.colors.textSecondary,
    fontSize: vars.typography['3'].fontSize,
    opacity: 0.7,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
});

export const link = style({
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: `opacity ${vars.transitions.fast}`,
    selectors: {
        '&:hover': {
            opacity: 0.8
        }
    }
});
