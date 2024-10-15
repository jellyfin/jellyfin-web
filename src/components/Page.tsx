import React, { type FC, type PropsWithChildren, type HTMLAttributes, useEffect, useRef } from 'react';

import viewManager from './viewManager/viewManager';

type PageProps = {
    id: string, // id is required for libraryMenu
    title?: string,
    isBackButtonEnabled?: boolean,
    isMenuButtonEnabled?: boolean,
    isNowPlayingBarEnabled?: boolean,
    isThemeMediaSupported?: boolean,
    backDropType?: string,
};

/**
 * Page component that handles hiding active non-react views, triggering the required events for
 * navigation and appRouter state updates, and setting the correct classes and data attributes.
 */
const Page: FC<PropsWithChildren<PageProps & HTMLAttributes<HTMLDivElement>>> = ({
    children,
    id,
    className = '',
    title,
    isBackButtonEnabled = true,
    isMenuButtonEnabled = false,
    isNowPlayingBarEnabled = true,
    isThemeMediaSupported = false,
    backDropType
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
                isRestored: false,
                options: {
                    enableMediaControl: isNowPlayingBarEnabled,
                    supportsThemeMedia: isThemeMediaSupported
                }
            }
        };
        // viewbeforeshow - switches between the admin dashboard and standard themes
        element.current?.dispatchEvent(new CustomEvent('viewbeforeshow', event));
        // pagebeforeshow - hides tabs on tables pages in libraryMenu
        element.current?.dispatchEvent(new CustomEvent('pagebeforeshow', event));
        // viewshow - updates state of appRouter
        element.current?.dispatchEvent(new CustomEvent('viewshow', event));
        // pageshow - updates header/navigation in libraryMenu
        element.current?.dispatchEvent(new CustomEvent('pageshow', event));
    }, [ element, isNowPlayingBarEnabled, isThemeMediaSupported ]);

    return (
        <div
            ref={element}
            id={id}
            data-role='page'
            className={`page ${className}`}
            data-title={title}
            data-backbutton={isBackButtonEnabled}
            data-menubutton={isMenuButtonEnabled}
            data-backdroptype={backDropType}
        >
            {children}
        </div>
    );
};

export default Page;
