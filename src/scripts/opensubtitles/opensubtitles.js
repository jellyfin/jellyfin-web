// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/naming-convention */
import OpenSubtitlesApiClass from './api';
import Utils from './utils';

const _OpenSubtitlesClientSettingsKey = 'opensubtitles_clientSettings';

class OpenSubtitlesManagerClass {
    /**
     * Class constructor
     */
    constructor() {
        this.api = new OpenSubtitlesApiClass( { apikey: 'gUCLWGoAg2PmyseoTM0INFFVPcDCeDlT' } );
        this.utils = Utils;
        this.isLoggedIn = false;
        this.downloadData = { link: '', fileId: null };
        this.mediaItem = null;
        this.searchResults = null;
        this.JellyfinMediaStreamTemplate = {
            Type: 'Subtitle',
            Codec: 'srt',
            DisplayTitle: 'OpenSubtitle',
            Index: 10000, /* Web subtitle indexes will always be out of range for any MediaItem */
            IsDefault: false,
            IsExternal: true,
            IsExternalUrl: true,
            IsForced: false,
            IsHearingImpaired: false,
            IsTextSubtitleStream: true,
            Language: '',
            SupportsExternalStream: true,
            DeliveryMethod: 'External',
            Path: '',
            DeliveryUrl: ''
        };
        this.settings = {
            languages: 'en',
            credentials: { username: '', password: '', token: '' }
        };

        // Settings are saved locally
        try {
            const clientSettings = localStorage.getItem( _OpenSubtitlesClientSettingsKey );
            if ( clientSettings?.includes('credentials') ) {
                this.settings = JSON.parse( clientSettings );
                this.api._authentication.token = this.settings.credentials.token;
            }
        } catch ( err ) {
            console.error('[opensubtitles] ', err);
        }
        console.debug('[opensubtitles] instance created', this);
    }

    /**
     * Start the instance
     */
    async start() {
        // Login if not already
        const openSubtitlesCredentials = this.credentials();
        if ( openSubtitlesCredentials.token ) {
            const res = await this.refreshUserInfo();
            if ( this.isLoggedIn ) {
                console.debug( '[opensubtitles] already logged in ', res );
                return res;
            }
        }
        if ( openSubtitlesCredentials.username ) {
            const resLogin = await this.login( openSubtitlesCredentials.username, openSubtitlesCredentials.password );
            console.debug( '[opensubtitles] login ', resLogin );
        } else {
            console.debug( '[opensubtitles] no credentials found' );
        }
    }

    /**
     * Set settings
     * @param {boolean} en Enable opensubtitles
     * @param {string} user User
     * @param {string} pwd Password
     * @param {string} languages Languages (comma-separated)
     * @param (string) token API Token
     * @returns Response JSON
     */
    async setSettings(en, user, pwd, languages, token = null) {
        if ( !en ) {
            return this.logout();
        }
        this.settings.languages = languages;
        if ( token ) {
            // Check if provided token is still valid
            this.settings.credentials = {
                username: user,
                password: pwd,
                token: token
            };
            this.api._authentication.token = token;
            const res = await this.refreshUserInfo();
            if ( res.user ) {
                localStorage.setItem( _OpenSubtitlesClientSettingsKey, JSON.stringify(this.settings) );
                return res;
            }
        }
        // get token using `/login`
        return this.login(user, pwd);
    }

    /**
     * Create a token to authenticate a user
     * @param {string} username OpenSubtitles User
     * @param {string} password OpenSubtitles Password
     * @returns Response JSON
     */
    login(username, password) {
        if (!username || !password) {
            // opensubtitles.com api does not work anonymously
            return null;
        }

        console.debug('[opensubtitles] trying to login at', Date.now());
        const credentials = { username: username, password: password };
        this.settings.credentials.username = credentials.username;
        this.settings.credentials.password = credentials.password;

        return this.api.user.login(credentials).then((response) => {
            if ( response?.user && response?.token ) {
                this.api._authentication.user = response.user;
                this.api._authentication.token = response.token;
                this.api._settings.endpoint = 'https://' + response.base_url + '/api/v1';
                this.settings.credentials.token = response.token;
                localStorage.setItem( _OpenSubtitlesClientSettingsKey, JSON.stringify(this.settings) );
                this.isLoggedIn = true;
            }
            console.debug('[opensubtitles] login', this.api.last_response?.status, response);
            return response;
        }, (err) => {
            console.error('[opensubtitles] login failed', err);
            return null;
        });
    }

