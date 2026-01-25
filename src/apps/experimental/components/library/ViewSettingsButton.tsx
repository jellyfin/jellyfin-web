import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import React, { type FC, useCallback } from 'react';

import { CheckIcon, DotsVerticalIcon } from '@radix-ui/react-icons';
import { Box, Flex } from 'ui-primitives/Box';
import { Checkbox } from 'ui-primitives/Checkbox';
import { Divider } from 'ui-primitives/Divider';
import { IconButton } from 'ui-primitives/IconButton';
import { Menu, MenuItem, MenuSeparator } from 'ui-primitives/Menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui-primitives/Select';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

import globalize from 'lib/globalize';
import { type LibraryViewSettings, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const IMAGE_TYPE_EXCLUDED_VIEWS = [LibraryTab.Episodes, LibraryTab.Artists, LibraryTab.AlbumArtists, LibraryTab.Albums];

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
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const ViewSettingsButton: FC<ViewSettingsButtonProps> = ({ viewType, libraryViewSettings, setLibraryViewSettings }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const name = event.target.name;

            setLibraryViewSettings(prevState => ({
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
    }, [setLibraryViewSettings]);

    const onListViewClick = useCallback(() => {
        setLibraryViewSettings(prevState => ({
            ...prevState,
            ViewMode: ViewMode.ListView
        }));
    }, [setLibraryViewSettings]);

    const onSelectChange = useCallback(
        (value: string) => {
            setLibraryViewSettings(prevState => ({
                ...prevState,
                ImageType: value as ImageType
            }));
        },
        [setLibraryViewSettings]
    );

    const isGridView = libraryViewSettings.ViewMode === ViewMode.GridView;
    const isImageTypeVisible = !IMAGE_TYPE_EXCLUDED_VIEWS.includes(viewType);

    return (
        <Menu
            id="selectview-popover"
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            align="center"
            trigger={
                <IconButton title={globalize.translate('ViewSettings')} aria-haspopup="true" size="lg">
                    <DotsVerticalIcon />
                </IconButton>
            }
        >
            <MenuItem onClick={onGridViewClick}>
                <Flex align="center" gap={vars.spacing.sm}>
                    <Box style={{ width: vars.spacing.lg, display: 'flex', justifyContent: 'center' }}>
                        {isGridView ? <CheckIcon /> : null}
                    </Box>
                    <Text size="md">{globalize.translate('GridView')}</Text>
                </Flex>
            </MenuItem>
            <MenuItem onClick={onListViewClick}>
                <Flex align="center" gap={vars.spacing.sm}>
                    <Box style={{ width: vars.spacing.lg, display: 'flex', justifyContent: 'center' }}>
                        {!isGridView ? <CheckIcon /> : null}
                    </Box>
                    <Text size="md">{globalize.translate('ListView')}</Text>
                </Flex>
            </MenuItem>

            {isGridView && (
                <>
                    <MenuSeparator />
                    {isImageTypeVisible && (
                        <>
                            <Box style={{ padding: vars.spacing.sm, width: 220 }}>
                                <Text size="sm" weight="medium" color="secondary">
                                    {globalize.translate('LabelImageType')}
                                </Text>
                                <Select value={libraryViewSettings.ImageType} onValueChange={onSelectChange}>
                                    <SelectTrigger style={{ width: '100%', marginTop: vars.spacing.xs }}>
                                        <SelectValue placeholder={globalize.translate('LabelImageType')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {imageTypesOptions.map(imageType => (
                                            <SelectItem key={imageType.value} value={imageType.value}>
                                                {globalize.translate(imageType.label)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Box>
                            <Divider />
                        </>
                    )}
                    <Box style={{ padding: vars.spacing.sm }}>
                        <Checkbox checked={libraryViewSettings.ShowTitle} onChange={handleChange} name="ShowTitle">
                            {globalize.translate('ShowTitle')}
                        </Checkbox>
                        {isImageTypeVisible && (
                            <Checkbox checked={libraryViewSettings.ShowYear} onChange={handleChange} name="ShowYear">
                                {globalize.translate('ShowYear')}
                            </Checkbox>
                        )}
                        <Checkbox checked={libraryViewSettings.CardLayout} onChange={handleChange} name="CardLayout">
                            {globalize.translate('EnableCardLayout')}
                        </Checkbox>
                    </Box>
                </>
            )}
        </Menu>
    );
};

export default ViewSettingsButton;
