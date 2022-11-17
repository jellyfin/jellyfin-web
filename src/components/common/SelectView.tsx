import React, { FC } from 'react';
import IconButton from '../../elements/emby-button/IconButton';
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
    const showViewSettingsMenu = () => {
        import('../viewSettings/viewSettings').then(({default: ViewSettings}) => {
            const viewsettings = new ViewSettings();
            viewsettings.show({
                settings: viewQuerySettings,
                visibleSettings: getVisibleViewSettings(),
                setviewsettings: setViewQuerySettings
            });
        });
    };

    return (
        <IconButton
            type='button'
            className='btnSelectView autoSize'
            title='ButtonSelectView'
            icon='view_comfy'
            onClick={showViewSettingsMenu}
        />
    );
};

export default SelectView;
