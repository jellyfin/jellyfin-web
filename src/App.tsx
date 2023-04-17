import { History } from '@remix-run/router';
import React, { useEffect } from 'react';

import { HistoryRouter } from './components/HistoryRouter';
import { ApiProvider } from './hooks/useApi';
import { AppRoutes, ExperimentalAppRoutes } from './routes';

const App = ({ history }: { history: History }) => {
    const layoutMode = localStorage.getItem('layout');

    useEffect(() => {
        Promise.all([
            // Initialize the UI components after first render
            import('./scripts/libraryMenu'),
            import('./scripts/autoBackdrops')
        ]);
    }, []);

    return (
        <ApiProvider>
            <HistoryRouter history={history}>
                <div className='backdropContainer' />
                <div className='backgroundContainer' />

                <div className='mainDrawer hide'>
                    <div className='mainDrawer-scrollContainer scrollContainer focuscontainer-y' />
                </div>
                <div className='skinHeader focuscontainer-x' />

                <div className='mainAnimatedPages skinBody' />
                <div className='skinBody'>
                    {layoutMode === 'experimental' ? <ExperimentalAppRoutes /> : <AppRoutes /> }
                </div>

                <div className='mainDrawerHandle' />
            </HistoryRouter>
        </ApiProvider>
    );
};

export default App;
