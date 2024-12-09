import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useCallback } from 'react';

import globalize from 'lib/globalize';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client';
import { Button, IconButton, Popover, SxProps } from '@mui/material';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';

import './BackgroundPlaybackPreferences.scss';

interface BackgroundPlaybackPreferencesProps {
    onChange: (event: SelectChangeEvent | React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function BackgroundPlaybackPreferences({
    onChange,
    values
}: Readonly<BackgroundPlaybackPreferencesProps>) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openPopover = Boolean(anchorEl);

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClosePopover = useCallback(() => {
        setAnchorEl(null);
    }, []);

    // Create wrapper on change callback to toggle the Sort Order state
    // when the Icon Button is pressed
    const handleSortOrderChange = useCallback((
        e: SelectChangeEvent | React.SyntheticEvent
    ) => {
        const target = e.currentTarget as HTMLInputElement;
        const fieldName = target.name as keyof DisplaySettingsValues;
        const fieldValue = target.value;

        // Toggle the ascending/descending variable on the event target when the Sort Icon Button is pressed
        if (Object.is(values.libraryThemeMediaSortOrder, values?.[fieldName])) {
            let newSortOrder = null;
            switch (fieldValue) {
                case SortOrder.Ascending:
                    newSortOrder = SortOrder.Descending;
                    break;
                case SortOrder.Descending:
                    newSortOrder = SortOrder.Ascending;
                    break;
            }

            target.value = newSortOrder ?? target.value;
            // For an Icon Button, the event target can be either the pressed icon <svg>
            // or the <button> element depending on where the click occurs.
            // Therefore replace `e.target` with `e.currentTarget`
            // which has the updated event value
            e.target = target;
        }

        // Delegate to the supplied onChange function for normal processing
        onChange(e);
    }, [onChange, values]);

    const popoverCssClass = 'backgroundPlaybackPopover';
    const stackCssClass = 'backgroundPlaybackStack';
    const themeMediaCheckboxCssClass =
        'checkboxContainer checkboxContainer-withDescription';

    const themeMediaCheckboxLabelStyleProps: SxProps = {
        marginLeft: 0
    };

    return (
        <div id='background-playback-settings-preferences'>
            <Typography variant='h2' id='background-playback-settings-header'>
                {globalize.translate('BackgroundPlayback')}
            </Typography>
            <Button
                onClick={handleClick}
                id='background-playback-settings-model-button'
            >
                {globalize.translate('BackgroundPlayback')}
            </Button>
            <Popover
                id='background-playback-settings-popover'
                aria-describedby='background-playback-settings-popover-description'
                className={popoverCssClass}
                open={openPopover}
                anchorEl={anchorEl}
                onClose={handleClosePopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                }}
            >
                <Stack spacing={1} className={stackCssClass}>
                    <Typography
                        variant='h3'
                        id='background-playback-settings-play-theme-media-label'
                    >
                        {globalize.translate('ThemeMediaPlayInBackgroundHelp')}
                    </Typography>
                    <FormControl
                        fullWidth
                        className={themeMediaCheckboxCssClass}
                    >
                        <FormControlLabel
                            aria-describedby='background-playback-settings-lib-backdrops-description'
                            control={
                                <Checkbox
                                    checked={values.enableLibraryBackdrops}
                                    onChange={onChange}
                                />
                            }
                            label={globalize.translate('Backdrops')}
                            name='enableLibraryBackdrops'
                            sx={themeMediaCheckboxLabelStyleProps}
                        />
                        <FormControlLabel
                            aria-describedby='background-playback-settings-lib-theme-songs-description'
                            control={
                                <Checkbox
                                    checked={values.enableLibraryThemeSongs}
                                    onChange={onChange}
                                />
                            }
                            label={globalize.translate('ThemeSongs')}
                            name='enableLibraryThemeSongs'
                            sx={themeMediaCheckboxLabelStyleProps}
                        />
                        <FormControlLabel
                            aria-describedby='background-playback-settings-lib-theme-videos-description'
                            control={
                                <Checkbox
                                    checked={values.enableLibraryThemeVideos}
                                    onChange={onChange}
                                />
                            }
                            label={globalize.translate('ThemeVideos')}
                            name='enableLibraryThemeVideos'
                            sx={themeMediaCheckboxLabelStyleProps}
                        />
                    </FormControl>

                    <Stack
                        direction={'row'}
                        spacing={1}
                        id='background-playback-sort-by-select-stack'
                    >
                        <FormControl id='background-playback-sort-by-select-container'>
                            <InputLabel id='background-playback-sort-by-select-label'>
                                {globalize.translate('ThemeMediaSortBy')}
                            </InputLabel>
                            <Select
                                aria-describedby='background-playback-settings-lib-theme-media-sort-by-description'
                                inputProps={{
                                    name: 'libraryThemeMediaSortBy'
                                }}
                                labelId='background-playback-sort-by-select-label'
                                id='background-playback-sort-by-select-dropdown'
                                onChange={onChange}
                                value={values.libraryThemeMediaSortBy}
                            >
                                <MenuItem value={ItemSortBy.Random}>
                                    {globalize.translate('OptionRandom')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.SortName}>
                                    {globalize.translate('Name')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.Album}>
                                    {globalize.translate('Album')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.AlbumArtist}>
                                    {globalize.translate('AlbumArtist')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.Artist}>
                                    {globalize.translate('Artist')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.DateCreated}>
                                    {globalize.translate('OptionDateAdded')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.DatePlayed}>
                                    {globalize.translate('OptionDatePlayed')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.PlayCount}>
                                    {globalize.translate('OptionPlayCount')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.PremiereDate}>
                                    {globalize.translate('OptionReleaseDate')}
                                </MenuItem>
                                <MenuItem value={ItemSortBy.Runtime}>
                                    {globalize.translate('Runtime')}
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <IconButton
                            id='background-playback-sort-order-icon-button'
                            aria-label='sort-order-by'
                            onClick={handleSortOrderChange}
                            name='libraryThemeMediaSortOrder'
                            value={values.libraryThemeMediaSortOrder}
                        >
                            {values.libraryThemeMediaSortOrder
                                == SortOrder.Ascending && <ArrowUpward />}
                            {values.libraryThemeMediaSortOrder
                                == SortOrder.Descending && <ArrowDownward />}
                        </IconButton>
                    </Stack>
                </Stack>
            </Popover>
        </div>
    );
}
