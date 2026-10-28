import { describe, expect, it } from 'vitest';

import { toItemsRequest } from './legacyItemsQuery';

describe('toItemsRequest', () => {
    it('returns an empty request for no query', () => {
        expect(toItemsRequest()).toEqual({});
        expect(toItemsRequest(null)).toEqual({});
        expect(toItemsRequest({})).toEqual({});
    });

    it('maps legacy PascalCase keys to SDK parameter names', () => {
        expect(toItemsRequest({ ParentId: 'p', Recursive: true, Limit: 5, StartIndex: 10 }))
            .toEqual({ parentId: 'p', recursive: true, limit: 5, startIndex: 10 });
    });

    it('matches keys case-insensitively', () => {
        expect(toItemsRequest({ parentid: 'a', PARENTID: 'b' })).toEqual({ parentId: 'b' });
        expect(toItemsRequest({ enabletotalrecordcount: false })).toEqual({ enableTotalRecordCount: false });
    });

    it('maps keys whose SDK name is not a plain lower-cased first letter', () => {
        expect(toItemsRequest({ IsHD: true, Is4K: true, Is3D: false, IsHd: true }))
            .toEqual({ isHd: true, is4K: true, is3D: false });
        expect(toItemsRequest({ NameStartsWithOrGreater: 'a', EnableUserData: true }))
            .toEqual({ nameStartsWithOrGreater: 'a', enableUserData: true });
    });

    it('splits comma-separated list parameters into arrays', () => {
        expect(toItemsRequest({
            Ids: 'a,b,c',
            SortBy: 'Album,ParentIndexNumber,IndexNumber,SortName',
            MediaTypes: 'Photo,Video',
            Filters: 'IsNotFolder',
            ExcludeLocationTypes: 'Virtual'
        })).toEqual({
            ids: [ 'a', 'b', 'c' ],
            sortBy: [ 'Album', 'ParentIndexNumber', 'IndexNumber', 'SortName' ],
            mediaTypes: [ 'Photo', 'Video' ],
            filters: [ 'IsNotFolder' ],
            excludeLocationTypes: [ 'Virtual' ]
        });
    });

    it('splits list parameters regardless of key casing', () => {
        expect(toItemsRequest({ mediatypes: 'Audio,Video' })).toEqual({ mediaTypes: [ 'Audio', 'Video' ] });
    });

    it('wraps a single sort order in an array', () => {
        expect(toItemsRequest({ SortOrder: 'Descending' })).toEqual({ sortOrder: [ 'Descending' ] });
    });

    it('leaves values that are already arrays untouched', () => {
        expect(toItemsRequest({ Fields: [ 'Chapters', 'Trickplay' ] })).toEqual({ fields: [ 'Chapters', 'Trickplay' ] });
    });

    it('does not split non-list strings', () => {
        expect(toItemsRequest({ SearchTerm: 'a,b', NameStartsWith: 'x,y' })).toEqual({ searchTerm: 'a,b', nameStartsWith: 'x,y' });
    });

    it('drops keys that are not SDK getItems parameters', () => {
        expect(toItemsRequest({ Limit: 1, NotAParam: 'x', StartItemId: 'y' })).toEqual({ limit: 1 });
    });

    it('drops null, undefined and empty-string values', () => {
        expect(toItemsRequest({ SortBy: null, SortOrder: undefined, Ids: '', Limit: 0, Recursive: false }))
            .toEqual({ limit: 0, recursive: false });
    });

    it('does not mutate the input', () => {
        const query = { Ids: 'a,b', Limit: 1 };
        toItemsRequest(query);
        expect(query).toEqual({ Ids: 'a,b', Limit: 1 });
    });
});
