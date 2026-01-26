import { style, keyframes } from '@vanilla-extract/css';

export const rotate = keyframes({
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
});

export const circularProgressRoot = style({
    display: 'inline-block',
    position: 'relative',
    verticalAlign: 'middle'
});

export const circularProgressSizes = {
    sm: style({ width: '16px', height: '16px' }),
    md: style({ width: '24px', height: '24px' }),
    lg: style({ width: '32px', height: '32px' }),
    xl: style({ width: '48px', height: '48px' })
};
