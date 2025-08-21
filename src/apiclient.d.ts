/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'jellyfin-apiclient' {
    import type {
        AllThemeMediaResult,
        AuthenticationResult,
        BaseItemDto,
        BaseItemDtoQueryResult,
        BufferRequestDto,
        ClientCapabilities,
        CountryInfo,
        CultureDto,
        DeviceOptions,
        DisplayPreferencesDto,
        EndPointInfo,
        FileSystemEntryInfo,
        GeneralCommand,
        GroupInfoDto,
        GuideInfo,
        IgnoreWaitRequestDto,
        ImageInfo,
        ImageProviderInfo,
        ImageType,
        ItemCounts,
        LiveTvInfo,
        MovePlaylistItemRequestDto,
        NewGroupRequestDto,
        NextItemRequestDto,
        NotificationResultDto,
        NotificationsSummaryDto,
        ParentalRating,
        PingRequestDto,
        PlaybackInfoResponse,
        PlaybackProgressInfo,
        PlaybackStartInfo,
        PlaybackStopInfo,
        PlayCommand,
        PlaystateCommand,
        PluginInfo,
        PluginSecurityInfo,
        PreviousItemRequestDto,
        QueryFiltersLegacy,
        QueueRequestDto,
        QuickConnectResult,
        QuickConnectState,
        ReadyRequestDto,
        RecommendationDto,
        RemoteImageResult,
        RemoveFromPlaylistRequestDto,
        SearchHintResult,
        SeekRequestDto,
        SeriesTimerInfoDto,
        SeriesTimerInfoDtoQueryResult,
        ServerConfiguration,
        SessionInfo,
        SetPlaylistItemRequestDto,
        SetRepeatModeRequestDto,
        SetShuffleModeRequestDto,
        SystemInfo,
        TaskInfo,
        TaskTriggerInfo,
        TimerInfoDto,
        TimerInfoDtoQueryResult,
        UserConfiguration,
        UserDto,
        UserItemDataDto,
        UserPolicy,
        UtcTimeResponse,
        VirtualFolderInfo
    } from '@jellyfin/sdk/lib/generated-client';
    import type { ConnectionState } from 'lib/jellyfin-apiclient';

    class ApiClient {
        constructor(serverAddress: string, appName: string, appVersion: string, deviceName: string, deviceId: string);

        accessToken(): string;
        addMediaPath(virtualFolderName: string, mediaPath: string, networkSharePath: string, refreshLibrary?: boolean): Promise<void>;
        addVirtualFolder(name: string, type?: string, refreshLibrary?: boolean, libraryOptions?: any): Promise<void>;
        ajax(request: any): Promise<any>;
        appName(): string;
        appVersion(): string;
        authenticateUserByName(name: string, password: string): Promise<AuthenticationResult>;
        cancelLiveTvSeriesTimer(id: string): Promise<void>;
        cancelLiveTvTimer(id: string): Promise<void>;
        cancelSyncItems(itemIds: string[], targetId?: string): Promise<void>;
        clearAuthenticationInfo(): void;
        clearUserItemRating(userId: string, itemId: string): Promise<UserItemDataDto>;
        closeWebSocket(): void;
        createLiveTvSeriesTimer(item: string): Promise<void>;
        createLiveTvTimer(item: string): Promise<void>;
        createPackageReview(review: any): Promise<any>;
        createSyncPlayGroup(options?: NewGroupRequestDto): Promise<void>;
        createUser(user: UserDto): Promise<UserDto>;
        deleteDevice(deviceId: string): Promise<void>;
        deleteItemImage(itemId: string, imageType: ImageType, imageIndex?: number): Promise<void>;
        deleteItem(itemId: string): Promise<void>;
        deleteLiveTvRecording(id: string): Promise<void>;
        deleteUserImage(userId: string, imageType: ImageType, imageIndex?: number): Promise<void>;
        deleteUser(userId: string): Promise<void>;
        detectBitrate(force: boolean): Promise<number>;
        deviceId(): string;
        deviceName(): string;
        disablePlugin(id: string, version: string): Promise<void>;
        downloadRemoteImage(options: any): Promise<void>;
        enablePlugin(id: string, version: string): Promise<void>;
        encodeName(name: string): string;
        ensureWebSocket(): void;
        fetch(request: any, includeAuthorization?: boolean): Promise<any>;
        fetchWithFailover(request: any, enableReconnection?: boolean): Promise<any>;
        getAdditionalVideoParts(userId?: string, itemId: string): Promise<BaseItemDtoQueryResult>;
        getAlbumArtists(userId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getAncestorItems(itemId: string, userId?: string): Promise<BaseItemDto[]>;
        getArtist(name: string, userId?: string): Promise<BaseItemDto>;
        getArtists(userId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getAvailablePlugins(options?: any): Promise<PluginInfo[]>;
        getAvailableRemoteImages(options: any): Promise<RemoteImageResult>;
        getContentUploadHistory(): Promise<any>;
        getCountries(): Promise<CountryInfo[]>;
        getCriticReviews(itemId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getCultures(): Promise<CultureDto[]>;
        getCurrentUser(cache?: boolean): Promise<UserDto>;
        getCurrentUserId(): string;
        getDateParamValue(date: Date): string;
        getDefaultImageQuality(imageType: ImageType): number;
        getDevicesOptions(): Promise<DeviceOptions>;
        getDirectoryContents(path: string, options?: any): Promise<FileSystemEntryInfo[]>;
        getDisplayPreferences(id: string, userId: string, app: string): Promise<DisplayPreferencesDto>;
        getDownloadSpeed(byteSize: number): Promise<number>;
        getDrives(): Promise<FileSystemEntryInfo[]>;
        getEndpointInfo(): Promise<EndPointInfo>;
        getEpisodes(itemId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getFilters(options?: any): Promise<QueryFiltersLegacy>;
        getGenre(name: string, userId?: string): Promise<BaseItemDto>;
        getGenres(userId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getImageUrl(itemId: string, options?: any): string;
        getInstalledPlugins(): Promise<PluginInfo[]>;
        getInstantMixFromItem(itemId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getIntros(itemId: string): Promise<BaseItemDtoQueryResult>;
        getItemCounts(userId?: string): Promise<ItemCounts>;
        getItemDownloadUrl(itemId: string): string;
        getItemImageInfos(itemId: string): Promise<ImageInfo[]>;
        getItems(userId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getItem(userId: string, itemId: string): Promise<BaseItemDto>;
        getJSON(url: string, includeAuthorization?: boolean): Promise<any>;
        getLatestItems(options?: any): Promise<BaseItemDto[]>;
        getLiveStreamMediaInfo(liveStreamId: string): Promise<any>;
        getLiveTvChannel(id: string, userId?: string): Promise<BaseItemDto>;
        getLiveTvChannels(options?: any): Promise<BaseItemDtoQueryResult>;
        getLiveTvGuideInfo(userId: string): Promise<GuideInfo>;
        getLiveTvInfo(userId: string): Promise<LiveTvInfo>;
        getLiveTvProgram(id: string, userId?: string): Promise<BaseItemDto>;
        getLiveTvPrograms(options?: any): Promise<BaseItemDtoQueryResult>;
        getLiveTvRecommendedPrograms(options?: any): Promise<BaseItemDtoQueryResult>;
        getLiveTvRecordingGroup(id: string): Promise<BaseItemDto>;
        getLiveTvRecordingGroups(options?: any): Promise<BaseItemDtoQueryResult>;
        getLiveTvRecording(id: string, userId?: string): Promise<BaseItemDto>;
        getLiveTvRecordingSeries(options?: any): Promise<BaseItemDtoQueryResult>;
        getLiveTvRecordings(options?: any): Promise<BaseItemDtoQueryResult>;
        getLiveTvSeriesTimer(id: string): Promise<SeriesTimerInfoDto>;
        getLiveTvSeriesTimers(options?: any): Promise<SeriesTimerInfoDtoQueryResult>;
        getLiveTvTimer(id: string): Promise<TimerInfoDto>;
        getLiveTvTimers(options?: any): Promise<TimerInfoDtoQueryResult>;
        getLocalTrailers(userId: string, itemId: string): Promise<BaseItemDto[]>;
        getMovieRecommendations(options?: any): Promise<RecommendationDto[]>;
        getMusicGenre(name: string, userId?: string): Promise<BaseItemDto>;
        getMusicGenres(userId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getNamedConfiguration(name: string): Promise<any>;
        getNetworkDevices(): Promise<any>;
        getNetworkShares(path: string): Promise<FileSystemEntryInfo[]>;
        getNewLiveTvTimerDefaults(options?: any): Promise<SeriesTimerInfoDto>;
        getNextUpEpisodes(options?: any): Promise<BaseItemDtoQueryResult>;
        getNotificationSummary(userId: string): Promise<NotificationsSummaryDto>;
        getNotifications(userId: string, options?: any): Promise<NotificationResultDto>;
        getPackageInfo(name: string, guid: string): Promise<PackageInfo>;
        getPackageReviews(packageId: string, minRating?: string, maxRating?: string, limit?: string): Promise<any>;
        getParentalRatings(): Promise<ParentalRating[]>;
        getParentPath(path: string): Promise<string>;
        getPeople(userId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getPerson(name: string, userId?: string): Promise<BaseItemDto>;
        getPhysicalPaths(): Promise<string[]>;
        getPlaybackInfo(itemId: string, options: any, deviceProfile: any): Promise<PlaybackInfoResponse>;
        getPluginConfiguration(id: string): Promise<any>;
        getPublicSystemInfo(): Promise<PublicSystemInfo>;
        getPublicUsers(): Promise<UserDto[]>;
        getQuickConnect(verb: string): Promise<void | boolean | number | QuickConnectResult | QuickConnectState>;
        getReadySyncItems(deviceId: string): Promise<any>;
        getRecordingFolders(userId: string): Promise<BaseItemDtoQueryResult>;
        getRegistrationInfo(feature: string): Promise<any>;
        getRemoteImageProviders(options: any): Promise<ImageProviderInfo[]>;
        getResumableItems(userId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getRootFolder(userId: string): Promise<BaseItemDto>;
        getSavedEndpointInfo(): EndPointInfo;
        getScaledImageUrl(itemId: string, options?: any): string;
        getScheduledTask(id: string): Promise<TaskInfo>;
        getScheduledTasks(options?: any): Promise<TaskInfo[]>;
        getSearchHints(options?: any): Promise<SearchHintResult>;
        getSeasons(itemId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getServerConfiguration(): Promise<ServerConfiguration>;
        getServerTime(): Promise<UtcTimeResponse>;
        getSessions(options?: any): Promise<SessionInfo[]>;
        getSimilarItems(itemId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getSpecialFeatures(userId: string, itemId: string): Promise<BaseItemDto[]>;
        getStudio(name: string, userId?: string): Promise<BaseItemDto>;
        getStudios(userId: string, options?: any): Promise<BaseItemDtoQueryResult>;
        getSyncPlayGroups(): Promise<GroupInfoDto[]>;
        getSyncStatus(itemId: string): Promise<any>;
        getSystemInfo(): Promise<SystemInfo>;
        getThemeMedia(userId?: string, itemId: string, inherit?: boolean): Promise<AllThemeMediaResult>;
        getThumbImageUrl(item: BaseItemDto, options?: any): string;
        getUpcomingEpisodes(options?: any): Promise<BaseItemDtoQueryResult>;
        getUrl(name: string, params?: any, serverAddress?: string): string;
        get(url: string): Promise<any>;
        getUserImageUrl(userId: string, options?: any): string;
        getUsers(options?: any): Promise<UserDto[]>;
        getUser(userId: string): Promise<UserDto>;
        getUserViews(options?: any, userId: string): Promise<BaseItemDtoQueryResult>;
        getVirtualFolders(): Promise<VirtualFolderInfo[]>;
        handleMessageReceived(msg: any): void;
        installPlugin(name: string, guid: string, version?: string): Promise<void>;
        isLoggedIn(): boolean;
        isMessageChannelOpen(): boolean;
        isMinServerVersion(version: string): boolean;
        isWebSocketOpen(): boolean;
        isWebSocketOpenOrConnecting(): boolean;
        isWebSocketSupported(): boolean;
        joinSyncPlayGroup(options?: any): Promise<void>;
        leaveSyncPlayGroup(): Promise<void>;
        logout(): Promise<void>;
        markNotificationsRead(userId: string, idList: string[], isRead: boolean): Promise<void>;
        markPlayed(userId: string, itemId: string, date: Date): Promise<UserItemDataDto>;
        markUnplayed(userId: string, itemId: string, date: Date): Promise<UserItemDataDto>;
        openWebSocket(): void;
        quickConnect(secret: string): Promise<AuthenticationResult>;
        refreshItem(itemId: string, options?: any): Promise<void>;
        removeMediaPath(virtualFolderName: string, mediaPath: string, refreshLibrary?: boolean): Promise<void>;
        removeVirtualFolder(name: string, refreshLibrary?: boolean): Promise<void>;
        renameVirtualFolder(name: string, newName: string, refreshLibrary?: boolean): Promise<void>;
        reportCapabilities(capabilities: ClientCapabilities): Promise<void>;
        reportOfflineActions(actions: any): Promise<any>;
        reportPlaybackProgress(options: PlaybackProgressInfo): Promise<void>;
        reportPlaybackStart(options: PlaybackStartInfo): Promise<void>;
        reportPlaybackStopped(options: PlaybackStopInfo): Promise<void>;
        reportSyncJobItemTransferred(syncJobItemId: string): Promise<any>;
        requestSyncPlayBuffering(options?: BufferRequestDto): Promise<void>;
        requestSyncPlayMovePlaylistItem(options?: MovePlaylistItemRequestDto): Promise<void>;
        requestSyncPlayNextItem(options?: NextItemRequestDto): Promise<void>;
        requestSyncPlayPause(): Promise<void>;
        requestSyncPlayPreviousItem(options?: PreviousItemRequestDto): Promise<void>;
        requestSyncPlayQueue(options?: QueueRequestDto): Promise<void>;
        requestSyncPlayReady(options?: ReadyRequestDto): Promise<void>;
        requestSyncPlayRemoveFromPlaylist(options?: RemoveFromPlaylistRequestDto): Promise<void>;
        requestSyncPlaySeek(options?: SeekRequestDto): Promise<void>;
        requestSyncPlaySetIgnoreWait(options?: IgnoreWaitRequestDto): Promise<void>;
        requestSyncPlaySetNewQueue(options?: NewGroupRequestDto): Promise<void>;
        requestSyncPlaySetPlaylistItem(options?: SetPlaylistItemRequestDto): Promise<void>;
        requestSyncPlaySetRepeatMode(options?: SetRepeatModeRequestDto): Promise<void>;
        requestSyncPlaySetShuffleMode(options?: SetShuffleModeRequestDto): Promise<void>;
        requestSyncPlayUnpause(): Promise<void>;
        resetEasyPassword(userId: string): Promise<void>;
        resetLiveTvTuner(id: string): Promise<void>;
        resetUserPassword(userId: string): Promise<void>;
        restartServer(): Promise<void>;
        sendCommand(sessionId: string, command: any): Promise<void>;
        sendMessageCommand(sessionId: string, options: GeneralCommand): Promise<void>;
        sendMessage(name: string, data: any): void;
        sendPlayCommand(sessionId: string, options: PlayCommand): Promise<void>;
        sendPlayStateCommand(sessionId: string, command: PlaystateCommand, options?: any): Promise<void>;
        sendSyncPlayPing(options?: PingRequestDto): Promise<void>;
        sendWebSocketMessage(name: string, data: any): void;
        serverAddress(val?: string): string;
        serverId(): string;
        serverVersion(): string;
        setAuthenticationInfo(accessKey?: string, userId?: string): void;
        setRequestHeaders(headers: any): void;
        setSystemInfo(info: SystemInfo): void;
        shutdownServer(): Promise<void>;
        startScheduledTask(id: string): Promise<void>;
        stopActiveEncodings(playSessionId: string): Promise<void>;
        stopScheduledTask(id: string): Promise<void>;
        syncData(data: any): Promise<any>;
        uninstallPluginByVersion(id: string, version: string): Promise<void>;
        uninstallPlugin(id: string): Promise<void>;
        updateDisplayPreferences(id: string, obj: DisplayPreferencesDto, userId: string, app: string): Promise<void>;
        updateEasyPassword(userId: string, newPassword: string): Promise<void>;
        updateFavoriteStatus(userId: string, itemId: string, isFavorite: boolean): Promise<UserItemDataDto>;
        updateItemImageIndex(itemId: string, imageType: ImageType, imageIndex: number, newIndex: number): Promise<any>;
        updateItem(item: BaseItemDto): Promise<void>;
        updateLiveTvSeriesTimer(item: SeriesTimerInfoDto): Promise<void>;
        updateLiveTvTimer(item: TimerInfoDto): Promise<void>;
        updateMediaPath(virtualFolderName: string, pathInfo: any): Promise<void>;
        updateNamedConfiguration(name: string, configuration: any): Promise<void>;
        updatePluginConfiguration(id: string, configuration: any): Promise<void>;
        updatePluginSecurityInfo(info: PluginSecurityInfo): Promise<void>;
        updateScheduledTaskTriggers(id: string, triggers: TaskTriggerInfo[]): Promise<void>;
        updateServerConfiguration(configuration: ServerConfiguration): Promise<void>;
        updateServerInfo(server: any, serverUrl: string): void;
        updateUserConfiguration(userId: string, configuration: UserConfiguration): Promise<void>;
        updateUserItemRating(userId: string, itemId: string, likes: boolean): Promise<UserItemDataDto>;
        updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
        updateUserPolicy(userId: string, policy: UserPolicy): Promise<void>;
        updateUser(user: UserDto): Promise<void>;
        updateVirtualFolderOptions(id: string, libraryOptions?: any): Promise<void>;
        uploadItemImage(itemId: string, imageType: ImageType, file: File): Promise<void>;
        uploadItemSubtitle(itemId: string, language: string, isForced: boolean, file: File): Promise<void>;
        uploadUserImage(userId: string, imageType: ImageType, file: File): Promise<void>;
    }

    class AppStore {
        constructor();

        getItem(name: string): string | null;
        removeItem(name: string): void;
        setItem(name: string, value: string): void;
    }

    interface ConnectResponse {
        ApiClient: ApiClient
        Servers: any[]
        State: ConnectionState
    }

    class ConnectionManager {
        constructor(credentialProvider: Credentials, appName: string, appVersion: string, deviceName: string, deviceId: string, capabilities: ClientCapabilities);

        addApiClient(apiClient: ApiClient): void;
        clearData(): void;
        connect(options?: any): Promise<ConnectResponse>;
        connectToAddress(address: string, options?: any): Promise<any>;
        connectToServer(server: any, options?: any): Promise<any>;
        connectToServers(servers: any[], options?: any): Promise<any>;
        deleteServer(serverId: string): Promise<void>;
        getApiClient(item: BaseItemDto | string): ApiClient;
        getApiClients(): ApiClient[];
        getAvailableServers(): any[];
        getOrCreateApiClient(serverId: string): ApiClient;
        getSavedServers(): any[];
        handleMessageReceived(msg: any): void;
        logout(): Promise<void>;
        minServerVersion(val?: string): string;
        updateSavedServerId(server: any): Promise<void>;
        user(apiClient: ApiClient): Promise<any>;
    }

    class Credentials {
        constructor(key?: string);

        addOrUpdateServer(list: any[], server: any): any;
        clear(): void;
        credentials(data?: any): any;
    }

    interface Event {
        type: string;
    }

    const Events: {
        off(obj: any, eventName: string, fn: (e: Event, ...args: any[]) => void): void;
        on(obj: any, eventName: string, fn: (e: Event, ...args: any[]) => void): void;
        trigger(obj: any, eventName: string, ...args: any[]): void;
    };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
