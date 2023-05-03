import React from 'react';

import AppHeader from '../../components/AppHeader';
import Backdrop from '../../components/Backdrop';
import { ExperimentalAppRoutes } from './routes/AppRoutes';

const ExperimentalApp = () => (
    <>
        <Backdrop />
        <AppHeader />

        <div className='mainAnimatedPages skinBody' />
        <div className='skinBody'>
            <ExperimentalAppRoutes />
        </div>
    </>
);

export default ExperimentalApp;
