import React from 'react';

import ViewManagerPage, { ViewManagerPageProps } from '@/components/viewManager/ViewManagerPage';

export interface LegacyRoute {
    path: string,
    pageProps: ViewManagerPageProps
}

export function toViewManagerPageRoute(route: LegacyRoute) {
    return {
        path: route.path,
        element: <ViewManagerPage {...route.pageProps} />
    };
}
