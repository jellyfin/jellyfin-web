import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';

import './BookOsd.scss';
import IconButton from '../../../elements/emby-button/IconButton';
import globalize from 'lib/globalize';
import * as userSettings from '../../../scripts/settings/userSettings';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import Screenfull from 'screenfull';
import LinearProgress from '@mui/material/LinearProgress';
import { PlayerEvent } from 'apps/legacy/features/playback/constants/playerEvent';
import { playbackManager } from 'components/playback/playbackmanager';
import Events, { type Event } from 'utils/events';
import { PlaybackManagerEvent } from 'apps/legacy/features/playback/constants/playbackManagerEvent';
import type { PlayerState } from 'types/playbackStopInfo';
import type { PlayerPlugin } from 'types/plugin';

interface BookOsdProps {
    item: BaseItemDto;
    onExit: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onOpenTableOfContents?: () => void;
    onRotateTheme?: () => void;
    onDecreaseFontSize?: () => void;
    onIncreaseFontSize?: () => void;
    onToggleDirection?: () => void;
    onToggleLayout?: () => void;
    onToggleFullscreen: () => void;
}

interface ComicsPlayerSettings {
    langDir?: string;
    pagesPerView?: number;
}

const BookOsd: FC<BookOsdProps> = ({
    item,
    onExit,
    onPrevious,
    onNext,
    onOpenTableOfContents,
    onRotateTheme,
    onDecreaseFontSize,
    onIncreaseFontSize,
    onToggleDirection,
    onToggleLayout,
    onToggleFullscreen
}) => {
    const settings = userSettings.getComicsPlayerSettings(item.Id!) as ComicsPlayerSettings;
    const timeout = useRef<ReturnType<typeof setTimeout>>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = useRef<any>(undefined);

    const [direction, setDirection] = useState(settings.langDir === 'rtl');
    const [layout, setLayout] = useState(settings.pagesPerView === 2);
    const [fullscreen, setFullscreen] = useState(false);
    const [visible, setVisible] = useState(true);
    const [position, setPosition] = useState(-1);
    const [duration, setDuration] = useState(100);

    const scheduleHide = useCallback(() => {
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => setVisible(false), 2000);
    }, []);

    const updateFullscreen = useCallback((state: boolean) => {
        if (Screenfull.isEnabled && Screenfull.isFullscreen !== state) {
            void Screenfull.toggle();
        } else if (window.NativeShell) {
            state ? window.NativeShell.enableFullscreen() : window.NativeShell.disableFullscreen();
        }
    }, []);

    const onClickDirection = useCallback(() => {
        onToggleDirection?.();
        setDirection(state => !state);
    }, [onToggleDirection]);

    const onClickLayout = useCallback(() => {
        onToggleLayout?.();
        setLayout(state => !state);
    }, [onToggleLayout]);

    const onClickFullscreen = useCallback(() => {
        updateFullscreen(!fullscreen);
        onToggleFullscreen?.();
        setFullscreen(state => !state);
    }, [onToggleFullscreen, updateFullscreen, fullscreen]);

    useEffect(() => {
        const onPointerMove = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse') return;

            scheduleHide();
            setVisible(true);
        };

        const onClick = (event: MouseEvent) => {
            // apply this before the BookOsd check so IconButton clicks will reset the timer
            scheduleHide();

            if ((event.target as Element | null)?.closest?.('.bookOsdRow')) return;
            setVisible(state => !state);
        };

        scheduleHide();
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('click', onClick);

        return () => {
            clearTimeout(timeout.current);
            updateFullscreen(false);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('click', onClick);
        };
    }, [scheduleHide, updateFullscreen]);

    useEffect(() => {
        const onStateChange = (_e: Event, _newState: PlayerState) => {
            // special case to handle EPUB progress as percentage value
            if (_newState.NowPlayingItem?.Path?.endsWith('.epub')) {
                setPosition(Math.floor(player.current?.currentTime() / 10));
                setDuration(100);
            } else {
                setPosition(player.current?.currentTime());
                setDuration(player.current?.duration());
            }
        };

        const onPlaybackStart = (_e: Event, _player: PlayerPlugin, _state?: PlayerState) => {
            player.current = _player;

            Events.on(player.current, PlayerEvent.StateChange, onStateChange);
            onStateChange(_e, _state!);
        };

        Events.on(playbackManager, PlaybackManagerEvent.PlaybackStart, onPlaybackStart);

        return () => {
            Events.off(playbackManager, PlaybackManagerEvent.PlaybackStart, onPlaybackStart);
            Events.off(player.current, PlayerEvent.StateChange, onStateChange);
        };
    }, []);

    return (
        <div className='bookOsd'>
            <div className='bookOsdRow' style={{ paddingTop: 'env(safe-area-inset-top)', ...(!visible && { opacity: 0, pointerEvents: 'none' }) }}>
                <IconButton onClick={onExit} icon='arrow_back' title={globalize.translate('ButtonBack')} />
                <span className='bookOsdTitle'>{item.Name}</span>
            </div>

            <div className='bookOsdRow bookOsdProgressRow' style={{ ...(!visible && { opacity: 0, pointerEvents: 'none' }) }}>
                <span className='bookOsdProgressText'>{position + 1}</span>
                <LinearProgress
                    variant='determinate'
                    value={position !== 0 ? position / (duration - 1) * 100 : 0}
                    style={{ flex: 1 }}
                />
                <span className='bookOsdProgressText'>{duration}</span>
            </div>

            <div className='bookOsdRow' style={{ paddingBottom: 'env(safe-area-inset-bottom)', ...(!visible && { opacity: 0, pointerEvents: 'none' }) }}>
                <IconButton onClick={onPrevious} icon='navigate_before' title={globalize.translate('Previous')} />
                <IconButton onClick={onNext} icon='navigate_next' title={globalize.translate('Next')} />
                <div className='bookOsdSpacer' />

                {onOpenTableOfContents && (
                    <IconButton
                        onClick={onOpenTableOfContents}
                        icon='toc'
                        title={globalize.translate('TableOfContents')}
                    />
                )}

                {onRotateTheme && (
                    <IconButton
                        onClick={onRotateTheme}
                        icon='remove_red_eye'
                        title={globalize.translate('LabelTheme')}
                    />
                )}

                {onDecreaseFontSize && (
                    <IconButton
                        onClick={onDecreaseFontSize}
                        icon='text_decrease'
                        title={globalize.translate('Smaller')}
                    />
                )}

                {onIncreaseFontSize && (
                    <IconButton
                        onClick={onIncreaseFontSize}
                        icon='text_increase'
                        title={globalize.translate('Larger')}
                    />
                )}

                {onToggleDirection && (
                    <IconButton
                        onClick={onClickDirection}
                        icon={direction ? 'arrow_circle_left' : 'arrow_circle_right'}
                        title={globalize.translate(direction ? 'ViewRightToLeft' : 'ViewLeftToRight')}
                    />
                )}

                {onToggleLayout && (
                    <IconButton
                        onClick={onClickLayout}
                        icon={layout ? 'import_contacts' : 'devices_fold'}
                        title={globalize.translate(layout ? 'ViewDoublePage' : 'ViewSinglePage')}
                    />
                )}

                {(Screenfull.isEnabled || window.NativeShell) && (
                    <IconButton
                        onClick={onClickFullscreen}
                        icon={fullscreen ? 'fullscreen_exit' : 'fullscreen'}
                        title={globalize.translate(fullscreen ? 'ExitFullscreen' : 'Fullscreen')}
                    />
                )}
            </div>
        </div>
    );
};

export default BookOsd;
