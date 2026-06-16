import { ItemKind } from 'types/base/models/item-kind';

// Show types use the "Unaired" term of art for an item with a future premiere
// date; every other type falls back to the medium-neutral "Unreleased".
export const UNAIRED_TYPES: ItemKind[] = [
    ItemKind.Episode,
    ItemKind.Season,
    ItemKind.Series
];
