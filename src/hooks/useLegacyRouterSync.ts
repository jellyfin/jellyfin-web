import { Update } from 'history';
import { useLayoutEffect, useState } from 'react';
import type { History, Router } from '@remix-run/router';

const normalizePath = (pathname: string) => pathname.replace(/^!/, '');

interface UseLegacyRouterSyncProps {
  router: Router;
  history: History;
}
export function useLegacyRouterSync({ router, history }: UseLegacyRouterSyncProps) {
    const [routerLocation, setRouterLocation] = useState(router.state.location);

    useLayoutEffect(() => {
        const onHistoryChange = async (update: Update) => {
            const isSynced = router.createHref(router.state.location) === router.createHref(update.location);

            /**
             * Some legacy codepaths may still use the `#!` routing scheme which is unsupported with the React routing
             * implementation, so we need to remove the leading `!` from the pathname. React Router already removes the
             * hash for us.
             */
            if (update.location.pathname.startsWith('!')) {
                history.replace(normalizePath(update.location.pathname), update.location.state);
            } else if (!isSynced) {
                await router.navigate(update.location, { replace: true });
            }
        };

        const unlisten = history.listen(onHistoryChange);

        return () => {
            unlisten();
        };
    }, [history, router]);

    /**
     * Because the router subscription needs to be in a zero-dependencies effect, syncing changes to the router back to
     * the legacy history API needs to be in a separate effect. This should run any time the router location changes.
     */
    useLayoutEffect(() => {
        const isSynced = router.createHref(routerLocation) === router.createHref(history.location);
        if (!isSynced) {
            history.replace(routerLocation);
        }
    }, [history, router, routerLocation]);

    /**
     * We want to use an effect with no dependencies here when we set up the router subscription to ensure that we only
     * subscribe to the router state once. The router doesn't provide a way to remove subscribers, so we need to be
     * careful to not create multiple subscribers.
     */
    useLayoutEffect(() => {
        router.subscribe((newState) => {
            setRouterLocation((prevLocation) => {
                if (newState.location !== prevLocation) {
                    return newState.location;
                }
                return prevLocation;
            });
        });
    });
}
