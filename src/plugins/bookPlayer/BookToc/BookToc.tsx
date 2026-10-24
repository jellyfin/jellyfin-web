import React, { type FC, useCallback, useState } from 'react';

import './BookToc.scss';
import IconButton from '../../../elements/emby-button/IconButton';
import globalize from 'lib/globalize';
import { Rendition } from 'epubjs';
import type { NavItem } from 'epubjs/types/navigation';
import Dialog from '@mui/material/Dialog';

interface BookTocProps {
    rendition: () => Rendition;
    onClose: () => void;
}

const BookToc: FC<BookTocProps> = ({ rendition, onClose }) => {
    const [active, setActive] = useState(true);

    const onClickClose = useCallback(() => setActive(false), []);

    const onClickChapter = useCallback((chapter: NavItem) => (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        void rendition()?.display(rendition().book.spine.get(chapter.href).href);
        setActive(false);
    }, [rendition]);

    const renderChapter = (chapter: NavItem): React.JSX.Element => {
        return (
            <li key={chapter.href}>
                <a href={chapter.href} onClick={onClickChapter(chapter)}>
                    {chapter.label}
                </a>
                {(chapter.subitems?.length ?? 0) > 0 && (
                    <ul style={{ padding: 0 }}>{chapter.subitems?.map(renderChapter)}</ul>
                )}
            </li>
        );
    };

    return (
        <Dialog
            disablePortal
            fullScreen
            className='bookToc'
            open={active}
            onClose={onClickClose}
            slotProps={{ transition: { onExited: onClose } }}
        >
            <div className='bookTocHeader'>
                <IconButton
                    onClick={onClickClose}
                    icon='arrow_back'
                    title={globalize.translate('ButtonClose')}
                />
                <span className='bookTocTitle'>{globalize.translate('TableOfContents')}</span>
            </div>
            <ul className='bookTocList'>
                {rendition()?.book.navigation.toc.map(renderChapter)}
            </ul>
        </Dialog>
    );
};

export default BookToc;
