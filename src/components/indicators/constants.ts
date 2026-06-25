import { ItemKind } from 'types/base/models/item-kind';

// Items in a Show collection (Series/Seasons/Episodes) use the term "Unaired" for an item with
// a future premiere date; every other type falls back to the medium-neutral "Unreleased".
export const UNAIRED_TYPES: ItemKind[] = [
    ItemKind.Episode,
    ItemKind.Season,
    ItemKind.Series
];
