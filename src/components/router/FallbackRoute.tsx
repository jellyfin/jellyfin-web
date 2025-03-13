import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import Page from 'components/Page';
import globalize from 'lib/globalize';
import LinkButton from 'elements/emby-button/LinkButton';

const FallbackRoute = () => {
    const location = useLocation();

    // Check if the requested path should be redirected
    const to = useMemo(() => {
        const _to = {
            search: location.search,
            hash: location.hash
        };

        // If a path ends in ".html", redirect to the path with it removed
        if (location.pathname.endsWith('.html')) {
            return { ..._to, pathname: location.pathname.slice(0, -5) };
        }
    }, [ location ]);

    if (to) {
        console.warn('[FallbackRoute] You are using a deprecated URL format. This will stop working in a future Jellyfin update.');

        return (
            <Navigate
                replace
                to={to}
            />
        );
    }

    return (
        <Page
            id='fallbackPage'
            title={globalize.translate('HeaderPageNotFound')}
            className='mainAnimatedPage libraryPage'
        >
            <div className='padded-left padded-right'>
                <h1>{globalize.translate('HeaderPageNotFound')}</h1>
                <p>{globalize.translate('PageNotFound')}</p>
                <LinkButton
                    className='button-link'
                    href='#/home.html'
                >
                    {globalize.translate('GoHome')}
                </LinkButton>
            </div>
        </Page>
    );
};

export default FallbackRoute;
