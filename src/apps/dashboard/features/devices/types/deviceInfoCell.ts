import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client/models/device-info-dto';
import type { Row } from '@tanstack/react-table';

export interface DeviceInfoCell {
    renderedCellValue: React.ReactNode;
    row: Row<DeviceInfoDto>;
}
