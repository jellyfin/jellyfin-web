import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const progressBar = style({
    selectors: {
        '& > div': {
            backgroundColor: vars.colors.secondary,
            borderRadius: '5px'
        }
    }
});
