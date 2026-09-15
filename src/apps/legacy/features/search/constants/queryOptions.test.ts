import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { describe, expect, it } from 'vitest';

import { QUERY_OPTIONS } from './queryOptions';

describe('QUERY_OPTIONS', () => {
    it('should include OriginalTitle field', () => {
        expect(QUERY_OPTIONS.fields).toContain(ItemFields.OriginalTitle);
    });
});
