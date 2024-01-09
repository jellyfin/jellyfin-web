import Box from '@mui/material/Box';
import React, { useEffect } from 'react';
import { DRAWER_WIDTH } from './ResponsiveDrawer';

const Backdrop = () => {
    useEffect(() => {
        // Initialize the UI components after first render
        import('../scripts/autoBackdrops');
    }, []);

    return (
        <>
            <Box
                className='backdropContainer'
                sx={{
                    left: {
                        md: DRAWER_WIDTH
                    }
                }}
            />
            <div className='backgroundContainer' />
        </>
    );
};

export default Backdrop;
