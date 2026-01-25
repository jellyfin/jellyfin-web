import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const styledChannelHeader = style({
    height: 80,
    width: 120,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: `1px solid ${vars.colors.divider}`,
    borderRight: `1px solid ${vars.colors.divider}`,
    backgroundColor: vars.colors.surface,
    padding: vars.spacing.sm,
    textAlign: 'center'
});

export const channelImage = style({
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain'
});

export const channelNumber = style({
    marginTop: vars.spacing.xs,
    fontSize: vars.typography.fontSizeSm,
    color: vars.colors.textSecondary
});
