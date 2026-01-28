import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

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
    padding: vars.spacing['4'],
    textAlign: 'center'
});

export const channelImage = style({
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain'
});

export const channelNumber = style({
    marginTop: vars.spacing['2'],
    fontSize: vars.typography['3'].fontSize,
    color: vars.colors.textSecondary
});
