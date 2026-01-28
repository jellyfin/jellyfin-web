/**
 * React Aria Theme Integration
 *
 * Integrates React Aria components with our existing design token system
 * for consistent styling across React Aria and Radix UI components.
 */

import { vars } from 'styles/tokens.css.ts';

/**
 * React Aria theme configuration using our design tokens
 */
export const ariaTheme = {
    // Focus styles
    focusRing: {
        default: {
            outlineWidth: '2px',
            outlineStyle: 'solid',
            outlineColor: vars.colors.focus,
            outlineOffset: '2px',
            borderRadius: vars.borderRadius.sm
        },
        keyboard: {
            outlineWidth: '2px',
            outlineStyle: 'solid',
            outlineColor: vars.colors.focus,
            outlineOffset: '2px',
            borderRadius: vars.borderRadius.sm
        },
        highContrast: {
            outlineWidth: '3px',
            outlineStyle: 'solid',
            outlineColor: vars.colors.text,
            outlineOffset: '2px',
            borderRadius: vars.borderRadius.sm
        }
    },

    // Color schemes
    colors: {
        primary: vars.colors.primary,
        secondary: vars.colors.secondary,
        neutral: vars.colors.textSecondary,
        success: vars.colors.success,
        warning: vars.colors.warning,
        error: vars.colors.error,
        background: vars.colors.background,
        surface: vars.colors.surface,
        border: vars.colors.border,
        textPrimary: vars.colors.text,
        textSecondary: vars.colors.textSecondary,
        textMuted: vars.colors.textMuted
    },

    // Spacing scale
    spacing: {
        '1': vars.spacing['1'],
        '2': vars.spacing['2'],
        '3': vars.spacing['3'],
        '4': vars.spacing['4'],
        '5': vars.spacing['5'],
        '6': vars.spacing['6'],
        '7': vars.spacing['7'],
        '8': vars.spacing['8'],
        '9': vars.spacing['9']
    },

    // Border radius
    borderRadius: {
        none: '0',
        sm: vars.borderRadius.sm,
        md: vars.borderRadius.md,
        lg: vars.borderRadius.lg,
        xl: vars.borderRadius.xl,
        full: vars.borderRadius.full
    },

    // Typography
    typography: {
        fontFamily: vars.typography.fontFamily,
        fontSize: {
            xs: vars.typography['1'],
            sm: vars.typography['2'],
            md: vars.typography['3'],
            lg: vars.typography['4'],
            xl: vars.typography['5'],
            '2xl': vars.typography['6'],
            '3xl': vars.typography['7']
        },
        fontWeight: {
            normal: vars.typography.fontWeightNormal,
            medium: vars.typography.fontWeightMedium,
            bold: vars.typography.fontWeightBold
        },
        lineHeight: {
            tight: vars.typography.lineHeightCompact,
            normal: vars.typography.lineHeightNormal,
            relaxed: vars.typography.lineHeightHeading
        }
    },

    // Shadows
    shadows: {
        sm: vars.shadows.sm,
        md: vars.shadows.md,
        lg: vars.shadows.lg,
        xl: vars.shadows.xl,
        outline: vars.shadows.outline
    },

    // Z-index scale
    zIndex: {
        base: vars.zIndex.base,
        overlay: vars.zIndex.overlay,
        modal: vars.zIndex.modal,
        toast: vars.zIndex.toast,
        tooltip: vars.zIndex.tooltip
    }
};

/**
 * CSS-in-JS style generator for React Aria components
 */
export function createAriaStyles(componentType: keyof typeof ariaStyleMaps) {
    return (props: any = {}): React.CSSProperties => {
        const styles: React.CSSProperties = {};
        const styleMap = ariaStyleMaps[componentType];

        if (!styleMap) return styles;

        // Apply base styles
        if (styleMap.base) {
            Object.assign(styles, styleMap.base);
        }

        // Apply variant styles (button component)
        if (props.variant && 'variants' in styleMap && styleMap.variants) {
            const variantStyles = (styleMap.variants as any)[props.variant];
            if (variantStyles) {
                Object.assign(styles, variantStyles);
            }
        }

        // Apply size styles (button, textfield, modal)
        if (props.size && 'sizes' in styleMap && styleMap.sizes) {
            const sizeStyles = (styleMap.sizes as any)[props.size];
            if (sizeStyles) {
                Object.assign(styles, sizeStyles);
            }
        }

        // Apply color styles (if they exist)
        if (props.color && 'colors' in styleMap && styleMap.colors) {
            const colorStyles = (styleMap.colors as any)[props.color];
            if (colorStyles) {
                Object.assign(styles, colorStyles);
            }
        }

        return styles;
    };
}

/**
 * Style maps for common React Aria component patterns
 */
