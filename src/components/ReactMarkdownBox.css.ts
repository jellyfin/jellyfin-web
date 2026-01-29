import { globalStyle, style } from '@vanilla-extract/css';

export const container = style({});

globalStyle(`${container} > :first-child`, {
    marginTop: 0,
    paddingTop: 0
});

globalStyle(`${container} > :last-child`, {
    marginBottom: 0,
    paddingBottom: 0
});
