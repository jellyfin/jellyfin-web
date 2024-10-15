import { PlaybackManager } from './playbackmanager';
import { TICKS_PER_MILLISECOND } from 'constants/time';
import { MediaSegmentDto, MediaSegmentType } from '@jellyfin/sdk/lib/generated-client';
import { PlaybackSubscriber } from 'apps/stable/features/playback/utils/playbackSubscriber';
import { isInSegment } from 'apps/stable/features/playback/utils/mediaSegments';
import Events, { type Event } from '../../utils/events';
import { EventType } from 'types/eventType';
import './skipbutton.scss';
import dom from 'scripts/dom';
import globalize from 'lib/globalize';

interface ShowOptions {
    animate?: boolean;
    keep?: boolean;
}

class SkipSegment extends PlaybackSubscriber {
    private skipElement: HTMLButtonElement | undefined;
    private currentSegment: MediaSegmentDto | null | undefined;
    private hideTimeout: ReturnType<typeof setTimeout> | null | undefined;

    constructor(playbackManager: PlaybackManager) {
        super(playbackManager);

        this.onOsdChanged = this.onOsdChanged.bind(this);
    }

    onHideComplete() {
        if (this.skipElement) {
            this.skipElement.classList.add('hide');
        }
    }

    createSkipElement() {
        if (!this.skipElement && this.currentSegment) {
            const elem = document.createElement('button');
            elem.classList.add('skip-button');
            elem.classList.add('hide');
            elem.classList.add('skip-button-hidden');

            elem.addEventListener('click', () => {
                if (this.currentSegment) {
                    this.playbackManager.seek(this.currentSegment.EndTicks);
                }
            });

            document.body.appendChild(elem);
            this.skipElement = elem;
        }
    }

    setButtonText() {
        if (this.skipElement && this.currentSegment) {
            if (this.player && this.currentSegment.EndTicks
                && this.currentSegment.Type === MediaSegmentType.Outro
                && this.currentSegment.EndTicks >= this.playbackManager.currentItem(this.player).RunTimeTicks
                && this.playbackManager.getNextItem()
            ) {
                // Display "Next Episode" if it's an outro segment, exceeds or is equal to the runtime, and if there is a next track.
                this.skipElement.innerHTML += globalize.translate('MediaSegmentNextEpisode');
            } else {
                this.skipElement.innerHTML = globalize.translate('MediaSegmentSkipPrompt', globalize.translate(`MediaSegmentType.${this.currentSegment.Type}`));
            }
            this.skipElement.innerHTML += '<span class="material-icons skip_next" aria-hidden="true"></span>';
        }
    }

    showSkipButton(options: ShowOptions) {
        const elem = this.skipElement;
        if (elem) {
            this.clearHideTimeout();
            dom.removeEventListener(elem, dom.whichTransitionEvent(), this.onHideComplete, {
                once: true
            });
            elem.classList.remove('hide');
            if (!options.animate) {
                elem.classList.add('no-transition');
            } else {
                elem.classList.remove('no-transition');
            }

            void elem.offsetWidth;

            requestAnimationFrame(() => {
                elem.classList.remove('skip-button-hidden');

                if (!options.keep) {
                    this.hideTimeout = setTimeout(this.hideSkipButton.bind(this), 6000);
                }
            });
        }
    }

    hideSkipButton() {
        const elem = this.skipElement;
        if (elem) {
            elem.classList.remove('no-transition');
            void elem.offsetWidth;

            requestAnimationFrame(() => {
                elem.classList.add('skip-button-hidden');

                dom.addEventListener(elem, dom.whichTransitionEvent(), this.onHideComplete, {
                    once: true
                });
            });
        }
    }

    clearHideTimeout() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    onOsdChanged(_e: Event, isOpen: boolean) {
        if (this.currentSegment) {
            if (isOpen) {
                this.showSkipButton({
                    animate: false,
                    keep: true
                });
            } else if (!this.hideTimeout) {
                this.hideSkipButton();
            }
        }
    }

    onPromptSkip(segment: MediaSegmentDto) {
        if (!this.currentSegment) {
            this.currentSegment = segment;

            this.createSkipElement();

            this.setButtonText();

            this.showSkipButton({ animate: true });
        }
    }

    onPlayerTimeUpdate() {
        if (this.currentSegment) {
            const time = this.playbackManager.currentTime(this.player) * TICKS_PER_MILLISECOND;

            if (!isInSegment(this.currentSegment, time)) {
                this.currentSegment = null;
                this.hideSkipButton();
            }
        }
    }

    onPlayerChange(): void {
        if (this.playbackManager.getCurrentPlayer()) {
            Events.off(document, EventType.SHOW_VIDEO_OSD, this.onOsdChanged);
            Events.on(document, EventType.SHOW_VIDEO_OSD, this.onOsdChanged);
        }
    }

    onPlaybackStop() {
        this.currentSegment = null;
        this.hideSkipButton();
        Events.off(document, EventType.SHOW_VIDEO_OSD, this.onOsdChanged);
    }
}

export const bindSkipSegment = (playbackManager: PlaybackManager) => new SkipSegment(playbackManager);
