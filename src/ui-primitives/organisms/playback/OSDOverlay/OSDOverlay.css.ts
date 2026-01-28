import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const warningProgress = style({});

globalStyle(`${warningProgress} > div`, {
    backgroundColor: vars.colors.warning
});
