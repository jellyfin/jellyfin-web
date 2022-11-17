import React, { FC } from 'react';
import IconButton from '../../elements/emby-button/IconButton';
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
    const showSortMenu = () => {
        import('../sortmenu/sortmenu').then(({default: SortMenu}) => {
            const sortMenu = new SortMenu();
            sortMenu.show({
                settings: viewQuerySettings,
                sortOptions: getSortMenuOptions(),
                setSortValues: setViewQuerySettings
            });
        });
    };

    /*useEffect(() => {
        const btnSort = element.current?.querySelector('.btnSort');

        btnSort?.addEventListener('click', showSortMenu);

        return () => {
            btnSort?.removeEventListener('click', showSortMenu);
        };
    }, [showSortMenu]);*/

    return (
        <IconButton
            type='button'
            className='btnSort autoSize'
            title='Sort'
            icon='sort_by_alpha'
            onClick={showSortMenu}
        />
    );
};

export default Sort;
