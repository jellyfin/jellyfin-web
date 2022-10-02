import React, { FC, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';

import libraryBrowser from '../../scripts/libraryBrowser';
import * as userSettings from '../../scripts/settings/userSettings';
import { QueryI } from './interface';

interface SelectViewI {
    getCurrentViewStyle: () => string;
    query: QueryI;
    getViewSettings: () => string;
    reloadItems: () => void;
}

const SelectView: FC<SelectViewI> = ({ getCurrentViewStyle, getViewSettings, query, reloadItems }) => {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const btnSelectView = element.current?.querySelector('.btnSelectView') as HTMLButtonElement;
        btnSelectView.addEventListener('click', (e) => {
            libraryBrowser.showLayoutMenu(e.target, getCurrentViewStyle(), 'Banner,List,Poster,PosterCard,Thumb,ThumbCard'.split(','));
        });
        btnSelectView.addEventListener('layoutchange', (e) => {
            const viewStyle = (e as CustomEvent).detail.viewStyle;
            userSettings.set(getViewSettings(), viewStyle, false);
            query.StartIndex = 0;
            reloadItems();
        });
    }, [getCurrentViewStyle, query, reloadItems, getViewSettings]);

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
