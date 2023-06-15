import React, { useEffect } from 'react';

const AppHeader = () => {
    useEffect(() => {
        // Initialize the UI components after first render
        import('../scripts/libraryMenu');
    }, []);

    return (
        <>
            <div className='mainDrawer hide'>
                <div className='mainDrawer-scrollContainer scrollContainer focuscontainer-y' />
            </div>
            <div className='skinHeader focuscontainer-x' />
            <div className='mainDrawerHandle' />
        </>
    );
};

export default AppHeader;
