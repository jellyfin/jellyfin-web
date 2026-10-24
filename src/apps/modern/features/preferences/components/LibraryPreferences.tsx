import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useRef, useState } from 'react';

import { clearAllLibraryViewSettings, DefaultSortByOption, getUserDefaultViewSettings, setUserDefaultViewSettings } from 'apps/modern/features/libraries/utils/settings';
import globalize from 'lib/globalize';
import { ViewMode } from 'types/library';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface LibraryPreferencesProps {
    onChange: (event: React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function LibraryPreferences({ onChange, values }: Readonly<LibraryPreferencesProps>) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState(() => getUserDefaultViewSettings().ViewMode ?? ViewMode.GridView);
    const [sortBy, setSortBy] = useState(() => getUserDefaultViewSettings().SortBy ?? DefaultSortByOption.Name);
    const [sortOrder, setSortOrder] = useState(() => getUserDefaultViewSettings().SortOrder ?? SortOrder.Ascending);
    const [overrideExisting, setOverrideExisting] = useState(false);

    useEffect(() => {
        const formElement = rootRef.current?.closest('form');
        if (!formElement) {
            return;
        }

        const onFormSubmit = () => {
            setUserDefaultViewSettings({ ViewMode: viewMode, SortBy: sortBy, SortOrder: sortOrder });
            if (overrideExisting) {
                clearAllLibraryViewSettings();
            }
        };

        formElement.addEventListener('submit', onFormSubmit);
        return () => formElement.removeEventListener('submit', onFormSubmit);
    }, [viewMode, sortBy, sortOrder, overrideExisting]);

    return (
        <Stack ref={rootRef} spacing={3}>
            <Typography variant='h2'>{globalize.translate('HeaderLibraries')}</Typography>

            <Stack spacing={2}>
                <Typography variant='h3'>{globalize.translate('HeaderLibraryViewDefaults')}</Typography>

                <FormControl fullWidth>
                    <InputLabel id='library-view-defaults-viewmode-label'>{globalize.translate('LabelDefaultLibraryView')}</InputLabel>
                    <Select
                        labelId='library-view-defaults-viewmode-label'
                        value={viewMode}
                        onChange={e => setViewMode(e.target.value as ViewMode)}
                    >
                        <MenuItem value={ViewMode.GridView}>{globalize.translate('GridView')}</MenuItem>
                        <MenuItem value={ViewMode.ListView}>{globalize.translate('ListView')}</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id='library-view-defaults-sortby-label'>{globalize.translate('LabelDefaultSortBy')}</InputLabel>
                    <Select
                        labelId='library-view-defaults-sortby-label'
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as DefaultSortByOption)}
                    >
                        <MenuItem value={DefaultSortByOption.Name}>{globalize.translate('Name')}</MenuItem>
                        <MenuItem value={DefaultSortByOption.DateAdded}>{globalize.translate('OptionDateAdded')}</MenuItem>
                        <MenuItem value={DefaultSortByOption.Random}>{globalize.translate('OptionRandom')}</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id='library-view-defaults-sortorder-label'>{globalize.translate('LabelDefaultSortOrder')}</InputLabel>
                    <Select
                        labelId='library-view-defaults-sortorder-label'
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value as SortOrder)}
                    >
                        <MenuItem value={SortOrder.Ascending}>{globalize.translate('Ascending')}</MenuItem>
                        <MenuItem value={SortOrder.Descending}>{globalize.translate('Descending')}</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ pl: 4 }}>
                    <FormControlLabel
                        aria-describedby='display-settings-lib-override-existing-description'
                        control={
                            <Checkbox
                                checked={overrideExisting}
                                onChange={e => setOverrideExisting(e.target.checked)}
                            />
                        }
                        label={globalize.translate('LabelOverrideExistingLibraryConfigs')}
                    />
                    <FormHelperText id='display-settings-lib-override-existing-description'>
                        {globalize.translate('MessageConfirmOverrideAllLibraries')}
                    </FormHelperText>
                </FormControl>
            </Stack>

            <FormControl fullWidth>
                <TextField
                    aria-describedby='display-settings-lib-pagesize-description'
                    value={values.libraryPageSize}
                    label={globalize.translate('LabelLibraryPageSize')}
                    name='libraryPageSize'
                    onChange={onChange}
                    slotProps={{
                        htmlInput: {
                            type: 'number',
                            inputMode: 'numeric',
                            max: '1000',
                            min: '0',
                            pattern: '[0-9]',
                            required: true,
                            step: '1'
                        }
                    }}
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
