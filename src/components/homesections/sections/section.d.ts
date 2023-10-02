import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

export interface SectionOptions {
    enableOverflow: boolean
}

export type SectionContainerElement = {
    fetchData: () => void
    getItemsHtml: (items: BaseItemDto[]) => void
    parentContainer: HTMLElement
} & Element;
