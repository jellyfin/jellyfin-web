import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { ViewSettingsI } from './interface';

interface SelectViewProps {
    getVisibleViewSettings: () => string[];
    viewSettings: ViewSettingsI
    setViewSettings: React.Dispatch<React.SetStateAction<ViewSettingsI>>;
}

const SelectView: FC<SelectViewProps> = ({
    getVisibleViewSettings,
    viewSettings,
    setViewSettings
}) => {
    const element = useRef<HTMLDivElement>(null);

    const showViewSettingsMenu = useCallback(() => {
        import('../../components/viewSettings/viewSettings').then(({default: ViewSettings}) => {
            const viewsettings = new ViewSettings();
            viewsettings.show({
                settings: viewSettings,
                visibleSettings: getVisibleViewSettings(),
                setviewsettings: setViewSettings
            });
        });
    }, [getVisibleViewSettings, viewSettings, setViewSettings]);

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
