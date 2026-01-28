import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const alphaPicker = style({
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center'
});

export const alphaPickerVertical = style({
    lineHeight: 1
});

export const alphaPickerFixed = style({
    position: 'fixed',
    bottom: '5.5em'
});

export const alphaPickerRow = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
});

export const alphaPickerRowVertical = style({
    flexDirection: 'column'
});

export const alphaPickerButton = style({
    border: 0,
    cursor: 'pointer',
    outline: 'none',
    verticalAlign: 'middle',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    minWidth: 'initial',
    margin: 0,
    padding: '0.1em 0.4em',
    width: 'auto',
    borderRadius: '0.1em',
    fontWeight: 'normal',
    flexShrink: 0,
    flexGrow: 1
});

export const alphaPickerButtonVertical = style({
    width: '1.5em',
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'center'
});

export const alphaPickerButtonIcon = style({
    fontSize: vars.typography['6'].fontSize
});

export const alphaPickerTv = style({
    fontSize: vars.typography['3'].fontSize
});

export const alphaPickerFixedRight = style({
    position: 'fixed'
});

globalStyle('.alphaPicker-fixed.alphaPicker-tv', {
    bottom: '1%'
});

globalStyle('.alphaPickerButton-tv.alphaPickerButton-vertical', {
    padding: 0
});

export const alphaPickerMediumTall = style({
    '@media': {
        'all and (max-height: 50em)': {
            selectors: {
                '&.alphaPicker-fixed': {
                    bottom: '5em'
                },
                '&.alphaPickerButton-vertical': {
                    paddingTop: '1px',
                    paddingBottom: '1px'
                }
            }
        }
    }
});

export const alphaPickerShort = style({
    '@media': {
        'all and (max-height: 49em)': {
            selectors: {
                '&.alphaPicker-vertical': {
                    fontSize: vars.typography['7'].fontSize
                }
            }
        },
        'all and (max-height: 44em)': {
            selectors: {
                '&.alphaPicker-vertical': {
                    fontSize: vars.typography['6'].fontSize
                },
                '&.alphaPickerButton-vertical': {
                    paddingTop: 0,
                    paddingBottom: 0
                }
            }
        },
        'all and (max-height: 37em)': {
            selectors: {
                '&.alphaPicker-vertical': {
                    fontSize: vars.typography['3'].fontSize
                }
            }
        },
        'all and (max-height: 32em)': {
            selectors: {
                '&.alphaPicker-vertical': {
                    fontSize: vars.typography['1'].fontSize
                }
            }
        },
        'all and (max-height: 31.25em)': {
            selectors: {
                '&.alphaPicker-fixed': {
                    display: 'none'
                }
            }
        }
    }
});

globalStyle('[dir="ltr"] .alphaPicker-fixed-right', {
    right: '0.4em'
});

globalStyle('[dir="rtl"] .alphaPicker-fixed-right', {
    left: '0.4em'
});

export const alphaPickerFixedRightMedium = style({
    '@media': {
        'all and (min-width: 62.5em)': {
            selectors: {
                '&.alphaPicker-fixed-right': {
                    right: '1em'
                }
            }
        }
    }
});