    /**
     * Gather informations about the user authenticated by a bearer token
     * @returns Response JSON
     */
    refreshUserInfo() {
        if ( !this.api?._authentication?.token ) {
            console.debug('[opensubtitles] refreshUserInfo was called without a token');
            return Promise.resolve();
        }
        return this.api.infos.user().then( (res) => {
            if ( res?.data?.allowed_downloads != null ) {
                this.api._authentication.user = res.data;
                this.isLoggedIn = true;
                return res;
            }
        }, ( err ) => {
            console.error('[opensubtitles] ', err);
            return null;
        });
    }

    /**
     * Current user credentials
     * @returns JSON
     */
    credentials() {
        if ( this.settings.credentials?.username ) {
            return this.settings.credentials;
        }
        return { username: '', password: '', token: '' };
    }

    /**
     * Check remaining allowed downloads for the user
     * @returns Number of allowed downloads
     */
    allowedDownloads() {
        if ( this.api._authentication?.user?.allowed_downloads ) {
            return this.api._authentication.user.allowed_downloads;
        }
        return 0;
    }

    /**
     * Request a download url for a subtitle
     * @param {number} fileId from /subtitles search results
     * @returns Download url
     */
    async getDownloadLink( fileId ) {
        console.debug('[opensubtitles] getDownloadLink for fileId = ', fileId);
        if ( fileId == OpenSubtitlesManager.downloadData?.fileId ) {
            // Already have the download link for this file
            return OpenSubtitlesManager.downloadData.link;
        }

        // Check if it is possible to adjust FPS
        let inFps = null;
        let outFps = null;
        try {
            for (const dataItem of this.searchResults.data) {
                if ( fileId == dataItem.attributes.files[0].fileId ) {
                    inFps = dataItem.attributes.fps;
                    const videoSrc = this.searchResults.item.MediaStreams.filter(function (s) {
                        return s.Type === 'Video';
                    });
                    if ( videoSrc.length == 1 ) {
                        outFps = videoSrc[0].AverageFrameRate;
                    }
                    break;
                }
            }
        } catch ( err ) {
            console.error('[opensubtitles] unable to detect inFps outFps', err);
        }

        // Request from API
        const options = { file_id: fileId };
        if ( inFps && outFps ) {
            console.debug('[opensubtitles] inFps = ', inFps, 'outFps = ', outFps);
            options.in_fps = inFps;
            options.out_fps = outFps;
        }
        await this.api.download( options ).then( response => {
            this.downloadData.link = response.link;
            this.downloadData.fileId = fileId;
        }).catch(console.error);

        return OpenSubtitlesManager.downloadData.link;
    }

    /**
     * Destroy a user token to end a session
     * @returns Response JSON
     */
    async logout() {
        try {
            let res = null;
            if ( this.isLoggedIn ) {
                res = await this.api.user.logout( { token: this.api._authentication.token } );
            }

            this.api._authentication = {};
            this.settings.credentials = { username: '', password: '', token: '' };
            localStorage.removeItem( _OpenSubtitlesClientSettingsKey );

            return res;
        } catch (err) {
            console.error( '[opensubtitles] ', err );
            this.api._authentication = {};
            return null;
        }
    }

    /**
     * Parse filename from mediaItem
     * @param {*} mediaItem item
     * @returns filename
     */
    getFilenameFromMedia( mediaItem ) {
        return mediaItem.Path.split('/').slice(-1)[0];
    }

