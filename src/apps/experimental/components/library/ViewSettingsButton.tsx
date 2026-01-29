import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { CheckIcon, DotsVerticalIcon } from '@radix-ui/react-icons';
import globalize from 'lib/globalize';
import React, { type FC, useCallback } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { type LibraryViewSettings, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import {
    Box,
    Checkbox,
    Divider,
    Flex,
    IconButton,
    Menu,
    MenuItem,
    MenuSeparator,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Text
} from 'ui-primitives';

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
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const ViewSettingsButton: FC<ViewSettingsButtonProps> = ({
    viewType,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            ViewMode: ViewMode.GridView
        }));
    }, [setLibraryViewSettings]);

    const onListViewClick = useCallback(() => {
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            ViewMode: ViewMode.ListView
        }));
    }, [setLibraryViewSettings]);

    const onSelectChange = useCallback(
        (value: string) => {
            setLibraryViewSettings((prevState) => ({
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
                <IconButton
                    title={globalize.translate('ViewSettings')}
                    aria-haspopup="true"
                    size="lg"
                >
                    <DotsVerticalIcon />
                </IconButton>
            }
        >
            <MenuItem onClick={onGridViewClick}>
                <Flex align="center" gap={vars.spacing['4']}>
                    <Box
                        style={{
                            width: vars.spacing['6'],
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        {isGridView ? <CheckIcon /> : null}
                    </Box>
                    <Text size="md">{globalize.translate('GridView')}</Text>
                </Flex>
            </MenuItem>
            <MenuItem onClick={onListViewClick}>
                <Flex align="center" gap={vars.spacing['4']}>
                    <Box
                        style={{
                            width: vars.spacing['6'],
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
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
                            <Box style={{ padding: vars.spacing['4'], width: 220 }}>
                                <Text size="sm" weight="medium" color="secondary">
                                    {globalize.translate('LabelImageType')}
                                </Text>
                                <Select
                                    value={libraryViewSettings.ImageType}
                                    onValueChange={onSelectChange}
                                >
                                    <SelectTrigger
                                        style={{ width: '100%', marginTop: vars.spacing['2'] }}
                                    >
                                        <SelectValue
                                            placeholder={globalize.translate('LabelImageType')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {imageTypesOptions.map((imageType) => (
                                            <SelectItem
                                                key={imageType.value}
                                                value={imageType.value}
                                            >
                                                {globalize.translate(imageType.label)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Box>
                            <Divider />
                        </>
                    )}
                    <Box style={{ padding: vars.spacing['4'] }}>
                        <Checkbox
                            checked={libraryViewSettings.ShowTitle}
                            onChange={handleChange}
                            name="ShowTitle"
                        >
                            {globalize.translate('ShowTitle')}
                        </Checkbox>
                        {isImageTypeVisible && (
                            <Checkbox
                                checked={libraryViewSettings.ShowYear}
                                onChange={handleChange}
                                name="ShowYear"
                            >
                                {globalize.translate('ShowYear')}
                            </Checkbox>
                        )}
                        <Checkbox
                            checked={libraryViewSettings.CardLayout}
                            onChange={handleChange}
                            name="CardLayout"
                        >
                            {globalize.translate('EnableCardLayout')}
                        </Checkbox>
                    </Box>
                </>
            )}
        </Menu>
    );
};

export default ViewSettingsButton;
