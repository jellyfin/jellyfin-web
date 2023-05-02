import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { ViewQuerySettings } from '../../types/interface';

interface SortProps {
    getSortMenuOptions: () => {
        name: string;
        value: string;
    }[];
    viewQuerySettings: ViewQuerySettings;
    setViewQuerySettings: React.Dispatch<React.SetStateAction<ViewQuerySettings>>;
}

const Sort: FC<SortProps> = ({
    getSortMenuOptions,
    viewQuerySettings,
    setViewQuerySettings
}) => {
    const element = useRef<HTMLDivElement>(null);

    const showSortMenu = useCallback(() => {
        import('../sortmenu/sortmenu').then(({ default: SortMenu }) => {
            const sortMenu = new SortMenu();
            sortMenu.show({
                settings: viewQuerySettings,
                sortOptions: getSortMenuOptions(),
                setSortValues: setViewQuerySettings
            }).catch(() => {
                // sort menu closed
            });
        }).catch(err => {
            console.error('[Sort] failed to load sort menu', err);
        });
    }, [getSortMenuOptions, viewQuerySettings, setViewQuerySettings]);

    useEffect(() => {
        const btnSort = element.current?.querySelector('.btnSort');

        btnSort?.addEventListener('click', showSortMenu);

        return () => {
            btnSort?.removeEventListener('click', showSortMenu);
        };
    }, [showSortMenu]);

    return (
        <div ref={element}>
            <IconButtonElement
                is='paper-icon-button-light'
                className='btnSort autoSize'
                title='Sort'
                icon='material-icons sort_by_alpha'
            />
        </div>
    );
};

export default Sort;
