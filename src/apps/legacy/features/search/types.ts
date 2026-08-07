import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CardOptions } from 'types/cardOptions';

export interface Section {
    title: string
    items: BaseItemDto[];
    cardOptions?: CardOptions;
};
