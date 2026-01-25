import React, { useEffect } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

import Page from 'components/Page';
import globalize from 'lib/globalize';
import { Button } from 'ui-primitives/Button';

const FallbackRoute = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Check if the requested path should be redirected
    const to = RegExp(/^\/wizard[a-z]+\.html/i).test(location.pathname)
        ? `/wizard/${location.pathname.slice(7, -5)}${location.search}${location.hash}`
        : location.pathname.endsWith('.html')
          ? `${location.pathname.slice(0, -5)}${location.search}${location.hash}`
          : undefined;

    useEffect(() => {
        if (!to) {
            return;
        }

        console.warn(
            '[FallbackRoute] You are using a deprecated URL format. This will stop working in a future Jellyfin update.'
        );
        navigate({ to, replace: true });
    }, [navigate, to]);

    if (to) {
        return null;
    }

    return (
        <Page
            id="fallbackPage"
            title={globalize.translate('HeaderPageNotFound')}
            className="mainAnimatedPage libraryPage"
        >
            <div className="padded-left padded-right">
                <h1>{globalize.translate('HeaderPageNotFound')}</h1>
                <p>{globalize.translate('PageNotFound')}</p>
                <Button component="a" className="button-link" href="#/home" variant="ghost">
                    {globalize.translate('GoHome')}
                </Button>
            </div>
        </Page>
    );
};

export default FallbackRoute;
