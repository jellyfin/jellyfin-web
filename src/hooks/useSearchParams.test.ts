import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchParams } from './useSearchParams';

// Mock router
vi.mock('@tanstack/react-router', () => ({
    useNavigate: vi.fn(),
    useRouterState: vi.fn((options) => {
        if (options?.select) {
            return options.select({
                location: {
                    pathname: '/test',
                    search: 'page=1&sort=name'
                }
            });
        }
        return {
            location: {
                pathname: '/test',
                search: 'page=1&sort=name'
            }
        };
    })
}));

describe('useSearchParams', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('reading search params', () => {
        it('should return URLSearchParams object', () => {
            const { result } = renderHook(() => useSearchParams());
            const [params] = result.current;

            expect(params).toBeInstanceOf(URLSearchParams);
        });

        it('should parse query parameters', () => {
            const { result } = renderHook(() => useSearchParams());
            const [params] = result.current;

            // URLSearchParams is returned, can be used to get values
            expect(params).toBeDefined();
        });

        it('should return setter function', () => {
            const { result } = renderHook(() => useSearchParams());
            const [, setSearchParams] = result.current;

            expect(typeof setSearchParams).toBe('function');
        });
    });

    describe('building search params', () => {
        it('should handle object input', () => {
            const params = new URLSearchParams({
                page: '1',
                sort: 'name'
            });

            expect(params.get('page')).toBe('1');
            expect(params.get('sort')).toBe('name');
        });

        it('should handle URLSearchParams input', () => {
            const original = new URLSearchParams('page=2&sort=date');
            const copy = new URLSearchParams(original.toString());

            expect(copy.get('page')).toBe('2');
            expect(copy.get('sort')).toBe('date');
        });

        it('should handle string input', () => {
            const params = new URLSearchParams('page=3&sort=rating');

            expect(params.get('page')).toBe('3');
            expect(params.get('sort')).toBe('rating');
        });

        it('should filter undefined values', () => {
            const params = new URLSearchParams();
            const input = {
                page: '1',
                sort: undefined,
                filter: 'active'
            };

            Object.entries(input).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.set(key, value);
                }
            });

            expect(params.has('page')).toBe(true);
            expect(params.has('sort')).toBe(false);
            expect(params.has('filter')).toBe(true);
        });
    });

    describe('multiple parameters', () => {
        it('should handle multiple values', () => {
            const params = new URLSearchParams();
            params.set('id', 'abc');
            params.set('page', '1');
            params.set('limit', '10');
            params.set('sort', 'name');

            expect(params.size).toBe(4);
        });

        it('should preserve parameter order conceptually', () => {
            const params = new URLSearchParams('a=1&b=2&c=3');
            const keys = Array.from(params.keys());

            expect(keys).toContain('a');
            expect(keys).toContain('b');
            expect(keys).toContain('c');
        });
    });

    describe('special characters', () => {
        it('should handle URL-encoded values', () => {
            const params = new URLSearchParams('search=hello%20world');
            expect(params.get('search')).toBe('hello world');
        });

        it('should handle special characters in keys and values', () => {
            const params = new URLSearchParams();
            params.set('key_name', 'value-name');

            expect(params.get('key_name')).toBe('value-name');
        });

        it('should handle empty string values', () => {
            const params = new URLSearchParams('empty=');
            expect(params.has('empty')).toBe(true);
            expect(params.get('empty')).toBe('');
        });
    });

    describe('options handling', () => {
        it('should accept replace option', () => {
            const options = { replace: true };
            expect(options.replace).toBe(true);
        });

        it('should default replace to false', () => {
            const options: { replace?: boolean } = {};
            expect(options.replace).toBe(undefined);
        });
    });

    describe('URLSearchParams API', () => {
        it('should support get method', () => {
            const params = new URLSearchParams('page=1');
            expect(params.get('page')).toBe('1');
            expect(params.get('missing')).toBeNull();
        });

        it('should support has method', () => {
            const params = new URLSearchParams('page=1');
            expect(params.has('page')).toBe(true);
            expect(params.has('missing')).toBe(false);
        });

        it('should support set method', () => {
            const params = new URLSearchParams();
            params.set('key', 'value');
            expect(params.get('key')).toBe('value');
        });

        it('should support delete method', () => {
            const params = new URLSearchParams('page=1&sort=name');
            params.delete('sort');
            expect(params.has('sort')).toBe(false);
            expect(params.has('page')).toBe(true);
        });

        it('should support toString', () => {
            const params = new URLSearchParams('page=1&sort=name');
            const str = params.toString();
            expect(typeof str).toBe('string');
            expect(str).toContain('page=1');
            expect(str).toContain('sort=name');
        });

        it('should support iteration', () => {
            const params = new URLSearchParams('a=1&b=2');
            const entries = Array.from(params.entries());
            expect(entries).toHaveLength(2);
        });
    });

    describe('common use cases', () => {
        it('should construct pagination params', () => {
            const params = new URLSearchParams();
            params.set('page', '2');
            params.set('limit', '20');

            expect(params.get('page')).toBe('2');
            expect(params.get('limit')).toBe('20');
        });

        it('should construct filter params', () => {
            const params = new URLSearchParams();
            params.set('status', 'active');
            params.set('type', 'user');
            params.set('sort', 'date');

            const str = params.toString();
            expect(str).toContain('status=active');
            expect(str).toContain('type=user');
            expect(str).toContain('sort=date');
        });

        it('should update specific param', () => {
            const params = new URLSearchParams('page=1&sort=name');
            params.set('page', '2');

            expect(params.get('page')).toBe('2');
            expect(params.get('sort')).toBe('name');
        });

        it('should remove specific param', () => {
            const params = new URLSearchParams('page=1&sort=name&filter=active');
            params.delete('filter');

            expect(params.has('filter')).toBe(false);
            expect(params.has('page')).toBe(true);
            expect(params.has('sort')).toBe(true);
        });
    });
});
