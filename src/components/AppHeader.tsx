import React, { FC, useEffect } from 'react';

interface AppHeaderParams {
    isHidden?: boolean
}

const AppHeader: FC<AppHeaderParams> = ({
    isHidden = false
}) => {
    useEffect(() => {
        // Initialize the UI components after first render
        import('../scripts/libraryMenu');
    }, []);

    return (
        /**
         * NOTE: These components are not used with the new layouts, but legacy views interact with the elements
         * directly so they need to be present in the DOM. We use display: none to hide them and prevent errors.
         */
        <div style={isHidden ? { display: 'none' } : undefined}>
            <div className='mainDrawer hide'>
                <div className='mainDrawer-scrollContainer scrollContainer focuscontainer-y' />
            </div>
            <div className='skinHeader focuscontainer-x' />
            <div className='mainDrawerHandle' />
        </div>
    );
};

export default AppHeader;
