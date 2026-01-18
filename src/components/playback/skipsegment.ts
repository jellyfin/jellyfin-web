import { PlaybackManager } from './playbackmanager';
import { TICKS_PER_MILLISECOND, TICKS_PER_SECOND } from 'constants/time';
import type { MediaSegmentDto } from '@jellyfin/sdk/lib/generated-client/models/media-segment-dto';
import type { PlaybackStopInfo } from 'types/playbackStopInfo';
import { PlaybackSubscriber } from 'apps/stable/features/playback/utils/playbackSubscriber';
import { isInSegment } from 'apps/stable/features/playback/utils/mediaSegments';
import Events, { type Event } from 'utils/events';
import type { Player } from './playbackmanager';
import { EventType } from 'constants/eventType';
import './skipbutton.scss';
import dom from 'utils/dom';
import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import focusManager from 'components/focusManager';
import layoutManager from 'components/layoutManager';

interface ShowOptions {
    animate?: boolean;
    keep?: boolean;
    focus?: boolean;
}

function onHideComplete(this: HTMLButtonElement) {
    if (this) {
        // Handle focus after the hide transition completes
        if (document.activeElement === this) {
            this.blur();
            const pauseButton = document.querySelector('.btnPause');
            if (pauseButton && focusManager.isCurrentlyFocusable(pauseButton)) {
                focusManager.focus(pauseButton);
            }
        }

        this.classList.add('hide');
    }
}

class SkipSegment extends PlaybackSubscriber {
    private skipElement: HTMLButtonElement | null;
    private currentSegment: MediaSegmentDto | null | undefined;
    private hideTimeout: ReturnType<typeof setTimeout> | null | undefined;

    constructor(playbackManager: PlaybackManager) {
        super(playbackManager);

        this.skipElement = null;
        this.onOsdChanged = this.onOsdChanged.bind(this);
    }

    createSkipElement() {
        if (!this.skipElement && this.currentSegment) {
            let buttonHtml = '';

            // FIXME: Move skip button to the video OSD
            buttonHtml += '<div class="skip-button-container"><button is="emby-button" class="skip-button hide skip-button-hidden"></button></div>';

            document.body.insertAdjacentHTML('beforeend', buttonHtml);

            this.skipElement = document.body.querySelector('.skip-button');
            if (this.skipElement) {
                this.skipElement.addEventListener('click', () => {
                    const time = this.playbackManager.currentTime(this.player as unknown as Player) * TICKS_PER_MILLISECOND;
                    if (this.currentSegment?.EndTicks) {
                        if (time < this.currentSegment.EndTicks - TICKS_PER_SECOND) {
                            this.playbackManager.seek(this.currentSegment.EndTicks);
                        } else {
                            this.hideSkipButton();
                        }
                    }
                });
            }
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
            dom.removeEventListener(elem, dom.whichTransitionEvent(), onHideComplete, {
                once: true
            });
            elem.classList.remove('hide');
            if (!options.animate) {
                elem.classList.add('no-transition');
            } else {
                elem.classList.remove('no-transition');
            }

            // eslint-disable-next-line sonarjs/void-use
            void elem.offsetWidth;

            const hasFocus = document.activeElement && focusManager.isCurrentlyFocusable(document.activeElement);
            if (options.focus && !hasFocus) {
                focusManager.focus(elem);
            }

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
            // eslint-disable-next-line sonarjs/void-use
            void elem.offsetWidth;

            requestAnimationFrame(() => {
                elem.classList.add('skip-button-hidden');

                dom.addEventListener(elem, dom.whichTransitionEvent(), onHideComplete, {
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
                    keep: true,
                    focus: false
                });
            } else if (!this.hideTimeout) {
                this.hideSkipButton();
            }
        }
    }

    onPromptSkip(e: Event, segment: MediaSegmentDto) {
        if (this.player && segment.EndTicks != null
            && segment.EndTicks >= this.playbackManager.currentItem(this.player as unknown as Player).RunTimeTicks
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

            this.showSkipButton({
                animate: true,
                focus: layoutManager.tv
            });
        }
    }

    onPlayerTimeUpdate() {
        if (this.currentSegment) {
            const time = this.playbackManager.currentTime(this.player as unknown as Player) * TICKS_PER_MILLISECOND;

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

    onPlaybackStop(_e: Event, playbackStopInfo: PlaybackStopInfo) {
        this.currentSegment = null;
        this.hideSkipButton();
        if (!playbackStopInfo.nextItem) {
            Events.off(document, EventType.SHOW_VIDEO_OSD, this.onOsdChanged);
        }
    }
}

export const bindSkipSegment = (playbackManager: PlaybackManager) => new SkipSegment(playbackManager);
