import type { RouteObject } from 'react-router-dom';

import { AppType } from 'constants/appType';

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

const importRoute = (page: string, type: AppType) => {
    switch (type) {
        case AppType.Dashboard:
            return import(
                /* webpackChunkName: "[request]" */ `../../apps/dashboard/routes/${page}`
            );
        case AppType.Experimental:
            return import(
                /* webpackChunkName: "[request]" */ `../../apps/experimental/routes/${page}`
            );
        case AppType.Stable:
            return import(
                /* webpackChunkName: "[request]" */ `../../apps/stable/routes/${page}`
            );
    }
};

export const toAsyncPageRoute = ({
    path,
    page,
    type = AppType.Stable
}: AsyncRoute): RouteObject => {
    return {
        path,
        lazy: async () => {
            const {
                // If there is a default export, use it as the Component for compatibility
                default: Component,
                ...route
            } = await importRoute(page ?? path, type);

            return {
                Component,
                ...route
            };
        }
    };
};
