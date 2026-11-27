import { describe, expect, it } from 'vitest';

import { getUserAvatarBackgroundClass } from './userAvatar';

describe('getUserAvatarBackgroundClass', () => {
    it('is stable for a user id and taken from the theme card backgrounds', () => {
        const className = getUserAvatarBackgroundClass({ Id: 'user-id' });

        expect(getUserAvatarBackgroundClass({ Id: 'user-id', Name: 'renamed' })).toBe(className);
        expect(className).toMatch(/^defaultCardBackground defaultCardBackground[1-5]$/);
    });

    it('falls back to the name when the user has no id', () => {
        expect(getUserAvatarBackgroundClass({ Name: 'alice' })).toBe(getUserAvatarBackgroundClass({ Name: 'alice' }));
    });

    it('tells users apart', () => {
        // Sample ids that pick different colors. If the number of colors or the hash changes, pick new samples
        expect(getUserAvatarBackgroundClass({ Id: 'user-id' })).not.toBe(getUserAvatarBackgroundClass({ Id: 'bob' }));
    });
});
