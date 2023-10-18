import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import globalize from 'scripts/globalize';

export function LibraryPreferences() {
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
                    label={globalize.translate('LabelLibraryPageSize')}
                />
                <FormHelperText id='display-settings-lib-pagesize-description'>
                    {globalize.translate('LabelLibraryPageSizeHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-lib-backdrops-description'
                    control={<Checkbox />}
                    label={globalize.translate('Backdrops')}
                />
                <FormHelperText id='display-settings-lib-backdrops-description'>
                    {globalize.translate('EnableBackdropsHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-lib-theme-songs-description'
                    control={<Checkbox />}
                    label={globalize.translate('ThemeSongs')}
                />
                <FormHelperText id='display-settings-lib-theme-songs-description'>
                    {globalize.translate('EnableThemeSongsHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-lib-theme-videos-description'
                    control={<Checkbox />}
                    label={globalize.translate('ThemeVideos')}
                />
                <FormHelperText id='display-settings-lib-theme-videos-description'>
                    {globalize.translate('EnableThemeVideosHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-show-missing-episodes-description'
                    control={<Checkbox />}
                    label={globalize.translate('DisplayMissingEpisodesWithinSeasons')}
                />
                <FormHelperText id='display-settings-show-missing-episodes-description'>
                    {globalize.translate('DisplayMissingEpisodesWithinSeasonsHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
}
