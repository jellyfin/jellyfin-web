/**
 * React Aria + Radix UI Compatibility Layer
 *
 * This module provides utilities for integrating React Aria with our existing Radix UI components,
 * allowing gradual migration while maintaining consistent styling and behavior.
 */

import { useFocusRing as ariaUseFocusRing } from '@react-aria/focus';
import React from 'react';
import { vars } from 'styles/tokens.css.ts';

/**
 * Enhanced focus ring hook with custom styling integration
 */
export interface UseFocusRingWithTokensProps {
    /** Custom focus ring color from token system */
    color?: keyof typeof vars.colors;
    /** Custom focus ring width */
    width?: string;
    /** Custom focus ring offset */
    offset?: string;
}

export function useFocusRingWithTokens(props: UseFocusRingWithTokensProps = {}) {
    const { color = 'primary', width = '2px', offset = '2px' } = props;

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
 * Accessibility utility functions
 */
export const ariaUtils = {
    /** Generate proper aria-label for screen readers */
    createAriaLabel: (action: string, object?: string) => {
        return object ? `${action} ${object}` : action;
    },

    /** Generate unique IDs for accessibility relationships */
    generateId: (prefix: string) => {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /** Check if element is focusable */
    isFocusable: (element: Element): boolean => {
        const htmlElement = element as HTMLElement;
        return (
            !htmlElement.hasAttribute('disabled') &&
            !htmlElement.hasAttribute('aria-hidden') &&
            (htmlElement.tabIndex >= 0 ||
                htmlElement.getAttribute('role') === 'button' ||
                htmlElement.tagName === 'BUTTON' ||
                htmlElement.tagName === 'INPUT' ||
                htmlElement.tagName === 'SELECT' ||
                htmlElement.tagName === 'TEXTAREA' ||
                htmlElement.tagName === 'A')
        );
    },

    /** Get all focusable elements within a container */
    getFocusableElements: (container: HTMLElement): HTMLElement[] => {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])'
        ].join(', ');

        return Array.from(container.querySelectorAll(focusableSelectors)).filter(
            ariaUtils.isFocusable
        ) as HTMLElement[];
    },

    /** Focus first focusable element in container */
    focusFirst: (container: HTMLElement) => {
        const focusableElements = ariaUtils.getFocusableElements(container);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
            return true;
        }
        return false;
    },

    /** Focus last focusable element in container */
    focusLast: (container: HTMLElement) => {
        const focusableElements = ariaUtils.getFocusableElements(container);
        if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
            return true;
        }
        return false;
    },

    /** Trap focus within container for dialogs/modals */
    trapFocus: (container: HTMLElement) => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            const focusableElements = ariaUtils.getFocusableElements(container);
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }
};

/**
 * Type definitions for enhanced compatibility
 */
export interface EnhancedAccessibilityProps {
    /** Accessibility announcements */
    'aria-live'?: 'polite' | 'assertive' | 'off';
    /** Accessibility descriptions */
    'aria-describedby'?: string;
    /** Accessibility labels */
    'aria-labelledby'?: string;
    /** Expanded state */
    'aria-expanded'?: boolean;
    /** Selected state */
    'aria-selected'?: boolean;
    /** Disabled state */
    'aria-disabled'?: boolean;
    /** Busy state */
    'aria-busy'?: boolean;
    /** Current item */
    'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
    /** pressed state */
    'aria-pressed'?: boolean;
}

/**
 * Enhanced label hook for form elements
 */
export interface UseEnhancedLabelProps {
    /** Label text */
    label?: string;
    /** Element ID */
    id?: string;
    /** Required indicator */
    required?: boolean;
    /** Error state */
    error?: boolean;
    /** Helper text */
    helperText?: string;
}

export function useEnhancedLabel(props: UseEnhancedLabelProps = {}) {
    const { label, id, required = false, error = false } = props;

    const labelId = id ? `${id}-label` : ariaUtils.generateId('label');
    const helperId = id ? `${id}-helper` : ariaUtils.generateId('helper');
    const errorId = id ? `${id}-error` : ariaUtils.generateId('error');

    const getAriaDescribedBy = () => {
        const describedBy = [];
        if (props.helperText) describedBy.push(helperId);
        if (error) describedBy.push(errorId);
        return describedBy.length > 0 ? describedBy.join(' ') : undefined;
    };

    return {
        labelProps: {
            id: labelId,
            htmlFor: id
        },
        fieldProps: {
            id,
            'aria-labelledby': label ? labelId : undefined,
            'aria-describedby': getAriaDescribedBy(),
            'aria-required': required,
            'aria-invalid': error
        },
        helperId,
        errorId
    };
}

/**
 * Export all utilities for easier consumption
 */
export { ariaUseFocusRing as useAriaFocusRing };
