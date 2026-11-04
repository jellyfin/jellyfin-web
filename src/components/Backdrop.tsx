import React, { useEffect } from 'react';

const Backdrop = () => {
    useEffect(() => {
        // Initialize the UI components after first render
        void import('../scripts/autoBackdrops');
    }, []);

    return (
        <>
            <div className='backdropContainer'>
                <div id='backdropImage0' className='backdropImage' />
                <div id='backdropImage1' className='backdropImage' />
            </div>
            <div className='backgroundContainer' />
        </>
    );
};

export default Backdrop;
