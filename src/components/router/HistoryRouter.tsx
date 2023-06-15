import React, { useLayoutEffect } from 'react';
import { HistoryRouterProps, Router } from 'react-router-dom';
import { Update } from 'history';

/** Strips leading "!" from paths */
const normalizePath = (pathname: string) => pathname.replace(/^!/, '');

/**
 * A slightly customized version of the HistoryRouter from react-router-dom.
 * We need to use HistoryRouter to have a shared history state between react-router and appRouter, but it does not seem
 * to be properly exported in the upstream package.
 * We also needed some customizations to handle #! routes.
 * Refs: https://github.com/remix-run/react-router/blob/v6.3.0/packages/react-router-dom/index.tsx#L222
 */
export function HistoryRouter({ basename, children, history }: HistoryRouterProps) {
    const [state, setState] = React.useState<Update>({
        action: history.action,
        location: history.location
    });

    useLayoutEffect(() => {
        const onHistoryChange = (update: Update) => {
            if (update.location.pathname.startsWith('!')) {
                // When the location changes, we need to check for #! paths and replace the location with the "!" stripped
                history.replace(normalizePath(update.location.pathname), update.location.state);
            } else {
                setState(update);
            }
        };

        history.listen(onHistoryChange);
    }, [ history ]);

    return (
        <Router
            basename={basename}
            // eslint-disable-next-line react/no-children-prop
            children={children}
            location={{
                ...state.location,
                // The original location does not get replaced with the normalized version, so we need to strip it here
                pathname: normalizePath(state.location.pathname)
            }}
            navigationType={state.action}
            navigator={history}
        />
    );
}
