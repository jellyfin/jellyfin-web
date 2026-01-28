import { style, styleVariants, keyframes, globalStyle } from '@vanilla-extract/css';
import { vars } from './tokens.css.ts';

export const iconButton = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: vars.borderRadius.full,
    padding: vars.spacing['2'],
    border: 'none',
    backgroundColor: 'transparent',
    color: vars.colors.text,
    cursor: 'pointer',
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    },
    ':focus-visible': {
        outline: 'none',
        boxShadow: vars.shadows.outline
    }
});

export const cardBase = style({
    borderRadius: vars.borderRadius.lg,
    backgroundColor: vars.colors.surface,
    boxShadow: vars.shadows.md,
    overflow: 'hidden'
});

export const cardDefault = cardBase;

export const cardElevated = style({
    borderRadius: vars.borderRadius.lg,
    backgroundColor: vars.colors.surface,
    boxShadow: vars.shadows.lg,
    overflow: 'hidden'
});

export const cardOutlined = style({
    borderRadius: vars.borderRadius.lg,
    backgroundColor: vars.colors.surface,
    border: `1px solid ${vars.colors.divider}`,
    boxShadow: vars.shadows.none,
    overflow: 'hidden'
});

export const cardHoverable = style({
    borderRadius: vars.borderRadius.lg,
    backgroundColor: vars.colors.surface,
    boxShadow: vars.shadows.md,
    overflow: 'hidden',
    transition: vars.transitions.fast,
    ':hover': {
        boxShadow: vars.shadows.lg,
        transform: 'translateY(-2px)'
    }
});

export const inputBase = style({
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    backgroundColor: vars.colors.background,
    color: vars.colors.text,
    fontFamily: 'inherit',
    fontSize: vars.typography['6'].fontSize,
    transition: vars.transitions.fast,
    ':focus': {
        outline: 'none',
        borderColor: vars.colors.primary,
        boxShadow: vars.shadows.outline
    },
    ':disabled': {
        opacity: vars.opacity.disabled,
        cursor: 'not-allowed'
    },
    '::placeholder': {
        color: vars.colors.textMuted
    }
});

export const inputDefault = inputBase;

export const inputFilled = style({
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    backgroundColor: vars.colors.surface,
    color: vars.colors.text,
    fontFamily: 'inherit',
    fontSize: vars.typography['6'].fontSize,
    transition: vars.transitions.fast,
    ':focus': {
        outline: 'none',
        borderColor: vars.colors.primary,
        boxShadow: vars.shadows.outline
    },
    ':disabled': {
        opacity: vars.opacity.disabled,
        cursor: 'not-allowed'
    },
    '::placeholder': {
        color: vars.colors.textMuted
    }
});

export const inputOutline = style({
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    backgroundColor: 'transparent',
    color: vars.colors.text,
    fontFamily: 'inherit',
    fontSize: vars.typography['6'].fontSize,
    transition: vars.transitions.fast,
    ':focus': {
        outline: 'none',
        borderColor: vars.colors.primary,
        boxShadow: vars.shadows.outline
    },
    ':disabled': {
        opacity: vars.opacity.disabled,
        cursor: 'not-allowed'
    },
    '::placeholder': {
        color: vars.colors.textMuted
    }
});

export const textarea = style({
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    backgroundColor: vars.colors.background,
    color: vars.colors.text,
    fontFamily: 'inherit',
    fontSize: vars.typography['6'].fontSize,
    transition: vars.transitions.fast,
    minHeight: '100px',
    resize: 'vertical',
    ':focus': {
        outline: 'none',
        borderColor: vars.colors.primary,
        boxShadow: vars.shadows.outline
    }
});

export const select = style({
    border: `1px solid ${vars.colors.divider}`,
    borderRadius: vars.borderRadius.md,
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    backgroundColor: vars.colors.background,
    color: vars.colors.text,
    fontFamily: 'inherit',
    fontSize: vars.typography['6'].fontSize,
    transition: vars.transitions.fast,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(vars.colors.text)}' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: vars.spacing['7'],
    ':focus': {
        outline: 'none',
        borderColor: vars.colors.primary,
        boxShadow: vars.shadows.outline
    }
});

export const dialogBase = style({
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.xl,
    padding: vars.spacing['6'],
    maxWidth: '500px',
    width: '100%'
});

export const dialogDefault = dialogBase;

export const dialogLarge = style({
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.xl,
    padding: vars.spacing['7'],
    maxWidth: '800px',
    width: '100%'
});

export const dialogSmall = style({
    backgroundColor: vars.colors.surface,
    borderRadius: vars.borderRadius.lg,
    boxShadow: vars.shadows.xl,
    padding: vars.spacing['6'],
    maxWidth: '360px',
    width: '100%'
});

export const dialogFullscreen = style({
    position: 'fixed',
    inset: 0,
    backgroundColor: vars.colors.surface,
    borderRadius: 0,
    boxShadow: vars.shadows.xl,
    padding: vars.spacing['6'],
    maxWidth: 'none',
    width: '100%',
    height: '100%'
});

export const listItem = style({
    display: 'flex',
    alignItems: 'center',
    padding: vars.spacing['4'],
    borderBottom: `1px solid ${vars.colors.divider}`,
    cursor: 'pointer',
    transition: vars.transitions.fast,
    ':hover': {
        backgroundColor: vars.colors.surfaceHover
    }
});

export const listItemContent = style({
    flex: 1,
    minWidth: 0
});

export const listItemIcon = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: vars.spacing['7'],
    height: vars.spacing['7'],
    marginRight: vars.spacing['4'],
    color: vars.colors.textSecondary
});

