import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client/models/device-info-dto';
import type { CellContext } from '@tanstack/react-table';
import React from 'react';
import { getDeviceIcon } from 'utils/image';

const DeviceNameCell = ({ row }: CellContext<DeviceInfoDto, unknown>) => (
    <>
        <img
            alt={row.original.AppName || undefined}
            src={getDeviceIcon(row.original)}
            style={{
                display: 'inline-block',
                maxWidth: '1.5em',
                maxHeight: '1.5em',
                marginRight: '1rem'
            }}
        />
        {row.original.CustomName || row.original.Name}
    </>
);

export default DeviceNameCell;
