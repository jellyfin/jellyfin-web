import classNames from 'classnames';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC, type PropsWithChildren, type HTMLAttributes, useEffect, useRef, StrictMode } from 'react';
import { useNavigationType } from 'react-router-dom';

import autoFocuser from 'components/autoFocuser';
import viewManager from 'components/viewManager/viewManager';

type CustomPageProps = {
    id: string, // id is required for libraryMenu
    title?: string,
    isBackButtonEnabled?: boolean,
    isMenuButtonEnabled?: boolean,
    isNowPlayingBarEnabled?: boolean,
    isThemeMediaSupported?: boolean,
    shouldAutoFocus?: boolean,
    backDropType?: BaseItemKind[]
};

export type PageProps = CustomPageProps & HTMLAttributes<HTMLDivElement>;

/**
 * Page component that handles hiding active non-react views, triggering the required events for
 * navigation and appRouter state updates, and setting the correct classes and data attributes.
 */
const Page: FC<PropsWithChildren<PageProps>> = ({
    children,
    id,
    className = '',
    title,
    isBackButtonEnabled = true,
    isMenuButtonEnabled = false,
    isNowPlayingBarEnabled = true,
    isThemeMediaSupported = false,
    shouldAutoFocus = false,
    backDropType
}) => {
    const element = useRef<HTMLDivElement>(null);
    const navigationType = useNavigationType();

    useEffect(() => {
        // hide active non-react views
        viewManager.hideView();
    }, []);

    useEffect(() => {
        const event = {
            bubbles: true,
            cancelable: false,
            detail: {
                isRestored: navigationType === 'POP',
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
    }, [ element, isNowPlayingBarEnabled, isThemeMediaSupported, navigationType ]);

    useEffect(() => {
        if (shouldAutoFocus) {
            autoFocuser.autoFocus(element.current);
        }
    }, [ shouldAutoFocus ]);

    return (
        <StrictMode>
            <div
                ref={element}
                id={id}
                data-role='page'
                className={classNames(
                    'page',
                    { 'backdropPage': backDropType?.length },
                    className
                )}
                data-title={title}
                data-backbutton={isBackButtonEnabled}
                data-menubutton={isMenuButtonEnabled}
                data-backdroptype={backDropType?.join(',')}
            >
                {children}
            </div>
        </StrictMode>
    );
};

export default Page;
