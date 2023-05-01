import React from 'react';
import { Route } from 'react-router-dom';

import ViewManagerPage, { ViewManagerPageProps } from '../viewManager/ViewManagerPage';

export interface LegacyRoute {
    path: string,
    pageProps: ViewManagerPageProps
}

export function toViewManagerPageRoute(route: LegacyRoute) {
    return (
        <Route
            key={route.path}
            path={route.path}
            element={
                <ViewManagerPage {...route.pageProps} />
            }
        />
    );
}