const ariaStyleMaps = {
    button: {
        base: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            fontFamily: ariaTheme.typography.fontFamily,
            fontWeight: ariaTheme.typography.fontWeight.medium,
            textDecoration: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:disabled': {
                cursor: 'not-allowed',
                opacity: 0.6
            }
        },
        variants: {
            primary: {
                backgroundColor: ariaTheme.colors.primary,
                color: 'white',
                '&:hover:not(:disabled)': {
                    backgroundColor: 'var(--color-primary-hover)',
                    transform: 'translateY(-1px)'
                },
                '&:active:not(:disabled)': {
                    transform: 'translateY(0)'
                }
            },
            secondary: {
                backgroundColor: ariaTheme.colors.surface,
                color: ariaTheme.colors.textPrimary,
                border: `1px solid ${ariaTheme.colors.border}`,
                '&:hover:not(:disabled)': {
                    backgroundColor: ariaTheme.colors.surface,
                    borderColor: ariaTheme.colors.primary
                }
            },
            ghost: {
                backgroundColor: 'transparent',
                color: ariaTheme.colors.textPrimary,
                '&:hover:not(:disabled)': {
                    backgroundColor: ariaTheme.colors.surface
                }
            }
        },
        sizes: {
            sm: {
                padding: `${ariaTheme.spacing['1']} ${ariaTheme.spacing['2']}`,
                fontSize: ariaTheme.typography.fontSize.sm,
                borderRadius: ariaTheme.borderRadius.sm,
                minHeight: '32px'
            },
            md: {
                padding: `${ariaTheme.spacing['2']} ${ariaTheme.spacing['3']}`,
                fontSize: ariaTheme.typography.fontSize.md,
                borderRadius: ariaTheme.borderRadius.sm,
                minHeight: '40px'
            },
            lg: {
                padding: `${ariaTheme.spacing['3']} ${ariaTheme.spacing['4']}`,
                fontSize: ariaTheme.typography.fontSize.lg,
                borderRadius: ariaTheme.borderRadius.md,
                minHeight: '48px'
            }
        }
    },

    textfield: {
        base: {
            display: 'block',
            width: '100%',
            fontFamily: ariaTheme.typography.fontFamily,
            fontSize: ariaTheme.typography.fontSize.md,
            lineHeight: ariaTheme.typography.lineHeight.normal,
            color: ariaTheme.colors.textPrimary,
            backgroundColor: ariaTheme.colors.surface,
            border: `1px solid ${ariaTheme.colors.border}`,
            borderRadius: ariaTheme.borderRadius.sm,
            transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:focus': {
                outline: 'none',
                borderColor: ariaTheme.colors.primary,
                boxShadow: `0 0 0 2px ${ariaTheme.colors.primary}20`
            },
            '&:disabled': {
                backgroundColor: ariaTheme.colors.background,
                cursor: 'not-allowed'
            },
            '&::placeholder': {
                color: ariaTheme.colors.textMuted
            }
        },
        sizes: {
            sm: {
                padding: ariaTheme.spacing['1'],
                minHeight: '32px'
            },
            md: {
                padding: ariaTheme.spacing['2'],
                minHeight: '40px'
            },
            lg: {
                padding: ariaTheme.spacing['3'],
                minHeight: '48px'
            }
        }
    },

    overlay: {
        base: {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: ariaTheme.zIndex.overlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    },

    modal: {
        base: {
            backgroundColor: ariaTheme.colors.surface,
            borderRadius: ariaTheme.borderRadius.lg,
            boxShadow: ariaTheme.shadows.xl,
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            zIndex: ariaTheme.zIndex.modal
        },
        sizes: {
            sm: {
                width: '90%',
                maxWidth: '400px'
            },
            md: {
                width: '90%',
                maxWidth: '600px'
            },
            lg: {
                width: '90%',
                maxWidth: '800px'
            },
            full: {
                width: '95%',
                maxWidth: '1200px'
            }
        }
    }
} as const;

/**
 * Theme utilities for React Aria components
 */
export const ariaThemeUtils = {
    /** Get focus ring styles */
    getFocusRing: (variant: keyof typeof ariaTheme.focusRing = 'default') =>
        ariaTheme.focusRing[variant],

    /** Get color from theme */
    getColor: (color: keyof typeof ariaTheme.colors) => ariaTheme.colors[color],

    /** Get spacing value */
    getSpacing: (spacing: keyof typeof ariaTheme.spacing) => ariaTheme.spacing[spacing],

    /** Get border radius */
    getBorderRadius: (radius: keyof typeof ariaTheme.borderRadius) =>
        ariaTheme.borderRadius[radius],

    /** Get typography value */
    getTypography: (property: 'fontSize' | 'fontWeight' | 'lineHeight', value: string) => {
        const prop = ariaTheme.typography[property];
        if (property === 'fontSize' && value in ariaTheme.typography.fontSize) {
            return ariaTheme.typography.fontSize[
                value as keyof typeof ariaTheme.typography.fontSize
            ];
        }
        if (property === 'fontWeight' && value in ariaTheme.typography.fontWeight) {
            return ariaTheme.typography.fontWeight[
                value as keyof typeof ariaTheme.typography.fontWeight
            ];
        }
        if (property === 'lineHeight' && value in ariaTheme.typography.lineHeight) {
            return ariaTheme.typography.lineHeight[
                value as keyof typeof ariaTheme.typography.lineHeight
            ];
        }
        return prop;
    },

    /** Get shadow value */
    getShadow: (shadow: keyof typeof ariaTheme.shadows) => ariaTheme.shadows[shadow],

    /** Get z-index value */
    getZIndex: (zIndex: keyof typeof ariaTheme.zIndex) => ariaTheme.zIndex[zIndex]
};

/**
 * Export commonly used theme combinations
 */
export const ariaThemes = {
    // High contrast theme
    highContrast: {
        ...ariaTheme,
        focusRing: {
            ...ariaTheme.focusRing,
            default: ariaTheme.focusRing.highContrast
        }
    },

    // Reduced motion theme
    reducedMotion: {
        ...ariaTheme,
        // Override transitions for reduced motion
        transitions: {
            none: 'none',
            fast: '0.1s ease-in-out',
            normal: '0.2s ease-in-out',
            slow: '0.3s ease-in-out'
        }
    }
};

// Import React for type definitions
import type React from 'react';
