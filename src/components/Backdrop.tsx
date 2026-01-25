import React, { useEffect } from 'react';

const Backdrop = () => {
    useEffect(() => {
        // Initialize the UI components after first render
        void import('../scripts/autoBackdrops');
    }, []);

    return (
        <>
            <div className='backdropContainer' style={{ pointerEvents: 'none' }} />
            <div className='backgroundContainer' style={{ pointerEvents: 'none' }} />
        </>
    );
};

export default Backdrop;
