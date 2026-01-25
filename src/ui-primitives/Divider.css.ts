import { style } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const dividerStyles = style({
    margin: `${vars.spacing.md} 0`,
    border: 'none',
    borderTop: `1px solid ${vars.colors.divider}`
});

export const dividerVertical = style({
    display: 'inline-block',
    height: '1em',
    margin: `0 ${vars.spacing.sm}`,
    verticalAlign: 'middle',
    borderLeft: `1px solid ${vars.colors.divider}`
});

