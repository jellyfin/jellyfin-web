import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { ViewSettingsI } from './interface';

interface SortProps {
    getSortMenuOptions: () => {
        name: string;
        value: string;
    }[];
    viewSettings: ViewSettingsI
    setViewSettings: React.Dispatch<React.SetStateAction<ViewSettingsI>>;
}

const Sort: FC<SortProps> = ({
    getSortMenuOptions,
    viewSettings,
    //setSortValues,
    setViewSettings
}) => {
    const element = useRef<HTMLDivElement>(null);

    const showSortMenu = useCallback(() => {
        import('../../components/sortmenu/sortmenu').then(({default: SortMenu}) => {
            const sortMenu = new SortMenu();
            sortMenu.show({
                settings: viewSettings,
                sortOptions: getSortMenuOptions(),
                setSortValues: setViewSettings
            });
        });
    }, [getSortMenuOptions, viewSettings, setViewSettings]);

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