export const badgePrimary = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    borderRadius: vars.borderRadius.full,
    fontSize: vars.typography['1'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    backgroundColor: vars.colors.primary,
    color: vars.colors.text
});

export const badgeSecondary = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    borderRadius: vars.borderRadius.full,
    fontSize: vars.typography['1'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    backgroundColor: vars.colors.surface,
    color: vars.colors.text,
    border: `1px solid ${vars.colors.divider}`
});

export const badgeSuccess = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    borderRadius: vars.borderRadius.full,
    fontSize: vars.typography['1'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    backgroundColor: vars.colors.success,
    color: vars.colors.text
});

export const badgeWarning = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    borderRadius: vars.borderRadius.full,
    fontSize: vars.typography['1'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    backgroundColor: vars.colors.warning,
    color: vars.colors.textInverse
});

export const badgeError = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    borderRadius: vars.borderRadius.full,
    fontSize: vars.typography['1'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    backgroundColor: vars.colors.error,
    color: vars.colors.text
});

export const badgeOutline = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    borderRadius: vars.borderRadius.full,
    fontSize: vars.typography['1'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    backgroundColor: 'transparent',
    color: vars.colors.text,
    border: `1px solid ${vars.colors.divider}`
});

export const chip = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.spacing['2'],
    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
    borderRadius: vars.borderRadius.full,
    fontSize: vars.typography['3'].fontSize,
    backgroundColor: vars.colors.surface,
    color: vars.colors.text,
    border: `1px solid ${vars.colors.divider}`
});

export const divider = style({
    border: 'none',
    height: '1px',
    backgroundColor: vars.colors.divider,
    margin: `${vars.spacing['4']} 0`
});

export const dividerVertical = style({
    display: 'inline-block',
    width: '1px',
    height: '1em',
    backgroundColor: vars.colors.divider,
    margin: `0 ${vars.spacing['4']}`,
    verticalAlign: 'middle'
});

export const avatar = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: vars.borderRadius.full,
    backgroundColor: vars.colors.primary,
    color: vars.colors.text,
    fontWeight: vars.typography.fontWeightMedium,
    overflow: 'hidden'
});

export const avatarSm = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: vars.borderRadius.full,
    backgroundColor: vars.colors.primary,
    color: vars.colors.text,
    fontWeight: vars.typography.fontWeightMedium,
    overflow: 'hidden',
    width: vars.spacing['6'],
    height: vars.spacing['6'],
    fontSize: vars.typography['3'].fontSize
});

export const avatarMd = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: vars.borderRadius.full,
    backgroundColor: vars.colors.primary,
    color: vars.colors.text,
    fontWeight: vars.typography.fontWeightMedium,
    overflow: 'hidden',
    width: vars.spacing['7'],
    height: vars.spacing['7'],
    fontSize: vars.typography['6'].fontSize
});

export const avatarLg = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: vars.borderRadius.full,
    backgroundColor: vars.colors.primary,
    color: vars.colors.text,
    fontWeight: vars.typography.fontWeightMedium,
    overflow: 'hidden',
    width: vars.spacing['8'],
    height: vars.spacing['8'],
    fontSize: vars.typography['7'].fontSize
});

const spin = keyframes({
    to: { transform: 'rotate(360deg)' }
});

export const spinner = style({
    display: 'inline-block',
    width: vars.spacing['6'],
    height: vars.spacing['6'],
    border: `2px solid ${vars.colors.surfaceHover}`,
    borderTopColor: vars.colors.primary,
    borderRadius: vars.borderRadius.full,
    animation: `${spin} 1s linear infinite`
});

const pulse = keyframes({
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 }
});

export const skeleton = style({
    backgroundColor: vars.colors.surfaceHover,
    borderRadius: vars.borderRadius.md,
    animation: `${pulse} 1.5s ease-in-out infinite`
});

export const skeletonText = style({
    height: '1em',
    marginBottom: vars.spacing['2']
});

export const tooltip = style({
    position: 'relative',
    display: 'inline-block'
});

export const tooltipContent = style({
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: vars.spacing['2'],
    backgroundColor: vars.colors.overlay,
    color: vars.colors.text,
    fontSize: vars.typography['3'].fontSize,
    borderRadius: vars.borderRadius.sm,
    whiteSpace: 'nowrap',
    opacity: 0,
    visibility: 'hidden',
    transition: vars.transitions.fast,
    marginBottom: vars.spacing['2'],
    zIndex: vars.zIndex.tooltip
});

globalStyle(`${tooltip}:hover ${tooltipContent}`, {
    opacity: 1,
    visibility: 'visible'
});

export const backdrop = style({
    position: 'fixed',
    inset: 0,
    backgroundColor: vars.colors.backdrop,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: vars.zIndex.modalBackdrop
});

export const overlay = style({
    position: 'fixed',
    inset: 0,
    backgroundColor: vars.colors.overlay,
    zIndex: vars.zIndex.overlay
});

export const emptyState = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: vars.spacing['8'],
    textAlign: 'center',
    color: vars.colors.textSecondary
});

export const emptyStateIcon = style({
    fontSize: vars.spacing['8'],
    marginBottom: vars.spacing['5'],
    opacity: vars.opacity.muted
});

export const emptyStateTitle = style({
    fontSize: vars.typography['7'].fontSize,
    fontWeight: vars.typography.fontWeightMedium,
    color: vars.colors.text,
    marginBottom: vars.spacing['4']
});

export const emptyStateDescription = style({
    fontSize: vars.typography['6'].fontSize,
    maxWidth: '400px'
});
