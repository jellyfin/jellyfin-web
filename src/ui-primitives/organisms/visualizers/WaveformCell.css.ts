import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const container = style({
    position: 'relative',
    height: 40,
    width: '100%',
    minWidth: 100,
    maxWidth: 200
});

export const emptyState = style({
    height: '100%',
    minWidth: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end'
});

export const timeText = style({
    fontSize: vars.typography.fontSizeXs,
    color: vars.colors.textSecondary
});

export const canvas = style({
    width: '100%',
    height: '100%',
    display: 'block'
});
