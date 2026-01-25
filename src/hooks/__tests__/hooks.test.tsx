/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, test } from 'vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDebounce } from '../useDebounce';
import { useLocalStorage } from '../useLocalStorage';
import { useMediaQuery } from '../useMediaQuery';
import { useClickOutside } from '../useClickOutside';

describe('useDebounce', () => {
    function TestComponent({ value, delay = 300 }: { value: string; delay?: number }) {
        const debounced = useDebounce(value, delay);
        return <div data-testid="result">{debounced}</div>;
    }

    it('returns initial value immediately', () => {
        render(<TestComponent value="hello" />);
        expect(screen.getByTestId('result')).toHaveTextContent('hello');
    });

    it('debounces value changes', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<TestComponent value="hello" delay={100} />);

        rerender(<TestComponent value="world" delay={100} />);
        expect(screen.getByTestId('result')).toHaveTextContent('hello');

        await waitFor(
            () => {
                expect(screen.getByTestId('result')).toHaveTextContent('world');
            },
            { timeout: 200 }
        );
    });
});

describe('useLocalStorage', () => {
    function TestComponent({ storageKey, initialValue }: { storageKey: string; initialValue: string }) {
        const [value, setValue] = useLocalStorage(storageKey, initialValue);
        return (
            <div>
                <span data-testid="value">{value}</span>
                <button onClick={() => setValue('updated')}>Update</button>
                <button onClick={() => setValue(v => (v || '') + '-appended')}>Append</button>
            </div>
        );
    }

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
        cleanup();
    });

    it('returns initial value when no stored value', () => {
        render(<TestComponent storageKey="test-key" initialValue="default" />);
        expect(screen.getByTestId('value')).toHaveTextContent('default');
    });

    it('returns stored value', () => {
        localStorage.setItem('test-key', '"stored"');
        render(<TestComponent storageKey="test-key" initialValue="default" />);
        expect(screen.getByTestId('value')).toHaveTextContent('stored');
    });

    it('updates stored value', async () => {
        const user = userEvent.setup();
        render(<TestComponent storageKey="test-key" initialValue="default" />);

        await user.click(screen.getByText('Update'));
        expect(screen.getByTestId('value')).toHaveTextContent('updated');
        expect(localStorage.getItem('test-key')).toBe('"updated"');
    });

    it('supports functional updates', async () => {
        const user = userEvent.setup();
        render(<TestComponent storageKey="test-key" initialValue="initial" />);

        await user.click(screen.getByText('Append'));
        expect(screen.getByTestId('value')).toHaveTextContent('initial-appended');
    });
});

describe('useMediaQuery', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(), // Deprecated
                removeListener: vi.fn(), // Deprecated
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }))
        });
    });

    it('returns false on server', () => {
        function TestComponent() {
            const matches = useMediaQuery('(min-width: 1000px)');
            return <div data-testid="result">{matches.toString()}</div>;
        }

        render(<TestComponent />);
        expect(screen.getByTestId('result')).toHaveTextContent('false');
    });
});

describe('useClickOutside', () => {
    it('calls callback when clicking outside', async () => {
        const onClickOutside = vi.fn();
        function TestComponent() {
            const ref = useClickOutside<HTMLDivElement>(onClickOutside);
            return (
                <div>
                    <div ref={ref} data-testid="inside">
                        Inside
                    </div>
                    <div data-testid="outside">Outside</div>
                </div>
            );
        }

        const user = userEvent.setup();
        render(<TestComponent />);

        await user.click(screen.getByTestId('outside'));
        expect(onClickOutside).toHaveBeenCalledTimes(1);
    });

    it('does not call callback when clicking inside', async () => {
        const onClickOutside = vi.fn();
        function TestComponent() {
            const ref = useClickOutside<HTMLDivElement>(onClickOutside);
            return (
                <div>
                    <div ref={ref} data-testid="inside">
                        Inside
                    </div>
                </div>
            );
        }

        const user = userEvent.setup();
        render(<TestComponent />);

        await user.click(screen.getByTestId('inside'));
        expect(onClickOutside).not.toHaveBeenCalled();
    });
});
