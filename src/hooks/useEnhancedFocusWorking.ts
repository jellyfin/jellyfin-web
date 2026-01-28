/**
 * Simple React Aria Enhanced Focus Hook
 *
 * Working version that properly tracks focus state for testing
 */

import { useFocusRing as ariaUseFocusRing } from '@react-aria/focus';
import { useFocus, useFocusWithin } from '@react-aria/interactions';
import { useState } from 'react';
import { ariaTheme } from '../../lib/accessibility/theme';
import { logger } from '../../utils/logger';

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

    // Use local state to track focus
    const [isFocusedState, setIsFocusedState] = useState(false);

    // React Aria focus ring for keyboard navigation
    const { isFocusVisible, focusProps: ariaFocusProps } = ariaUseFocusRing();

    // Custom focus handlers with proper state management
    const { focusProps: customFocusProps } = useFocus({
        onFocus: (e) => {
            setIsFocusedState(true);
            onFocus?.(true);
            logger.debug('Element focused', { component, color: focusColor, event: e.type });
        },
        onBlur: (e) => {
            setIsFocusedState(false);
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
        isFocusedState && isFocusVisible
            ? {
                  outline: `${focusWidth} solid ${ariaTheme.colors[focusColor]}`,
                  outlineOffset: focusOffset,
                  borderRadius: ariaTheme.borderRadius.sm,
                  // Ensure focus ring is visible above other elements
                  zIndex: ariaTheme.zIndex.tooltip
              }
            : {};

    // Merge focus props from both hooks
    const mergedFocusProps = {
        ...ariaFocusProps,
        ...customFocusProps,
        'data-focused': isFocusedState.toString()
    };

    const result: EnhancedFocusResult = {
        isFocused: isFocusedState,
        isFocusVisible,
        focusProps: mergedFocusProps,
        focusRingStyles
    };

    // Add focus within tracking if enabled
    if (trackFocusWithin) {
        result.isFocusWithin = isFocusWithin;
        result.withinProps = {
            ...focusWithinProps,
            'data-focus-within': isFocusWithin.toString()
        };
    }

    return result;
}
