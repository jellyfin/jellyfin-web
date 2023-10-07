import React from 'react';
import { Navigate, Route, RouteObject, useLocation } from 'react-router-dom';

export interface Redirect {
    from: string
    to: string
}

const RedirectWithSearch = ({ to }: { to: string }) => {
    const { search } = useLocation();

    return (
        <Navigate
            replace
            to={`${to}${search}`}
        />
    );
};

export function toRedirectRoute({ from, to }: Redirect) {
    return (
        <Route
            key={from}
            path={from}
            element={<RedirectWithSearch to={to} />}
        />
    );
}

export function toRedirectRouteConfig({ from, to }: Redirect): RouteObject {
    return {
        path: from,
        element: <RedirectWithSearch to={to} />
    };
}
