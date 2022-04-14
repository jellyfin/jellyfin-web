import React, { useLayoutEffect } from 'react';
import { HistoryRouterProps, Router } from 'react-router-dom';

export function HistoryRouter({ basename, children, history }: HistoryRouterProps) {
    const [state, setState] = React.useState({
        action: history.action,
        location: history.location
    });

    useLayoutEffect(() => history.listen(setState), [history]);

    return (
        <Router
            basename={basename}
            // eslint-disable-next-line react/no-children-prop
            children={children}
            location={state.location}
            navigationType={state.action}
            navigator={history}
        />
    );
}
