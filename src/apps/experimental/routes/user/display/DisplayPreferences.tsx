import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import globalize from 'scripts/globalize';
import { DisplaySettingsValues } from './types';
import { useScreensavers } from './hooks/useScreensavers';
import { useServerThemes } from './hooks/useServerThemes';

interface DisplayPreferencesProps {
    onChange: (event: SelectChangeEvent | React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function DisplayPreferences({ onChange, values }: Readonly<DisplayPreferencesProps>) {
    const { screensavers } = useScreensavers();
    const { themes } = useServerThemes();

    return (
        <Stack spacing={2}>
            <Typography variant='h2'>{globalize.translate('Display')}</Typography>

            <FormControl fullWidth>
                <Select
                    aria-describedby='display-settings-layout-description'
                    inputProps={{
                        name: 'layout'
                    }}
                    label={globalize.translate('LabelDisplayMode')}
                    onChange={onChange}
                    value={values.layout}
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
                <Select
                    inputProps={{
                        name: 'theme'
                    }}
                    label={globalize.translate('LabelTheme')}
                    onChange={onChange}
                    value={values.theme}
                >
                    { ...themes.map(({ id, name }) => (
                        <MenuItem key={id} value={id}>{name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-disable-css-description'
                    control={
                        <Checkbox
                            checked={values.disableCustomCss}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('DisableCustomCss')}
                    name='disableCustomCss'
                />
                <FormHelperText id='display-settings-disable-css-description'>
                    {globalize.translate('LabelDisableCustomCss')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <TextField
                    aria-describedby='display-settings-custom-css-description'
                    defaultValue={values.customCss}
                    label={globalize.translate('LabelCustomCss')}
                    multiline
                    name='customCss'
                    onChange={onChange}
                />
                <FormHelperText id='display-settings-custom-css-description'>
                    {globalize.translate('LabelLocalCustomCss')}
                </FormHelperText>
            </FormControl>

            {/* TODO: There are some admin-only options here */}
            {/* Server Dashboard Theme */}

            <FormControl fullWidth>
                <Select
                    inputProps={{
                        name: 'screensaver'
                    }}
                    label={globalize.translate('LabelScreensaver')}
                    onChange={onChange}
                    value={values.screensaver}
                >
                    { ...screensavers.map(({ id, name }) => (
                        <MenuItem key={id} value={id}>{name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* TODO: There are some extra options here related to screensavers */}

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-faster-animations-description'
                    control={
                        <Checkbox
                            checked={values.enableFasterAnimation}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('EnableFasterAnimations')}
                    name='enableFasterAnimation'
                />
                <FormHelperText id='display-settings-faster-animations-description'>
                    {globalize.translate('EnableFasterAnimationsHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-blurhash-description'
                    control={
                        <Checkbox
                            checked={values.enableBlurHash}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('EnableBlurHash')}
                    name='enableBlurHash'
                />
                <FormHelperText id='display-settings-blurhash-description'>
                    {globalize.translate('EnableBlurHashHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
}
