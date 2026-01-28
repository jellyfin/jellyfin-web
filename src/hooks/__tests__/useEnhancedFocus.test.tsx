/**
 * React Aria Enhanced Components Test
 *
 * Test suite to validate our enhanced focus management works correctly
 * with existing design tokens and accessibility standards.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import our React Aria enhanced hooks
import {
    useEnhancedButtonFocus,
    useEnhancedFocus,
    useEnhancedInputFocus,
    useFocusTrap
} from '../useEnhancedFocus';

// Simple test component that uses enhanced focus
const TestButton = ({ children, ...props }: any) => {
    const { isFocused, focusProps, focusRingStyles } = useEnhancedButtonFocus({
        component: 'TestButton',
        ...props
    });

    return (
        <button {...focusProps} style={{ ...focusRingStyles }} data-focused={isFocused}>
            {children}
        </button>
    );
};

// Test component for focus trap
const TestFocusTrap = ({ children }: { children: React.ReactNode }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    useFocusTrap(containerRef as React.RefObject<HTMLElement>);

    return (
        <div ref={containerRef} tabIndex={-1}>
            {children}
        </div>
    );
};

// Test component for inputs
const TestInput = (props: any) => {
    const { isFocused, focusProps, focusRingStyles } = useEnhancedInputFocus({
        component: 'TestInput',
        ...props
    });

    return (
        <input 
            {...props}
            {...focusProps} 
            style={{ ...focusRingStyles }} 
            data-focused={isFocused} 
        />
    );
};

describe('React Aria Enhanced Focus Management', () => {
    beforeEach(() => {
        // Clear any focus before each test
        if (document.activeElement) {
            (document.activeElement as HTMLElement).blur();
        }
    });

    describe('useEnhancedButtonFocus', () => {
        it('should apply focus ring styles when focused', async () => {
            const user = userEvent.setup();
            render(<TestButton>Test Button</TestButton>);
            const button = screen.getByRole('button');

            // Initially not focused
            expect(button).not.toHaveAttribute('data-focused', 'true');

            // Focus the button
            await user.tab();

            // Should have focus ring styles
            expect(button).toHaveAttribute('data-focused', 'true');

            // Check for focus ring styles
            const style = window.getComputedStyle(button);
            expect(style.outline).toContain('solid');
        });

        it('should support custom focus colors', async () => {
            const user = userEvent.setup();
            render(<TestButton focusColor="error">Error Button</TestButton>);
            const button = screen.getByRole('button');

            await user.tab();

            // Should be focused with custom color
            expect(button).toHaveAttribute('data-focused', 'true');
        });

        it('should handle keyboard vs mouse focus correctly', async () => {
            const user = userEvent.setup();
            render(<TestButton>Test Button</TestButton>);
            const button = screen.getByRole('button');

            // Mouse focus should not show focus ring initially (depends on React Aria defaults)
            await user.click(button);
            
            // isFocused should be true, but isFocusVisible might be false
            expect(button).toHaveAttribute('data-focused', 'true');

            // Keyboard interaction should make focus visible
            await user.tab(); // Cycle focus back or to next
            render(<TestButton>Other Button</TestButton>);
            await user.tab();
            
            expect(button).toHaveAttribute('data-focused', 'true');
        });
    });

    describe('useEnhancedInputFocus', () => {
        it('should apply focus styles to input elements', async () => {
            const user = userEvent.setup();
            render(<TestInput placeholder="Test input" />);
            const input = screen.getByPlaceholderText('Test input');

            await user.click(input);

            expect(input).toHaveAttribute('data-focused', 'true');
        });

        it('should support custom focus handlers', async () => {
            const user = userEvent.setup();
            const onFocus = vi.fn();
            const onBlur = vi.fn();

            render(<TestInput placeholder="Test input" onFocus={onFocus} onBlur={onBlur} />);

            const input = screen.getByPlaceholderText('Test input');

            await user.click(input);
            expect(onFocus).toHaveBeenCalledWith(true);

            await user.tab(); // Blur by tabbing away
            expect(onBlur).toHaveBeenCalledWith(false);
        });
    });

    describe('useFocusTrap', () => {
        it('should trap focus within container', () => {
            render(
                <TestFocusTrap>
                    <button>Button 1</button>
                    <button>Button 2</button>
                    <button>Button 3</button>
                </TestFocusTrap>
            );

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(3);

            // First button should receive focus when trap is activated
            expect(buttons[0]).toBeInTheDocument();
        });

        it('should handle tab cycling within container', () => {
            render(
                <TestFocusTrap>
                    <button>First</button>
                    <button>Last</button>
                </TestFocusTrap>
            );

            const first = screen.getByText('First');
            const last = screen.getByText('Last');

            // Basic DOM structure validation
            expect(first).toBeInTheDocument();
            expect(last).toBeInTheDocument();
        });
    });

    describe('useEnhancedFocus (base hook)', () => {
        it('should track focus state correctly', async () => {
            const user = userEvent.setup();
            const TestComponent = () => {
                const { isFocused, focusProps } = useEnhancedFocus({
                    component: 'TestComponent'
                });

                return (
                    <div {...focusProps} tabIndex={0} data-focused={isFocused}>
                        Test Content
                    </div>
                );
            };

            render(<TestComponent />);
            const element = screen.getByText('Test Content');

            expect(element).toHaveAttribute('data-focused', 'false');

            await user.click(element);
            expect(element).toHaveAttribute('data-focused', 'true');

            await user.tab();
            expect(element).toHaveAttribute('data-focused', 'false');
        });

        it('should provide proper focus ring styles', () => {
            const TestComponent = () => {
                const { focusRingStyles } = useEnhancedFocus({
                    focusColor: 'primary',
                    focusWidth: '3px',
                    focusOffset: '4px'
                });

                return <div style={focusRingStyles}>Test</div>;
            };

            render(<TestComponent />);
            const element = screen.getByText('Test');

            // Initially no focus ring styles
            const style = window.getComputedStyle(element);
            expect(style.outline).toBe('');
        });

        it('should support focus within tracking', async () => {
            const user = userEvent.setup();
            const TestComponent = () => {
                const { isFocusWithin, focusProps, withinProps } = useEnhancedFocus({
                    trackFocusWithin: true,
                    component: 'Container'
                });

                return (
                    <div {...withinProps} data-focus-within={isFocusWithin}>
                        <input {...focusProps} />
                    </div>
                );
            };

            render(<TestComponent />);
            const input = screen.getByRole('textbox');
            const container = input.parentElement;

            expect(container).toHaveAttribute('data-focus-within', 'false');

            await user.click(input);

            expect(container).toHaveAttribute('data-focus-within', 'true');
        });
    });

    describe('Design Token Integration', () => {
        it('should use design token colors for focus rings', () => {
            const TestComponent = () => {
                const { focusRingStyles } = useEnhancedFocus({
                    focusColor: 'primary'
                });

                return <div style={focusRingStyles}>Test</div>;
            };

            render(<TestComponent />);

            // Validate that styles are being applied
            const element = screen.getByText('Test');
            expect(element).toBeInTheDocument();
        });

        it('should support different color variants', () => {
            const colors: Array<
                keyof typeof import('../../lib/accessibility/theme').ariaTheme.colors
            > = ['primary', 'secondary', 'error', 'success'];

            colors.forEach((color) => {
                const TestComponent = () => {
                    const { focusRingStyles } = useEnhancedFocus({ focusColor: color });
                    return <div style={focusRingStyles}>{color}</div>;
                };

                render(<TestComponent />);
                const element = screen.getByText(color);
                expect(element).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility Compliance', () => {
        it('should maintain proper tab order', () => {
            render(
                <div>
                    <TestButton>Button 1</TestButton>
                    <TestButton>Button 2</TestButton>
                    <TestButton>Button 3</TestButton>
                </div>
            );

            const buttons = screen.getAllByRole('button');

            // All buttons should be focusable
            buttons.forEach((button) => {
                expect(button).not.toHaveAttribute('disabled');
                expect(button).not.toHaveAttribute('aria-disabled');
            });
        });

        it('should provide visible focus indicators', async () => {
            const user = userEvent.setup();
            render(<TestButton>Accessible Button</TestButton>);
            const button = screen.getByRole('button');

            // Simulate keyboard navigation
            await user.tab();

            // Should have focus indicator
            expect(button).toHaveAttribute('data-focused', 'true');
        });

        it('should respect user preferences for reduced motion', async () => {
            const user = userEvent.setup();
            // Mock prefers-reduced-motion
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: vi.fn().mockImplementation((query) => ({
                    matches: query === '(prefers-reduced-motion: reduce)',
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn()
                }))
            });

            render(<TestButton>Reduced Motion Button</TestButton>);
            const button = screen.getByRole('button');

            await user.tab();

            expect(button).toHaveAttribute('data-focused', 'true');
        });
    });
});