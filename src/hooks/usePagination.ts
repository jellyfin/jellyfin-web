/**
 * usePagination Hook
 *
 * Manages pagination state with localStorage persistence.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface UsePaginationOptions {
    defaultPageSize?: number;
    storageKey?: string;
}

interface UsePaginationReturn {
    pageIndex: number;
    pageSize: number;
    setPageIndex: React.Dispatch<React.SetStateAction<number>>;
    setPageSize: (size: number) => void;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    goToFirstPage: () => void;
    goToLastPage: (totalCount: number) => void;
    nextPage: () => void;
    previousPage: () => void;
}

export const usePagination = (
    componentKey: string,
    options: UsePaginationOptions = {}
): UsePaginationReturn => {
    const { defaultPageSize = 50, storageKey = 'jellyfin-pagination' } = options;

    const [pageIndex, setPageIndexState] = useState(0);
    const [pageSize, setPageSizeState] = useState(defaultPageSize);

    const [storedPageIndex] = useLocalStorage<number>(
        `${storageKey}-${componentKey}-page`,
        0
    );

    const [storedPageSize] = useLocalStorage<number>(
        `${storageKey}-${componentKey}-size`,
        defaultPageSize
    );

    useEffect(() => {
        setPageIndexState(storedPageIndex);
    }, [storedPageIndex]);

    useEffect(() => {
        setPageSizeState(storedPageSize);
    }, [storedPageSize]);

    const setPageIndex = useCallback<React.Dispatch<React.SetStateAction<number>>>((index) => {
        const newIndex = typeof index === 'function' ? index(pageIndex) : Math.max(0, index);
        setPageIndexState(newIndex);
        localStorage.setItem(`${storageKey}-${componentKey}-page`, String(newIndex));
    }, [componentKey, storageKey, pageIndex]);

    const setPageSize = useCallback((size: number) => {
        const newSize = Math.max(1, size);
        setPageSizeState(newSize);
        localStorage.setItem(`${storageKey}-${componentKey}-size`, String(newSize));
        setPageIndex(0);
    }, [componentKey, storageKey, setPageIndex]);

    const hasNextPage = useCallback((totalCount?: number) => {
        if (totalCount === undefined) return true;
        return (pageIndex + 1) * pageSize < totalCount;
    }, [pageIndex, pageSize]);

    const hasPreviousPage = useCallback(() => {
        return pageIndex > 0;
    }, [pageIndex]);

    const goToFirstPage = useCallback(() => {
        setPageIndex(0);
    }, [setPageIndex]);

    const goToLastPage = useCallback((totalCount: number) => {
        const maxPage = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
        setPageIndex(maxPage);
    }, [pageSize, setPageIndex]);

    const nextPage = useCallback(() => {
        setPageIndex(pageIndex + 1);
    }, [pageIndex, setPageIndex]);

    const previousPage = useCallback(() => {
        if (pageIndex > 0) {
            setPageIndex(pageIndex - 1);
        }
    }, [pageIndex, setPageIndex]);

    return {
        pageIndex,
        pageSize,
        setPageIndex,
        setPageSize,
        hasNextPage: hasNextPage(),
        hasPreviousPage: hasPreviousPage(),
        goToFirstPage,
        goToLastPage,
        nextPage,
        previousPage,
    };
};

export default usePagination;
