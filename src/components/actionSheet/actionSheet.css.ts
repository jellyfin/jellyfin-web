import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const actionSheet = style({
    display: 'flex',
    justifyContent: 'center',
    padding: 0,
    border: 'none',
    maxHeight: '84%',
    borderRadius: vars.borderRadius.sm + ' !important'
});

export const actionsheetNotFullscreen = style({
    maxWidth: '90%',
    maxHeight: '90%'
});

export const actionsheetFullscreen = style({
    maxHeight: 'none',
    borderRadius: '0 !important'
});

export const actionSheetContentCentered = style({
    textAlign: 'center',
    alignItems: 'center'
});

export const actionSheetContent = style({
    margin: '0 !important',
    padding: '0.4em 0 !important',
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'center',
    flexGrow: 1,
    overflow: 'hidden'
});

export const actionSheetMenuItem = style({
    fontWeight: 'inherit',
    boxShadow: 'none',
    flexShrink: 0,
    borderRadius: 0,
    margin: 0,
    ':focus': {
        transform: 'none !important'
    }
});

export const actionsheetListItemBody = style({
    padding: '0.4em 1em 0.4em 0.6em !important'
});

export const actionsheetListItemBodyRtl = style({
    padding: '0.4em 0.6em 0.4em 1em !important'
});

export const actionSheetItemText = style({
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'middle',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-start'
});

export const actionSheetItemAsideText = style({
    opacity: 0.7,
    fontSize: vars.typography.fontSizeSm,
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
    marginLeft: '5em',
    marginRight: '0.5em'
});

export const actionSheetItemAsideTextRtl = style({
    opacity: 0.7,
    fontSize: vars.typography.fontSizeSm,
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
    marginRight: '5em',
    marginLeft: '0.5em'
});

export const actionSheetScroller = style({
    marginBottom: '0 !important',
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
});

export const actionSheetScrollerTv = style({
    maxHeight: '64%',
    maxWidth: '60%',
    width: 'auto'
});

export const actionsheetDivider = style({
    height: '0.07em',
    margin: '0.25em 0',
    flexShrink: 0,
    backgroundColor: vars.colors.divider
});

export const actionSheetTitle = style({
    margin: '0.6em 0 0.7em !important',
    padding: '0 0.75rem',
    flexGrow: 0
});

export const actionSheetText = style({
    marginTop: 0,
    padding: '0 0.75rem',
    flexGrow: 0
});

export const actionsheetMenuItemIcon = style({
    padding: '0 !important',
    margin: '0 0.85em 0 0.45em !important'
});

export const actionsheetMenuItemIconRtl = style({
    padding: '0 !important',
    margin: '0 0.45em 0 0.85em !important'
});

export const actionsheetXlargeFont = style({
    fontSize: `${vars.typography.fontSizeLg} !important`
});

export const btnCloseActionSheet = style({
    position: 'fixed',
    top: '0.75em',
    left: '0.5em'
});

export const btnCloseActionSheetRtl = style({
    position: 'fixed',
    top: '0.75em',
    right: '0.5em'
});
