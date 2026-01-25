import { useCallback, useMemo } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';

export interface SetSearchParamsOptions {
    replace?: boolean;
}

type SetSearchParams = (
    nextInit: URLSearchParams | string | Record<string, string | undefined>,
    options?: SetSearchParamsOptions
) => void;

const buildSearchParams = (
    nextInit: URLSearchParams | string | Record<string, string | undefined>
): URLSearchParams => {
    if (nextInit instanceof URLSearchParams) {
        return new URLSearchParams(nextInit.toString());
    }

    if (typeof nextInit === 'string') {
        return new URLSearchParams(nextInit);
    }

    const params = new URLSearchParams();
    Object.entries(nextInit).forEach(([key, value]) => {
        if (value !== undefined) {
            params.set(key, value);
        }
    });

    return params;
};

export const useSearchParams = (): [URLSearchParams, SetSearchParams] => {
    const navigate = useNavigate();
    const pathname = useRouterState({
        select: (state) => state.location.pathname
    });
    const search = useRouterState({
        select: (state) => state.location.search
    });

    const searchParams = useMemo(() => new URLSearchParams(search), [search]);

    const setSearchParams = useCallback((nextInit: URLSearchParams | string | Record<string, string | undefined>, options?: SetSearchParamsOptions) => {
        const nextParams = buildSearchParams(nextInit);
        const nextSearch = nextParams.toString();
        const to = nextSearch ? `${pathname}?${nextSearch}` : pathname;
        navigate({ to, replace: options?.replace });
    }, [navigate, pathname]);

    return [ searchParams, setSearchParams ];
};

export default useSearchParams;
