import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import globalize from 'scripts/globalize';
import { DisplaySettingsValues } from './types';
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client';

interface LibraryPreferencesProps {
    onChange: (e: SelectChangeEvent | React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function LibraryPreferences({ onChange, values }: Readonly<LibraryPreferencesProps>) {
    return (
        <Stack spacing={3}>
            <Typography variant='h2'>{globalize.translate('HeaderLibraries')}</Typography>

            <FormControl fullWidth>
                <TextField
                    aria-describedby='display-settings-lib-pagesize-description'
                    inputProps={{
                        type: 'number',
                        inputMode: 'numeric',
                        max: '1000',
                        min: '0',
                        pattern: '[0-9]',
                        required: true,
                        step: '1'
                    }}
                    value={values.libraryPageSize}
                    label={globalize.translate('LabelLibraryPageSize')}
                    name='libraryPageSize'
                    onChange={onChange}
                />
                <FormHelperText id='display-settings-lib-pagesize-description'>
                    {globalize.translate('LabelLibraryPageSizeHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-lib-backdrops-description'
                    control={
                        <Checkbox
                            checked={values.enableLibraryBackdrops}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('Backdrops')}
                    name='enableLibraryBackdrops'
                />
                <FormHelperText id='display-settings-lib-backdrops-description'>
                    {globalize.translate('EnableBackdropsHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-lib-theme-songs-description'
                    control={
                        <Checkbox
                            checked={values.enableLibraryThemeSongs}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('ThemeSongs')}
                    name='enableLibraryThemeSongs'
                />
                <FormHelperText id='display-settings-lib-theme-songs-description'>
                    {globalize.translate('EnableThemeSongsHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-lib-theme-videos-description'
                    control={
                        <Checkbox
                            checked={values.enableLibraryThemeVideos}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('ThemeVideos')}
                    name='enableLibraryThemeVideos'
                />
                <FormHelperText id='display-settings-lib-theme-videos-description'>
                    {globalize.translate('EnableThemeVideosHelp')}
                </FormHelperText>
            </FormControl>

            { (values.enableLibraryThemeSongs || values.enableLibraryThemeVideos) && (<FormControl fullWidth>
                <InputLabel id='display-settings-lib-theme-media-sort-by-label'>{globalize.translate('ThemeMediaSortBy')}</InputLabel>
                <Select
                    aria-describedby='display-settings-lib-theme-media-sort-by-description'
                    inputProps={{
                        name: 'libraryThemeMediaSortBy'
                    }}
                    labelId='display-settings-lib-theme-media-sort-by-label'
                    onChange={onChange}
                    value={values.libraryThemeMediaSortBy}
                >
                    <MenuItem value={ItemSortBy.Random}>{globalize.translate('OptionRandom')}</MenuItem>
                    <MenuItem value={ItemSortBy.SortName}>{globalize.translate('OptionTrackName')}</MenuItem>
                    <MenuItem value={ItemSortBy.Album}>{globalize.translate('Album')}</MenuItem>
                    <MenuItem value={ItemSortBy.AlbumArtist}>{globalize.translate('AlbumArtist')}</MenuItem>
                    <MenuItem value={ItemSortBy.Artist}>{globalize.translate('Artist')}</MenuItem>
                    <MenuItem value={ItemSortBy.DateCreated}>{globalize.translate('OptionDateAdded')}</MenuItem>
                    <MenuItem value={ItemSortBy.DatePlayed}>{globalize.translate('OptionDatePlayed')}</MenuItem>
                    <MenuItem value={ItemSortBy.PlayCount}>{globalize.translate('OptionPlayCount')}</MenuItem>
                    <MenuItem value={ItemSortBy.PremiereDate}>{globalize.translate('OptionReleaseDate')}</MenuItem>
                    <MenuItem value={ItemSortBy.Runtime}>{globalize.translate('Runtime')}</MenuItem>
                </Select>
                <FormHelperText component={Stack} id='display-settings-lib-theme-media-sort-by-description'>
                    <span>{globalize.translate('ThemeMediaSortByHelp')}</span>
                    <span>{globalize.translate('ThemeMediaFolderUsageHelp')}</span>
                </FormHelperText>
            </FormControl>)}

            { (values.enableLibraryThemeSongs || values.enableLibraryThemeVideos) && (<FormControl fullWidth>
                <InputLabel id='display-settings-lib-theme-media-sort-order-label'>{globalize.translate('ThemeMediaSortOrder')}</InputLabel>
                <Select
                    aria-describedby='display-settings-lib-theme-media-sort-order-description'
                    inputProps={{
                        name: 'libraryThemeMediaSortOrder'
                    }}
                    labelId='display-settings-lib-theme-media-sort-order-label'
                    onChange={onChange}
                    value={values.libraryThemeMediaSortOrder}
                >
                    <MenuItem value={SortOrder.Ascending}>{globalize.translate('Ascending')}</MenuItem>
                    <MenuItem value={SortOrder.Descending}>{globalize.translate('Descending')}</MenuItem>
                </Select>
                <FormHelperText component={Stack} id='display-settings-lib-theme-media-sort-order-description'>
                    <span>{globalize.translate('ThemeMediaSortOrderHelp')}</span>
                    <span>{globalize.translate('ThemeMediaFolderUsageHelp')}</span>
                </FormHelperText>
            </FormControl>)}

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-show-missing-episodes-description'
                    control={
                        <Checkbox
                            checked={values.displayMissingEpisodes}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('DisplayMissingEpisodesWithinSeasons')}
                    name='displayMissingEpisodes'
                />
                <FormHelperText id='display-settings-show-missing-episodes-description'>
                    {globalize.translate('DisplayMissingEpisodesWithinSeasonsHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
}
