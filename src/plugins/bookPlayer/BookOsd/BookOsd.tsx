import React, { type FC, useCallback, useState } from 'react';

import './BookOsd.scss';
import IconButton from '../../../elements/emby-button/IconButton';
import globalize from 'lib/globalize';
import * as userSettings from '../../../scripts/settings/userSettings';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

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
    onToggleFullscreen?: () => void;
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

    const [direction, setDirection] = useState(settings.langDir === 'rtl');
    const [layout, setLayout] = useState(settings.pagesPerView === 1);
    const [fullscreen, setFullscreen] = useState(false);

    const onClickDirection = useCallback(() => {
        onToggleDirection?.();
        setDirection(state => !state);
    }, [onToggleDirection]);

    const onClickLayout = useCallback(() => {
        onToggleLayout?.();
        setLayout(state => !state);
    }, [onToggleLayout]);

    const onClickFullscreen = useCallback(() => {
        onToggleFullscreen?.();
        setFullscreen(state => !state);
    }, [onToggleFullscreen]);

    return (
        <div className='bookOsd'>
            <div className='bookOsdRow bookOsdTop'>
                <IconButton onClick={onExit} icon='arrow_back' title={globalize.translate('ButtonBack')} />
                <span className='bookOsdTitle'>{item.Name}</span>
            </div>

            <div className='bookOsdRow bookOsdBottom'>
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
                        title={direction ? 'Right to Left' : 'Left to Right'}
                    />
                )}

                {onToggleLayout && (
                    <IconButton
                        onClick={onClickLayout}
                        icon={layout ? 'import_contacts' : 'devices_fold'}
                        title={layout ? 'Double Page View' : 'Single Page View'}
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
