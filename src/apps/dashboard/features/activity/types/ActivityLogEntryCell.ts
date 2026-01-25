import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import type { Cell, Row } from '@tanstack/react-table';

export interface ActivityLogEntryCell {
    cell: Cell<ActivityLogEntry, unknown>;
    row: Row<ActivityLogEntry>;
}
