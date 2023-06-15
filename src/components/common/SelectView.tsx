import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { ViewQuerySettings } from '../../types/interface';

interface SelectViewProps {
    getVisibleViewSettings: () => string[];
    viewQuerySettings: ViewQuerySettings;
    setViewQuerySettings: React.Dispatch<React.SetStateAction<ViewQuerySettings>>;
}

const SelectView: FC<SelectViewProps> = ({
    getVisibleViewSettings,
    viewQuerySettings,
    setViewQuerySettings
}) => {
    const element = useRef<HTMLDivElement>(null);

    const showViewSettingsMenu = useCallback(() => {
        import('../viewSettings/viewSettings').then(({ default: ViewSettings }) => {
            const viewsettings = new ViewSettings();
            viewsettings.show({
                settings: viewQuerySettings,
                visibleSettings: getVisibleViewSettings(),
                setviewsettings: setViewQuerySettings
            }).catch(() => {
                // view settings closed
            });
        }).catch(err => {
            console.error('[SelectView] failed to load view settings', err);
        });
    }, [getVisibleViewSettings, viewQuerySettings, setViewQuerySettings]);

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
