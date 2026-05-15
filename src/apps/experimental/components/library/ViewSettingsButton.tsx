import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import React, { type FC, useCallback, useState } from 'react';

import Check from '@mui/icons-material/Check';
import Settings from '@mui/icons-material/Settings';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import globalize from 'lib/globalize';
import { LibraryViewSettings, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const IMAGE_TYPE_EXCLUDED_VIEWS = [
    LibraryTab.Episodes,
    LibraryTab.Artists,
    LibraryTab.AlbumArtists,
    LibraryTab.Albums
];

const imageTypesOptions = [
    { label: 'Primary', value: ImageType.Primary },
    { label: 'Banner', value: ImageType.Banner },
    { label: 'Disc', value: ImageType.Disc },
    { label: 'Logo', value: ImageType.Logo },
    { label: 'Thumb', value: ImageType.Thumb }
];

interface ViewSettingsButtonProps {
    viewType: LibraryTab;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const ViewSettingsButton: FC<ViewSettingsButtonProps> = ({
    viewType,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const open = Boolean(anchorEl);
    const id = open ? 'selectview-popover' : undefined;

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
        setIsSettingsOpen(false);
    }, []);

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const name = event.target.name;

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                [name]: event.target.checked
            }));
        },
        [setLibraryViewSettings]
    );

    const onGridViewClick = useCallback(() => {
        setLibraryViewSettings(prevState => ({
            ...prevState,
            ViewMode: ViewMode.GridView
        }));
        setIsSettingsOpen(false);
    }, [ setLibraryViewSettings ]);

    const onListViewClick = useCallback(() => {
        setLibraryViewSettings(prevState => ({
            ...prevState,
            ViewMode: ViewMode.ListView
        }));
        setIsSettingsOpen(false);
    }, [setLibraryViewSettings]);

    const onSettingsClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsSettingsOpen(prev => !prev);
    }, []);

    const setImageType = useCallback((imageType: ImageType) => {
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            ImageType: imageType
        }));
    }, [setLibraryViewSettings]);

    const isGridView = libraryViewSettings.ViewMode === ViewMode.GridView;
    const isImageTypeVisible = !IMAGE_TYPE_EXCLUDED_VIEWS.includes(viewType);

    return (
        <>
            <Button
                title={globalize.translate('ViewSettings')}
                aria-describedby={id}
                onClick={handleClick}
            >
                {isGridView ? <ViewModuleIcon /> : <ViewListIcon />}
            </Button>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                sx={{
                    '& .MuiFormControl-root': { m: 1, width: 220 }
                }}
            >
                <MenuList>
                    <MenuItem
                        onClick={onGridViewClick}
                    >
                        <ListItemIcon>
                            {isGridView ? <Check fontSize='small' /> : null}
                        </ListItemIcon>
                        <ListItemText>
                            {globalize.translate('GridView')}
                        </ListItemText>
                        <IconButton
                            onClick={onSettingsClick}
                            size='small'
                            sx={{
                                ml: 2
                            }}
                        >
                            <Settings fontSize='small' />
                        </IconButton>
                    </MenuItem>

                    <Collapse
                        in={isSettingsOpen}
                        timeout='auto'
                        unmountOnExit
                    >
                        {isImageTypeVisible && (
                            <MenuList
                                subheader={
                                    <ListSubheader
                                        disableSticky
                                        sx={{
                                            lineHeight: '36px'
                                        }}
                                    >
                                        {globalize.translate('LabelImageType')}
                                    </ListSubheader>
                                }
                                dense
                            >
                                {imageTypesOptions.map((imageType) => (
                                    <MenuItem
                                        key={imageType.value}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onClick={() => setImageType(imageType.value)}
                                    >
                                        <ListItemIcon>
                                            {libraryViewSettings.ImageType === imageType.value && <Check fontSize='small' />}
                                        </ListItemIcon>
                                        <Typography component='span'>
                                            {globalize.translate(imageType.label)}
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </MenuList>
                        )}

                        <MenuList
                            subheader={
                                <ListSubheader
                                    disableSticky
                                    sx={{
                                        lineHeight: '36px'
                                    }}
                                >
                                    {globalize.translate('CardSettings')}
                                </ListSubheader>
                            }
                            dense
                        >
                            <MenuItem>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size='small'
                                            checked={libraryViewSettings.ShowTitle}
                                            onChange={handleChange}
                                            name='ShowTitle'
                                        />
                                    }
                                    label={globalize.translate('ShowTitle')}
                                />
                            </MenuItem>
                            {isImageTypeVisible && (
                                <MenuItem>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size='small'
                                                checked={libraryViewSettings.ShowYear}
                                                onChange={handleChange}
                                                name='ShowYear'
                                            />
                                        }
                                        label={globalize.translate('ShowYear')}
                                    />
                                </MenuItem>
                            )}
                            <MenuItem>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size='small'
                                            checked={libraryViewSettings.CardLayout}
                                            onChange={handleChange}
                                            name='CardLayout'
                                        />
                                    }
                                    label={globalize.translate('EnableCardLayout')}
                                />
                            </MenuItem>
                        </MenuList>
                        <Divider />
                    </Collapse>

                    <MenuItem
                        onClick={onListViewClick}
                    >
                        <ListItemIcon>
                            {isGridView ? null : <Check fontSize='small' />}
                        </ListItemIcon>
                        <ListItemText>
                            {globalize.translate('ListView')}
                        </ListItemText>
                    </MenuItem>
                </MenuList>
            </Popover>
        </>
    );
};

export default ViewSettingsButton;
