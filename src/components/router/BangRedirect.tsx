import React, { useEffect } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

const BangRedirect = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const to = location.pathname.startsWith('/!/')
        ? `${location.pathname.substring(2)}${location.search}${location.hash}`
        : location.pathname.startsWith('/!')
          ? `${location.pathname.replace(/^\/!/, '/')}${location.search}${location.hash}`
          : location.pathname.startsWith('!')
            ? `${location.pathname.substring(1)}${location.search}${location.hash}`
            : undefined;

    useEffect(() => {
        if (!to) {
            return;
        }

        console.warn(
            '[BangRedirect] You are using a deprecated URL format. This will stop working in a future Jellyfin update.'
        );
        navigate({ to, replace: true });
    }, [navigate, to]);

    return null;
};

export default BangRedirect;
