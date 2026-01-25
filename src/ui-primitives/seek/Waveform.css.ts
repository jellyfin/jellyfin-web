import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const waveformContainerStyle = style({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: vars.borderRadius.full,
    opacity: 0.6
});

export const waveformOverlayStyle = style({
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    borderRadius: vars.borderRadius.md,
    overflow: 'hidden'
});

