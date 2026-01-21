import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    maxWidth: '600px',
    margin: '0 auto',
    marginTop: vars.spacing.xl * 2,
    padding: vars.spacing.lg,
    textAlign: 'center',
});

export const title = style({
    marginBottom: vars.spacing.md,
});

export const helpText = style({
    marginBottom: vars.spacing.xl * 3,
});

export const finishButton = style({
    paddingLeft: vars.spacing.xl * 3,
    paddingRight: vars.spacing.xl * 3,
});
