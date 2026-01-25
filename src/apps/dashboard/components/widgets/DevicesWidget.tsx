import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import DeviceCard from 'apps/dashboard/features/devices/components/DeviceCard';
import useLiveSessions from 'apps/dashboard/features/sessions/hooks/useLiveSessions';
import { Flex } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';

const DevicesWidget = (): React.ReactElement => {
    const { data: devices } = useLiveSessions();

    return (
        <Widget title={globalize.translate('HeaderDevices')} href="/dashboard/devices">
            <Flex style={{ flexDirection: 'row', flexWrap: 'wrap', gap: vars.spacing.md }}>
                {devices?.map(device => (
                    <DeviceCard key={device.Id} device={device} />
                ))}
            </Flex>
        </Widget>
    );
};

export default DevicesWidget;
