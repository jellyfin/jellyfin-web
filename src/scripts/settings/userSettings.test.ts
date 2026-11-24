import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('hooks/api/useDisplayPreferences', () => ({ getDisplayPreferencesQuery: vi.fn() }));
vi.mock('hooks/api/useUser', () => ({ getUserQuery: vi.fn() }));
// Use Object.fromEntries to work around the UPPER_CASE naming convention lint rule
vi.mock('hooks/useUsers', () => Object.fromEntries([ [ 'QUERY_KEY', 'Users' ] ]));
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));
vi.mock('utils/query/queryClient', () => ({ queryClient: {} }));

import { UserSettings } from './userSettings';

describe('settings/userSettings', () => {
    describe('Method: backdropParentalRatingLimit', () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it('should default to true', () => {
            expect(new UserSettings().backdropParentalRatingLimit()).toBe(true);
        });

        it('should be settable to false', () => {
            const instance = new UserSettings();

            instance.backdropParentalRatingLimit(false);

            expect(instance.backdropParentalRatingLimit()).toBe(false);
        });

        it('should persist between instances', () => {
            new UserSettings().backdropParentalRatingLimit(false);

            expect(new UserSettings().backdropParentalRatingLimit()).toBe(false);
        });
    });
});
