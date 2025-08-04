import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import type { MRT_Cell, MRT_Row } from 'material-react-table';

export interface ActivityLogEntryCell {
    cell: MRT_Cell<ActivityLogEntry>;
    row: MRT_Row<ActivityLogEntry>;
}
