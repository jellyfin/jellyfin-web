import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const gridContainer = style({
    display: 'grid',
    width: '100%'
});

export const gridGap = styleVariants({
    xs: { gap: vars.spacing.xs },
    sm: { gap: vars.spacing.sm },
    md: { gap: vars.spacing.md },
    lg: { gap: vars.spacing.lg },
    xl: { gap: vars.spacing.xl }
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
