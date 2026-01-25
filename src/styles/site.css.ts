import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from './tokens.css';

globalStyle('html', {
    margin: 0,
    padding: 0,
    height: '100%',
    fontFamily: vars.typography.fontFamily,
    lineHeight: 1.35
});

globalStyle('body', {
    margin: 0,
    padding: 0,
    height: '100%',
    overflowX: 'hidden',
    backgroundColor: 'transparent',
    WebkitFontSmoothing: 'antialiased'
});

export const clipForScreenReader = style({
    clip: 'rect(1px, 1px, 1px, 1px)',
    clipPath: 'inset(50%)',
    height: '1px',
    width: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute'
});

globalStyle('.material-icons', {
    fontFeatureSettings: '"liga"'
});

export const backgroundContainer = style({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    contain: 'strict'
});

export const layoutMobileTv = style({
    WebkitTouchCallout: 'none',
    userSelect: 'none'
});

export const mainAnimatedPage = style({
    contain: 'style size !important'
});

export const pageContainer = style({
    overflowX: 'visible'
});

export const bodyWithPopupOpen = style({
    overflowY: 'hidden'
});

globalStyle('div[data-role="page"]', {
    outline: 0
});

export const sitePageTitle = style({
    marginTop: 0,
    fontFamily: 'inherit'
});

export const fieldDescription = style({
    paddingLeft: '0.15em',
    fontWeight: vars.typography.fontWeightNormal,
    whiteSpace: 'normal !important'
});

globalStyle('.fieldDescription + .fieldDescription', {
    marginTop: '0.3em'
});

export const contentPrimary = style({
    paddingBottom: 'calc(5em + env(safe-area-inset-bottom, 0) + 12em)'
});

export const readOnlyContent = style({
    '@media': {
        'all and (min-width: 50em)': {
            maxWidth: '54em'
        }
    }
});

globalStyle('form', {
    '@media': {
        'all and (min-width: 50em)': {
            maxWidth: '54em'
        }
    }
});

export const mediaInfoContent = style({
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '85%'
});

export const headroom = style({
    willChange: 'transform',
    transition: 'transform 200ms linear'
});

export const headroomPinned = style({
    transform: 'translateY(0%)'
});

export const headroomUnpinned = style({
    transform: 'translateY(-100%)'
});

export const headroomDisabled = style({
    transform: 'none !important',
    transition: 'none !important'
});

export const drawerContent = style({
    paddingBottom: '4em'
});

export const forceScroll = style({
    overflowY: 'scroll'
});

export const hideScroll = style({
    overflowY: 'hidden'
});

export const width100 = style({
    width: '100%'
});

export const marginAutoX = style({
    marginLeft: 'auto',
    marginRight: 'auto'
});

export const marginAutoY = style({
    marginTop: 'auto',
    marginBottom: 'auto'
});
