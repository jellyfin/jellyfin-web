import { style, styleVariants, createVar } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const listGap = createVar();
export const listPadding = createVar();
export const listItemRadius = createVar();

export const listStyles = style({
    listStyle: 'none',
    padding: 0,
    margin: 0
});

export const listSizes = styleVariants({
    sm: {
        [listGap]: vars.spacing['2'],
        [listPadding]: vars.spacing['4'],
        [listItemRadius]: vars.borderRadius.sm
    },
    md: {
        [listGap]: vars.spacing['4'],
        [listPadding]: vars.spacing['5'],
        [listItemRadius]: vars.borderRadius.md
    },
    lg: {
        [listGap]: vars.spacing['5'],
        [listPadding]: vars.spacing['6'],
        [listItemRadius]: vars.borderRadius.lg
    }
});

export const listNested = style({
    padding: 0,
    margin: 0,
    marginLeft: vars.spacing['5'],
    borderLeft: `1px solid ${vars.colors.divider}`,
    paddingLeft: vars.spacing['5'],
    listStyle: 'none'
});

export const listItemStyles = style({
    padding: `var(--list-item-padding, var(--list-padding, ${vars.spacing['5']}))`,
    borderBottom: `1px solid ${vars.colors.divider}`,
    ':last-child': {
        borderBottom: 'none'
    }
});

export const listItemContentStyles = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['2'],
    flex: 1
});

export const listItemDecorator = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: vars.spacing['4'],
    color: vars.colors.textSecondary
});

export const listSubheaderStyles = style({
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    fontSize: vars.typography['3'].fontSize,
    fontWeight: vars.typography.fontWeightBold,
    color: vars.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block'
});

export const listSubheaderSticky = style({
    position: 'sticky',
    top: 0,
    backgroundColor: vars.colors.background,
    zIndex: 1
});

export const listItemButtonStyles = style({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    borderRadius: 'var(--list-item-radius, 4px)',
    transition: `background-color ${vars.transitions.fast}`,
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    },
    selectors: {
        '&[data-selected="true"]': {
            backgroundColor: `${vars.colors.primary}22`,
            color: vars.colors.primary
        }
    }
});

export const listItemAvatarStyles = style({
    display: 'flex',
    alignItems: 'center',
    minWidth: 56,
    flexShrink: 0
});

export const listItemTextStyles = style({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0
});
