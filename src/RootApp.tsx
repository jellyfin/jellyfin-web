import loadable from '@loadable/component';
import { History } from '@remix-run/router';
import React from 'react';

import StableApp from './apps/stable/App';
import AppHeader from './components/AppHeader';
import Backdrop from './components/Backdrop';
import { HistoryRouter } from './components/HistoryRouter';
import { ApiProvider } from './hooks/useApi';

const ExperimentalApp = loadable(() => import('./apps/experimental/App'));

const RootApp = ({ history }: { history: History }) => {
    const layoutMode = localStorage.getItem('layout');

    return (
        <ApiProvider>
            <HistoryRouter history={history}>
                <Backdrop />
                <AppHeader />

                <div className='mainAnimatedPages skinBody' />
                <div className='skinBody'>
                    {
                        layoutMode === 'experimental' ?
                            <ExperimentalApp /> :
                            <StableApp />
                    }
                </div>
            </HistoryRouter>
        </ApiProvider>
    );
};

export default RootApp;
