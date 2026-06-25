import React, { type FC, useCallback, useState } from 'react';

import './BookOsd.scss';
import IconButton from '../../../elements/emby-button/IconButton';
import globalize from 'lib/globalize';

interface BookOsdProps {
    title: string;
    onExit: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onOpenTableOfContents?: () => void;
    onRotateTheme?: () => void;
    onDecreaseFontSize?: () => void;
    onIncreaseFontSize?: () => void;
    onToggleFullscreen?: () => void;
    onToggleWakeLock?: () => void;
}

const BookOsd: FC<BookOsdProps> = ({
    title,
    onExit,
    onPrevious,
    onNext,
    onOpenTableOfContents,
    onRotateTheme,
    onDecreaseFontSize,
    onIncreaseFontSize,
    onToggleFullscreen,
    onToggleWakeLock
}) => {
    const [fullscreen, setFullscreen] = useState(false);
    const [wakeLockActive, setWakeLockActive] = useState(false);

    const onClickFullscreen = useCallback(() => {
        onToggleFullscreen?.();
        setFullscreen(state => !state);
    }, [onToggleFullscreen]);

    const onClickWakeLock = useCallback(() => {
        onToggleWakeLock?.();
        setWakeLockActive(state => !state);
    }, [onToggleWakeLock]);

    return (
        <div className='bookOsd'>
            <div className='bookOsdRow bookOsdTop'>
                <IconButton onClick={onExit} icon='arrow_back' title={globalize.translate('ButtonBack')} />
                <span className='bookOsdTitle'>{title}</span>
            </div>

            <div className='bookOsdRow bookOsdBottom'>
                <IconButton onClick={onPrevious} icon='navigate_before' title={globalize.translate('Previous')} />
                <IconButton onClick={onNext} icon='navigate_next' title={globalize.translate('Next')} />

                {onOpenTableOfContents && (
                    <IconButton
                        onClick={onOpenTableOfContents}
                        icon='toc'
                        title={globalize.translate('TableOfContents')}
                        className='bookOsdMargin'
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

                {onToggleWakeLock && (
                    <IconButton
                        onClick={onClickWakeLock}
                        icon={wakeLockActive ? 'bedtime_off' : 'bedtime'}
                        title={globalize.translate(wakeLockActive ? 'ButtonKeepScreenOff' : 'ButtonKeepScreenOn')}
                    />
                )}

                {onToggleFullscreen && (
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
