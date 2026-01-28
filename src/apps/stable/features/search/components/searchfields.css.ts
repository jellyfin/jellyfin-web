import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const searchFieldsInner = style({
    maxWidth: '60em',
    margin: '0 auto'
});

export const searchFieldsIcon = style({
    marginBottom: '0.1em',
    marginRight: '0.25em',
    fontSize: vars.typography['7'].fontSize,
    alignSelf: 'flex-end'
});
