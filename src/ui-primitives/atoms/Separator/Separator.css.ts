import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/tokens.css';

export const separatorRoot = style({
    backgroundColor: vars.colors.divider,
    flexShrink: 0
});

export const separatorHorizontal = style({
    height: 1,
    width: '100%',
    margin: `${vars.spacing.sm} 0`
});

export const separatorVertical = style({
    width: 1,
    height: '100%',
    margin: `0 ${vars.spacing.sm}`
});

export const separatorStyles = {
    root: separatorRoot,
    horizontal: separatorHorizontal,
    vertical: separatorVertical
};
