import React from 'react';

import { AppType } from 'constants/appType';
import { LazyRouteWrapper } from './LazyRouteWrapper';

type RouteObject = {
    path?: string;
    children?: RouteObject[];
    element?: React.ReactNode;
    Component?: React.ComponentType;
    lazy?: () => Promise<Record<string, unknown>>;
    [key: string]: unknown;
};

export interface AsyncRoute {
    /** The URL path for this route. */
    path: string;
    /**
     * The relative path to the page component in the routes directory.
     * Will fallback to using the `path` value if not specified.
     */
    page?: string;
    /** The app that this page is part of. */
    type?: AppType;
}

const routeModules = import.meta.glob('../../apps/**/routes/**/*.{ts,tsx,js,jsx}');

const importRoute = (page: string, type: AppType) => {
    let folder = '';
    switch (type) {
        case AppType.Dashboard:
            folder = 'dashboard';
            break;
        case AppType.Experimental:
            folder = 'experimental';
            break;
        case AppType.Stable:
            folder = 'stable';
            break;
    }

    const path = `../../apps/${folder}/routes/${page}`;
    const loader =
        routeModules[`${path}.tsx`] ||
        routeModules[`${path}.ts`] ||
        routeModules[`${path}/index.tsx`] ||
        routeModules[`${path}/index.ts`] ||
        routeModules[`${path}.jsx`] ||
        routeModules[`${path}.js`];

    if (!loader) {
        throw new Error(`Route module not found: ${path}`);
    }

    return loader() as Promise<any>;
};

export const toAsyncPageRoute = ({ path, page, type = AppType.Stable }: AsyncRoute): RouteObject => {
    return {
        path,
        lazy: async () => {
            const {
                // If there is a default export, use it as the Component for compatibility
                default: Component,
                ...route
            } = await importRoute(page ?? path, type);

            // Wrap with Suspense and Error boundaries for better UX
            const WrappedComponent = () => (
                <LazyRouteWrapper>
                    <Component />
                </LazyRouteWrapper>
            );

            return {
                Component: WrappedComponent,
                ...route
            };
        }
    };
};
