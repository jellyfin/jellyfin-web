import loadable from '@loadable/component';
import React from 'react';
import { Route } from 'react-router-dom';

export enum AsyncRouteType {
    Stable,
    Experimental
}

export interface AsyncRoute {
    /** The URL path for this route. */
    path: string
    /** The relative path to the page component in the routes directory. */
    page: string
    /** The route should use the page component from the experimental app. */
    type?: AsyncRouteType
}

interface AsyncPageProps {
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

export const toAsyncPageRoute = ({ path, page, type = AsyncRouteType.Stable }: AsyncRoute) => (
    <Route
        key={path}
        path={path}
        element={(
            type === AsyncRouteType.Experimental ?
                <ExperimentalAsyncPage page={page} /> :
                <StableAsyncPage page={page} />
        )}
    />
);
