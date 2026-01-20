import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-api',
    version: '1.0.0'
});

function createTool(name: string, description: string, schema: object, handler: Function) {
    // @ts-expect-error - SDK types are too strict for runtime use
    server.tool(name, description, schema, handler);
}

createTool(
    'get_api_relationships',
    'Understand how the API layer relates to other MCP servers',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    relatedMcpServers: [
                        {
                            server: 'store-architecture',
                            relationship: 'API responses update Zustand stores',
                            direction: 'API → Store',
                            integration: 'TanStack Query mutations write to stores'
                        },
                        {
                            server: 'playback-manager',
                            relationship: 'API provides stream URLs and progress reporting',
                            direction: 'API ↔ Playback',
                            integration: 'getAudioStream(), reportPlaybackProgress()'
                        },
                        {
                            server: 'components',
                            relationship: 'Forms submit data via API',
                            direction: 'Component → API',
                            integration: 'SettingsForm submits to apiClient.updateUserConfiguration()'
                        },
                        {
                            server: 'audio-engine',
                            relationship: 'API provides audio stream URLs for playback',
                            direction: 'API → Audio',
                            integration: 'getAudioStream() returns URL for MediaElement'
                        },
                        {
                            server: 'architecture',
                            relationship: 'API is the foundation layer',
                            direction: 'API feeds all other layers',
                            integration: 'All data originates from API calls'
                        }
                    ],
                    dataFlowToStores: [
                        {
                            store: 'mediaStore',
                            apiMethod: 'getAudioStream()',
                            trigger: 'User initiates playback',
                            file: 'src/apiclient.d.ts'
                        },
                        {
                            store: 'queueStore',
                            apiMethod: 'getItems()',
                            trigger: 'Loading library/playlist',
                            file: 'src/utils/jellyfin-apiclient/getItems.ts'
                        },
                        {
                            store: 'settingsStore',
                            apiMethod: 'getUserConfiguration()',
                            trigger: 'App initialization',
                            file: 'src/apiclient.d.ts'
                        },
                        {
                            store: 'playerStore',
                            apiMethod: 'getAvailablePlayers()',
                            trigger: 'Player selection',
                            file: 'src/components/playback/playerSelectionMenu.ts'
                        }
                    ],
                    websocketIntegration: [
                        {
                            event: 'playbackprogress',
                            updates: 'mediaStore.progress',
                            layer: 'store-architecture'
                        },
                        {
                            event: 'sessionupdate',
                            updates: 'playerStore.activePlayers',
                            layer: 'store-architecture'
                        },
                        {
                            event: 'libraryadded',
                            updates: 'queueStore (refetch)',
                            layer: 'store-architecture + components'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_jellyfin_api_overview',
    'Get overview of Jellyfin API client architecture',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    coreComponents: [
                        {
                            name: 'ApiClient',
                            purpose: 'Main API client for Jellyfin server communication',
                            file: 'src/apiclient.d.ts',
                            responsibilities: [
                                'All HTTP requests to Jellyfin server',
                                'Authentication and token management',
                                'WebSocket for real-time updates',
                                'Image URL generation'
                            ]
                        },
                        {
                            name: 'ServerConnections',
                            purpose: 'Singleton manager for multiple server connections',
                            file: 'src/lib/jellyfin-apiclient/ServerConnections.ts',
                            responsibilities: [
                                'Manage multiple ApiClient instances',
                                'Track current/signed-in state',
                                'Event emission for connection changes'
                            ]
                        },
                        {
                            name: 'toApi()',
                            purpose: 'Convert legacy ApiClient to typed SDK API',
                            file: 'src/utils/jellyfin-apiclient/compat.ts',
                            usage: 'bridge between old and new API patterns'
                        }
                    ],
                    authentication: [
                        'Access token management via ApiClient.accessToken()',
                        'ServerConnections tracks signed-in users',
                        'Events: localusersignedin, localusersignedout, apiclientcreated'
                    ],
                    commonPatterns: [
                        'ServerConnections.getApiClient(serverId) - Get client for specific server',
                        'ServerConnections.currentApiClient() - Get currently active client',
                        'apiClient.getCurrentUser() - Get logged-in user'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_api_endpoints',
    'Get common Jellyfin API endpoints and their usage',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    audioEndpoints: [
                        {
                            method: 'getAudioStream',
                            endpoint: '/Audio/{itemId}/stream',
                            params: ['deviceId', 'playSessionId', 'transcodingContainer', 'transcodingProtocol'],
                            usage: 'Fetch audio stream for playback'
                        },
                        {
                            method: 'getItems',
                            endpoint: '/Items',
                            params: ['userId', 'Ids', 'Limit', 'StartIndex', 'ParentId'],
                            usage: 'Query items from library'
                        },
                        {
                            method: 'getInstantMixFromItem',
                            endpoint: '/Items/{itemId}/InstantMix',
                            params: ['userId', 'limit'],
                            usage: 'Create auto-playlist from item'
                        }
                    ],
                    imageEndpoints: [
                        {
                            method: 'getScaledImageUrl',
                            endpoint: '/Items/{itemId}/Images/{type}',
                            params: ['maxWidth', 'maxHeight', 'quality', 'tag'],
                            usage: 'Generate sized image URLs'
                        },
                        {
                            method: 'getImageUrl',
                            endpoint: '/Items/{itemId}/Images/{type}/{index}',
                            params: [],
                            usage: 'Get image at specific index'
                        }
                    ],
                    playbackEndpoints: [
                        {
                            method: 'reportPlaybackProgress',
                            endpoint: '/Sessions/Playing/Progress',
                            params: ['ItemId', 'PositionTicks', 'IsPaused'],
                            usage: 'Report playback progress to server'
                        },
                        {
                            method: 'reportPlaybackStart',
                            endpoint: '/Sessions/Playing',
                            params: ['ItemId', 'PositionTicks'],
                            usage: 'Notify playback started'
                        },
                        {
                            method: 'reportPlaybackStopped',
                            endpoint: '/Sessions/Playing/Stopped',
                            params: ['ItemId', 'PositionTicks'],
                            usage: 'Notify playback stopped'
                        }
                    ],
                    userEndpoints: [
                        {
                            method: 'getCurrentUser',
                            endpoint: '/Users/Me',
                            usage: 'Get currently authenticated user'
                        },
                        {
                            method: 'getUserViews',
                            endpoint: '/Users/{userId}/Views',
                            usage: 'Get library views for user'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_jellyfin_sdk_api',
    'Get overview of @jellyfin/sdk generated API modules',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    overview: 'The @jellyfin/sdk provides typed API modules that wrap the Jellyfin REST API with Axios',
                    usage: 'import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api"',
                    sdkApiModules: [
                        { module: 'library-api', methods: ['getLibraries', 'getLibraryOptions'] },
                        { module: 'items-api', methods: ['getItems', 'getItem', 'getAncestorItems', 'getLatestItems'] },
                        { module: 'artists-api', methods: ['getArtists', 'getArtist'] },
                        { module: 'genres-api', methods: ['getGenres', 'getGenre'] },
                        { module: 'movies-api', methods: ['getMovie', 'getMovieRecommendations'] },
                        { module: 'tv-shows-api', methods: ['getTvShows', 'getNextUp', 'getEpisodes', 'getSeasons'] },
                        { module: 'studios-api', methods: ['getStudios', 'getStudio'] },
                        { module: 'user-library-api', methods: ['getUserViews', 'getItem', 'getResumeItems', 'getRecentItems'] },
                        { module: 'playlists-api', methods: ['getPlaylists', 'getPlaylistItems', 'addItemToPlaylist', 'moveItem'] },
                        { module: 'filter-api', methods: ['getFilters', 'getFilterOptions'] },
                        { module: 'live-tv-api', methods: ['getLiveTvChannels', 'getChannel', 'getPrograms', 'getGuideInfo'] },
                        { module: 'playstate-api', methods: ['markPlayed', 'markUnplayed', 'updateProgress'] },
                        { module: 'media-segments-api', methods: ['getMediaSegments'] },
                        { module: 'backup-api', methods: ['getBackups', 'createBackup', 'restoreBackup', 'deleteBackup'] }
                    ],
                    sdkModels: ['BaseItemDto', 'BaseItemDtoQueryResult', 'BaseItemKind', 'UserDto', 'SessionInfo', 'ImageType', 'MediaType', 'MediaSegmentDto', 'PlaybackInfoResponse'],
                    sdkPatterns: [
                        { pattern: 'new Api(configuration)', usage: 'Create SDK API instance' },
                        { pattern: 'api.axiosInstance', usage: 'Access Axios for custom requests' },
                        { pattern: 'toApi(legacyClient)', usage: 'Convert legacy ApiClient to typed SDK', file: 'src/utils/jellyfin-apiclient/compat.ts' }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_fetching_patterns',
    'Understand how to fetch audio and make API calls',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    audioFetching: [
                        {
                            pattern: 'ApiClient.getAudioStream()',
                            usage: 'Primary method for audio playback',
                            params: {
                                itemId: 'The audio item ID',
                                deviceId: 'Client device identifier',
                                playSessionId: 'Session ID for tracking',
                                transcodingContainer: 'e.g., "mp3", "webm" for transcoded',
                                transcodingProtocol: 'e.g., "http"'
                            },
                            returns: 'Stream URL or blob'
                        },
                        {
                            pattern: 'HTML5 Audio src',
                            usage: 'Set Audio element source to stream URL',
                            example: 'audioElement.src = apiClient.getAudioStream(itemId, options)'
                        },
                        {
                            pattern: 'getItems() with batching',
                            usage: 'Fetch multiple items with automatic splitting',
                            file: 'src/utils/jellyfin-apiclient/getItems.ts',
                            detail: 'URLs over 40 IDs are split into multiple requests'
                        }
                    ],
                    imageFetching: [
                        {
                            pattern: 'getScaledImageUrl()',
                            usage: 'Generate image URL with size constraints',
                            params: {
                                itemId: 'Item containing image',
                                type: 'Primary, Backdrop, Logo, Thumb, etc.',
                                maxWidth: 'Max width in pixels',
                                maxHeight: 'Max height in pixels',
                                quality: '0-100 quality value',
                                tag: 'Cache-busting tag from metadata'
                            }
                        }
                    ],
                    httpPatterns: [
                        {
                            pattern: 'apiClient.fetch(request, includeAuthorization?)',
                            usage: 'Low-level HTTP request with auth',
                            example: 'apiClient.fetch(request, includeAuthorization)'
                        },
                        {
                            pattern: 'apiClient.getJSON(url, includeAuthorization?)',
                            usage: 'Quick JSON GET request'
                        },
                        {
                            pattern: 'apiClient.ajax(request)',
                            usage: 'Legacy AJAX-style request'
                        }
                    ],
                    batching: {
                        tool: 'getItems() in utils/jellyfin-apiclient',
                        limit: 40,
                        automatic: 'Splits large requests, merges results',
                        useCase: 'Fetching playlist of known item IDs'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_websocket_usage',
    'Understand Jellyfin WebSocket for real-time updates',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    websocketEvents: [
                        {
                            event: 'message',
                            data: 'Server-sent messages (playback progress, library changes)',
                            handler: 'Events.on(apiClient, "message", callback)'
                        },
                        {
                            event: 'playbackprogress',
                            data: 'Periodic playback position updates',
                            payload: '{ ItemId, PositionTicks, IsPaused }'
                        },
                        {
                            event: 'sessionupdate',
                            data: 'Other clients changed session',
                            payload: '{ Sessions: [...] }'
                        },
                        {
                            event: 'libraryadded',
                            data: 'New content added to library',
                            payload: '{ AddedItemIds: [...] }'
                        }
                    ],
                    connectionManagement: [
                        {
                            method: 'ensureWebSocket()',
                            purpose: 'Open WebSocket connection if not open'
                        },
                        {
                            method: 'isWebSocketSupported()',
                            purpose: 'Check if browser supports WebSocket'
                        },
                        {
                            method: 'isWebSocketOpen()',
                            purpose: 'Check if connection is active'
                        },
                        {
                            method: 'closeWebSocket()',
                            purpose: 'Close WebSocket connection'
                        }
                    ],
                    messageSending: [
                        {
                            method: 'sendWebSocketMessage(name, data)',
                            purpose: 'Send message to server via WebSocket',
                            example: 'apiClient.sendWebSocketMessage("Ping", {})'
                        }
                    ],
                    syncPlayIntegration: [
                        'SyncPlay uses WebSocket for group sync',
                        'Events.on(ServerConnections, "message", handler)',
                        'Playback commands synced across clients'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_web_audio_overview',
    'Get overview of Web Audio API usage in Jellyfin',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    audioContext: {
                        purpose: 'Main Web Audio context for audio processing',
                        file: 'src/components/audioEngine/',
                        usage: 'Create audio nodes, connect signals, apply effects'
                    },
                    audioChain: [
                        {
                            node: 'MediaElementAudioSourceNode',
                            purpose: 'Connect HTML5 media element to Web Audio',
                            creation: 'context.createMediaElementSource(element)'
                        },
                        {
                            node: 'GainNode',
                            purpose: 'Volume control and normalization',
                            usage: 'Multiple instances for normalization, crossfade, master volume'
                        },
                        {
                            node: 'DynamicsCompressorNode',
                            purpose: 'Brick-wall limiter fallback',
                            usage: 'Prevent clipping when worklet unavailable'
                        },
                        {
                            node: 'AudioWorkletNode',
                            purpose: 'Custom audio processing (limiter, gain, EQ, delay)',
                            file: 'src/components/audioEngine/audioWorklets.ts'
                        }
                    ],
                    audioWorklets: [
                        {
                            name: 'limiterWorklet.js',
                            purpose: 'Brick-wall limiter to prevent overs',
                            parameters: ['threshold', 'release']
                        },
                        {
                            name: 'gainWorklet.js',
                            purpose: 'Gain control with smooth transitions',
                            parameters: ['gain']
                        },
                        {
                            name: 'delayWorklet.js',
                            purpose: 'Delay effects for timing',
                            parameters: ['delayTime', 'feedback']
                        },
                        {
                            name: 'biquadWorklet.js',
                            purpose: 'EQ filtering (lowpass, highpass, etc.)',
                            parameters: ['type', 'frequency', 'Q', 'gain']
                        }
                    ],
                    browserSupport: [
                        'AudioWorklet requires secure context (HTTPS)',
                        'Fallback to DynamicsCompressorNode if worklet fails',
                        'Web Audio enabled by default in modern browsers'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_web_audio_patterns',
    'Understand Web Audio API patterns used in the codebase',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    patterns: [
                        {
                            name: 'MediaElement Source',
                            code: 'context.createMediaElementSource(audioElement)',
                            purpose: 'Connect HTML5 Audio to Web Audio graph',
                            cleanup: 'disconnect() when done'
                        },
                        {
                            name: 'Gain Automation',
                            code: 'gainNode.gain.setValueAtTime(value, context.currentTime)',
                            purpose: 'Smooth volume changes',
                            types: ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime']
                        },
                        {
                            name: 'Crossfade',
                            code: 'fadeOut.gain.linearRampToValueAtTime(0, time + duration)',
                            purpose: 'Seamless track transitions',
                            pattern: 'Two gain nodes with opposing ramps'
                        },
                        {
                            name: 'AudioWorklet Loading',
                            code: 'await context.audioWorklet.addModule(url)',
                            purpose: 'Load custom processor',
                            location: 'src/components/audioEngine/audioWorklets.ts'
                        },
                        {
                            name: 'Worklet Node Creation',
                            code: 'new AudioWorkletNode(context, "processor-name")',
                            purpose: 'Create processor instance',
                            parameters: 'pass via options.parameters'
                        }
                    ],
                    synchronization: [
                        {
                            concept: 'AudioContext Time',
                            property: 'context.currentTime',
                            usage: 'Time reference for all scheduling',
                            note: 'Monotonically increasing, not affected by system clock'
                        },
                        {
                            concept: 'MediaElement Sync',
                            file: 'src/components/audioEngine/crossfader.logic.ts',
                            class: 'SyncManager',
                            purpose: 'Keep multiple media elements synchronized during crossfade'
                        }
                    ],
                    errorHandling: [
                        'try/catch around audioWorklet.addModule()',
                        'Fallback to DynamicsCompressorNode if worklet fails',
                        'Browser may block autoplay - user gesture required'
                    ],
                    cleanup: [
                        'disconnect() all nodes',
                        'suspend() context when not in use',
                        'close() context on page unload'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_error_handling',
    'Understand error handling for API calls and audio',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    apiErrors: [
                        {
                            type: 'MediaError',
                            source: 'HTML5 media element',
                            codes: ['MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'],
                            handling: 'getMediaError() utility in src/utils/mediaError.ts'
                        },
                        {
                            type: 'PlaybackErrorCode',
                            source: 'Jellyfin SDK',
                            handling: 'Mapped to user-friendly messages'
                        },
                        {
                            type: 'NetworkError',
                            source: 'fetch/ajax',
                            handling: 'apiClient.fetchWithFailover() for reconnection'
                        }
                    ],
                    audioErrors: [
                        {
                            type: 'AudioContextBlocked',
                            cause: 'Autoplay policy',
                            handling: 'Resume on user gesture'
                        },
                        {
                            type: 'WorkletLoadFailed',
                            cause: 'Network or MIME type',
                            handling: 'Fallback to DynamicsCompressorNode'
                        },
                        {
                            type: 'CrossOriginError',
                            cause: 'CORS restrictions on audio',
                            handling: 'Use crossorigin="anonymous" on media element'
                        }
                    ],
                    logging: [
                        'logger.error for critical failures',
                        'logger.warn for degradations',
                        'logger.debug for retry attempts'
                    ],
                    recovery: [
                        'Retry with lower quality',
                        'Fallback to direct play',
                        'Fallback to transcoding',
                        'User notification on failure'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_api_error_handling',
    'Understand API error handling patterns and error codes',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    errorCategories: [
                        {
                            category: 'Authentication Errors',
                            codes: ['401', '403'],
                            patterns: [
                                'InvalidCredentialsError - Wrong username/password',
                                'TokenExpiredError - Access token expired',
                                'PermissionDeniedError - User lacks required permissions'
                            ],
                            handling: 'Refresh token or re-authenticate'
                        },
                        {
                            category: 'Playback Errors',
                            codes: ['400', '404', '412'],
                            patterns: [
                                'ContentNotAccessibleError - Content not available',
                                'PlaybackForbiddenError - Content not accessible',
                                'StreamNotFoundError - Item missing',
                                'CodecNotSupportedError - Browser cannot decode'
                            ],
                            handling: 'Fallback to transcode or alternative format'
                        },
                        {
                            category: 'Network Errors',
                            codes: ['500', '502', '503', '504'],
                            patterns: [
                                'ServerUnavailableError - Server down',
                                'GatewayTimeoutError - Request timed out',
                                'RateLimitedError - Too many requests'
                            ],
                            handling: 'Retry with backoff, failover to other server'
                        }
                    ],
                    errorHandlingPatterns: [
                        {
                            pattern: 'try/catch with error boundary',
                            code: `try {
    const result = await apiCall();
    return result;
} catch (error) {
    if (error.status === 401) {
        await refreshToken();
        return retryApiCall();
    }
    throw error;
}`
                        },
                        {
                            pattern: 'Result type for success/failure',
                            code: `type Result<T> = { ok: true; data: T } | { ok: false; error: Error };

function safeApiCall<T>(): Promise<Result<T>> {
    try {
        const data = await fetchApi();
        return { ok: true, data };
    } catch (error) {
        return { ok: false, error };
    }
}`
                        }
                    ],
                    retryStrategies: [
                        'Exponential backoff with jitter',
                        'Maximum 3 retry attempts',
                        'Retry only on 5xx errors or network failure',
                        'Skip retry for 4xx client errors'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_session_management',
    'Understand session management and multi-server patterns',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    sessionLifecycle: [
                        {
                            stage: 'Create Session',
                            methods: ['apiClient.login()', 'apiClient.authenticate()'],
                            tokens: ['AccessToken', 'RefreshToken', 'DeviceId']
                        },
                        {
                            stage: 'Maintain Session',
                            methods: ['ensureWebSocket()', 'refreshToken()', 'heartbeat()'],
                            interval: 'Token refresh before expiry'
                        },
                        {
                            stage: 'End Session',
                            methods: ['logout()', 'clearTokens()', 'closeWebSocket()']
                        }
                    ],
                    multiServerPatterns: [
                        {
                            pattern: 'ServerConnections for multiple servers',
                            code: `import { ServerConnections } from 'lib/jellyfin-apiclient/ServerConnections';

const server1 = ServerConnections.getApiClient('server-1-id');
const server2 = ServerConnections.getApiClient('server-2-id');

ServerConnections.on('localusersignedin', (e, apiClient) => {
    console.log('Signed in to:', apiClient.serverAddress());
});`
                        },
                        {
                            pattern: 'Server discovery',
                            code: `import { discoverServers } from 'utils/jellyfin-apiclient/discovery';

const servers = await discoverServers();
return servers.map(s => ({ id: s.id, name: s.name }));`
                        }
                    ],
                    sessionStorage: [
                        'Access token: sessionStorage (cleared on tab close)',
                        'Refresh token: httpOnly cookie (server-managed)',
                        'Server list: localStorage (persistent)',
                        'User preferences: localStorage'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_sdk_type_definitions',
    'Get TypeScript type definitions for Jellyfin SDK',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    coreTypes: [
                        {
                            name: 'BaseItemDto',
                            properties: ['Id', 'Name', 'Type', 'MediaType', 'ProductionYear', 'PremiereDate'],
                            usage: 'Generic media item from API'
                        },
                        {
                            name: 'BaseItemQuery',
                            properties: ['UserId', 'StartIndex', 'Limit', 'SortBy', 'SortOrder', 'Filters'],
                            usage: 'Query parameters for item search'
                        },
                        {
                            name: 'SessionInfo',
                            properties: ['Id', 'UserId', 'DeviceId', 'NowPlayingItem', 'PlayState'],
                            usage: 'Current playback session'
                        },
                        {
                            name: 'ImageType',
                            enum: ['Primary', 'Backdrop', 'Logo', 'Thumb', 'Art', 'Banner'],
                            usage: 'Image classification for getImageUrl'
                        },
                        {
                            name: 'MediaType',
                            enum: ['Audio', 'Video', 'Photo', 'Book', 'Game'],
                            usage: 'Type of media content'
                        }
                    ],
                    playbackTypes: [
                        {
                            name: 'PlayRequestDto',
                            properties: ['ItemIds', 'StartPositionTicks', 'AudioStreamIndex', 'SubtitleStreamIndex'],
                            usage: 'Request to start playback'
                        },
                        {
                            name: 'PlaybackInfoResponse',
                            properties: ['MediaSources', 'PlaySessionId', 'SupportedMediaProtocols'],
                            usage: 'Server playback capabilities'
                        }
                    ],
                    typeGuards: [
                        {
                            name: 'isAudioItem',
                            code: `function isAudioItem(item: BaseItemDto): item is BaseItemDto & { MediaType: 'Audio' } {
    return item.MediaType === 'Audio';
}`
                        },
                        {
                            name: 'isPlayableItem',
                            code: `function isPlayableItem(item: BaseItemDto): boolean {
    return ['Audio', 'Video'].includes(item.MediaType);
}`
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

server.resource(
    'api-docs',
    'jellyfin://api/overview',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://api/overview',
                mimeType: 'text/markdown',
                text: `# Jellyfin API & Web Audio

## Jellyfin API Client

### ApiClient
Main client for server communication:
\`\`\`typescript
const apiClient = ServerConnections.getApiClient(serverId);
const user = await apiClient.getCurrentUser();
const items = await apiClient.getItems(user.Id, { Limit: 10 });
const streamUrl = apiClient.getAudioStream(itemId, { deviceId, playSessionId });
\`\`\`

### ServerConnections
Singleton for multiple servers:
\`\`\`typescript
// Get client for specific server
const client = ServerConnections.getApiClient(serverId);

// Get current active client
const current = ServerConnections.currentApiClient();

// Listen for connection changes
Events.on(ServerConnections, 'localusersignedin', () => {...});
Events.on(ServerConnections, 'localusersignedout', () => {...});
\`\`\`

### Fetching Audio
\`\`\`typescript
// Get stream URL
const url = apiClient.getAudioStream(itemId, {
    deviceId: apiClient.deviceId(),
    playSessionId: generateSessionId(),
    transcodingContainer: 'webm',
    transcodingProtocol: 'http'
});

// Use with HTML5 Audio
const audio = new Audio(url);
await audio.play();
\`\`\`

### WebSocket
\`\`\`typescript
apiClient.ensureWebSocket();
Events.on(apiClient, 'message', (e, data) => {
    if (data.type === 'playbackprogress') {
        // Handle progress update
    }
});
\`\`\`

## Web Audio API

### Audio Chain
\`\`\`
MediaElement → SourceNode → GainNode (Normalization) → GainNode (Crossfade) → GainNode (Master) → Limiter → Output
\`\`\`

### Loading AudioWorklets
\`\`\`typescript
await context.audioWorklet.addModule('/assets/audio/limiterWorklet.js');
const limiter = new AudioWorkletNode(context, 'limiter');
\`\`\`

### Crossfade
\`\`\`typescript
// Fade out current
currentGain.gain.setValueAtTime(1, context.currentTime);
currentGain.gain.linearRampToValueAtTime(0, context.currentTime + duration);

// Fade in next
nextGain.gain.setValueAtTime(0, context.currentTime);
nextGain.gain.linearRampToValueAtTime(1, context.currentTime + duration);
\`\`\`

## Files
- \`src/apiclient.d.ts\` - ApiClient type definitions
- \`src/lib/jellyfin-apiclient/\` - Connection management
- \`src/utils/jellyfin-apiclient/\` - API utilities
- \`src/components/audioEngine/\` - Web Audio implementation
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