    /**
     * Find subtitle for a video file
     * @param {Object} mediaItem Jellyfin media item
     * @param {string} languages comma-separated languages
     * @returns Search results
     */
    async searchForSubtitles( mediaItem, languages = null ) {
        if ( !this.isLoggedIn ) {
            return this.searchResults;
        }
        try {
            if ( this.allowedDownloads() < 1 ) {
                // If the user can't download, then don't even search
                return {};
            }

            // Check filename (don't research for the same file)
            const filename = this.getFilenameFromMedia(mediaItem);
            if ( filename == this.searchResults?.filename ) {
                return this.searchResults;
            }

            // Search options
            const options = {
                gzip: false,
                order_by: 'upload_date', order_direction: 'desc',
                ai_translated: 'include',
                foreign_parts_only: 'include',
                hearing_impaired: 'include'
            };

            // Find imdb_id
            let imdb_id = mediaItem?.ProviderIds?.Imdb;
            if ( !imdb_id ) {
                const imdbRegex = /(?:\x69\x6d\x64\x62\x69\x64\x2d\x74\x74)([0-9]*)/;
                if ( imdbRegex.test(mediaItem.Path) ) {
                    imdb_id = mediaItem.Path.match( imdbRegex ).at(-1);
                }
            }

            // Fing tmdb_id
            let tmdb_id = mediaItem?.ProviderIds?.Tmdb;
            if ( !tmdb_id ) {
                const tmdbRegex = /(?:\x74\x6d\x64\x62\x69\x64\x2d\x74\x74)([0-9]*)/;
                if ( tmdbRegex.test(mediaItem.Path) ) {
                    tmdb_id = mediaItem.Path.match( tmdbRegex ).at(-1);
                }
            }

            // Query (worst results)
            let query = filename;
            let titleName = null;
            try {
                if ( mediaItem.Type == 'Episode' ) {
                    // seriesName S##E##
                    const showName = mediaItem.SeriesName;
                    const aux = mediaItem.SortName.split('-').map((i)=>{
                        return Number(i.trim());
                    });
                    titleName = showName + ' S' + aux[0] + 'E' + aux[1];
                } else if ( mediaItem.Type == 'Movie') {
                    // movieName (year)
                    titleName = mediaItem.Name + ' (' + mediaItem.ProductionYear + ')';
                }
            } catch (err) {
                console.debug('[opensubtitles] unable to detect video information', err);
            }

            if ( titleName ) {
                query = titleName;
            }

            // Search mode (using ID is more precise then query)
            if ( imdb_id ) {
                options.imdb_id = imdb_id;
            } else if ( tmdb_id ) {
                options.tmdb_id = tmdb_id;
            } else {
                options.query = query;
            }

            // Try to get at least one result per language, in order of preference
            languages = languages || this.settings.languages || 'en';
            const responses = await Promise.all( languages.split(',').map((i)=>{
                return this.api.subtitles( { ...options, languages: i } );
            }) );
            let data = [];
            for (const res of responses) {
                data = data.concat( res.data );
            }
            this.searchResults = { data: data, item: mediaItem, filename: filename, options: options };
            console.debug( '[opensubtitles] searchForSubtitles', this.searchResults );
        } catch ( err ) {
            console.error( '[opensubtitles] searchForSubtitles', err);
        }
        return this.searchResults;
    }

    /**
     * Append OpenSubtitles text tracks to Jellyfin media item
     * @param {Object} streams Array of streams
     * @param {Object} mediaSource Full item
     * @returns Array of streams
     */
    async appendSubtitleTracks( streams, mediaSource = null ) {
        if ( !this.isLoggedIn ) {
            return streams;
        }

        if ( mediaSource ) {
            // OpenSubtitles is only for videos
            if ( !Object.hasOwn(mediaSource, 'VideoType') ) {
                return streams;
            }

            // Keep information from mediaSource
            if ( (!this.mediaItem?.ProviderIds && mediaSource.ProviderIds)
                || (this.mediaItem?.Path != mediaSource.Path) ) {
                console.debug('[opensubtitles] mediaItem changed from ', this.mediaItem, ' to ', mediaSource);
                this.mediaItem = mediaSource;
            }
        } else if ( !this.mediaItem?.VideoType ) {
            return streams;
        }

        // Search for subtitles (if this has not been done already)
        if ( this.getFilenameFromMedia(this.mediaItem) != this.searchResults?.filename ) {
            await this.searchForSubtitles( this.mediaItem );
        }

        // Do nothing if there are no search results
        if ( !this.searchResults?.data?.length ) {
            console.debug('[opensubtitles] appendSubtitleTracks empty searchResults.data');
            return streams;
        }

        // Append web `textTracks` to `streams`
        const refIndex = Number( this.JellyfinMediaStreamTemplate.Index );
        let numCount = 0;
        for (const dataItem of this.searchResults.data) {
            const textTrack = JSON.parse(JSON.stringify( this.JellyfinMediaStreamTemplate ));
            textTrack.OpenSubstitlesFileId = dataItem.attributes.files[0].file_id;
            textTrack.Language = dataItem.attributes.language;
            textTrack.IsHearingImpaired = dataItem.attributes.hearing_impaired;
            textTrack.DisplayTitle = dataItem.attributes.language + ' (web) ' + dataItem.attributes.files[0].file_name;
            textTrack.OpenSubtitlesData = dataItem.attributes;
            // playbackmanager.getSubtitleUrl was modified to get the download link, so this is probably extra
            if ( OpenSubtitlesManager.downloadData?.link
              && textTrack.OpenSubstitlesFileId == OpenSubtitlesManager.downloadData.fileId ) {
                textTrack.Path = OpenSubtitlesManager.downloadData.link;
                textTrack.DeliveryUrl = OpenSubtitlesManager.downloadData.link;
            }

            // Only append this item, if it has not been appended before
            let found = false;
            for (const streamItem of streams) {
                if ( streamItem.OpenSubstitlesFileId === textTrack.OpenSubstitlesFileId ) {
                    found = true;
                    break;
                }
            }
            if ( !found ) {
                textTrack.Index = refIndex + numCount++;
                streams.push( textTrack );
            }
        }
        return streams;
    }
}

const OpenSubtitlesManager = new OpenSubtitlesManagerClass();
export default OpenSubtitlesManager;
