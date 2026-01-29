import { keyframes, style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const backdropContainer = style({
    contain: 'layout style size'
});

export const backdropImage = style({
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    contain: 'layout style'
});

const backdropFadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 }
});

export const backdropImageFadeIn = style({
    animation: `${backdropFadeIn} 800ms ease-in normal both`
});
