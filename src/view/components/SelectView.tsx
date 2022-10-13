import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { QueryI } from './interface';

interface SelectViewProps {
    getSettingsKey: () => string;
    getVisibleViewSettings: () => string[];
    getViewSettings: () => {
        showTitle: string | boolean;
        cardLayout: string | boolean;
        showYear: string | boolean;
        imageType: string;
        viewType: string;
    };
    setQuery: React.Dispatch<React.SetStateAction<QueryI>>;
    reloadItems: () => void;
}

const SelectView: FC<SelectViewProps> = ({ setQuery, getSettingsKey, getVisibleViewSettings, getViewSettings, reloadItems }) => {
    const element = useRef<HTMLDivElement>(null);

    const showViewSettingsMenu = useCallback(() => {
        import('../../components/viewSettings/viewSettings').then(({default: ViewSettings}) => {
            const viewSettings = new ViewSettings();
            viewSettings.show({
                settingsKey: getSettingsKey(),
                settings: getViewSettings(),
                visibleSettings: getVisibleViewSettings()
            }).then(() => {
                setQuery({StartIndex: 0});
                reloadItems();
            });
        });
    }, [getSettingsKey, getViewSettings, getVisibleViewSettings, reloadItems, setQuery]);

    useEffect(() => {
        const btnSelectView = element.current?.querySelector('.btnSelectView') as HTMLButtonElement;
        btnSelectView?.addEventListener('click', showViewSettingsMenu);

        return () => {
            btnSelectView?.removeEventListener('click', showViewSettingsMenu);
        };
    }, [showViewSettingsMenu]);

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
