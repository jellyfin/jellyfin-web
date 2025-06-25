import { type FC, type PropsWithChildren, useEffect } from 'react';
import viewContainer from './viewContainer';

/**
 * A simple component that includes the correct structure for ViewManager pages
 * to exist alongside standard React pages.
 */
const AppBody: FC<PropsWithChildren<unknown>> = ({ children }) => {
    useEffect(() => () => {
        // Reset view container state on unload
        viewContainer.reset();
    }, []);

    return (
        <>
            <div className='mainAnimatedPages skinBody' />
            <div className='skinBody'>
                {children}
            </div>
        </>
    );
};

export default AppBody;
