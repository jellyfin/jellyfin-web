import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from './tokens.css.ts';

export const editPageSidebar = style({
    display: 'block'
});

export const editPageSidebarWithContent = style({
    display: 'none'
});

export const libraryTree = style({
    marginLeft: '0.25em'
});

export const offlineEditorNode = style({
    color: '#c33'
});

globalStyle('.editorNode img', {
    height: '18px',
    margin: '0 0.35em',
    verticalAlign: 'middle',
    position: 'relative',
    top: '-2px'
});

globalStyle('.jstree-anchor', {
    fontWeight: vars.typography.fontWeightNormal + ' !important'
});

globalStyle('.jstree-wholerow-hovered', {
    background: '#38c !important',
    borderRadius: '0 !important',
    boxShadow: 'none !important'
});

globalStyle('.jstree-default .jstree-hovered', {
    background: '0 0 !important',
    borderRadius: '0 !important',
    boxShadow: 'none !important',
    color: '#fff !important'
});

globalStyle('.jstree-default .jstree-wholerow-clicked', {
    background: vars.colors.primary + ' !important'
});

export const metadataSidebarIcon = style({
    marginRight: '0.4em'
});

export const editPageInnerContent = style({
    width: '68.5%',
    float: 'right'
});
