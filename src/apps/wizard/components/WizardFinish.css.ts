import { style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css';

export const container = style({
    maxWidth: '600px',
    margin: '0 auto',
    marginTop: `calc(${vars.spacing['7'] as string} * 2)`,
    padding: vars.spacing['6'],
    textAlign: 'center'
});

export const title = style({
    marginBottom: vars.spacing['5']
});

export const helpText = style({
    marginBottom: `calc(${vars.spacing['7'] as string} * 3)`
});

export const finishButton = style({
    paddingLeft: `calc(${vars.spacing['7'] as string} * 3)`,
    paddingRight: `calc(${vars.spacing['7'] as string} * 3)`
});
