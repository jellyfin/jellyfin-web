import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react';

export type LinkItem = DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
>;

export interface LinkItemList {
    label: string;
    text?: string;
    links?: LinkItem[];
}
