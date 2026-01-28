import { style } from '@vanilla-extract/css';
import { vars } from './tokens.css';

export const videoOsdBottom = style({
    bottom: 0,
    left: 0,
    right: 0,
    position: 'fixed',
    background: 'linear-gradient(0deg, rgba(16, 16, 16, 0.75) 0%, rgba(16, 16, 16, 0) 100%)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
    paddingTop: '7.5em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    willChange: 'opacity',
    transition: 'opacity 0.3s ease-out',
    color: '#fff',
    userSelect: 'none',
    WebkitTouchCallout: 'none',
    pointerEvents: 'none',
    paddingBottom: 'calc(1.75em + env(safe-area-inset-bottom, 0))'
});

export const osdHeader = style({
    transition: 'opacity 0.3s ease-out',
    position: 'relative',
    zIndex: 1,
    background: 'linear-gradient(180deg, rgba(16, 16, 16, 0.75) 0%, rgba(16, 16, 16, 0) 100%)',
    backdropFilter: 'none',
    color: '#eee',
    height: '7.5em',
    pointerEvents: 'none'
});

export const osdHeaderHidden = style({
    opacity: 0
});

export const osdHeaderTop = style({
    pointerEvents: 'all',
    maxHeight: '3.5em'
});

export const osdHeaderButton = style({
    display: 'none'
});

export const chapterThumbContainer = style({
    boxShadow: '0 0 1.9vh #000',
    flexGrow: 1,
    position: 'relative'
});

export const chapterThumb = style({
    backgroundPosition: 'center center',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    border: 0,
    height: '20vh',
    minWidth: '20vh'
});

export const osdSeekBarRoot = style({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '0.5em',
    cursor: 'pointer'
});

export const osdSeekBarTrack = style({
    background: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    flexGrow: 1,
    height: '0.25em',
    borderRadius: '0.25em'
});

export const osdSeekBarRange = style({
    position: 'absolute',
    height: '100%',
    background: vars.colors.primary,
    borderRadius: '0.25em'
});

export const osdSeekBarThumb = style({
    display: 'block',
    width: '1em',
    height: '1em',
    background: vars.colors.text,
    borderRadius: '50%',
    boxShadow: vars.shadows.md,
    transition: vars.transitions.fast,
    ':hover': {
        background: vars.colors.primary
    }
});

export const osdControls = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.spacing['5'],
    padding: vars.spacing['5']
});

export const osdButton = style({
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: vars.typography['7'].fontSize,
    cursor: 'pointer',
    padding: vars.spacing['4'],
    borderRadius: '50%',
    transition: vars.transitions.fast,
    ':hover': {
        background: 'rgba(255, 255, 255, 0.2)'
    }
});

export const osdTimeDisplay = style({
    color: '#fff',
    fontSize: vars.typography['6'].fontSize,
    fontFamily: vars.typography.fontFamilyMono
});

export const osdVolumeContainer = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing['4']
});

export const osdMenuContainer = style({
    display: 'flex',
    gap: vars.spacing['6'],
    marginLeft: vars.spacing['7']
});

export const osdMenuButton = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: vars.spacing['2'],
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: vars.spacing['4']
});

export const osdProgressRoot = style({
    position: 'relative',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '0.25em',
    height: '0.25em',
    flexGrow: 1
});

export const osdProgressIndicator = style({
    background: vars.colors.primary,
    height: '100%',
    transition: 'transform 660ms cubic-bezier(0.65, 0, 0.35, 1)'
});
