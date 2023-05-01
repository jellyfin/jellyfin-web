import React from 'react';
import { Route } from 'react-router-dom';

import AsyncPage from '../AsyncPage';

export interface AsyncRoute {
    /** The URL path for this route. */
    path: string
    /** The relative path to the page component in the routes directory. */
    page: string
}

export const toAsyncPageRoute = (route: AsyncRoute) => (
    <Route
        key={route.path}
        path={route.path}
        element={<AsyncPage page={route.page} />}
    />
);
