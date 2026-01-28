/**
 * React Aria Enhanced Focus Hook
 *
 * Modernized focus management using React Aria hooks while maintaining
 * compatibility with our existing design token system.
 */

import { useFocusRing as ariaUseFocusRing } from '@react-aria/focus';
import { useFocus, useFocusWithin } from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import { useState } from 'react';
import { ariaTheme } from '../lib/accessibility/theme';
import { logger } from '../utils/logger';

export interface UseEnhancedFocusOptions {
    /** Color for focus ring - defaults to 'primary' */
    focusColor?: keyof typeof ariaTheme.colors;
    /** Width of focus ring - defaults to '2px' */
    focusWidth?: string;
    /** Offset of focus ring - defaults to '2px' */
    focusOffset?: string;
    /** Enable focus tracking within container */
    trackFocusWithin?: boolean;
    /** Custom focus handler */
    onFocus?: (isFocused: boolean) => void;
    /** Custom blur handler */
    onBlur?: (isFocused: boolean) => void;
    /** Component name for logging */
    component?: string;
}

export interface EnhancedFocusResult {
    /** Whether element is currently focused */
    isFocused: boolean;
    /** Whether focus is visible (keyboard vs mouse) */
    isFocusVisible: boolean;
    /** Whether focus is within container (if trackFocusWithin enabled) */
    isFocusWithin?: boolean;
    /** Props to spread on target element */
    focusProps: React.HTMLAttributes<HTMLElement>;
    /** Computed focus ring styles */
    focusRingStyles: React.CSSProperties;
    /** Props to spread on container element (if trackFocusWithin enabled) */
    withinProps?: React.HTMLAttributes<HTMLElement>;
}

/**
 * Enhanced focus hook that combines React Aria focus utilities with our design tokens
 */
export function useEnhancedFocus(options: UseEnhancedFocusOptions = {}): EnhancedFocusResult {
    const {
        focusColor = 'primary',
        focusWidth = '2px',
        focusOffset = '2px',
        trackFocusWithin = false,
        onFocus,
        onBlur,
        component = 'Unknown'
    } = options;

    // React Aria focus ring for keyboard navigation
    const { isFocused, isFocusVisible, focusProps: ariaFocusProps } = ariaUseFocusRing();

    // Custom focus handlers
    const { focusProps: customFocusProps } = useFocus({
        onFocus: (e) => {
            onFocus?.(true);
            logger.debug('Element focused', { component, color: focusColor, event: e.type });
        },
        onBlur: (e) => {
            onBlur?.(false);
            logger.debug('Element blurred', { component, event: e.type });
        }
    });

    // Track focus within container (optional)
    const [isFocusWithin, setIsFocusWithin] = useState(false);
    const { focusWithinProps } = useFocusWithin({
        onFocusWithinChange: (isWithin) => {
            setIsFocusWithin(isWithin);
            if (trackFocusWithin) {
                logger.debug('Focus within changed', { component, isWithin });
            }
        }
    });

    // Compute focus ring styles using our design tokens
    const focusRingStyles: React.CSSProperties =
        isFocused && isFocusVisible
            ? {
                  outline: `${focusWidth} solid ${ariaTheme.colors[focusColor]}`,
                  outlineOffset: focusOffset,
                  borderRadius: ariaTheme.borderRadius.sm,
                  // Ensure focus ring is visible above other elements
                  zIndex: ariaTheme.zIndex.tooltip
              }
            : {};

    // Merge focus props from both hooks
    const mergedFocusProps = mergeProps(ariaFocusProps, customFocusProps);

    const result: EnhancedFocusResult = {
        isFocused,
        isFocusVisible,
        focusProps: mergedFocusProps,
        focusRingStyles
    };

    // Add focus within tracking if enabled
    if (trackFocusWithin) {
        result.isFocusWithin = isFocusWithin;
        result.withinProps = focusWithinProps;
    }

    return result;
}

/**
 * Hook for creating accessible buttons with enhanced focus management
 */
export function useEnhancedButtonFocus(
    options: UseEnhancedFocusOptions & {
        variant?: 'primary' | 'secondary' | 'ghost';
        size?: 'sm' | 'md' | 'lg';
    } = {}
) {
    const { variant = 'primary', size = 'md', ...focusOptions } = options;

    const focusResult = useEnhancedFocus({
        focusColor: variant === 'primary' ? 'primary' : 'textPrimary',
        ...focusOptions
    });

    // Additional button-specific styles
    const buttonStyles: React.CSSProperties = {
        position: 'relative',
        // Ensure focus ring doesn't get clipped
        overflow: 'visible'
    };

    return {
        ...focusResult,
        buttonStyles
    };
}

/**
 * Hook for creating accessible text inputs with enhanced focus management
 */
export function useEnhancedInputFocus(options: UseEnhancedFocusOptions = {}) {
    const focusResult = useEnhancedFocus({
        focusColor: 'primary',
        ...options
    });

    // Input-specific focus enhancements (focus styles are handled by focusRingStyles)
    const inputStyles: React.CSSProperties = {
        transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
    };

    return {
        ...focusResult,
        inputStyles
    };
}

/**
 * Hook for creating focus traps for modals and dialogs
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Get all focusable elements
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);

        // Focus first element when trap is activated
        if (focusableElements.length > 0) {
            firstElement.focus();
        }

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }, [containerRef]);
}

// Import React for hooks
import React from 'react';
