import React from 'react';

import DeviceCard from 'apps/dashboard/features/devices/components/DeviceCard';
import useLiveSessions from 'apps/dashboard/features/sessions/hooks/useLiveSessions';
import globalize from 'lib/globalize';
import { vars } from 'styles/tokens.css';
import { Flex } from 'ui-primitives/Box';

import Widget from './Widget';

function DevicesWidget(): React.ReactElement {
    const { data: devices } = useLiveSessions();

    return (
        <Widget title={globalize.translate('HeaderDevices')} href='/dashboard/devices'>
            <Flex style={{ flexDirection: 'row', flexWrap: 'wrap', gap: vars.spacing['5'] }}>
                {devices?.map(device => (
                    <DeviceCard key={device.Id} device={device} />
                ))}
            </Flex>
        </Widget>
    );
}

export default DevicesWidget;
