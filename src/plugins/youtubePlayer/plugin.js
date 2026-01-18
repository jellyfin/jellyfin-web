import browser from '../../scripts/browser';
import { appRouter } from '../../components/router/appRouter';
import loading from '../../components/loading/loading';
import { setBackdropTransparency, TRANSPARENCY_LEVEL } from '../../components/backdrop/backdrop';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';

/* globals YT */

const errorCodes = {
    2: 'YoutubeBadRequest',
    5: 'YoutubePlaybackError',
    100: 'YoutubeNotFound',
    101: 'YoutubeDenied',
    150: 'YoutubeDenied'
};

function zoomIn(elem, iterations) {
    const keyframes = [
        { transform: 'scale3d(.2, .2, .2)  ', opacity: '.6', offset: 0 },
        { transform: 'none', opacity: '1', offset: 1 }
    ];

    const timing = { duration: 240, iterations: iterations };
    return elem.animate(keyframes, timing);
}

function createMediaElement(instance, options) {
    return new Promise((resolve) => {
        const dlg = document.querySelector('.youtubePlayerContainer');

        if (!dlg) {
            import('./style.scss').then(() => {
                loading.show();

                const playerDlg = document.createElement('div');

                playerDlg.classList.add('youtubePlayerContainer');

                if (options.fullscreen) {
                    playerDlg.classList.add('onTop');
                }

                playerDlg.innerHTML = '<div id="player"></div>';
                const videoElement = playerDlg.querySelector('#player');

                document.body.insertBefore(playerDlg, document.body.firstChild);
                instance.videoDialog = playerDlg;

                if (options.fullscreen) {
                    document.body.classList.add('hide-scroll');
                }

                if (options.fullscreen && playerDlg.animate && !browser.slow) {
                    zoomIn(playerDlg, 1).onfinish = function () {
                        resolve(videoElement);
                    };
                } else {
                    resolve(videoElement);
                }
            });
        } else {
            // we need to hide scrollbar when starting playback from page with animated background
            if (options.fullscreen) {
                document.body.classList.add('hide-scroll');
            }

            resolve(dlg.querySelector('#player'));
        }
    });
}

function onVideoResize() {
    const instance = this;
    const player = instance.currentYoutubePlayer;
    const dlg = instance.videoDialog;
    if (player && dlg) {
        player.setSize(dlg.offsetWidth, dlg.offsetHeight);
    }
}

function clearTimeUpdateInterval(instance) {
    if (instance.timeUpdateInterval) {
        clearInterval(instance.timeUpdateInterval);
    }
    instance.timeUpdateInterval = null;
}

function onEndedInternal(instance) {
    clearTimeUpdateInterval(instance);
    const resizeListener = instance.resizeListener;
    if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
        window.removeEventListener('orientationChange', resizeListener);
        instance.resizeListener = null;
    }

    const stopInfo = {
        src: instance._currentSrc
    };

    Events.trigger(instance, 'stopped', [stopInfo]);

    instance._currentSrc = null;
    if (instance.currentYoutubePlayer) {
        instance.currentYoutubePlayer.destroy();
    }
    instance.currentYoutubePlayer = null;
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}

function onTimeUpdate() {
    Events.trigger(this, 'timeupdate');
}

function onPlaying(instance, playOptions, resolve) {
    if (!instance.started) {
        instance.started = true;
        resolve();
        clearTimeUpdateInterval(instance);
        instance.timeUpdateInterval = setInterval(onTimeUpdate.bind(instance), 500);

        if (playOptions.fullscreen) {
            appRouter.showVideoOsd().then(() => {
                instance.videoDialog.classList.remove('onTop');
            });
        } else {
            setBackdropTransparency(TRANSPARENCY_LEVEL.Backdrop);
            instance.videoDialog.classList.remove('onTop');
        }

        loading.hide();
    }
}

