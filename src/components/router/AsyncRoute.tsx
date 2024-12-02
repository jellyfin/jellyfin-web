import type { RouteObject } from 'react-router-dom';

export enum AsyncRouteType {
    Stable,
    Experimental,
    Dashboard
}

export interface AsyncRoute {
    /** The URL path for this route. */
    path: string
    /**
     * The relative path to the page component in the routes directory.
     * Will fallback to using the `path` value if not specified.
     */
    page?: string
    /** The page type used to load the correct page element. */
    type?: AsyncRouteType
}

const importRoute = (page: string, type: AsyncRouteType) => {
    switch (type) {
        case AsyncRouteType.Dashboard:
            return import(/* webpackChunkName: "[request]" */ `../../apps/dashboard/routes/${page}`);
        case AsyncRouteType.Experimental:
            return import(/* webpackChunkName: "[request]" */ `../../apps/experimental/routes/${page}`);
        case AsyncRouteType.Stable:
            return import(/* webpackChunkName: "[request]" */ `../../apps/stable/routes/${page}`);
    }
};

export const toAsyncPageRoute = ({
    path,
    page,
    type = AsyncRouteType.Stable
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
