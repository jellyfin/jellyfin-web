import { style } from '@vanilla-extract/css';
import { vars } from '../styles/tokens.css';

export const datePickerContainer = style({
    display: 'inline-flex',
    position: 'relative'
});

export const datePickerTrigger = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.spacing.sm,
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    backgroundColor: vars.colors.surface,
    color: vars.colors.text,
    fontSize: vars.typography.fontSizeMd,
    cursor: 'pointer',
    transition: `border-color ${vars.transitions.fast}, box-shadow ${vars.transitions.fast}`,
    ':hover': {
        borderColor: vars.colors.primary,
        boxShadow: `0 0 0 2px ${vars.colors.primary}33`
    },
    ':focus-visible': {
        outline: `2px solid ${vars.colors.primary}`,
        outlineOffset: '2px'
    }
});

export const datePickerTriggerActive = style({
    borderColor: vars.colors.primary,
    boxShadow: `0 0 0 2px ${vars.colors.primary}33`
});

export const datePickerIcon = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: vars.colors.textSecondary
});

export const datePickerValue = style({
    flex: 1,
    textAlign: 'left'
});

export const datePickerCalendar = style({
    padding: vars.spacing.sm
});

export const datePickerFooter = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: vars.spacing.sm,
    borderTop: `1px solid ${vars.colors.divider}`,
    marginTop: vars.spacing.sm
});

