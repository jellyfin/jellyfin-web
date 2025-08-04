import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { describe, expect, it } from 'vitest';

import type { ItemDto } from 'types/base/models/item-dto';

import { getItemTextLines } from './itemText';

describe('getItemTextLines', () => {
    it('Should return undefined if item is invalid', () => {
        let lines = getItemTextLines({});
        expect(lines).toBeUndefined();
        lines = getItemTextLines(null);
        expect(lines).toBeUndefined();
        lines = getItemTextLines(undefined);
        expect(lines).toBeUndefined();
    });

    it('Should return the name and index number', () => {
        const item: ItemDto = {
            Name: 'Item Name'
        };
        let lines = getItemTextLines(item);
        expect(lines).toBeDefined();
        expect(lines).toHaveLength(1);
        expect(lines?.[0]).toBe(item.Name);

        item.MediaType = MediaType.Video;
        item.IndexNumber = 5;
        lines = getItemTextLines(item);
        expect(lines).toBeDefined();
        expect(lines).toHaveLength(1);
        expect(lines?.[0]).toBe(`${item.IndexNumber} - ${item.Name}`);

        item.ParentIndexNumber = 2;
        lines = getItemTextLines(item);
        expect(lines).toBeDefined();
        expect(lines).toHaveLength(1);
        expect(lines?.[0]).toBe(
            `${item.ParentIndexNumber}.${item.IndexNumber} - ${item.Name}`
        );
    });

    it('Should add artist names', () => {
        let item: ItemDto = {
            Name: 'Item Name',
            ArtistItems: [{ Name: 'Artist 1' }, { Name: 'Artist 2' }]
        };
        let lines = getItemTextLines(item);
        expect(lines).toBeDefined();
        expect(lines).toHaveLength(2);
        expect(lines?.[0]).toBe(item.Name);
        expect(lines?.[1]).toBe('Artist 1, Artist 2');

        item = {
            Name: 'Item Name',
            Artists: ['Artist 1', 'Artist 2']
        };
        lines = getItemTextLines(item);
        expect(lines).toBeDefined();
        expect(lines).toHaveLength(2);
        expect(lines?.[0]).toBe(item.Name);
        expect(lines?.[1]).toBe('Artist 1, Artist 2');
    });

    it('Should add album or series name', () => {
        let item: ItemDto = {
            Name: 'Item Name',
            SeriesName: 'Series'
        };
        let lines = getItemTextLines(item);
        expect(lines).toBeDefined();
        expect(lines).toHaveLength(2);
        expect(lines?.[0]).toBe(item.SeriesName);
        expect(lines?.[1]).toBe(item.Name);

        item = {
            Name: 'Item Name',
            Album: 'Album'
        };
        lines = getItemTextLines(item);
        expect(lines).toBeDefined();
        expect(lines).toHaveLength(2);
        expect(lines?.[0]).toBe(item.Album);
        expect(lines?.[1]).toBe(item.Name);
    });

    it('Should add production year', () => {
        const item = {
            Name: 'Item Name',
            ProductionYear: 2025
        };
        const lines = getItemTextLines(item);
        expect(lines).toBeDefined();
        expect(lines).toHaveLength(2);
        expect(lines?.[0]).toBe(item.Name);
        expect(lines?.[1]).toBe(String(item.ProductionYear));
    });
});
