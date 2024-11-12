import { PlaybackManager } from './playbackmanager';
import { TICKS_PER_MILLISECOND, TICKS_PER_SECOND } from 'constants/time';
import type { MediaSegmentDto } from '@jellyfin/sdk/lib/generated-client/models/media-segment-dto';
import { PlaybackSubscriber } from 'apps/stable/features/playback/utils/playbackSubscriber';
import { isInSegment } from 'apps/stable/features/playback/utils/mediaSegments';
import Events, { type Event } from 'utils/events';
import { EventType } from 'types/eventType';
import './skipbutton.scss';
import dom from 'scripts/dom';
import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';

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
                const time = this.playbackManager.currentTime() * TICKS_PER_MILLISECOND;
                if (this.currentSegment?.EndTicks) {
                    if (time < this.currentSegment.EndTicks - TICKS_PER_SECOND) {
                        this.playbackManager.seek(this.currentSegment.EndTicks);
                    } else {
                        this.hideSkipButton();
                    }
                }
            });

            document.body.appendChild(elem);
            this.skipElement = elem;
        }
    }

    setButtonText() {
        if (this.skipElement && this.currentSegment) {
            this.skipElement.innerHTML = globalize.translate('MediaSegmentSkipPrompt', globalize.translate(`MediaSegmentType.${this.currentSegment.Type}`));
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
                    this.hideTimeout = setTimeout(this.hideSkipButton.bind(this), 8000);
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

    onPromptSkip(e: Event, segment: MediaSegmentDto) {
        if (this.player && segment.EndTicks != null
            && segment.EndTicks >= this.playbackManager.currentItem(this.player).RunTimeTicks
            && this.playbackManager.getNextItem()
            && userSettings.enableNextVideoInfoOverlay()
        ) {
            // Don't display button when UpNextDialog is expected.
            return;
        }
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
