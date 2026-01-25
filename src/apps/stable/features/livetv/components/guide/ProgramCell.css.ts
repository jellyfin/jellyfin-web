import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const styledProgramCell = style({
    position: 'absolute',
    height: '100%',
    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
    border: `1px solid ${vars.colors.divider}`,
    backgroundColor: vars.colors.surface,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: `background-color ${vars.transitions.fast}`,
    ':hover': {
        backgroundColor: vars.colors.background
    }
});

export const styledProgramCellActive = style({
    borderLeft: `4px solid ${vars.colors.primary}`
});

export const programHeader = style({
    display: 'flex',
    alignItems: 'center',
    gap: vars.spacing.xs,
    overflow: 'hidden'
});

export const programName = style({
    fontWeight: 'bold',
    fontSize: vars.typography.fontSizeMd,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
});

export const liveChip = style({
    backgroundColor: vars.colors.error,
    color: 'white',
    padding: '2px 4px',
    borderRadius: vars.borderRadius.sm,
    fontSize: vars.typography.fontSizeSm,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    flexShrink: 0
});

export const newChip = style({
    backgroundColor: vars.colors.success,
    color: 'white',
    padding: '2px 4px',
    borderRadius: vars.borderRadius.sm,
    fontSize: vars.typography.fontSizeSm,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    flexShrink: 0
});

export const programTitle = style({
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: vars.spacing.xs
});
