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
import React, { Fragment } from 'react';

import { appHost } from 'components/apphost';
import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';
import { DisplaySettingsValues } from './types';
import { useScreensavers } from './hooks/useScreensavers';
import { useServerThemes } from './hooks/useServerThemes';

interface DisplayPreferencesProps {
    onChange: (event: SelectChangeEvent | React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function DisplayPreferences({ onChange, values }: Readonly<DisplayPreferencesProps>) {
    const { user } = useApi();
    const { screensavers } = useScreensavers();
    const { themes } = useServerThemes();

    return (
        <Stack spacing={3}>
            <Typography variant='h2'>{globalize.translate('Display')}</Typography>

            { appHost.supports('displaymode') && (
                <FormControl fullWidth>
                    <InputLabel id='display-settings-layout-label'>{globalize.translate('LabelDisplayMode')}</InputLabel>
                    <Select
                        aria-describedby='display-settings-layout-description'
                        inputProps={{
                            name: 'layout'
                        }}
                        labelId='display-settings-layout-label'
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
            ) }

            { themes.length > 0 && (
                <FormControl fullWidth>
                    <InputLabel id='display-settings-theme-label'>{globalize.translate('LabelTheme')}</InputLabel>
                    <Select
                        inputProps={{
                            name: 'theme'
                        }}
                        labelId='display-settings-theme-label'
                        onChange={onChange}
                        value={values.theme}
                    >
                        { ...themes.map(({ id, name }) => (
                            <MenuItem key={id} value={id}>{name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ) }

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
                    value={values.customCss}
                    label={globalize.translate('LabelCustomCss')}
                    multiline
                    name='customCss'
                    onChange={onChange}
                />
                <FormHelperText id='display-settings-custom-css-description'>
                    {globalize.translate('LabelLocalCustomCss')}
                </FormHelperText>
            </FormControl>

            { themes.length > 0 && user?.Policy?.IsAdministrator && (
                <FormControl fullWidth>
                    <InputLabel id='display-settings-dashboard-theme-label'>{globalize.translate('LabelDashboardTheme')}</InputLabel>
                    <Select
                        inputProps={{
                            name: 'dashboardTheme'
                        }}
                        labelId='display-settings-dashboard-theme-label'
                        onChange={ onChange }
                        value={ values.dashboardTheme }
                    >
                        { ...themes.map(({ id, name }) => (
                            <MenuItem key={ id } value={ id }>{ name }</MenuItem>
                        )) }
                    </Select>
                </FormControl>
            ) }

            { screensavers.length > 0 && appHost.supports('screensaver') && (
                <Fragment>
                    <FormControl fullWidth>
                        <InputLabel id='display-settings-screensaver-label'>{globalize.translate('LabelScreensaver')}</InputLabel>
                        <Select
                            inputProps={{
                                name: 'screensaver'
                            }}
                            labelId='display-settings-screensaver-label'
                            onChange={onChange}
                            value={values.screensaver}
                        >
                            { ...screensavers.map(({ id, name }) => (
                                <MenuItem key={id} value={id}>{name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <TextField
                            aria-describedby='display-settings-screensaver-interval-description'
                            value={values.screensaverInterval}
                            inputProps={{
                                inputMode: 'numeric',
                                max: '3600',
                                min: '1',
                                pattern: '[0-9]',
                                required: true,
                                step: '1',
                                type: 'number'
                            }}
                            label={globalize.translate('LabelBackdropScreensaverInterval')}
                            name='screensaverInterval'
                            onChange={onChange}
                        />
                        <FormHelperText id='display-settings-screensaver-interval-description'>
                            {globalize.translate('LabelBackdropScreensaverIntervalHelp')}
                        </FormHelperText>
                    </FormControl>
                </Fragment>
            ) }

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
