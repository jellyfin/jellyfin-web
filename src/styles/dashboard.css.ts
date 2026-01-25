import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from './tokens.css';

export const dashboardColumn = style({
    flexDirection: 'column',
});

export const dashboardSections = style({
    flexDirection: 'column',
});

export const dashboardFooter = style({
    marginTop: '3.5em',
    textAlign: 'center',
});

globalStyle('.dashboardFooter a', {
    margin: '0 0.7em',
});

globalStyle('progress', {
    appearance: 'none',
    margin: 0,
    background: '#ccc !important',
    borderRadius: '0.2em',
    border: 'none',
});

globalStyle('progress[role]::after', {
    backgroundImage: 'none',
});

globalStyle('progress::-webkit-progress-bar', {
    background: '#ccc',
});

globalStyle('progress::-moz-progress-bar', {
    backgroundColor: '#00a4dc',
});

globalStyle('progress::-webkit-progress-value', {
    backgroundColor: '#00a4dc',
});

globalStyle('progress[aria-valuenow]::before', {
    borderRadius: '0.4em',
    backgroundColor: '#00a4dc',
});

export const localnav = style({
    marginBottom: '2.2em !important',
});

export const typeInteriorContent = style({
    '@media': {
        'all and (min-width: 50em)': {
            paddingRight: 0,
            paddingLeft: 0,
            paddingTop: 0,
            overflow: 'hidden',
        },
    },
});

export const dashboardDocumentEntryHeaderButton = style({
    display: 'none !important',
});

export const adminDrawerLogo = style({
    display: 'none',
});

globalStyle('.layout-mobile .adminDrawerLogo', {
    padding: '1.5em 1em 1.2em',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '1em',
    display: 'block',
});

globalStyle('.adminDrawerLogo img', {
    height: '4em',
});

export const dataRoleButton = style({
    background: '#292929',
    backgroundClip: 'padding-box',
    WebkitFontSmoothing: 'antialiased',
    userSelect: 'none',
    cursor: 'pointer !important',
    fontFamily: 'inherit !important',
    fontWeight: '500 !important',
    margin: '0 0.25em !important',
    display: 'inline-block',
    padding: '0.8em 1em',
    textAlign: 'center',
    textDecoration: 'none !important',
});

export const controlgroupButton = style({
    display: 'inline-block !important',
    margin: '0 !important',
    boxShadow: 'none !important',
    borderRadius: 0,
});

export const formRow = style({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: vars.spacing.md,
});

export const formLabel = style({
    flex: '0 0 auto',
    paddingRight: vars.spacing.md,
    maxWidth: '200px',
});

export const formInput = style({
    flex: '1 1 auto',
    minWidth: '200px',
});

export const settingGroup = style({
    marginBottom: vars.spacing.xl,
    paddingBottom: vars.spacing.lg,
    borderBottom: `1px solid ${vars.colors.divider}`,
});

export const settingGroupTitle = style({
    fontSize: vars.typography.fontSizeLg,
    fontWeight: vars.typography.fontWeightBold,
    marginBottom: vars.spacing.md,
});

export const paperButton = style({
    backgroundColor: vars.colors.surface,
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    padding: vars.spacing.md,
    marginBottom: vars.spacing.md,
});

export const dialogContent = style({
    padding: vars.spacing.lg,
});

export const dialogActions = style({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: vars.spacing.sm,
    marginTop: vars.spacing.lg,
});
