import { DeviceInfoCell } from 'apps/dashboard/features/devices/types/deviceInfoCell';
import { getDeviceIcon } from 'utils/image';

export default function DeviceNameCell({ row, renderedCellValue }: DeviceInfoCell) {
    return <>
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
        {renderedCellValue}
    </>
};
