import { style } from '@vanilla-extract/css';

export const rtlFlipHorizontal = style({
    transform: 'scaleX(-1)'
});

export const rtlFlipHorizontalSelectors = {
    '&, [dir="rtl"] &': {
        transform: 'scaleX(-1)'
    }
};
