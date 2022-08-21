import React, { FunctionComponent, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import libraryBrowser from '../../scripts/libraryBrowser';
import * as userSettings from '../../scripts/settings/userSettings';
import { IQuery } from './type';

type SortProps = {
    getSortMenuOptions: () => {
        name: string;
        id: string;
    }[];
    query: IQuery;
    getSettingsKey: () => string;
    reloadItems: () => void;
}

const Sort: FunctionComponent<SortProps> = ({ getSortMenuOptions, query, getSettingsKey, reloadItems }: SortProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const btnSort = element.current?.querySelector('.btnSort');

        if (btnSort) {
            btnSort.addEventListener('click', (e) => {
                libraryBrowser.showSortMenu({
                    items: getSortMenuOptions(),
                    callback: () => {
                        query.StartIndex = 0;
                        userSettings.saveQuerySettings(getSettingsKey(), query);
                        reloadItems();
                    },
                    query: query,
                    button: e.target
                });
            });
        }
    }, [getSortMenuOptions, query, reloadItems, getSettingsKey]);

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
