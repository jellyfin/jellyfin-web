import React from 'react';
import { Navigate, Route } from 'react-router-dom';

export interface Redirect {
    from: string
    to: string
}

export function toRedirectRoute({ from, to }: Redirect) {
    return (
        <Route
            key={from}
            path={from}
            element={<Navigate replace to={to} />}
        />
    );
}
