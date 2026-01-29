import { PlaybackStatus } from '../../store/types';
import { logger } from '../../utils/logger';
import { HTML5Player, PlayerEvents } from './HTML5Player';

export interface VideoPlayerEvents extends PlayerEvents {
    onVideoResize?: (width: number, height: number) => void;
    onSubtitleTrackChange?: (index: number) => void;
    onAudioTrackChange?: (index: number) => void;
}

export class VideoPlayer extends HTML5Player {
    private videoEvents: VideoPlayerEvents = {};

    constructor() {
        super('video');
        this.setupVideoListeners();
    }

    setVideoEvents(events: VideoPlayerEvents) {
        this.videoEvents = events;
        this.setEvents(events);
    }

    getVideoElement(): HTMLVideoElement {
        return this.getElement() as HTMLVideoElement;
    }

    setPoster(url: string) {
        this.getVideoElement().poster = url;
    }

    getVideoWidth(): number {
        return this.getVideoElement().videoWidth;
    }

    getVideoHeight(): number {
        return this.getVideoElement().videoHeight;
    }

    // Picture-in-Picture
    async requestPictureInPicture() {
        const video = this.getVideoElement();
        if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
            try {
                if (document.pictureInPictureElement !== video) {
                    await video.requestPictureInPicture();
                } else {
                    await document.exitPictureInPicture();
                }
            } catch (error) {
                logger.error('Error toggling PiP', { component: 'VideoPlayer' }, error as Error);
            }
        }
    }

    // Fullscreen
    requestFullscreen() {
        const video = this.getVideoElement();
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if ((video as any).webkitRequestFullscreen) {
            (video as any).webkitRequestFullscreen();
        } else if ((video as any).msRequestFullscreen) {
            (video as any).msRequestFullscreen();
        }
    }

    private setupVideoListeners() {
        const video = this.getVideoElement();
        video.addEventListener('resize', this.handleResize);

        // Audio/Subtitle track changes often happen via HLS/Dash events,
        // but native tracks trigger 'change' on the track list
        if (video.textTracks) {
            video.textTracks.addEventListener('change', this.handleTrackChange);
        }
    }

    private handleResize = () => {
        const video = this.getVideoElement();
        this.videoEvents.onVideoResize?.(video.videoWidth, video.videoHeight);
    };

    private handleTrackChange = () => {
        // Implementation depends on how we want to expose tracks
        // For now, just a placeholder
    };

    destroy() {
        const video = this.getVideoElement();
        video.removeEventListener('resize', this.handleResize);
        if (video.textTracks) {
            video.textTracks.removeEventListener('change', this.handleTrackChange);
        }
        super.destroy();
    }
}
