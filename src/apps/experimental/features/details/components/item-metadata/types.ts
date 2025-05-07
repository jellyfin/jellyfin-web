import { LinkItem } from '../../types';

export interface MetadataItem {
    labelKey: string;
    text?: string;
    linkItems?: LinkItem[];
}
