import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';

interface SortI {
    getSortMenuOptions: () => {
        name: string;
        value: string;
    }[]
    getSortValues: () => {
        sortBy: string;
        sortOrder: string;
    }
    getSettingsKey: () => string;
    reloadItems: () => void;
}

const Sort: FC<SortI> = ({ getSortMenuOptions, getSortValues, getSettingsKey, reloadItems }) => {
    const element = useRef<HTMLDivElement>(null);

    const showSortMenu = useCallback(() => {
        import('../../components/sortmenu/sortmenu').then(({default: SortMenu}) => {
            const sortMenu = new SortMenu();
            sortMenu.show({
                settingsKey: getSettingsKey(),
                settings: getSortValues(),
                sortOptions: getSortMenuOptions()
            }).then(() => {
                reloadItems();
            });
        });
    }, [getSettingsKey, getSortMenuOptions, getSortValues, reloadItems]);

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
