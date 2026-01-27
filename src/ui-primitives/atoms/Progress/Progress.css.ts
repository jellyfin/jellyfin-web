import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const progressRoot = style({
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: vars.colors.surfaceHover,
    borderRadius: vars.borderRadius.sm,
    width: '100%',
    height: 8
});

export const progressIndicator = style({
    backgroundColor: vars.colors.primary,
    height: '100%',
    width: '100%',
    flex: 1,
    transition: 'transform 660ms cubic-bezier(0.65, 0, 0.35, 1)',
    borderRadius: vars.borderRadius.sm
});
