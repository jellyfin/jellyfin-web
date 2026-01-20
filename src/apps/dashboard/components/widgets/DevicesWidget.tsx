import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import DeviceCard from 'apps/dashboard/features/devices/components/DeviceCard';
import Stack from '@mui/joy/Stack';
import useLiveSessions from 'apps/dashboard/features/sessions/hooks/useLiveSessions';

const DevicesWidget = () => {
    const { data: devices } = useLiveSessions();

    return (
        <Widget
            title={globalize.translate('HeaderDevices')}
            href='/dashboard/devices'
        >
            <Stack direction='row' flexWrap='wrap' spacing={2}>
                {devices?.map(device => (
                    <DeviceCard
                        key={device.Id}
                        device={device}
                    />
                ))}
            </Stack>
        </Widget>
    );
};

export default DevicesWidget;