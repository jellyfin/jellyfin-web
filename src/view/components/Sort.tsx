import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { QueryI } from './interface';

interface SortProps {
    getSortMenuOptions: () => {
        name: string;
        value: string;
    }[]
    getSortValues: () => {
        sortBy: string;
        sortOrder: string;
    }
    getSettingsKey: () => string;
    setQuery: React.Dispatch<React.SetStateAction<QueryI>>;
    reloadItems: () => void;
}

const Sort: FC<SortProps> = ({ getSortMenuOptions, getSortValues, getSettingsKey, setQuery, reloadItems }) => {
    const element = useRef<HTMLDivElement>(null);

    const showSortMenu = useCallback(() => {
        import('../../components/sortmenu/sortmenu').then(({default: SortMenu}) => {
            const sortMenu = new SortMenu();
            sortMenu.show({
                settingsKey: getSettingsKey(),
                settings: getSortValues(),
                sortOptions: getSortMenuOptions()
            }).then(() => {
                setQuery({StartIndex: 0});
                reloadItems();
            });
        });
    }, [getSettingsKey, getSortMenuOptions, getSortValues, reloadItems, setQuery]);

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
