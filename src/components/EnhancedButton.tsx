/**
 * Enhanced Button Component - React Aria Integration Example
 *
 * This component demonstrates proper usage of React Aria enhanced focus
 * management with our design token system.
 */

import React from 'react';
import { useEnhancedButtonFocus } from '../hooks/useEnhancedFocus';

export interface EnhancedButtonProps {
    /** Button content */
    children: React.ReactNode;
    /** Button variant for styling */
    variant?: 'primary' | 'secondary' | 'ghost';
    /** Button size */
    size?: 'sm' | 'md' | 'lg';
    /** Custom focus color */
    focusColor?: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
    /** Disabled state */
    disabled?: boolean;
    /** Click handler */
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    /** Custom className */
    className?: string;
    /** Component name for debugging */
    component?: string;
}

/**
 * Accessible button component with React Aria enhanced focus management
 *
 * Features:
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Design token integration
 * - Focus ring styling
 * - Focus state tracking
 */
export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    focusColor,
    disabled = false,
    onClick,
    className,
    component = 'EnhancedButton'
}) => {
    // Use React Aria enhanced focus management
    const { isFocused, isFocusVisible, focusProps, focusRingStyles, buttonStyles } =
        useEnhancedButtonFocus({
            focusColor: focusColor || (variant === 'primary' ? 'primary' : 'textPrimary'),
            component
        });

    // Base button styles using design tokens
    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--fonts-fontFamily)',
        fontWeight: 'var(--typography-fontWeightMedium)',
        textDecoration: 'none',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'visible',
        // Use design token spacing
        padding:
            size === 'sm'
                ? 'var(--spacing-1) var(--spacing-2)'
                : size === 'lg'
                  ? 'var(--spacing-3) var(--spacing-4)'
                  : 'var(--spacing-2) var(--spacing-3)',
        // Use design token typography
        fontSize:
            size === 'sm'
                ? 'var(--typography-2-fontSize)'
                : size === 'lg'
                  ? 'var(--typography-4-fontSize)'
                  : 'var(--typography-3-fontSize)',
        lineHeight: 'var(--typography-lineHeightNormal)',
        // Use design token border radius
        borderRadius: 'var(--borderRadius-sm)',
        minHeight: size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px',
        opacity: disabled ? 'var(--opacity-disabled)' : '1',
        // Apply focus ring styles when focused
        ...(isFocused && isFocusVisible ? focusRingStyles : {})
    };

    // Variant-specific styles using design tokens (without pseudo-selectors for React styles)
    const getVariantStyles = (variant: string): React.CSSProperties => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: disabled
                        ? 'var(--color-surfaceVariant)'
                        : 'var(--color-primary)',
                    color: 'white'
                };
            case 'secondary':
                return {
                    backgroundColor: disabled
                        ? 'var(--color-surfaceVariant)'
                        : 'var(--color-surface)',
                    color: 'var(--color-textPrimary)',
                    border: '1px solid var(--color-border)'
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    color: disabled ? 'var(--color-textMuted)' : 'var(--color-textPrimary)'
                };
            default:
                return {};
        }
    };

    const variantStyles = getVariantStyles(variant);

    // Merge all styles
    const mergedStyles: React.CSSProperties = {
        ...baseStyles,
        ...variantStyles,
        ...buttonStyles
    };

    return (
        <button
            {...focusProps}
            style={mergedStyles}
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
            className={className}
            // ARIA attributes for accessibility
            aria-disabled={disabled}
            role="button"
            // Debug attributes for testing
            data-focused={isFocused}
            data-focus-visible={isFocusVisible}
            data-variant={variant}
            data-size={size}
        >
            {children}
        </button>
    );
};

// Display name for debugging
EnhancedButton.displayName = 'EnhancedButton';

export default EnhancedButton;
