import { globalStyle } from '@vanilla-extract/css';

globalStyle('.layout-mobile', {
    fontSize: '90%'
});

globalStyle('.mouseIdle', {
    cursor: 'none'
});

globalStyle('video::-webkit-media-controls', {
    display: 'none'
});
