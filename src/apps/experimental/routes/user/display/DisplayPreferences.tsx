import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import globalize from 'scripts/globalize';

export function DisplayPreferences() {
    return (
        <Stack spacing={2}>
            <Typography variant='h2'>{globalize.translate('Display')}</Typography>

            <FormControl fullWidth>
                <Select
                    aria-describedby='display-settings-layout-description'
                    label={globalize.translate('LabelDisplayMode')}
                >
                    <MenuItem value='auto'>{globalize.translate('Auto')}</MenuItem>
                    <MenuItem value='desktop'>{globalize.translate('Desktop')}</MenuItem>
                    <MenuItem value='mobile'>{globalize.translate('Mobile')}</MenuItem>
                    <MenuItem value='tv'>{globalize.translate('TV')}</MenuItem>
                    <MenuItem value='experimental'>{globalize.translate('Experimental')}</MenuItem>
                </Select>
                <FormHelperText component={Stack} id='display-settings-layout-description'>
                    <span>{globalize.translate('DisplayModeHelp')}</span>
                    <span>{globalize.translate('LabelPleaseRestart')}</span>
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <Select label={globalize.translate('LabelTheme')}>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-disable-css-description'
                    control={<Checkbox />}
                    label={globalize.translate('DisableCustomCss')}
                />
                <FormHelperText id='display-settings-disable-css-description'>
                    {globalize.translate('LabelDisableCustomCss')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <TextField
                    aria-describedby='display-settings-custom-css-description'
                    label={globalize.translate('LabelCustomCss')}
                    multiline
                />
                <FormHelperText id='display-settings-custom-css-description'>
                    {globalize.translate('LabelLocalCustomCss')}
                </FormHelperText>
            </FormControl>

            {/* TODO: There are some admin-only options here */}
            {/* Server Dashboard Theme */}

            <FormControl fullWidth>
                <Select label={globalize.translate('LabelScreensaver')}></Select>
            </FormControl>

            {/* TODO: There are some extra options here related to screensavers */}

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-faster-animations-description'
                    control={<Checkbox />}
                    label={globalize.translate('EnableFasterAnimations')}
                />
                <FormHelperText id='display-settings-faster-animations-description'>
                    {globalize.translate('EnableFasterAnimationsHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-blurhash-description'
                    control={<Checkbox />}
                    label={globalize.translate('EnableBlurHash')}
                />
                <FormHelperText id='display-settings-blurhash-description'>
                    {globalize.translate('EnableBlurHashHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
}
