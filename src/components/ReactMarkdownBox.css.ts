import { style } from '@vanilla-extract/css';

export const container = style({
    selectors: {
        '& > :first-child': {
            marginTop: 0,
            paddingTop: 0
        },
        '& > :last-child': {
            marginBottom: 0,
            paddingBottom: 0
        }
    }
});
