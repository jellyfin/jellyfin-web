import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const styledTimeslotHeader = style({
    height: 40,
    width: '100%',
    display: 'flex',
    borderBottom: `1px solid ${vars.colors.divider}`,
    backgroundColor: vars.colors.background
});

export const timeslotCell = style({
    width: `${(1 / 48) * 100}%`, // 30 mins in 24 hours
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: vars.spacing.sm,
    borderRight: `1px solid ${vars.colors.divider}`,
    fontSize: vars.typography.fontSizeSm
});
