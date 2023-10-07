
import { History } from '@remix-run/router';
import React from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';

import { EXPERIMENTAL_APP_ROUTES } from 'apps/experimental/routes/routes';
import { useLegacyRouterSync } from 'hooks/useLegacyRouterSync';

const router = createHashRouter([
    ...EXPERIMENTAL_APP_ROUTES
]);

export default function RootAppRouter({ history }: { history: History}) {
    useLegacyRouterSync({ router, history });

    return <RouterProvider router={router} />;
}
