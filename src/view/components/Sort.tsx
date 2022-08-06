import React, { FunctionComponent, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import libraryBrowser from '../../scripts/libraryBrowser';
import * as userSettings from '../../scripts/settings/userSettings';
import { IQuery } from './type';

type SortProps = {
    sortMenuOptions: () => { name: string; id: string}[];
    query: IQuery;
    savedQueryKey: string;
    reloadItems: () => void;
}

const Sort: FunctionComponent<SortProps> = ({ sortMenuOptions, query, savedQueryKey, reloadItems }: SortProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const btnSort = element.current?.querySelector('.btnSort');

        if (btnSort) {
            btnSort.addEventListener('click', (e) => {
                libraryBrowser.showSortMenu({
                    items: sortMenuOptions(),
                    callback: () => {
                        query.StartIndex = 0;
                        userSettings.saveQuerySettings(savedQueryKey, query);
                        reloadItems();
                    },
                    query: query,
                    button: e.target
                });
            });
        }
    }, [sortMenuOptions, query, reloadItems, savedQueryKey]);

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
