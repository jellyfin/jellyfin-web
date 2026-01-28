import { style } from '@vanilla-extract/css';
import { vars } from './tokens.css.ts';

export const lyricPage = style({
    paddingTop: '4.2em !important',
    paddingLeft: '0.5em !important',
    paddingRight: '0.5em !important',
    display: 'flex',
    justifyContent: 'center'
});

export const lyricsContainer = style({
    display: 'flex',
    flexDirection: 'column'
});

export const lyricsLine = style({
    display: 'inline-block',
    width: 'fit-content',
    margin: '0.1em',
    fontSize: vars.typography['8'].fontSize,
    color: 'inherit',
    minHeight: '2em',
    transitionProperty: 'opacity',
    transitionDuration: '150ms'
});

export const futureLyric = style({
    opacity: 0.3
});

export const pastLyric = style({
    opacity: 0.7
});

export const dynamicLyric = style({
    cursor: 'pointer'
});
