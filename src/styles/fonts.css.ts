import '@fontsource-variable/inter/standard.css';

import { globalStyle } from '@vanilla-extract/css';
import { vars } from './tokens.css';

globalStyle('h1', {
    fontWeight: vars.typography.fontWeightNormal,
    fontSize: vars.typography.fontSizeH1
});

globalStyle('h2', {
    fontWeight: vars.typography.fontWeightNormal,
    fontSize: vars.typography.fontSizeH2
});

globalStyle('h3', {
    fontWeight: vars.typography.fontWeightNormal,
    fontSize: vars.typography.fontSizeH3
});

globalStyle('.textarea-mono', {
    fontFamily: vars.typography.fontFamilyMono
});

globalStyle('.layout-tv', {
    fontSize: '125%'
});

globalStyle('.layout-mobile', {
    fontSize: '90%'
});
