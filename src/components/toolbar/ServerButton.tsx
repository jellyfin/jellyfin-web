import icon from '@jellyfin/ux-web/icon-transparent.png';
import { Link } from '@tanstack/react-router';
import { useSystemInfo } from 'hooks/useSystemInfo';
import React, { FC } from 'react';
import { Button } from 'ui-primitives';

const ServerButton: FC = () => {
    const { data: systemInfo, isPending } = useSystemInfo();

    return (
        <Button
            variant="plain"
            size="lg"
            color="neutral"
            startIcon={
                <img
                    src={icon}
                    alt=""
                    aria-hidden
                    style={{
                        maxHeight: '1.25em',
                        maxWidth: '1.25em'
                    }}
                />
            }
            component={Link}
            to="/"
        >
            {isPending ? '' : systemInfo?.ServerName || 'Jellyfin'}
        </Button>
    );
};

export default ServerButton;
