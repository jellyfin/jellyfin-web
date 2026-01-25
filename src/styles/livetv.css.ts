import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from './tokens.css';

export const guideVerticalScroller = style({
    paddingBottom: '15em'
});

export const guideTab = style({
    '@media': {
        'all and (min-width: 62.5em)': {
            paddingLeft: '0.5em'
        }
    }
});

globalStyle('#channelsTab .cardImageContainer', {
    backgroundSize: 'contain'
});
