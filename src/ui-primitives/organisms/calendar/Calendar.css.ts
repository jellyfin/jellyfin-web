import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

export const calendarContainer = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['4'],
    padding: vars.spacing['5'],
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.lg,
    minWidth: 300,
    vars: {
        '--rdp-accent-color': vars.colors.primary,
        '--rdp-background-color': `${vars.colors.primary}33`
    }
});

globalStyle(`${calendarContainer} .rdp`, {
    vars: {
        '--rdp-cell-size': '36px',
        '--rdp-accent-color': vars.colors.primary,
        '--rdp-background-color': `${vars.colors.primary}33`
    },
    margin: 0
});

globalStyle(`${calendarContainer} .rdp-day`, {
    minWidth: 'var(--rdp-cell-size)',
    height: 'var(--rdp-cell-size)',
    borderRadius: vars.borderRadius.sm,
    fontSize: vars.typography['3'].fontSize,
    color: vars.colors.text
});

globalStyle(`${calendarContainer} .rdp-day:hover`, {
    backgroundColor: vars.colors.surfaceHover
});

globalStyle(`${calendarContainer} .rdp-day_selected`, {
    backgroundColor: `${vars.colors.primary} !important`,
    color: `${vars.colors.text} !important`,
    fontWeight: vars.typography.fontWeightMedium
});

globalStyle(`${calendarContainer} .rdp-day_selected:hover`, {
    backgroundColor: `${vars.colors.primaryHover} !important`
});

globalStyle(`${calendarContainer} .rdp-day_today`, {
    border: `2px solid ${vars.colors.primary}`,
    fontWeight: vars.typography.fontWeightBold
});

globalStyle(`${calendarContainer} .rdp-day_outside`, {
    color: vars.colors.textMuted
});

globalStyle(`${calendarContainer} .rdp-day_outside:hover`, {
    backgroundColor: `${vars.colors.surfaceHover}66`
});

globalStyle(`${calendarContainer} .rdp-day_disabled`, {
    color: vars.colors.textMuted,
    cursor: 'not-allowed'
});

globalStyle(`${calendarContainer} .rdp-day_disabled:hover`, {
    backgroundColor: 'transparent'
});

globalStyle(`${calendarContainer} .rdp-day_range_middle`, {
    backgroundColor: `${vars.colors.primary}22`,
    borderRadius: 0
});

globalStyle(`${calendarContainer} .rdp-week_header`, {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
    marginBottom: '4px'
});

globalStyle(`${calendarContainer} .rdp-weekday`, {
    padding: '4px',
    textAlign: 'center',
    fontSize: vars.typography['3'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    color: vars.colors.textSecondary,
    textTransform: 'uppercase'
});

globalStyle(`${calendarContainer} .rdp-week`, {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px'
});

globalStyle(`${calendarContainer} .rdp-caption`, {
    display: 'none'
});

globalStyle(`${calendarContainer} .rdp-nav`, {
    display: 'none'
});
