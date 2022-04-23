import React, { useLayoutEffect } from 'react';
import { HistoryRouterProps, Router } from 'react-router-dom';
import { Update } from 'history';

const normalizePath = (pathname: string) => pathname.replace(/^!/, '');

export function HistoryRouter({ basename, children, history }: HistoryRouterProps) {
    const [state, setState] = React.useState({
        action: history.action,
        location: history.location
    });

    useLayoutEffect(() => {
        const onHistoryChange = (update: Update) => {
            if (update.location.pathname.startsWith('!')) {
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
                pathname: normalizePath(state.location.pathname)
            }}
            navigationType={state.action}
            navigator={history}
        />
    );
}
