import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const gridContainer = style({
    display: 'grid',
    width: '100%'
});

export const gridGap = styleVariants({
    '1': { gap: vars.spacing['1'] },
    '2': { gap: vars.spacing['2'] },
    '3': { gap: vars.spacing['3'] },
    '4': { gap: vars.spacing['4'] },
    '5': { gap: vars.spacing['5'] },
    '6': { gap: vars.spacing['6'] },
    '7': { gap: vars.spacing['7'] },
    '8': { gap: vars.spacing['8'] },
    '9': { gap: vars.spacing['9'] },
    xs: { gap: vars.spacing['2'] },
    sm: { gap: vars.spacing['4'] },
    md: { gap: vars.spacing['5'] },
    lg: { gap: vars.spacing['6'] },
    xl: { gap: vars.spacing['7'] }
});

export const gridColumns = styleVariants({
    1: { gridTemplateColumns: 'repeat(1, 1fr)' },
    2: { gridTemplateColumns: 'repeat(2, 1fr)' },
    3: { gridTemplateColumns: 'repeat(3, 1fr)' },
    4: { gridTemplateColumns: 'repeat(4, 1fr)' },
    5: { gridTemplateColumns: 'repeat(5, 1fr)' },
    6: { gridTemplateColumns: 'repeat(6, 1fr)' },
    7: { gridTemplateColumns: 'repeat(7, 1fr)' },
    8: { gridTemplateColumns: 'repeat(8, 1fr)' },
    9: { gridTemplateColumns: 'repeat(9, 1fr)' },
    10: { gridTemplateColumns: 'repeat(10, 1fr)' },
    11: { gridTemplateColumns: 'repeat(11, 1fr)' },
    12: { gridTemplateColumns: 'repeat(12, 1fr)' }
});

export const gridXs = styleVariants({
    1: { gridTemplateColumns: 'repeat(1, 1fr)' },
    2: { gridTemplateColumns: 'repeat(2, 1fr)' },
    3: { gridTemplateColumns: 'repeat(3, 1fr)' },
    4: { gridTemplateColumns: 'repeat(4, 1fr)' },
    5: { gridTemplateColumns: 'repeat(5, 1fr)' },
    6: { gridTemplateColumns: 'repeat(6, 1fr)' },
    7: { gridTemplateColumns: 'repeat(7, 1fr)' },
    8: { gridTemplateColumns: 'repeat(8, 1fr)' },
    9: { gridTemplateColumns: 'repeat(9, 1fr)' },
    10: { gridTemplateColumns: 'repeat(10, 1fr)' },
    11: { gridTemplateColumns: 'repeat(11, 1fr)' },
    12: { gridTemplateColumns: 'repeat(12, 1fr)' }
});

export const gridSm = styleVariants({
    1: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(1, 1fr)' } } },
    2: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(2, 1fr)' } } },
    3: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(3, 1fr)' } } },
    4: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(4, 1fr)' } } },
    5: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(5, 1fr)' } } },
    6: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(6, 1fr)' } } },
    7: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(7, 1fr)' } } },
    8: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(8, 1fr)' } } },
    9: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(9, 1fr)' } } },
    10: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(10, 1fr)' } } },
    11: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(11, 1fr)' } } },
    12: { '@media': { '(min-width: 600px)': { gridTemplateColumns: 'repeat(12, 1fr)' } } }
});

export const gridMd = styleVariants({
    1: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(1, 1fr)' } } },
    2: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(2, 1fr)' } } },
    3: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(3, 1fr)' } } },
    4: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(4, 1fr)' } } },
    5: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(5, 1fr)' } } },
    6: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(6, 1fr)' } } },
    7: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(7, 1fr)' } } },
    8: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(8, 1fr)' } } },
    9: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(9, 1fr)' } } },
    10: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(10, 1fr)' } } },
    11: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(11, 1fr)' } } },
    12: { '@media': { '(min-width: 960px)': { gridTemplateColumns: 'repeat(12, 1fr)' } } }
});

export const gridLg = styleVariants({
    1: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(1, 1fr)' } } },
    2: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(2, 1fr)' } } },
    3: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(3, 1fr)' } } },
    4: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(4, 1fr)' } } },
    5: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(5, 1fr)' } } },
    6: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(6, 1fr)' } } },
    7: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(7, 1fr)' } } },
    8: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(8, 1fr)' } } },
    9: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(9, 1fr)' } } },
    10: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(10, 1fr)' } } },
    11: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(11, 1fr)' } } },
    12: { '@media': { '(min-width: 1280px)': { gridTemplateColumns: 'repeat(12, 1fr)' } } }
});

export const gridXl = styleVariants({
    1: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(1, 1fr)' } } },
    2: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(2, 1fr)' } } },
    3: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(3, 1fr)' } } },
    4: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(4, 1fr)' } } },
    5: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(5, 1fr)' } } },
    6: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(6, 1fr)' } } },
    7: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(7, 1fr)' } } },
    8: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(8, 1fr)' } } },
    9: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(9, 1fr)' } } },
    10: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(10, 1fr)' } } },
    11: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(11, 1fr)' } } },
    12: { '@media': { '(min-width: 1920px)': { gridTemplateColumns: 'repeat(12, 1fr)' } } }
});

export const gridDisplay = styleVariants({
    block: { display: 'block' },
    flex: { display: 'flex' },
    grid: { display: 'grid' },
    none: { display: 'none' },
    initial: { display: 'initial' }
});

export const gridOrder = styleVariants({
    0: { order: 0 },
    1: { order: 1 },
    2: { order: 2 },
    3: { order: 3 },
    4: { order: 4 },
    5: { order: 5 },
    6: { order: 6 },
    7: { order: 7 },
    8: { order: 8 },
    9: { order: 9 },
    10: { order: 10 },
    11: { order: 11 },
    12: { order: 12 },
    initial: { order: 'initial' },
    first: { order: -9999 },
    last: { order: 9999 }
});