function setCurrentSrc(instance, elem, options) {
    return new Promise((resolve, reject) => {
        instance._currentSrc = options.url;
        const params = new URLSearchParams(options.url.split('?')[1]); /* eslint-disable-line compat/compat */
        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        window.onYouTubeIframeAPIReady = function () {
            instance.currentYoutubePlayer = new YT.Player('player', {
                height: instance.videoDialog.offsetHeight,
                width: instance.videoDialog.offsetWidth,
                videoId: params.get('v'),
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': function (event) {
                        if (event.data === YT.PlayerState.PLAYING) {
                            onPlaying(instance, options, resolve);
                        } else if (event.data === YT.PlayerState.ENDED) {
                            onEndedInternal(instance);
                        } else if (event.data === YT.PlayerState.PAUSED) {
                            Events.trigger(instance, 'pause');
                        }
                    },
                    'onError': (e) => reject(errorCodes[e.data] || 'ErrorDefault')
                },
                playerVars: {
                    controls: 0,
                    enablejsapi: 1,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    fs: 0,
                    playsinline: 1
                }
            });

            let resizeListener = instance.resizeListener;
            if (resizeListener) {
                window.removeEventListener('resize', resizeListener);
                window.addEventListener('resize', resizeListener);
            } else {
                resizeListener = instance.resizeListener = onVideoResize.bind(instance);
                window.addEventListener('resize', resizeListener);
            }
            window.removeEventListener('orientationChange', resizeListener);
            window.addEventListener('orientationChange', resizeListener);
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            window.onYouTubeIframeAPIReady();
        }
    });
}

class YoutubePlayer {
    constructor() {
        this.name = 'Youtube Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'youtubeplayer';

        // Let any players created by plugins take priority
        this.priority = 1;
    }
    play(options) {
        this.started = false;
        const instance = this;

        return createMediaElement(this, options).then((elem) => {
            return setCurrentSrc(instance, elem, options);
        });
    }
    stop(destroyPlayer) {
        const src = this._currentSrc;

        if (src) {
            if (this.currentYoutubePlayer) {
                this.currentYoutubePlayer.stopVideo();
            }
            onEndedInternal(this);

            if (destroyPlayer) {
                this.destroy();
            }
        }

        return Promise.resolve();
    }
    destroy() {
        setBackdropTransparency(TRANSPARENCY_LEVEL.None);
        document.body.classList.remove('hide-scroll');

        const dlg = this.videoDialog;
        if (dlg) {
            this.videoDialog = null;

            dlg.parentNode.removeChild(dlg);
        }
    }
    canPlayMediaType(mediaType) {
        mediaType = (mediaType || '').toLowerCase();

        return mediaType === 'audio' || mediaType === 'video';
    }
    canPlayItem() {
        // Does not play server items
        return false;
    }
    canPlayUrl(url) {
        return url.toLowerCase().indexOf('youtube.com') !== -1;
    }
    getDeviceProfile() {
        return Promise.resolve({});
    }
    currentSrc() {
        return this._currentSrc;
    }
    setSubtitleStreamIndex() {
        // not supported
    }
    canSetAudioStreamIndex() {
        return false;
    }
    setAudioStreamIndex() {
        // not supported
    }
    // Save this for when playback stops, because querying the time at that point might return 0
    currentTime(val) {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (currentYoutubePlayer) {
            if (val != null) {
                currentYoutubePlayer.seekTo(val / 1000, true);
                return;
            }

            return currentYoutubePlayer.getCurrentTime() * 1000;
        }
    }
    duration() {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (currentYoutubePlayer) {
            return currentYoutubePlayer.getDuration() * 1000;
        }
        return null;
    }
    pause() {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (currentYoutubePlayer) {
            currentYoutubePlayer.pauseVideo();

            const instance = this;

            // This needs a delay before the youtube player will report the correct player state
            setTimeout(() => {
                Events.trigger(instance, 'pause');
            }, 200);
        }
    }
    unpause() {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (currentYoutubePlayer) {
            currentYoutubePlayer.playVideo();

            const instance = this;

            // This needs a delay before the youtube player will report the correct player state
            setTimeout(() => {
                Events.trigger(instance, 'unpause');
            }, 200);
        }
    }
    paused() {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (currentYoutubePlayer) {
            return currentYoutubePlayer.getPlayerState() === 2;
        }

        return false;
    }
    volume(val) {
        if (val != null) {
            return this.setVolume(val);
        }

        return this.getVolume();
    }
    setVolume(val) {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (currentYoutubePlayer && val != null) {
            currentYoutubePlayer.setVolume(val);
        }
    }
    getVolume() {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (currentYoutubePlayer) {
            return currentYoutubePlayer.getVolume();
        }
    }
    setMute(mute) {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (mute) {
            if (currentYoutubePlayer) {
                currentYoutubePlayer.mute();
            }
        } else if (currentYoutubePlayer) {
            currentYoutubePlayer.unMute();
        }
    }
    isMuted() {
        const currentYoutubePlayer = this.currentYoutubePlayer;

        if (currentYoutubePlayer) {
            return currentYoutubePlayer.isMuted();
        }
    }
}

export default YoutubePlayer;
