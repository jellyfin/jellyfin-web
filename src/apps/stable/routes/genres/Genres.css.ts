import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    padding: vars.spacing.lg
});

export const headerRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing.lg
});

export const chipGroup = style({
    display: 'flex',
    gap: vars.spacing.sm
});

export const paginationRow = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vars.spacing.lg
});

export const paginationControls = style({
    display: 'flex',
    gap: vars.spacing.sm,
    alignItems: 'center'
});

export const gridContainer = style({
    display: 'grid',
    gap: vars.spacing.md,
    marginBottom: vars.spacing.lg,
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
});

export const genreCard = style({
    cursor: 'pointer',
    transition: `transform ${vars.transitions.fast}, box-shadow ${vars.transitions.fast}`,
    ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: vars.shadows.lg
    }
});

export const cardCoverArea = style({
    position: 'relative',
    width: '100%',
    paddingBottom: '56.25%',
    backgroundColor: vars.colors.surfaceHover,
    overflow: 'hidden'
});

export const cardCoverGradient = style({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
});

export const cardContent = style({
    padding: vars.spacing.md,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    minHeight: '120px'
});

export const cardTitle = style({
    color: 'white',
    fontWeight: vars.typography.fontWeightBold,
    fontSize: vars.typography.fontSizeLg,
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    marginBottom: vars.spacing.xs,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
});

export const cardSubtitle = style({
    color: 'rgba(255,255,255,0.9)',
    fontSize: vars.typography.fontSizeSm,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
});

export const bottomPaginationContainer = style({
    display: 'flex',
    justifyContent: 'center',
    marginTop: vars.spacing.lg
});
