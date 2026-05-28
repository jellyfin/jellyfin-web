import React, { type FC, useCallback, useState } from 'react';

import './BookOsd.scss';
import IconButton from '../../../elements/emby-button/IconButton';

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
    onToggleFullscreen
}) => {
    const [fullscreen, setFullscreen] = useState(false);

    const onClickFullscreen = useCallback(() => {
        onToggleFullscreen?.();
        setFullscreen(state => !state);
    }, [onToggleFullscreen]);

    return (
        <div className='bookOsd'>
            <div className='bookOsdRow bookOsdTop'>
                <IconButton onClick={onExit} icon='arrow_back' />
                <span className='bookOsdTitle'>{title}</span>
            </div>

            <div className='bookOsdRow bookOsdBottom'>
                <IconButton onClick={onPrevious} icon='navigate_before' />
                <IconButton onClick={onNext} icon='navigate_next' />
                <IconButton
                    onClick={onOpenTableOfContents}
                    style={{ display: onOpenTableOfContents ? 'flex' : 'none' }}
                    icon='toc'
                    className='bookOsdMargin' />
                <IconButton
                    onClick={onRotateTheme}
                    style={{ display: onRotateTheme ? 'flex' : 'none' }}
                    icon='remove_red_eye' />
                <IconButton
                    onClick={onDecreaseFontSize}
                    style={{ display: onDecreaseFontSize ? 'flex' : 'none' }}
                    icon='text_decrease' />
                <IconButton
                    onClick={onIncreaseFontSize}
                    style={{ display: onIncreaseFontSize ? 'flex' : 'none' }}
                    icon='text_increase' />
                <IconButton
                    onClick={onClickFullscreen}
                    style={{ display: onToggleFullscreen ? 'flex' : 'none' }}
                    icon={fullscreen ? 'fullscreen_exit' : 'fullscreen'} />
            </div>
        </div>
    );
};

export default BookOsd;
