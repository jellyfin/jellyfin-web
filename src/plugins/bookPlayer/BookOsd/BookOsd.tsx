import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';

import './BookOsd.scss';
import IconButton from '../../../elements/emby-button/IconButton';

interface BookOsdProps {
    title: string;
}

const BookOsd: FC<BookOsdProps> = ({ title }) => {
    const [visible, setVisible] = useState(true);
    const timeout = useRef<number | null>(null);
    const onKeyDown = useCallback(() => console.log('onKeyDown triggered for BookOsd component'), []);

    const stopTimeout = useCallback(() => {
        clearTimeout(timeout.current ?? undefined);
        timeout.current = null;
    }, []);

    const hideOsd = useCallback(() => {
        stopTimeout();
        setVisible(false);
    }, [stopTimeout]);

    const showOsd = useCallback(() => {
        setVisible(true);
        stopTimeout();

        timeout.current = window.setTimeout(hideOsd, 2000);
    }, [hideOsd, stopTimeout]);

    useEffect(() => {
        showOsd();
        return () => stopTimeout();
    }, [showOsd, stopTimeout]);

    return (
        <div
            className='bookOsd'
            style={{ opacity: visible ? 1 : 0 }}
            role='button'
            tabIndex={-1}
            onKeyDown={onKeyDown}
            onClick={showOsd}
            onMouseMove={showOsd}
        >
            <div className='bookOsdRow'>
                <IconButton id='btnBookplayerExit' icon='arrow_back' />
                <span className='bookOsdTitle'>{title}</span>
            </div>

            <div className='bookOsdRow'>
                <IconButton id='btnBookplayerPrev' icon='navigate_before' />
                <IconButton id='btnBookplayerNext' icon='navigate_next' />
                <IconButton id='btnBookplayerToc' icon='toc' className='bookOsdMargin' />
                <IconButton id='btnBookplayerRotateTheme' icon='remove_red_eye' />
                <IconButton id='btnBookplayerDecreaseFontSize' icon='text_decrease' />
                <IconButton id='btnBookplayerIncreaseFontSize' icon='text_increase' />
                <IconButton id='btnBookplayerFullscreen' icon='fullscreen' />
            </div>
        </div>
    );
};

export default BookOsd;
