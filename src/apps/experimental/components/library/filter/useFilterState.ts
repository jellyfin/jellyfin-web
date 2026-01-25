import { useSearchParams } from 'hooks/useSearchParams';
import { useCallback, useMemo } from 'react';

interface FilterStateOptions {
    paramPrefix?: string;
    defaults?: Record<string, string[]>;
}

export function useFilterState(options: FilterStateOptions = {}) {
    const { paramPrefix = 'filter', defaults = {} } = options;
    const [searchParams, setSearchParams] = useSearchParams();

    const getParam = useCallback(
        (key: string): string[] => {
            const paramKey = `${paramPrefix}.${key}`;
            const value = searchParams.get(paramKey);
            if (value === null || value === '') {
                return defaults[key] || [];
            }
            return value.split(',').filter(Boolean);
        },
        [searchParams, paramPrefix, defaults]
    );

    const allFilters = useMemo(() => {
        const filters: Record<string, string[]> = {};
        searchParams.forEach((value, key) => {
            if (key.startsWith(`${paramPrefix}.`)) {
                const filterKey = key.substring(paramPrefix.length + 1);
                filters[filterKey] = value.split(',').filter(Boolean);
            }
        });
        return filters;
    }, [searchParams, paramPrefix]);

    const setFilter = useCallback(
        (key: string, values: string[]) => {
            const newParams = new URLSearchParams(searchParams);
            const paramKey = `${paramPrefix}.${key}`;

            if (values.length === 0) {
                newParams.delete(paramKey);
            } else {
                newParams.set(paramKey, values.join(','));
            }

            setSearchParams(newParams, { replace: true });
        },
        [searchParams, paramPrefix, setSearchParams]
    );

    const toggleFilter = useCallback(
        (key: string, value: string) => {
            const current = getParam(key);
            const newValues = current.includes(value) ?
                current.filter((v) => v !== value) :
                [...current, value];
            setFilter(key, newValues);
        },
        [getParam, setFilter]
    );

    const clearFilter = useCallback(
        (key: string) => {
            setFilter(key, []);
        },
        [setFilter]
    );

    const clearAllFilters = useCallback(() => {
        const newParams = new URLSearchParams();
        // Preserve non-filter params
        searchParams.forEach((value, key) => {
            if (!key.startsWith(`${paramPrefix}.`)) {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams, { replace: true });
    }, [searchParams, paramPrefix, setSearchParams]);

    const hasActiveFilters = useMemo(() => {
        return Object.keys(allFilters).some(
            (key) => allFilters[key].length > 0
        );
    }, [allFilters]);

    const activeFilterCount = useMemo(() => {
        return Object.values(allFilters).reduce(
            (sum, values) => sum + values.length,
            0
        );
    }, [allFilters]);

    return {
        filters: allFilters,
        getFilter: getParam,
        setFilter,
        toggleFilter,
        clearFilter,
        clearAllFilters,
        hasActiveFilters,
        activeFilterCount,
        searchParams
    };
}

export default useFilterState;
