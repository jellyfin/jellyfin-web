import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

export const ItemKind = {
    ...BaseItemKind,
    Timer: 'Timer',
    SeriesTimer: 'SeriesTimer'
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ItemKind = typeof ItemKind[keyof typeof ItemKind] | undefined;
