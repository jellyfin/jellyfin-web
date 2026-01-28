import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const slideshowDialog = style({
    background: '#000'
});

export const slideshowSwiperContainer = style({
    background: '#000',
    position: 'fixed',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundPosition: 'center center',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    margin: 0,
    color: '#fff',
    lineHeight: 'normal'
});

export const swiperWrapper = style({
    background: '#000'
});

export const swiperSlide = style({
    background: '#000'
});

export const slideshowImage = style({
    position: 'fixed',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundPosition: 'center center',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    margin: 0,
    color: '#fff',
    lineHeight: 'normal'
});

export const slideshowImageCover = style({
    backgroundSize: 'cover'
});

export const slideshowImageText = style({
    position: 'fixed',
    bottom: '0.25em',
    right: '0.5em',
    color: '#fff',
    zIndex: 1002,
    fontWeight: 'normal',
    textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
});

export const slideshowButtonIcon = style({
    color: '#fff',
    opacity: 0.7
});

export const btnSlideshowPrevious = style({
    left: '0.5vh',
    top: '45vh',
    zIndex: 1002,
    position: 'absolute'
});

export const btnSlideshowNext = style({
    right: '0.5vh',
    top: '45vh',
    zIndex: 1002,
    position: 'absolute'
});

export const topActionButtons = style({
    right: '0.5vh',
    top: '0.5vh',
    zIndex: 1002,
    position: 'absolute'
});

export const slideshowBottomBar = style({
    position: 'fixed',
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '0.5%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
});

export const slideshowTopBar = style({
    position: 'fixed',
    left: 0,
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '0.5%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'right',
    justifyContent: 'flex-end'
});

export const slideshowExtraButtons = style({
    marginLeft: 'auto',
    textAlign: 'right'
});

export const slideText = style({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '10vh',
    textAlign: 'center'
});

export const slideTextInner = style({
    margin: '0 auto',
    maxWidth: '60%',
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'inline-block',
    padding: '0.5em 1em',
    borderRadius: '0.25em'
});

export const slideTitle = style({
    margin: '0 0 0.25em'
});

export const slideSubtitle = style({
    color: '#ccc'
});

export const swiperZoomFakeImg = style({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundPosition: '50% 50%',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    zIndex: 1,
    pointerEvents: 'none'
});

export const swiperZoomFakeImgHidden = style({
    display: 'none'
});
