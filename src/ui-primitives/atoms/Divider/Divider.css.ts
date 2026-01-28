import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const dividerStyles = style({
    margin: `${vars.spacing['5']} 0`,
    border: 'none',
    borderTop: `1px solid ${vars.colors.divider}`
});

export const dividerVertical = style({
    display: 'inline-block',
    height: '1em',
    margin: `0 ${vars.spacing['4']}`,
    verticalAlign: 'middle',
    borderLeft: `1px solid ${vars.colors.divider}`
});
