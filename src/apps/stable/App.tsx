import React from 'react';

import AppHeader from '../../components/AppHeader';
import Backdrop from '../../components/Backdrop';
import { AppRoutes } from './routes/AppRoutes';

const StableApp = () => (
    <>
        <Backdrop />
        <AppHeader />

        <div className='mainAnimatedPages skinBody' />
        <div className='skinBody'>
            <AppRoutes />
        </div>
    </>
);

export default StableApp;
