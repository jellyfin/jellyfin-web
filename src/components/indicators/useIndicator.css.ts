import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const progressBar = style({});

globalStyle(`${progressBar} > div`, {
    backgroundColor: vars.colors.secondary,
    borderRadius: '5px'
});
