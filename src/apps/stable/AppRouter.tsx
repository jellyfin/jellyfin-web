import { History } from '@remix-run/router';
import React from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';

import { STABLE_APP_ROUTES } from './routes/routes';
import { useLegacyRouterSync } from 'hooks/useLegacyRouterSync';

const router = createHashRouter([
    ...STABLE_APP_ROUTES
]);

export default function StableAppRouter({ history }: { history: History }) {
    useLegacyRouterSync({ router, history });

    return <RouterProvider router={router} />;
}
