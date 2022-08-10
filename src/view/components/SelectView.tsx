import React, { FunctionComponent, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';

import libraryBrowser from '../../scripts/libraryBrowser';
import * as userSettings from '../../scripts/settings/userSettings';
import { IQuery } from './type';

type SelectViewProps = {
    getCurrentViewStyle: () => string;
    query: IQuery;
    savedViewKey: string;
    reloadItems: () => void;
}

const SelectView: FunctionComponent<SelectViewProps> = ({ getCurrentViewStyle, savedViewKey, query, reloadItems }: SelectViewProps) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const btnSelectView = element.current?.querySelector('.btnSelectView') as HTMLButtonElement;
        btnSelectView.addEventListener('click', (e) => {
            libraryBrowser.showLayoutMenu(e.target, getCurrentViewStyle(), 'Banner,List,Poster,PosterCard,Thumb,ThumbCard'.split(','));
        });
        btnSelectView.addEventListener('layoutchange', (e) => {
            const viewStyle = (e as CustomEvent).detail.viewStyle;
            userSettings.set(savedViewKey, viewStyle, false);
            query.StartIndex = 0;
            reloadItems();
        });
    }, [getCurrentViewStyle, query, reloadItems, savedViewKey]);

    return (
        <div ref={element}>
            <IconButtonElement
                is='paper-icon-button-light'
                className='btnSelectView autoSize'
                title='ButtonSelectView'
                icon='material-icons view_comfy'
            />
        </div>
    );
};

export default SelectView;
