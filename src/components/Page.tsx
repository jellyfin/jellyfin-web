import React, { FunctionComponent, HTMLAttributes, useEffect, useRef } from 'react';

import viewManager from './viewManager/viewManager';

type PageProps = {
    title?: string,
    isBackButtonEnabled?: boolean
};

/**
 * Page component that handles hiding active non-react views, triggering the required events for
 * navigation and appRouter state updates, and setting the correct classes and data attributes.
 */
const Page: FunctionComponent<PageProps & HTMLAttributes<HTMLDivElement>> = ({
    children,
    className = '',
    title,
    isBackButtonEnabled = true
}) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // hide active non-react views
        viewManager.hideView();
    }, []);

    useEffect(() => {
        const event = {
            bubbles: true,
            cancelable: false,
            detail: {
                isRestored: false
            }
        };
        // pagebeforeshow - hides tabs on tabless pages in libraryMenu
        element.current?.dispatchEvent(new CustomEvent('pagebeforeshow', event));
        // viewshow - updates state of appRouter
        element.current?.dispatchEvent(new CustomEvent('viewshow', event));
        // pageshow - updates header/navigation in libraryMenu
        element.current?.dispatchEvent(new CustomEvent('pageshow', event));
    }, [ element ]);

    return (
        <div
            ref={element}
            data-role='page'
            className={`page ${className}`}
            data-title={title}
            data-backbutton={`${isBackButtonEnabled}`}
        >
            {children}
        </div>
    );
};

export default Page;
