import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../scripts/settings/appSettings', () => ({ default: {} }));
vi.mock('../../scripts/settings/userSettings', () => ({ currentSettings: {}, default: {} }));
vi.mock('../../components/playback/playbackmanager', () => ({ playbackManager: {} }));
vi.mock('../../lib/globalize', () => ({ default: {} }));
vi.mock('./castSenderApi', () => ({
    default: class {
        load() {
            return Promise.resolve();
        }
    }
}));
vi.mock('../../components/alert', () => ({ default: vi.fn() }));
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: { currentApiClient: vi.fn(), currentUserId: 'user1' } }));
vi.mock('../../utils/events.ts', () => ({ default: { on: vi.fn(), off: vi.fn(), trigger: vi.fn() } }));
vi.mock('../../utils/jellyfin-apiclient/getItems.ts', () => ({ getItems: vi.fn() }));

import ChromecastPlayer from './plugin';
import { ServerConnections } from 'lib/jellyfin-apiclient';

describe('chromecastPlayer plugin', () => {
    let originalChrome;

    beforeEach(() => {
        originalChrome = window.chrome;
    });

    afterEach(() => {
        window.chrome = originalChrome;
        vi.restoreAllMocks();
    });

    it('should initialize chromecast when CastReceiverId is non-empty', async () => {
        const mockInitialize = vi.fn();
        const mockSessionRequest = vi.fn();
        const mockApiConfig = vi.fn();

        window.chrome = {
            cast: {
                isAvailable: true,
                SessionRequest: mockSessionRequest,
                ApiConfig: mockApiConfig,
                initialize: mockInitialize
            }
        };

        const mockGetUser = vi.fn().mockResolvedValue({
            Configuration: {
                CastReceiverId: 'CUSTOM_ID_123'
            }
        });

        const mockApiClient = {
            getCurrentUserId: () => 'user1',
            getUser: mockGetUser
        };

        vi.mocked(ServerConnections.currentApiClient).mockReturnValue(mockApiClient);

        new ChromecastPlayer();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockGetUser).toHaveBeenCalledWith('user1');
        expect(mockSessionRequest).toHaveBeenCalledWith('CUSTOM_ID_123');
        expect(mockInitialize).toHaveBeenCalled();
    });

    it('should not initialize chromecast when CastReceiverId is missing or empty', async () => {
        const mockInitialize = vi.fn();
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
            // noop
        });

        window.chrome = {
            cast: {
                isAvailable: true,
                SessionRequest: vi.fn(),
                ApiConfig: vi.fn(),
                initialize: mockInitialize
            }
        };

        const mockGetUser = vi.fn().mockResolvedValue({
            Configuration: {
                CastReceiverId: '   '
            }
        });

        const mockApiClient = {
            getCurrentUserId: () => 'user1',
            getUser: mockGetUser
        };

        vi.mocked(ServerConnections.currentApiClient).mockReturnValue(mockApiClient);

        new ChromecastPlayer();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockGetUser).toHaveBeenCalledWith('user1');
        expect(mockInitialize).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith('Not initializing chromecast: CastReceiverId is missing or empty');
    });
});
