import { RecordingStatus } from '@jellyfin/sdk/lib/generated-client/models/recording-status';
import { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';

export const ItemStatus = {
    ...RecordingStatus,
    ...SeriesStatus
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ItemStatus =
    | (typeof ItemStatus)[keyof typeof ItemStatus]
    | undefined;
