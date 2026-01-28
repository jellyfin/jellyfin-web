import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const cardContainer = style({
    position: 'relative',
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.md,
    border: `1px solid ${vars.colors.divider}`,
    overflow: 'hidden',
    transition: `transform ${vars.transitions.fast}, box-shadow ${vars.transitions.fast}, border-color ${vars.transitions.fast}`,
    cursor: 'default',
    textDecoration: 'none'
});

export const cardContainerInteractive = style({
    cursor: 'pointer',
    ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: vars.shadows.md,
        borderColor: vars.colors.primary,
        backgroundColor: vars.colors.surfaceHover
    }
});

export const cardImageContainer = style({
    aspectRatio: '16/9',
    borderRadius: vars.borderRadius.sm,
    overflow: 'hidden'
});

export const cardImage = style({
    width: '100%',
    height: '100%',
    objectFit: 'cover'
});

export const cardIconContainer = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: vars.colors.surfaceHover
});

export const cardContent = style({
    paddingTop: vars.spacing['4'],
    paddingBottom: vars.spacing['5'],
    paddingLeft: vars.spacing['5'],
    paddingRight: vars.spacing['5']
});

export const cardTitleRow = style({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: vars.spacing['4']
});

export const cardTitleContainer = style({
    flexGrow: 1,
    minWidth: 0
});

export const cardTitle = style({
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
});

export const cardSubtitle = style({
    wordBreak: 'break-word',
    marginTop: vars.spacing['2']
});

export const cardAction = style({
    flexShrink: 0
});
