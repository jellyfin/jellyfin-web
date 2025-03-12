import React, { useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import loading from 'components/loading/loading';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import LinkButton from 'elements/emby-button/LinkButton';

const FallbackRoute = () => {
    const location = useLocation();

    useEffect(() => {
        loading.hide();
    }, []);

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
            className='mainAnimatedPage libraryPage'
        >
            <h1>{globalize.translate('HeaderPageNotFound')}</h1>
            <p>{globalize.translate('PageNotFound')}</p>
            <LinkButton
                className='button-link'
                href='#/home.html'
            >
                {globalize.translate('GoHome')}
            </LinkButton>
        </Page>
    );
};

export default FallbackRoute;
