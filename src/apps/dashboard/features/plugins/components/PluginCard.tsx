import { Component2Icon } from '@radix-ui/react-icons';
import { useLocation } from '@tanstack/react-router';
import BaseCard from 'apps/dashboard/components/BaseCard';
import React, { useMemo } from 'react';

import { type PluginDetails } from '../types/PluginDetails';

interface PluginCardProps {
    plugin: PluginDetails;
}

const PluginCard = ({ plugin }: PluginCardProps) => {
    const location = useLocation();

    const pluginPage = useMemo(
        () =>
            ({
                pathname: `/dashboard/plugins/${plugin.id}`,
                search: `?name=${encodeURIComponent(plugin.name || '')}`,
                hash: location.hash
            }) as const,
        [location, plugin]
    );

    return (
        <BaseCard
            title={plugin.name}
            to={pluginPage as any}
            text={[plugin.version?.VersionNumber, plugin.status].filter((t) => t).join(' ')}
            image={plugin.imageUrl}
            icon={<Component2Icon style={{ width: 80, height: 80 }} />}
        />
    );
};

export default PluginCard;
