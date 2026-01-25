import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const listItem = style({
    background: 'transparent',
    border: 0,
    outline: 'none',
    color: 'inherit',
    verticalAlign: 'middle',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    margin: 0,
    alignItems: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    selectors: {
        '&[data-action=none]': {
            cursor: 'default'
        },
        '&:focus': {
            borderRadius: '0.2em'
        }
    }
});

export const listItemBody = style({
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    padding: '0.85em 0.75em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexDirection: 'column',
    verticalAlign: 'middle',
    justifyContent: 'center',
    contain: 'layout style'
});

export const listItemMediaInfo = style({
    display: 'flex',
    alignItems: 'center',
    marginRight: '1em'
});

export const listItemWithContentWrapper = style({
    flexDirection: 'column',
    alignItems: 'flex-start'
});

export const listItemContent = style({
    display: 'flex',
    alignItems: 'center',
    width: '100%'
});

export const listItemButton = style({
    width: '100%'
});

export const listItemIndexNumberLeft = style({
    minWidth: '2%',
    textAlign: 'center',
    marginRight: '1em'
});

export const listItemBorder = style({
    margin: 0,
    padding: 0,
    borderWidth: '0 0 0.1em 0',
    borderStyle: 'solid',
    borderRadius: 0
});

export const listItemImage = style({
    display: 'flex',
    width: '4em',
    height: '4em',
    minWidth: '2.78em',
    minHeight: '2.78em',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    flexShrink: 0,
    position: 'relative'
});

export const listItemIcon = style({
    display: 'inline-block',
    verticalAlign: 'middle',
    width: '1em',
    height: '1em',
    fontSize: vars.typography.fontSizeLg
});

export const listItemIconTransparent = style({
    backgroundColor: 'transparent',
    color: 'inherit'
});

export const listItemIconDefault = style({
    backgroundColor: '#00a4dc',
    color: '#fff',
    padding: '0.5em',
    borderRadius: '100em'
});

export const listItemButtonClass = style({
    margin: 0,
    display: 'inline-block',
    verticalAlign: 'middle',
    flexShrink: 0,
    contain: 'layout style'
});

export const listViewDragHandle = style({
    touchAction: 'none'
});

export const listItemBodyText = style({
    margin: 0,
    padding: '0.1em 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: vars.typography.fontWeightNormal
});

export const listItemBodyTextNowrap = style({
    whiteSpace: 'nowrap'
});

export const listItemImageLarge = style({
    width: '19.5vw',
    height: '13vw',
    backgroundPosition: 'center center',
    marginRight: '0.75em'
});

export const listItemImageChannel = style({
    backgroundSize: 'contain'
});

export const listItemImageButton = style({
    alignSelf: 'center',
    justifySelf: 'center',
    margin: 'auto',
    color: 'rgba(255, 255, 255, 0.6)',
    background: 'rgba(0, 0, 0, 0.4)',
    fontSize: vars.typography.fontSizeXl,
    transition: '200ms ease-out',
    display: 'flex'
});

export const listItemImageButtonIcon = style({
    borderRadius: '100em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.2em'
});

export const cardImageIcon = style({
    margin: 'auto',
    fontSize: vars.typography.fontSizeXxl
});

export const listItemImageLargeTv = style({
    width: '30vw',
    height: '20vw'
});

export const listItemProgressBar = style({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
});

export const listItemFocusScale = style({
    transition: 'transform 0.2s ease-out',
    selectors: {
        '&:focus': {
            transform: 'scale(1.025, 1.025)'
        }
    }
});

export const paperList = style({
    margin: '0.5em auto'
});

export const paperListClear = style({
    backgroundColor: 'transparent'
});

export const listGroupHeaderFirst = style({
    marginTop: 0
});

export const listItemIndicators = style({
    right: '0.324em',
    top: '0.324em',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center'
});

export const listItemBottomOverview = style({
    fontSize: vars.typography.fontSizeSm,
    marginBottom: '1em',
    marginTop: '0.2em'
});

export const listItemCheckboxContainer = style({
    width: 'auto'
});

globalStyle('[dir="ltr"] .listItem', {
    textAlign: 'left',
    padding: '0.25em 0.25em 0.25em 0.5em'
});

globalStyle('[dir="rtl"] .listItem', {
    textAlign: 'right',
    padding: '0.25em 0.5em 0.25em 0.25em'
});

globalStyle('[dir="ltr"] .listViewDragHandle', {
    marginLeft: '-0.25em'
});

globalStyle('[dir="rtl"] .listViewDragHandle', {
    marginRight: '-0.25em'
});

globalStyle('.layout-tv .listItemBody', {
    padding: '0.35em 0.75em'
});

globalStyle('.layout-desktop .listItemBodyText', {
    lineHeight: '1.2em'
});

globalStyle('.listItem:hover .listItemImageButton', {
    color: '#00a4dc',
    background: 'rgba(0, 164, 220, 0.2)',
    transform: 'scale(1.2, 1.2)'
});

globalStyle('[dir="ltr"] .listItemIcon', {
    margin: '0 0.25em 0 0'
});

globalStyle('[dir="rtl"] .listItemIcon', {
    margin: '0 0 0 0.25em'
});

globalStyle('[dir="ltr"] .listItemIcon:not(.listItemIcon-transparent)', {
    margin: '0 0.2em 0 0.4em'
});

globalStyle('[dir="rtl"] .listItemIcon:not(.listItemIcon-transparent)', {
    margin: '0 0.4em 0 0.2em'
});

globalStyle('[dir="ltr"] .listItemMediaInfo + .timerIndicator', {
    marginLeft: '0.25em'
});

globalStyle('[dir="rtl"] .listItemMediaInfo + .timerIndicator', {
    marginRight: '0.25em'
});

export const listItemMediaSmall = style({
    '@media': {
        'all and (max-width: 50em)': {
            display: 'none'
        }
    }
});

export const listItemBodySmall = style({
    '@media': {
        'all and (max-width: 50em)': {
            paddingRight: '0.5em',
            paddingLeft: '0.75em'
        }
    }
});

export const listItemImageLargeResponsive = style({
    '@media': {
        'all and (max-width: 64em)': {
            width: '22vw',
            height: '16vw',
            marginRight: 0
        }
    }
});

export const listItemIndicatorsSmall = style({
    '@media': {
        'all and (max-width: 64em)': {
            fontSize: vars.typography.fontSizeXs
        }
    }
});

export const listItemImageButtonSmall = style({
    '@media': {
        'all and (max-width: 64em)': {
            fontSize: vars.typography.fontSizeXs
        }
    }
});

export const listItemBottomOverviewHidden = style({
    '@media': {
        'all and (min-width: 50em)': {
            display: 'none'
        }
    }
});

export const listItemBottomOverviewVisible = style({
    '@media': {
        'all and (max-width: 50em)': {
            display: 'none'
        }
    }
});

export const listItemHiddenMovieSeries = style({});

globalStyle(`[data-type="Movie"] ${listItemHiddenMovieSeries}, [data-type="Series"] ${listItemHiddenMovieSeries}`, {
    '@media': {
        'all and (max-width: 40em)': {
            display: 'none'
        }
    }
});

export const listItemTextHiddenSmall = style({});

globalStyle(
    `${listItemTextHiddenSmall} .endsAt, ${listItemTextHiddenSmall} .criticRating, ${listItemTextHiddenSmall}-overview`,
    {
        '@media': {
            'all and (max-width: 50em)': {
                display: 'none'
            }
        }
    }
);
