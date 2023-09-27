import loadable, { LoadableComponent } from '@loadable/component';
import React from 'react';
import { Route } from 'react-router-dom';

export enum AsyncRouteType {
    Stable,
    Experimental
}

export interface AsyncRoute {
    /** The URL path for this route. */
    path: string
    /**
     * The relative path to the page component in the routes directory.
     * Will fallback to using the `path` value if not specified.
     */
    page?: string
    /** The page element to render. */
    element?: LoadableComponent<AsyncPageProps>
    /** The page type used to load the correct page element. */
    type?: AsyncRouteType
}

export interface AsyncPageProps {
    /** The relative path to the page component in the routes directory. */
    page: string
}

const ExperimentalAsyncPage = loadable(
    (props: { page: string }) => import(/* webpackChunkName: "[request]" */ `../../apps/experimental/routes/${props.page}`),
    { cacheKey: (props: AsyncPageProps) => props.page }
);

const StableAsyncPage = loadable(
    (props: { page: string }) => import(/* webpackChunkName: "[request]" */ `../../apps/stable/routes/${props.page}`),
    { cacheKey: (props: AsyncPageProps) => props.page }
);

export const toAsyncPageRoute = ({ path, page, element, type = AsyncRouteType.Stable }: AsyncRoute) => {
    const Element = element
        || (
            type === AsyncRouteType.Experimental ?
                ExperimentalAsyncPage :
                StableAsyncPage
        );

    return (
        <Route
            key={path}
            path={path}
            element={<Element page={page ?? path} />}
        />
    );
};
