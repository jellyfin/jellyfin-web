import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from './tokens.css.ts';

export const libraryPage = style({
    paddingTop: '7em !important'
});

export const itemDetailPage = style({
    paddingTop: '0 !important'
});

globalStyle('.layout-tv .itemDetailPage', {
    paddingTop: '4.2em !important'
});

export const standalonePage = style({
    paddingTop: '4.5em !important'
});

export const wizardPage = style({
    paddingTop: '7em !important'
});

export const libraryPageNoSecondaryNav = style({
    paddingTop: '7.5em !important'
});

export const absolutePageTabContent = style({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    margin: '0 !important',
    top: '6.9em !important',
    transition: 'transform 0.2s ease-out'
});

export const pageTabContentInactive = style({
    display: 'none !important'
});

export const headerUserImage = style({
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    borderRadius: '100em',
    display: 'inline-block'
});

export const headerUserButtonRoundDiv = style({
    borderRadius: '100em',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center'
});

export const headerButton = style({
    flexShrink: 0
});

export const hideMainDrawerMainDrawerButton = style({
    display: 'none'
});

export const headerLeft = style({
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    overflow: 'hidden',
    justifyContent: 'flex-start'
});

export const headerRight = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end'
});

export const noHeaderRightHeaderRight = style({
    display: 'none !important'
});

export const noHomeButtonHeaderHomeButton = style({
    display: 'none !important'
});

export const pageTitle = style({
    display: 'inline-flex',
    height: '1.7em',
    alignItems: 'center',
    flexShrink: 1
});

globalStyle('[dir="ltr"] .pageTitle', {
    margin: '0 0 0 0.5em'
});

globalStyle('[dir="rtl"] .pageTitle', {
    margin: '0 0.5em 0 0'
});

export const pageTitleWithDefaultLogo = style({
    marginTop: 0
});

export const skinHeader = style({
    display: 'flex',
    flexDirection: 'column'
});

export const headerRightSection = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0
});

export const mainDrawerButton = style({
    marginRight: '0.25em'
});

export const mainTabContent = style({
    padding: '0 1.5%'
});

export const verticalCenter = style({
    display: 'flex',
    alignItems: 'center'
});

export const center = style({
    textAlign: 'center'
});

export const listItem = style({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '1%',
    borderRadius: vars.borderRadius.md
});

export const listItemBorder = style({
    borderBottom: `1px solid ${vars.colors.divider}`
});

export const cardContent = style({
    position: 'relative',
    paddingBottom: '0.5em'
});

export const cardScalable = style({
    position: 'relative',
    borderRadius: vars.borderRadius.md,
    overflow: 'hidden'
});

export const cardOverlay = style({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)`
});

export const cardOverlayButton = style({
    position: 'absolute',
    bottom: '0.5em',
    left: '50%',
    transform: 'translateX(-50%)'
});

export const verticalWrap = style({
    display: 'flex',
    flexWrap: 'wrap'
});

export const paddedLeft = style({
    paddingLeft: vars.spacing['5']
});

export const paddedRight = style({
    paddingRight: vars.spacing['5']
});

export const paddedTop = style({
    paddingTop: vars.spacing['5']
});

export const paddedBottom = style({
    paddingBottom: vars.spacing['5']
});

export const sectionTitle = style({
    fontSize: vars.typography['8'].fontSize,
    fontWeight: vars.typography.fontWeightBold,
    marginBottom: vars.spacing['5']
});

export const sectionTitleCards = style({
    marginLeft: vars.spacing['4']
});

export const libraryView = style({
    minHeight: '70vh'
});

export const itemsContainer = style({
    display: 'flex',
    flexWrap: 'wrap',
    gap: vars.spacing['5']
});

export const itemTile = style({
    borderRadius: vars.borderRadius.lg,
    padding: vars.spacing['5'],
    transition: vars.transitions.fast
});

export const cardImage = style({
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    borderRadius: vars.borderRadius.md
});

export const cardText = style({
    textAlign: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
});

export const actionButtons = style({
    display: 'flex',
    gap: vars.spacing['4'],
    justifyContent: 'flex-end'
});

export const collectionItems = style({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: vars.spacing['5']
});

export const metadataSidebar = style({
    padding: vars.spacing['6']
});

export const metadataField = style({
    marginBottom: vars.spacing['5']
});

export const metadataLabel = style({
    fontSize: vars.typography['3'].fontSize,
    color: vars.colors.textSecondary,
    marginBottom: vars.spacing['2']
});

export const metadataValue = style({
    fontSize: vars.typography['6'].fontSize,
    color: vars.colors.text
});
