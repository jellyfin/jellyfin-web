import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';
import DeviceCard from 'apps/dashboard/features/devices/components/DeviceCard';
import Stack from '@mui/material/Stack';

type IProps = {
    devices?: SessionInfo[];
};

const DevicesWidget = ({ devices }: IProps) => {
    return (
        <Widget
            title={globalize.translate('HeaderDevices')}
            href='/dashboard/devices'
        >
            <Stack direction='row' flexWrap='wrap' gap={2}>
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
