import browser from "browser";
import events from "events";
import appHost from "apphost";
import loading from "loading";
import dom from "dom";
import playbackManager from "playbackManager";
import appRouter from "appRouter";
import connectionManager from "connectionManager";
import htmlMediaHelper from "htmlMediaHelper";
import itemHelper from "itemHelper";
import screenfull from "screenfull";
import globalize from "globalize";

/* eslint-disable indent */

    /* globals cast */

let mediaManager;

function tryRemoveElement(elem) {
        const parentNode = elem.parentNode;
        if (parentNode) {

            // Seeing crashes in edge webview
            try {
                parentNode.removeChild(elem);
            } catch (err) {
                console.error('error removing dialog element: ' + err);
            }
        }
    }

let _supportsTextTracks;

function supportsTextTracks() {

        if (_supportsTextTracks == null) {
            _supportsTextTracks = document.createElement('video').textTracks != null;
        }

        // For now, until ready
        return _supportsTextTracks;
    }

    function supportsCanvas() {
        return !!document.createElement('canvas').getContext;
    }

    function supportsWebWorkers() {
        return !!window.Worker;
    }

    function enableNativeTrackSupport(currentSrc, track) {

        if (track) {
            if (track.DeliveryMethod === 'Embed') {
                return true;
            }
        }

        if (browser.firefox) {
            if ((currentSrc || '').toLowerCase().indexOf('.m3u8') !== -1) {
                return false;
            }
        }

        // subs getting blocked due to CORS
        if (browser.chromecast) {
            if ((currentSrc || '').toLowerCase().indexOf('.m3u8') !== -1) {
                return false;
            }
        }

        if (browser.ps4) {
            return false;
        }

        if (browser.web0s) {
            return false;
        }

        // Edge is randomly not rendering subtitles
        if (browser.edge) {
            return false;
        }

        if (browser.iOS) {
            // works in the browser but not the native app
            if ((browser.iosVersion || 10) < 10) {
                return false;
            }
        }

        if (track) {
            const format = (track.Codec || "").toLowerCase();
            if (format === 'ssa' || format === 'ass') {
                return false;
            }
        }

        return true;
    }

    function requireHlsPlayer(callback) {
        require(['hlsjs'], function (hls) {
            window.Hls = hls;
            callback();
        });
    }

    function getMediaStreamAudioTracks(mediaSource) {
        return mediaSource.MediaStreams.filter(function (s) {
            return s.Type === 'Audio';
        });
    }

    function getMediaStreamTextTracks(mediaSource) {
        return mediaSource.MediaStreams.filter(function (s) {
            return s.Type === 'Subtitle';
        });
    }

    function hidePrePlaybackPage() {
        let animatedPage = document.querySelector('.page:not(.hide)');
        animatedPage.classList.add('hide');
        // At this point, we must hide the scrollbar placeholder, so it's not being displayed while the item is being loaded
        document.body.classList.remove('force-scroll');
    }

    function zoomIn(elem) {
        return new Promise(function (resolve, reject) {
            const duration = 240;
            elem.style.animation = 'htmlvideoplayer-zoomin ' + duration + 'ms ease-in normal';
            hidePrePlaybackPage();
            dom.addEventListener(elem, dom.whichAnimationEvent(), resolve, {
                once: true
            });
        });
    }

    function normalizeTrackEventText(text, useHtml) {
        const result = text.replace(/\\N/gi, "\n").replace(/\r/gi, "");
        return useHtml ? result.replace(/\n/gi, '<br>') : result;
    }

    function setTracks(elem, tracks, item, mediaSource) {

        elem.innerHTML = getTracksHtml(tracks, item, mediaSource);
    }

    function getTextTrackUrl(track, item, format) {

        if (itemHelper.isLocalItem(item) && track.Path) {
            return track.Path;
        }

        let url = playbackManager.getSubtitleUrl(track, item.ServerId);
        if (format) {
            url = url.replace('.vtt', format);
        }

        return url;
    }

    function getTracksHtml(tracks, item, mediaSource) {
        return tracks.map(function (t) {

            if (t.DeliveryMethod !== 'External') {
                return '';
            }

            const defaultAttribute = mediaSource.DefaultSubtitleStreamIndex === t.Index ? " default" : "";

            const language = t.Language || "und";
            const label = t.Language || "und";
            return '<track id="textTrack' + t.Index + '" label="' + label + '" kind="subtitles" src="' + getTextTrackUrl(t, item) + '" srclang="' + language + '"' + defaultAttribute + '></track>';

        }).join('');
    }

    function getDefaultProfile() {
        return import("browserdeviceprofile").then(profileBuilder => {

            return profileBuilder({});
        });
    }

    /**
     * Private:
     *  - videoDialog
     *  - winJsPlaybackItem
     *  - subtitleTrackIndexToSetOnPlaying
     *  - audioTrackIndexToSetOnPlaying
     *  - lastCustomTrackMs
     *  - currentClock
     *  - currentSubtitlesOctopus
     *  - currentAssRenderer
     *  - customTrackIndex
     *  - showTrackOffset
     *  - currentTrackOffset
     *  - videoSubtitlesElem
     *  - currentTrackEvents
     *  - supportedFeatures
     */
    export class HtmlVideoPlayer {
        constructor() {
            if (browser.edgeUwp) {
                this.name = 'Windows Video Player';
            } else {
                this.name = 'Html Video Player';
            }

            this.type = 'mediaplayer';
            this.id = 'htmlvideoplayer';

            // Let any players created by plugins take priority
            this.priority = 1;

            this._fetchQueue = 0;
            this.isFetching = false;
        }

        currentSrc() {
            return this._currentSrc;
        }

        /**
         * @private
         */
        incrementFetchQueue() {
            if (this._fetchQueue <= 0) {
                this.isFetching = true;
                events.trigger(this, "beginFetch");
            }

            this._fetchQueue++;
        }

        /**
         * @private
         */
        decrementFetchQueue() {
            this._fetchQueue--;

            if (this._fetchQueue <= 0) {
                this.isFetching = false;
                events.trigger(this, "endFetch");
            }
        }

        /**
         * @private
         */
        updateVideoUrl(streamInfo) {
            const isHls = streamInfo.url.toLowerCase().indexOf(".m3u8") !== -1;

            const mediaSource = streamInfo.mediaSource;
            const item = streamInfo.item;

            // Huge hack alert. Safari doesn't seem to like if the segments aren't available right away when playback starts
            // This will start the transcoding process before actually feeding the video url into the player
            // Edit: Also seeing stalls from hls.js
            if (mediaSource && item && !mediaSource.RunTimeTicks && isHls && streamInfo.playMethod === 'Transcode' && (browser.iOS || browser.osx)) {

                const hlsPlaylistUrl = streamInfo.url.replace("master.m3u8", "live.m3u8");

                loading.show();

                console.debug('prefetching hls playlist: ' + hlsPlaylistUrl);

                return connectionManager.getApiClient(item.ServerId).ajax({

                    type: 'GET',
                    url: hlsPlaylistUrl

                }).then(function () {
                    console.debug('completed prefetching hls playlist: ' + hlsPlaylistUrl);

                    loading.hide();
                    streamInfo.url = hlsPlaylistUrl;
                }, function () {
                    console.error('error prefetching hls playlist: ' + hlsPlaylistUrl);

                    loading.hide();
                });

            } else {
                return Promise.resolve();
            }
        }

        play(options) {
            this._started = false;
            this._timeUpdated = false;

            this._currentTime = null;

            this.resetSubtitleOffset();

            return this.createMediaElement(options).then(elem => {
                return this.updateVideoUrl(options).then(() => {
                    return this.setCurrentSrc(elem, options);
                });
            });
        }

        /**
         * @private
         */
        setSrcWithFlvJs(instance, elem, options, url) {
            return import('flvjs').then(flvjs => {
                const flvPlayer = flvjs.createPlayer({
                        type: "flv",
                        url: url
                    },
                    {
                        seekType: "range",
                        lazyLoad: false
                    });

                flvPlayer.attachMediaElement(elem);
                flvPlayer.load();

                instance._flvPlayer = flvPlayer;

                // This is needed in setCurrentTrackElement
                this._currentSrc = url;

                return flvPlayer.play();
            });
        }

        /**
         * @private
         */
        setSrcWithHlsJs(instance, elem, options, url) {

            return new Promise(function (resolve, reject) {

                requireHlsPlayer(() => {
                    const hls = new Hls({
                        manifestLoadingTimeOut: 20000,
                        xhrSetup(xhr, xhr_url) {
                            xhr.withCredentials = true;
                        }
                        //appendErrorMaxRetry: 6,
                        //debug: true
                    });
                    hls.loadSource(url);
                    hls.attachMedia(elem);

                    htmlMediaHelper.bindEventsToHlsPlayer(this, hls, elem, this.onError.bind(this), resolve, reject);

                    this._hlsPlayer = hls;

                    // This is needed in setCurrentTrackElement
                    this._currentSrc = url;
                });
            });
        }

        /**
         * @private
         */
        onShakaError(event) {

            const error = event.detail;
            console.error('Error code', error.code, 'object', error);
        }

        /**
         * @private
         */
        setSrcWithShakaPlayer(instance, elem, options, url) {
            return import('shaka').then(() => {
                /* globals shaka */

                const player = new shaka.Player(elem);

                //player.configure({
                //    abr: {
                //        enabled: false
                //    },
                //    streaming: {

                //        failureCallback: function () {
                //            alert(2);
                //        }
                //    }
                //});

                //shaka.log.setLevel(6);

                // Listen for error events.
                player.addEventListener('error', this.onShakaError.bind(this));

                self._shakaPlayer = player;

                // This is needed in setCurrentTrackElement
                self._currentSrc = url;

                // Try to load a manifest.
                // This is an asynchronous process.
                return player.load(url);
            });
        }

        /**
         * @private
         */
        setCurrentSrcChromecast(instance, elem, options, url) {

            elem.autoplay = true;

            const lrd = new cast.receiver.MediaManager.LoadRequestData();
            lrd.currentTime = (options.playerStartPositionTicks || 0) / 10000000;
            lrd.autoplay = true;
            lrd.media = new cast.receiver.media.MediaInformation();

            lrd.media.contentId = url;
            lrd.media.contentType = options.mimeType;
            lrd.media.streamType = cast.receiver.media.StreamType.OTHER;
            lrd.media.customData = options;

            console.debug('loading media url into media manager');

            try {
                mediaManager.load(lrd);
                // This is needed in setCurrentTrackElement
                this._currentSrc = url;

                return Promise.resolve();
            } catch (err) {

                console.debug('media manager error: ' + err);
                return Promise.reject();
            }
        }

        /**
         * Adapted from : https://github.com/googlecast/CastReferencePlayer/blob/master/player.js
         * @private
         */
        onMediaManagerLoadMedia(event) {

            if (this._castPlayer) {
                this._castPlayer.unload(); // Must unload before starting again.
            }
            this._castPlayer = null;

            const data = event.data;

            const media = event.data.media || {};
            const url = media.contentId;
            const contentType = media.contentType.toLowerCase();
            const options = media.customData;

            let protocol;
            const ext = "m3u8";

            const mediaElement = this._mediaElement;

            const host = new cast.player.api.Host({
                "url": url,
                "mediaElement": mediaElement
            });

            if (ext === 'm3u8' ||
                contentType === 'application/x-mpegurl' ||
                contentType === 'application/vnd.apple.mpegurl') {
                protocol = cast.player.api.CreateHlsStreamingProtocol(host);
            } else if (ext === 'mpd' ||
                contentType === 'application/dash+xml') {
                protocol = cast.player.api.CreateDashStreamingProtocol(host);
            } else if (url.indexOf('.ism') > -1 ||
                contentType === 'application/vnd.ms-sstr+xml') {
                protocol = cast.player.api.CreateSmoothStreamingProtocol(host);
            }

            console.debug('loading playback url: ' + url);
            console.debug('content type: ' + contentType);

            host.onError = function (errorCode) {
                console.error('fatal Error - ' + errorCode);
            };

            mediaElement.autoplay = false;

            this._castPlayer = new cast.player.api.Player(host);

            this._castPlayer.load(protocol, data.currentTime || 0);

            this._castPlayer.playWhenHaveEnoughData();
        }

        /**
         * @private
         */
        initMediaManager() {
            mediaManager.defaultOnLoad = mediaManager.onLoad.bind(mediaManager);
            mediaManager.onLoad = this.onMediaManagerLoadMedia.bind(this);

            //mediaManager.defaultOnPlay = mediaManager.onPlay.bind(mediaManager);
            //mediaManager.onPlay = function (event) {
            //    // TODO ???
            //    mediaManager.defaultOnPlay(event);
            //};

            mediaManager.defaultOnStop = mediaManager.onStop.bind(mediaManager);
            mediaManager.onStop = function (event) {
                playbackManager.stop();
                mediaManager.defaultOnStop(event);
            };
        }

        /**
         * @private
         */
        setCurrentSrc(elem, options) {
            elem.removeEventListener('error', this.onError.bind(this));

            let val = options.url;
            console.debug('playing url: ' + val);

            // Convert to seconds
            const seconds = (options.playerStartPositionTicks || 0) / 10000000;
            if (seconds) {
                val += '#t=' + seconds;
            }

            htmlMediaHelper.destroyHlsPlayer(this);
            htmlMediaHelper.destroyFlvPlayer(this);
            htmlMediaHelper.destroyCastPlayer(this);

            const tracks = getMediaStreamTextTracks(options.mediaSource);

            this.subtitleTrackIndexToSetOnPlaying = options.mediaSource.DefaultSubtitleStreamIndex == null ? -1 : options.mediaSource.DefaultSubtitleStreamIndex;
            if (this.subtitleTrackIndexToSetOnPlaying != null && this.subtitleTrackIndexToSetOnPlaying >= 0) {
                const initialSubtitleStream = options.mediaSource.MediaStreams[this.subtitleTrackIndexToSetOnPlaying];
                if (!initialSubtitleStream || initialSubtitleStream.DeliveryMethod === 'Encode') {
                    this.subtitleTrackIndexToSetOnPlaying = -1;
                }
            }

            this.audioTrackIndexToSetOnPlaying = options.playMethod === 'Transcode' ? null : options.mediaSource.DefaultAudioStreamIndex;

            this._currentPlayOptions = options;

            const crossOrigin = htmlMediaHelper.getCrossOriginValue(options.mediaSource);
            if (crossOrigin) {
                elem.crossOrigin = crossOrigin;
            }

            /*if (htmlMediaHelper.enableHlsShakaPlayer(options.item, options.mediaSource, 'Video') && val.indexOf('.m3u8') !== -1) {

                setTracks(elem, tracks, options.item, options.mediaSource);

                return setSrcWithShakaPlayer(self, elem, options, val);

            } else*/
            if (browser.chromecast && val.indexOf('.m3u8') !== -1 && options.mediaSource.RunTimeTicks) {

                return this.setCurrentSrcChromecast(this, elem, options, val);
            } else if (htmlMediaHelper.enableHlsJsPlayer(options.mediaSource.RunTimeTicks, 'Video') && val.indexOf('.m3u8') !== -1) {
                return this.setSrcWithHlsJs(this, elem, options, val);
            } else if (options.playMethod !== 'Transcode' && options.mediaSource.Container === 'flv') {
                return this.setSrcWithFlvJs(this, elem, options, val);
            } else {
                elem.autoplay = true;

                // Safari will not send cookies without this
                elem.crossOrigin = 'use-credentials';

                return htmlMediaHelper.applySrc(elem, val, options).then(() => {
                    this._currentSrc = val;

                    return htmlMediaHelper.playWithPromise(elem, this.onError.bind(this));
                });
            }
        }

        setSubtitleStreamIndex(index) {
            this.setCurrentTrackElement(index);
        }

        resetSubtitleOffset() {
            this.currentTrackOffset = 0;
            this.showTrackOffset = false;
        }

        enableShowingSubtitleOffset() {
            this.showTrackOffset = true;
        }

        disableShowingSubtitleOffset() {
            this.showTrackOffset = false;
        }

        isShowingSubtitleOffsetEnabled() {
            return this.showTrackOffset;
        }

        /**
         * @private
         */
        getTextTrack() {
            const videoElement = this._mediaElement;
            if (videoElement) {
                return Array.from(videoElement.textTracks)
                    .find(function (trackElement) {
                        // get showing .vtt textTack
                        return trackElement.mode === 'showing';
                    });
            } else {
                return null;
            }
        }

        /**
         * @private
         */
        setSubtitleOffset(offset) {
            const offsetValue = parseFloat(offset);

            // if .ass currently rendering
            if (this.currentSubtitlesOctopus) {
                this.updateCurrentTrackOffset(offsetValue);
                this.currentSubtitlesOctopus.timeOffset = (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000 + offsetValue;;
            } else {
                const trackElement = this.getTextTrack();
                // if .vtt currently rendering
                if (trackElement) {
                    this.setTextTrackSubtitleOffset(trackElement, offsetValue);
                } else if (this.currentTrackEvents) {
                    this.setTrackEventsSubtitleOffset(this.currentTrackEvents, offsetValue);
                } else {
                    console.debug('No available track, cannot apply offset: ', offsetValue);
                }
            }
        }

        /**
         * @private
         */
        updateCurrentTrackOffset(offsetValue) {
            let relativeOffset = offsetValue;
            const newTrackOffset = offsetValue;
            if (this.currentTrackOffset) {
                relativeOffset -= this.currentTrackOffset;
            }
            this.currentTrackOffset = newTrackOffset;
            // relative to currentTrackOffset
            return relativeOffset;
        }

        /**
         * @private
         */
        setTextTrackSubtitleOffset(currentTrack, offsetValue) {
            if (currentTrack.cues) {
                offsetValue = this.updateCurrentTrackOffset(offsetValue);
                Array.from(currentTrack.cues)
                    .forEach(function (cue) {
                        cue.startTime -= offsetValue;
                        cue.endTime -= offsetValue;
                    });
            }
        }

        /**
         * @private
         */
        setTrackEventsSubtitleOffset(trackEvents, offsetValue) {
            if (Array.isArray(trackEvents)) {
                offsetValue = this.updateCurrentTrackOffset(offsetValue) * 1e7; // ticks
                trackEvents.forEach(function (trackEvent) {
                    trackEvent.StartPositionTicks -= offsetValue;
                    trackEvent.EndPositionTicks -= offsetValue;
                });
            }
        }

        getSubtitleOffset() {
            return this.currentTrackOffset;
        }

        /**
         * @private
         */
        isAudioStreamSupported(stream, deviceProfile) {

            const codec = (stream.Codec || "").toLowerCase();

            if (!codec) {
                return true;
            }

            if (!deviceProfile) {
                // This should never happen
                return true;
            }

            const profiles = deviceProfile.DirectPlayProfiles || [];

            return profiles.filter(function (p) {

                if (p.Type === 'Video') {

                    if (!p.AudioCodec) {
                        return true;
                    }

                    return p.AudioCodec.toLowerCase().indexOf(codec) !== -1;
                }

                return false;

            }).length > 0;
        }

        /**
         * @private
         */
        getSupportedAudioStreams() {
            const profile = self._lastProfile;

            return getMediaStreamAudioTracks(self._currentPlayOptions.mediaSource).filter((stream) => {
                return this.isAudioStreamSupported(stream, profile);
            });
        }

        setAudioStreamIndex(index) {

            const streams = this.getSupportedAudioStreams();

            if (streams.length < 2) {
                // If there's only one supported stream then trust that the player will handle it on it's own
                return;
            }

            let audioIndex = -1;
            let i;
            let length;
            let stream;

            for (i = 0, length = streams.length; i < length; i++) {
                stream = streams[i];

                audioIndex++;

                if (stream.Index === index) {
                    break;
                }
            }

            if (audioIndex === -1) {
                return;
            }

            const elem = self._mediaElement;
            if (!elem) {
                return;
            }

            // https://msdn.microsoft.com/en-us/library/hh772507(v=vs.85).aspx

            const elemAudioTracks = elem.audioTracks || [];
            console.debug('found ' + elemAudioTracks.length + ' audio tracks');

            for (i = 0, length = elemAudioTracks.length; i < length; i++) {

                if (audioIndex === i) {
                    console.debug('setting audio track ' + i + ' to enabled');
                    elemAudioTracks[i].enabled = true;
                } else {
                    console.debug('setting audio track ' + i + ' to disabled');
                    elemAudioTracks[i].enabled = false;
                }
            }
        }

        stop(destroyPlayer) {
            const elem = this._mediaElement;
            const src = this._currentSrc;

            if (elem) {
                if (src) {
                    elem.pause();
                }

                htmlMediaHelper.onEndedInternal(this, elem, this.onError.bind(this));

                if (destroyPlayer) {
                    this.destroy();
                }
            }

            this.destroyCustomTrack(elem);

            return Promise.resolve();
        }

        destroy() {
            htmlMediaHelper.destroyHlsPlayer(this);
            htmlMediaHelper.destroyFlvPlayer(this);

            appRouter.setTransparency('none');

            const videoElement = this._mediaElement;

            if (videoElement) {
                this._mediaElement = null;

                this.destroyCustomTrack(videoElement);
                videoElement.removeEventListener('timeupdate', this.onTimeUpdate.bind(this));
                videoElement.removeEventListener('ended', this.onEnded.bind(this));
                videoElement.removeEventListener('volumechange', this.onVolumeChange.bind(this));
                videoElement.removeEventListener('pause', this.onPause.bind(this));
                videoElement.removeEventListener('playing', this.onPlaying.bind(this));
                videoElement.removeEventListener('play', this.onPlay.bind(this));
                videoElement.removeEventListener('click', this.onClick.bind(this));
                videoElement.removeEventListener('dblclick', this.onDblClick.bind(this));
                videoElement.removeEventListener('waiting', this.onWaiting.bind(this));

                videoElement.parentNode.removeChild(videoElement);
            }

            const dlg = this.videoDialog;
            if (dlg) {
                this.videoDialog = null;
                dlg.parentNode.removeChild(dlg);
            }

            if (screenfull.isEnabled) {
                screenfull.exit();
            }
        }

        /**
         * @private
         */
        onEnded() {
            this.destroyCustomTrack(this);
            htmlMediaHelper.onEndedInternal(this, this.onEnded.bind(this), this.onError.bind(this));
        }

        /**
         * @private
         */
        onTimeUpdate(e) {
            // get the player position and the transcoding offset
            const time = this.currentTime;

            if (time && !this._timeUpdated) {
                this._timeUpdated = true;
                this.ensureValidVideo(this);
            }

            this._currentTime = time;

            const currentPlayOptions = this._currentPlayOptions;
            // Not sure yet how this is coming up null since we never null it out, but it is causing app crashes
            if (currentPlayOptions) {
                let timeMs = time * 1000;
                timeMs += ((currentPlayOptions.transcodingOffsetTicks || 0) / 10000);
                this.updateSubtitleText(timeMs);
            }

            events.trigger(this, 'timeupdate');
        }

        /**
         * @private
         */
        onVolumeChange() {
            htmlMediaHelper.saveVolume(this.volume);
            events.trigger(this, 'volumechange');
        }

        /**
         * @private
         */
        onNavigatedToOsd() {
            const dlg = this.videoDialog;
            if (dlg) {
                dlg.classList.remove('videoPlayerContainer-onTop');

                this.onStartedAndNavigatedToOsd();
            }
        }

        /**
         * @private
         */
        onStartedAndNavigatedToOsd() {
            // If this causes a failure during navigation we end up in an awkward UI state
            this.setCurrentTrackElement(this.subtitleTrackIndexToSetOnPlaying);

            if (this.audioTrackIndexToSetOnPlaying != null && self.canSetAudioStreamIndex()) {
                self.setAudioStreamIndex(this.audioTrackIndexToSetOnPlaying);
            }
        }

        /**
         * @private
         */
        onPlaying(e) {
            if (!this._started) {
                this._started = true;
                this.onPlaying.removeAttribute('controls');

                loading.hide();

                htmlMediaHelper.seekOnPlaybackStart(this, e.target, this._currentPlayOptions.playerStartPositionTicks, function () {
                    if (this.currentSubtitlesOctopus) {
                        this.currentSubtitlesOctopus.timeOffset = (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000 + currentTrackOffset;
                        this.currentSubtitlesOctopus.resize();
                        this.currentSubtitlesOctopus.resetRenderAheadCache(false);
                    }
                });

                if (this._currentPlayOptions.fullscreen) {

                    appRouter.showVideoOsd().then(this.onNavigatedToOsd.bind(this));

                } else {
                    appRouter.setTransparency('backdrop');
                    this.videoDialog.classList.remove('videoPlayerContainer-onTop');

                    this.onStartedAndNavigatedToOsd();
                }
            }
            events.trigger(this, 'playing');
        }

        /**
         * @private
         */
        onPlay(e) {
            events.trigger(this, 'unpause');
        }

        /**
         * @private
         */
        ensureValidVideo(elem) {
            if (elem !== this._mediaElement) {
                return;
            }

            if (elem.videoWidth === 0 && elem.videoHeight === 0) {
                const mediaSource = (this._currentPlayOptions || {}).mediaSource;

                // Only trigger this if there is media info
                // Avoid triggering in situations where it might not actually have a video stream (audio only live tv channel)
                if (!mediaSource || mediaSource.RunTimeTicks) {
                    htmlMediaHelper.onErrorInternal(this, 'mediadecodeerror');
                }
            }
        }

        /**
         * @private
         */
        onClick() {
            events.trigger(this, 'click');
        }

        /**
         * @private
         */
        onDblClick() {
            events.trigger(this, 'dblclick');
        }

        /**
         * @private
         */
        onPause() {
            events.trigger(this, 'pause');
        }

        onWaiting() {
            events.trigger(this, 'waiting');
        }

        /**
         * @private
         */
        onError() {
            const errorCode = this.onError.error ? (this.onError.error.code || 0) : 0;
            const errorMessage = this.onError.error ? (this.onError.error.message || "") : "";
            console.error('media element error: ' + errorCode.toString() + ' ' + errorMessage);

            let type;

            switch (errorCode) {
                case 1:
                    // MEDIA_ERR_ABORTED
                    // This will trigger when changing media while something is playing
                    return;
                case 2:
                    // MEDIA_ERR_NETWORK
                    type = 'network';
                    break;
                case 3:
                    // MEDIA_ERR_DECODE
                    if (self._hlsPlayer) {
                        htmlMediaHelper.handleHlsJsMediaError(self);
                        return;
                    } else {
                        type = 'mediadecodeerror';
                    }
                    break;
                case 4:
                    // MEDIA_ERR_SRC_NOT_SUPPORTED
                    type = 'medianotsupported';
                    break;
                default:
                    // seeing cases where Edge is firing error events with no error code
                    // example is start playing something, then immediately change src to something else
                    return;
            }

            htmlMediaHelper.onErrorInternal(this, type);
        }

        /**
         * @private
         */
        destroyCustomTrack(videoElement) {
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }

            if (this.videoSubtitlesElem) {
                const subtitlesContainer = this.videoSubtitlesElem.parentNode;
                if (subtitlesContainer) {
                    tryRemoveElement(subtitlesContainer);
                }
                this.videoSubtitlesElem = null;
            }

            this.currentTrackEvents = null;

            if (videoElement) {
                const allTracks = videoElement.textTracks || []; // get list of tracks
                for (let i = 0; i < allTracks.length; i++) {

                    const currentTrack = allTracks[i];

                    if (currentTrack.label.indexOf('manualTrack') !== -1) {
                        currentTrack.mode = 'disabled';
                    }
                }
            }

            this.customTrackIndex = -1;
            this.currentClock = null;
            this._currentAspectRatio = null;

            const octopus = this.currentSubtitlesOctopus;
            if (octopus) {
                octopus.dispose();
            }
            this.currentSubtitlesOctopus = null;

            const renderer = this.currentAssRenderer;
            if (renderer) {
                renderer.setEnabled(false);
            }
            this.currentAssRenderer = null;
        }

        /**
         * @private
         */
        fetchSubtitlesUwp(track, item) {
            return Windows.Storage.StorageFile.getFileFromPathAsync(track.Path).then(function (storageFile) {
                return Windows.Storage.FileIO.readTextAsync(storageFile);
            }).then(function (text) {
                return JSON.parse(text);
            });
        }

        /**
         * @private
         */
        fetchSubtitles(track, item) {
            if (window.Windows && itemHelper.isLocalItem(item)) {
                return this.fetchSubtitlesUwp(track, item);
            }

            this.incrementFetchQueue();
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                const url = getTextTrackUrl(track, item, ".js");

                xhr.open('GET', url, true);

                xhr.onload = (e) => {
                    resolve(JSON.parse(this.response));
                    this.decrementFetchQueue();
                };

                xhr.onerror = (e) => {
                    reject(e);
                    this.decrementFetchQueue();
                };

                xhr.send();
            });
        }

        /**
         * @private
         */
        setTrackForDisplay(videoElement, track) {
            if (!track) {
                this.destroyCustomTrack(videoElement);
                return;
            }

            // skip if already playing this track
            if (this.customTrackIndex === track.Index) {
                return;
            }

            this.resetSubtitleOffset();
            const item = self._currentPlayOptions.item;

            this.destroyCustomTrack(videoElement);
            this.customTrackIndex = track.Index;
            this.renderTracksEvents(videoElement, track, item);
            this.lastCustomTrackMs = 0;
        }

        /**
         * @private
         */
        renderSsaAss(videoElement, track, item) {
            const attachments = self._currentPlayOptions.mediaSource.MediaAttachments || [];
            const apiClient = connectionManager.getApiClient(item);
            const options = {
                video: videoElement,
                subUrl: getTextTrackUrl(track, item),
                fonts: attachments.map(function (i) {
                    return apiClient.getUrl(i.DeliveryUrl);
                }),
                workerUrl: appRouter.baseUrl() + '/libraries/subtitles-octopus-worker.js',
                legacyWorkerUrl: appRouter.baseUrl() + '/libraries/subtitles-octopus-worker-legacy.js',
                onError() {
                    htmlMediaHelper.onErrorInternal(self, 'mediadecodeerror');
                },
                timeOffset: (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000,

                // new octopus options; override all, even defaults
                renderMode: "blend",
                dropAllAnimations: false,
                libassMemoryLimit: 40,
                libassGlyphLimit: 40,
                targetFps: 24,
                prescaleTradeoff: 0.8,
                softHeightLimit: 1080,
                hardHeightLimit: 2160,
                resizeVariation: 0.2,
                renderAhead: 90
            };
            import('JavascriptSubtitlesOctopus').then(SubtitlesOctopus => {
                this.currentSubtitlesOctopus = new SubtitlesOctopus(options);
            });
        }

        /**
         * @private
         */
        requiresCustomSubtitlesElement() {
            // after a system update, ps4 isn't showing anything when creating a track element dynamically
            // going to have to do it ourselves
            if (browser.ps4) {
                return true;
            }

            // This is unfortunate, but we're unable to remove the textTrack that gets added via addTextTrack
            if (browser.firefox || browser.web0s) {
                return true;
            }

            if (browser.edge) {
                return true;
            }

            if (browser.iOS) {
                const userAgent = navigator.userAgent.toLowerCase();
                // works in the browser but not the native app
                if ((userAgent.indexOf('os 9') !== -1 || userAgent.indexOf('os 8') !== -1) && userAgent.indexOf('safari') === -1) {
                    return true;
                }
            }

            return false;
        }

        /**
         * @private
         */
        renderSubtitlesWithCustomElement(videoElement, track, item) {
            this.fetchSubtitles(track, item).then((data) => {
                if (!this.videoSubtitlesElem) {
                    const subtitlesContainer = document.createElement("div");
                    subtitlesContainer.classList.add('videoSubtitles');
                    subtitlesContainer.innerHTML = '<div class="videoSubtitlesInner"></div>';
                    this.videoSubtitlesElem = subtitlesContainer.querySelector('.videoSubtitlesInner');
                    this.setSubtitleAppearance(subtitlesContainer, this.videoSubtitlesElem);
                    videoElement.parentNode.appendChild(subtitlesContainer);
                    this.currentTrackEvents = data.TrackEvents;
                }
            });
        }

        /**
         * @private
         */
        setSubtitleAppearance(elem, innerElem) {
            Promise.all([import('userSettings'), import('subtitleAppearanceHelper')]).then(([userSettings, subtitleAppearanceHelper]) => {
                subtitleAppearanceHelper.applyStyles({
                    text: innerElem,
                    window: elem
                }, userSettings.getSubtitleAppearanceSettings());
            });
        }

        /**
         * @private
         */
        getCueCss(appearance, selector) {

            let html = selector + "::cue {";

            html += appearance.text.map(function (s) {

                return s.name + ':' + s.value + '!important;';

            }).join('');

            html += '}';

            return html;
        }

        /**
         * @private
         */
        setCueAppearance() {

            Promise.all([import('userSettings'), import('subtitleAppearanceHelper')]).then(([userSettings, subtitleAppearanceHelper]) => {

                const elementId = self.id + "-cuestyle";

                let styleElem = document.querySelector("#" + elementId);
                if (!styleElem) {
                    styleElem = document.createElement('style');
                    styleElem.id = elementId;
                    styleElem.type = 'text/css';
                    document.getElementsByTagName('head')[0].appendChild(styleElem);
                }

                styleElem.innerHTML = this.getCueCss(subtitleAppearanceHelper.getStyles(userSettings.getSubtitleAppearanceSettings(), true), '.htmlvideoplayer');
            });
        }

        /**
         * @private
         */
        renderTracksEvents(videoElement, track, item) {
            if (!itemHelper.isLocalItem(item) || track.IsExternal) {
                const format = (track.Codec || "").toLowerCase();
                if (format === 'ssa' || format === 'ass') {
                    this.renderSsaAss(videoElement, track, item);
                    return;
                }

                if (this.requiresCustomSubtitlesElement()) {
                    this.renderSubtitlesWithCustomElement(videoElement, track, item);
                    return;
                }
            }

            let trackElement = null;
            if (videoElement.textTracks && videoElement.textTracks.length > 0) {
                trackElement = videoElement.textTracks[0];

                // This throws an error in IE, but is fine in chrome
                // In IE it's not necessary anyway because changing the src seems to be enough
                try {
                    trackElement.mode = 'showing';
                    while (trackElement.cues.length) {
                        trackElement.removeCue(trackElement.cues[0]);
                    }
                } catch (e) {
                    console.error('error removing cue from textTrack');
                }

                trackElement.mode = 'disabled';
            } else {
                // There is a function addTextTrack but no function for removeTextTrack
                // Therefore we add ONE element and replace its cue data
                trackElement = videoElement.addTextTrack('subtitles', 'manualTrack', 'und');
            }

            // download the track json
            this.fetchSubtitles(track, item).then(function (data) {

                // show in ui
                console.debug('downloaded ' + data.TrackEvents.length + ' track events');
                // add some cues to show the text
                // in safari, the cues need to be added before setting the track mode to showing
                data.TrackEvents.forEach(function (trackEvent) {

                    const trackCueObject = window.VTTCue || window.TextTrackCue;
                    const cue = new trackCueObject(trackEvent.StartPositionTicks / 10000000, trackEvent.EndPositionTicks / 10000000, normalizeTrackEventText(trackEvent.Text, false));

                    trackElement.addCue(cue);
                });
                trackElement.mode = 'showing';
            });
        }

        /**
         * @private
         */
        updateSubtitleText(timeMs) {
            const clock = this.currentClock;
            if (clock) {
                try {
                    clock.seek(timeMs / 1000);
                } catch (err) {
                    console.error('error in libjass: ' + err);
                }
                return;
            }

            const trackEvents = this.currentTrackEvents;
            const subtitleTextElement = this.videoSubtitlesElem;

            if (trackEvents && subtitleTextElement) {
                const ticks = timeMs * 10000;
                let selectedTrackEvent;
                for (let i = 0; i < trackEvents.length; i++) {

                    const currentTrackEvent = trackEvents[i];
                    if (currentTrackEvent.StartPositionTicks <= ticks && currentTrackEvent.EndPositionTicks >= ticks) {
                        selectedTrackEvent = currentTrackEvent;
                        break;
                    }
                }

                if (selectedTrackEvent && selectedTrackEvent.Text) {
                    subtitleTextElement.innerHTML = normalizeTrackEventText(selectedTrackEvent.Text, true);
                    subtitleTextElement.classList.remove('hide');

                } else {
                    subtitleTextElement.classList.add('hide');
                }
            }
        }

        /**
         * @private
         */
        setCurrentTrackElement(streamIndex) {

            console.debug('setting new text track index to: ' + streamIndex);

            const mediaStreamTextTracks = getMediaStreamTextTracks(this._currentPlayOptions.mediaSource);

            let track = streamIndex === -1 ? null : mediaStreamTextTracks.filter(function (t) {
                return t.Index === streamIndex;
            })[0];

            this.setTrackForDisplay(this._mediaElement, track);
            if (enableNativeTrackSupport(this._currentSrc, track)) {
                if (streamIndex !== -1) {
                    this.setCueAppearance();
                }

            } else {
                // null these out to disable the player's native display (handled below)
                streamIndex = -1;
                track = null;
            }
        }

        /**
         * @private
         */
        createMediaElement(options) {
            const dlg = document.querySelector(".videoPlayerContainer");

                if (!dlg) {
                    return import('css!./style').then(() => {
                        loading.show();

                        const dlg = document.createElement("div");

                        dlg.classList.add('videoPlayerContainer');

                        if (options.fullscreen) {
                            dlg.classList.add('videoPlayerContainer-onTop');
                        }

                        let html = "";
                        let cssClass = "htmlvideoplayer";

                        if (!browser.chromecast) {
                            cssClass += ' htmlvideoplayer-moveupsubtitles';
                        }

                        // Can't autoplay in these browsers so we need to use the full controls, at least until playback starts
                        if (!appHost.supports('htmlvideoautoplay')) {
                            html += '<video class="' + cssClass + '" preload="metadata" autoplay="autoplay" controls="controls" webkit-playsinline playsinline>';
                        } else {
                            // Chrome 35 won't play with preload none
                            html += '<video class="' + cssClass + '" preload="metadata" autoplay="autoplay" webkit-playsinline playsinline>';
                        }

                        html += '</video>';

                        dlg.innerHTML = html;
                        const videoElement = dlg.querySelector("video");

                        videoElement.volume = htmlMediaHelper.getSavedVolume();
                        videoElement.addEventListener('timeupdate', this.onTimeUpdate);
                        videoElement.addEventListener('ended', this.onEnded);
                        videoElement.addEventListener('volumechange', this.onVolumeChange);
                        videoElement.addEventListener('pause', this.onPause);
                        videoElement.addEventListener('playing', this.onPlaying);
                        videoElement.addEventListener('play', this.onPlay);
                        videoElement.addEventListener('click', this.onClick);
                        videoElement.addEventListener('dblclick', this.onDblClick);
                        videoElement.addEventListener('waiting', this.onWaiting);
                        if (options.backdropUrl) {
                            videoElement.poster = options.backdropUrl;
                        }

                        document.body.insertBefore(dlg, document.body.firstChild);
                        this.videoDialog = dlg;
                        this._mediaElement = videoElement;

                        if (mediaManager) {
                            if (!mediaManager.embyInit) {
                                this.initMediaManager();
                                mediaManager.embyInit = true;
                            }
                            mediaManager.setMediaElement(videoElement);
                        }

                        // don't animate on smart tv's, too slow
                        if (options.fullscreen && browser.supportsCssAnimation() && !browser.slow) {
                            zoomIn(dlg).then(function () {
                                return videoElement;
                            });
                        } else {
                            hidePrePlaybackPage();
                            return videoElement;
                        }
                    });
                } else {
                    return Promise.resolve(dlg.querySelector('video'));
                }
        }

    /**
     * @private
     */
    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'video';
    }

    /**
     * @private
     */
    supportsPlayMethod(playMethod, item) {
        if (appHost.supportsPlayMethod) {
            return appHost.supportsPlayMethod(playMethod, item);
        }

        return true;
    }

    /**
     * @private
     */
    getDeviceProfile(item, options) {
        return HtmlVideoPlayer.getDeviceProfileInternal(item, options).then((profile) => {
            this._lastProfile = profile;
            return profile;
        });
    }

    /**
     * @private
     */
    static getDeviceProfileInternal(item, options) {
        if (appHost.getDeviceProfile) {
            return appHost.getDeviceProfile(item, options);
        }

        return getDefaultProfile();
    }

    /**
     * @private
     */
    static getSupportedFeatures() {
        const list = [];

        const video = document.createElement("video");
        if (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === "function" || document.pictureInPictureEnabled) {
            list.push('PictureInPicture');
        } else if (window.Windows) {
            if (Windows.UI.ViewManagement.ApplicationView.getForCurrentView().isViewModeSupported(Windows.UI.ViewManagement.ApplicationViewMode.compactOverlay)) {
                list.push('PictureInPicture');
            }
        }

        if (browser.safari || browser.iOS || browser.iPad) {
            list.push('AirPlay');
        }

        if (typeof video.playbackRate === 'number') {
            list.push('PlaybackRate');
        }

        list.push('SetBrightness');
        list.push("SetAspectRatio");

        return list;
    }

    supports(feature) {
        if (!this.supportedFeatures) {
            this.supportedFeatures = HtmlVideoPlayer.getSupportedFeatures();
        }

        return this.supportedFeatures.contains(feature);
    }

    // Save this for when playback stops, because querying the time at that point might return 0
    currentTime(val) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            if (val != null) {
                mediaElement.currentTime = val / 1000;
                return;
            }

            const currentTime = this._currentTime;
            if (currentTime) {
                return currentTime * 1000;
            }

            return (mediaElement.currentTime || 0) * 1000;
        }
    }

    duration(val) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            const duration = mediaElement.duration;
            if (htmlMediaHelper.isValidDuration(duration)) {
                return duration * 1000;
            }
        }

        return null;
    }

    canSetAudioStreamIndex(index) {
        if (browser.tizen || browser.orsay) {
            return true;
        }

        const video = this._mediaElement;
        if (video) {
            if (video.audioTracks) {
                return true;
            }
        }

        return false;
    }

    static onPictureInPictureError(err) {
        console.error('Picture in picture error: ' + err.toString());
    }

    setPictureInPictureEnabled(isEnabled) {
        const video = this._mediaElement;

        if (document.pictureInPictureEnabled) {
            if (video) {
                if (isEnabled) {
                    video.requestPictureInPicture().catch(HtmlVideoPlayer.onPictureInPictureError);
                } else {
                    document.exitPictureInPicture().catch(HtmlVideoPlayer.onPictureInPictureError);
                }
            }
        } else if (window.Windows) {
            this.isPip = isEnabled;
            if (isEnabled) {
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView().tryEnterViewModeAsync(Windows.UI.ViewManagement.ApplicationViewMode.compactOverlay);
            } else {
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView().tryEnterViewModeAsync(Windows.UI.ViewManagement.ApplicationViewMode.default);
            }
        } else {
            if (video && video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === "function") {
                video.webkitSetPresentationMode(isEnabled ? "picture-in-picture" : "inline");
            }
        }
    }

    isPictureInPictureEnabled() {
        if (document.pictureInPictureEnabled) {
            return document.pictureInPictureElement ? true : false;
        } else if (window.Windows) {
            return this.isPip || false;
        } else {
            const video = this._mediaElement;
            if (video) {
                return video.webkitPresentationMode === "picture-in-picture";
            }
        }

        return false;
    }

    static isAirPlayEnabled() {
        if (document.AirPlayEnabled) {
            return document.AirplayElement ? true : false;
        }

        return false;
    }

    setAirPlayEnabled(isEnabled) {
        const video = this._mediaElement;

        if (document.AirPlayEnabled) {
            if (video) {
                if (isEnabled) {
                    video.requestAirPlay().catch(function(err) {
                        console.error("Error requesting AirPlay", err);
                    });
                } else {
                    document.exitAirPLay().catch(function(err) {
                        console.error("Error exiting AirPlay", err);
                    });
                }
            }
        } else {
            video.webkitShowPlaybackTargetPicker();
        }
    }

    setBrightness(val) {
        const elem = this._mediaElement;

        if (elem) {
            val = Math.max(0, val);
            val = Math.min(100, val);

            let rawValue = val;
            rawValue = Math.max(20, rawValue);

            const cssValue = rawValue >= 100 ? "none" : (rawValue / 100);
            elem.style['-webkit-filter'] = 'brightness(' + cssValue + ');';
            elem.style.filter = 'brightness(' + cssValue + ')';
            elem.brightnessValue = val;
            events.trigger(this, 'brightnesschange');
        }
    }

    getBrightness() {
        const elem = this._mediaElement;
        if (elem) {
            const val = elem.brightnessValue;
            return val == null ? 100 : val;
        }
    }

    seekable() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {

            const seekable = mediaElement.seekable;
            if (seekable && seekable.length) {

                let start = seekable.start(0);
                let end = seekable.end(0);

                if (!htmlMediaHelper.isValidDuration(start)) {
                    start = 0;
                }
                if (!htmlMediaHelper.isValidDuration(end)) {
                    end = 0;
                }

                return (end - start) > 0;
            }

            return false;
        }
    }

    pause() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.pause();
        }
    }

    // This is a retry after error
    resume() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.play();
        }
    }

    unpause() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.play();
        }
    }

    paused() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.paused;
        }

        return false;
    }

    setPlaybackRate(value) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.playbackRate = value;
        }
    };

    getPlaybackRate() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.playbackRate;
        }
        return null;
    };

    setVolume(val) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.volume = val / 100;
        }
    }

    getVolume() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return Math.min(Math.round(mediaElement.volume * 100), 100);
        }
    }

    volumeUp() {
        this.setVolume(Math.min(this.getVolume() + 2, 100));
    }

    volumeDown() {
        this.setVolume(Math.max(this.getVolume() - 2, 0));
    }

    setMute(mute) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.muted = mute;
        }
    }

    isMuted() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.muted;
        }
        return false;
    }

    setAspectRatio(val) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            if ("auto" === val) {
                mediaElement.style.removeProperty("object-fit");
            } else {
                mediaElement.style["object-fit"] = val;
            }
        }
        this._currentAspectRatio = val;
    }

    getAspectRatio() {
        return this._currentAspectRatio || "auto";
    }

    getSupportedAspectRatios() {
        return [{
            name: "Auto",
            id: "auto"
        }, {
            name: "Cover",
            id: "cover"
        }, {
            name: "Fill",
            id: "fill"
        }];
    }

    togglePictureInPicture() {
        return this.setPictureInPictureEnabled(!this.isPictureInPictureEnabled());
    }

    toggleAirPlay() {
        return this.setAirPlayEnabled(!this.isAirPlayEnabled());
    }

    getBufferedRanges() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return htmlMediaHelper.getBufferedRanges(this, mediaElement);
        }

        return [];
    }

    getStats() {
        const mediaElement = this._mediaElement;
        const playOptions = this._currentPlayOptions || [];

        const categories = [];

        if (!mediaElement) {
            return Promise.resolve({
                categories: categories
            });
        }

        const mediaCategory = {
            stats: [],
            type: "media"
        };
        categories.push(mediaCategory);

        if (playOptions.url) {
            //  create an anchor element (note: no need to append this element to the document)
            let link = document.createElement("a");
            //  set href to any path
            link.setAttribute('href', playOptions.url);
            const protocol = (link.protocol || "").replace(":", "");

            if (protocol) {
                mediaCategory.stats.push({
                    label: globalize.translate("LabelProtocol"),
                    value: protocol
                });
            }

            link = null;
        }

        if (this._hlsPlayer || this._shakaPlayer) {
            mediaCategory.stats.push({
                label: globalize.translate("LabelStreamType"),
                value: 'HLS'
            });
        } else {
            mediaCategory.stats.push({
                label: globalize.translate("LabelStreamType"),
                value: 'Video'
            });
        }

        const videoCategory = {
            stats: [],
            type: "video"
        };
        categories.push(videoCategory);

        const rect = mediaElement.getBoundingClientRect ? mediaElement.getBoundingClientRect() : {};
        let height = parseInt(rect.height);
        let width = parseInt(rect.width);

        // Don't show player dimensions on smart TVs because the app UI could be lower resolution than the video and this causes users to think there is a problem
        if (width && height && !browser.tv) {
            videoCategory.stats.push({
                label: globalize.translate("LabelPlayerDimensions"),
                value: width + 'x' + height
            });
        }

        height = mediaElement.videoHeight;
        width = mediaElement.videoWidth;

        if (width && height) {
            videoCategory.stats.push({
                label: globalize.translate("LabelVideoResolution"),
                value: width + 'x' + height
            });
        }

        if (mediaElement.getVideoPlaybackQuality) {
            const playbackQuality = mediaElement.getVideoPlaybackQuality();

            const droppedVideoFrames = playbackQuality.droppedVideoFrames || 0;
            videoCategory.stats.push({
                label: globalize.translate("LabelDroppedFrames"),
                value: droppedVideoFrames
            });

            const corruptedVideoFrames = playbackQuality.corruptedVideoFrames || 0;
            videoCategory.stats.push({
                label: globalize.translate("LabelCorruptedFrames"),
                value: corruptedVideoFrames
            });
        }

        const audioCategory = {
            stats: [],
            type: "audio"
        };
        categories.push(audioCategory);

        const sinkId = mediaElement.sinkId;
        if (sinkId) {
            audioCategory.stats.push({
                label: 'Sink Id:',
                value: sinkId
            });
        }

        return Promise.resolve({
            categories: categories
        });
    }
    }

    if (browser.chromecast) {
        mediaManager = new cast.receiver.MediaManager(document.createElement('video'));
    }
/* eslint-enable indent */

export default HtmlVideoPlayer;
