import React, { FC, useCallback } from 'react';
import ButtonGroup from '@mui/material/ButtonGroup/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

import globalize from 'lib/globalize';
import { LibraryViewSettings, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import ViewSettingsButton from './ViewSettingsButton';

interface GridListViewButtonProps {
    viewType: LibraryTab;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const GridListViewButton: FC<GridListViewButtonProps> = ({
    viewType,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const handleToggleCurrentView = useCallback(() => {
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            ViewMode:
                prevState.ViewMode === ViewMode.ListView ? ViewMode.GridView : ViewMode.ListView
        }));
    }, [setLibraryViewSettings]);

    const isGridView = libraryViewSettings.ViewMode === ViewMode.GridView;

    return (
        <ButtonGroup>
            {isGridView ? (
                <ViewSettingsButton
                    viewType={viewType}
                    libraryViewSettings={libraryViewSettings}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            ) : (
                <IconButton
                    title={globalize.translate('GridView')}
                    className='paper-icon-button-light autoSize'
                    disabled={isGridView}
                    onClick={handleToggleCurrentView}
                >
                    <ViewModuleIcon />
                </IconButton>
            )}

            <IconButton
                title={globalize.translate('ListView')}
                className='paper-icon-button-light autoSize'
                disabled={!isGridView}
                onClick={handleToggleCurrentView}
            >
                <ViewListIcon />
            </IconButton>
        </ButtonGroup>
    );
};

export default GridListViewButton;
