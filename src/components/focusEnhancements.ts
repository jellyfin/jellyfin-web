/**
 * React Aria Focus Enhancements
 *
 * Provides React Aria-based hooks for focus management while keeping the
 * existing focusManager.ts for backward compatibility.
 */

import { useFocusRing as ariaUseFocusRing } from '@react-aria/focus';
import React from 'react';
import { ariaUtils } from '../lib/accessibility/adapters';
import { vars } from '../styles/tokens.css';
import focusManager from './focusManager';

/**
 * Enhanced focus ring hook with custom styling integration
 */
export interface UseEnhancedFocusProps {
    /** Custom focus ring color from token system */
    color?: keyof typeof vars.colors;
    /** Custom focus ring width */
    width?: string;
    /** Custom focus ring offset */
    offset?: string;
    /** Whether the element is disabled */
    isDisabled?: boolean;
}

export function useEnhancedFocus(props: UseEnhancedFocusProps = {}) {
    const { color = 'primary', width = '2px', offset = '2px', isDisabled = false } = props;

    const { isFocused, isFocusVisible, focusProps } = ariaUseFocusRing();

    const focusRingStyles =
        isFocused && isFocusVisible
            ? {
                  outline: `${width} solid ${vars.colors[color]}`,
                  outlineOffset: offset,
                  borderRadius: vars.borderRadius.sm
              }
            : {};

    return {
        isFocused,
        isFocusVisible,
        focusProps,
        focusRingStyles
    };
}

/**
 * Enhanced focus trap for dialogs/modals using React Aria patterns
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        return ariaUtils.trapFocus(container);
    }, [containerRef]);
}

/**
 * Focus container hook for managing directional navigation
 */
export function useFocusContainer(
    containerRef: React.RefObject<HTMLElement>,
    options: {
        /** Direction constraints: 'x', 'y', 'all', or specific directions */
        direction?: 'x' | 'y' | 'all' | 'left' | 'right' | 'up' | 'down';
        /** Whether to trap focus within container */
        trapFocus?: boolean;
        /** Callback when focus changes */
        onFocusChange?: (element: HTMLElement | null) => void;
    } = {}
) {
    const { direction = 'all', trapFocus = false, onFocusChange } = options;

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Set up container classes for focus management
        container.classList.add('focuscontainer');

        if (direction === 'x' || direction === 'left' || direction === 'right') {
            container.classList.add('focuscontainer-x');
        }
        if (direction === 'y' || direction === 'up' || direction === 'down') {
            container.classList.add('focuscontainer-y');
        }

        // Add focus trap if requested
        let cleanup: (() => void) | undefined;
        if (trapFocus) {
            cleanup = ariaUtils.trapFocus(container);
        }

        // Listen for focus changes
        const handleFocusIn = (event: FocusEvent) => {
            onFocusChange?.(event.target as HTMLElement);
        };

        const handleFocusOut = (event: FocusEvent) => {
            // Check if focus moved outside container
            if (!container.contains(event.relatedTarget as Node)) {
                onFocusChange?.(null);
            }
        };

        container.addEventListener('focusin', handleFocusIn);
        container.addEventListener('focusout', handleFocusOut);

        return () => {
            container.removeEventListener('focusin', handleFocusIn);
            container.removeEventListener('focusout', handleFocusOut);
            cleanup?.();

            // Clean up container classes
            container.classList.remove('focuscontainer', 'focuscontainer-x', 'focuscontainer-y');
        };
    }, [containerRef, direction, trapFocus, onFocusChange]);
}

/**
 * Enhanced autoFocus hook that combines React Aria with existing logic
 */
export function useEnhancedAutoFocus(
    containerRef: React.RefObject<HTMLElement>,
    options: {
        /** Whether to auto-focus first focusable element */
        autoFocusFirst?: boolean;
        /** Whether to look for elements with autofocus attribute */
        respectAutofocus?: boolean;
        /** Element to focus instead of auto-detection */
        focusElement?: HTMLElement;
    } = {}
) {
    const { autoFocusFirst = true, respectAutofocus = true, focusElement } = options;

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (focusElement) {
            focusManager.focus(focusElement);
            return;
        }

        // Try autofocus elements first
        if (respectAutofocus) {
            const autofocusElement = container.querySelector('*[autofocus]') as HTMLElement | null;
            if (autofocusElement) {
                focusManager.focus(autofocusElement);
                return;
            }
        }

        // Fall back to first focusable element
        if (autoFocusFirst) {
            const focusableElements = ariaUtils.getFocusableElements(container);
            if (focusableElements.length > 0) {
                focusManager.focus(focusableElements[0]);
            }
        }
    }, [containerRef, autoFocusFirst, respectAutofocus, focusElement]);
}

/**
 * Keyboard navigation hook for arrow key handling
 */
export function useKeyboardNavigation(
    containerRef: React.RefObject<HTMLElement>,
    options: {
        /** Whether to handle arrow keys */
        handleArrows?: boolean;
        /** Whether to handle tab key */
        handleTab?: boolean;
        /** Whether to handle enter/space */
        handleActivation?: boolean;
        /** Custom key handlers */
        onKey?: (event: KeyboardEvent) => void;
        /** Arrow key handler */
        onArrow?: (direction: 'up' | 'down' | 'left' | 'right') => void;
        /** Activation handler */
        onActivate?: () => void;
    } = {}
) {
    const {
        handleArrows = true,
        handleTab = true,
        handleActivation = true,
        onKey,
        onArrow,
        onActivate
    } = options;

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Call custom handler first
            onKey?.(event);

            // Handle arrow keys
            if (handleArrows) {
                switch (event.key) {
                    case 'ArrowUp':
                        onArrow?.('up');
                        break;
                    case 'ArrowDown':
                        onArrow?.('down');
                        break;
                    case 'ArrowLeft':
                        onArrow?.('left');
                        break;
                    case 'ArrowRight':
                        onArrow?.('right');
                        break;
                }
            }

            // Handle tab key
            if (handleTab && event.key === 'Tab') {
                // Let default tab behavior handle it
                return;
            }

            // Handle activation keys
            if (handleActivation) {
                if (event.key === 'Enter' || event.key === ' ') {
                    onActivate?.();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [containerRef, handleArrows, handleTab, handleActivation, onKey, onArrow, onActivate]);
}

// Export enhanced utilities with existing focusManager
export const enhancedFocusManager = {
    ...focusManager,
    // New React Aria enhanced methods
    useEnhancedFocus,
    useFocusTrap,
    useFocusContainer,
    useEnhancedAutoFocus,
    useKeyboardNavigation,

    // Utility methods from ariaUtils
    getFirstFocusable: ariaUtils.getFocusableElements,
    focusFirst: ariaUtils.focusFirst,
    focusLast: ariaUtils.focusLast
};

export default enhancedFocusManager;
