import Checkbox from '@mui/material/Checkbox/Checkbox';
import FormControl from '@mui/material/FormControl/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText/FormHelperText';
import InputLabel from '@mui/material/InputLabel/InputLabel';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Select from '@mui/material/Select/Select';
import { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack/Stack';
import TextField from '@mui/material/TextField/TextField';
import Typography from '@mui/material/Typography/Typography';
import React, { Fragment } from 'react';

import { safeAppHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import { LayoutMode } from 'constants/layoutMode';
import { useApi } from 'hooks/useApi';
import { useThemes } from 'hooks/useThemes';
import globalize from 'lib/globalize';

import { useScreensavers } from '../hooks/useScreensavers';
import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface DisplayPreferencesProps {
    onChange: (event: SelectChangeEvent | React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function DisplayPreferences({ onChange, values }: Readonly<DisplayPreferencesProps>) {
    const { user } = useApi();
    const { screensavers } = useScreensavers();
    const { themes } = useThemes();

    return (
        <Stack spacing={3}>
            <Typography variant='h2'>{globalize.translate('Display')}</Typography>

            { safeAppHost.supports(AppFeature.DisplayMode) && (
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
                        <MenuItem value={LayoutMode.Auto}>{globalize.translate('Auto')}</MenuItem>
                        <MenuItem value={LayoutMode.Desktop}>{globalize.translate('Desktop')}</MenuItem>
                        <MenuItem value={LayoutMode.Mobile}>{globalize.translate('Mobile')}</MenuItem>
                        <MenuItem value={LayoutMode.Tv}>{globalize.translate('TV')}</MenuItem>
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
                        {themes.map(({ id, name }) => (
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
                        { themes.map(({ id, name }) => (
                            <MenuItem key={ id } value={ id }>{ name }</MenuItem>
                        )) }
                    </Select>
                </FormControl>
            ) }

            { screensavers.length > 0 && safeAppHost.supports(AppFeature.Screensaver) && (
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
                            { screensavers.map(({ id, name }) => (
                                <MenuItem key={id} value={id}>{name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <TextField
                            aria-describedby='display-settings-screensaver-interval-description'
                            value={values.screensaverInterval}
                            label={globalize.translate('LabelBackdropScreensaverInterval')}
                            name='screensaverInterval'
                            onChange={onChange}
                            slotProps={{
                                htmlInput: {
                                    inputMode: 'numeric',
                                    max: '3600',
                                    min: '1',
                                    pattern: '[0-9]',
                                    required: true,
                                    step: '1',
                                    type: 'number'
                                }
                            }}
                        />
                        <FormHelperText id='display-settings-screensaver-interval-description'>
                            {globalize.translate('LabelBackdropScreensaverIntervalHelp')}
                        </FormHelperText>
                    </FormControl>
                </Fragment>
            ) }

            <FormControl fullWidth>
                <TextField
                    aria-describedby='display-settings-slideshow-interval-description'
                    value={values.slideshowInterval}
                    label={globalize.translate('LabelSlideshowInterval')}
                    name='slideshowInterval'
                    onChange={onChange}
                    slotProps={{
                        htmlInput: {
                            inputMode: 'numeric',
                            max: '3600',
                            min: '1',
                            pattern: '[0-9]',
                            required: true,
                            step: '1',
                            type: 'number'
                        }
                    }}
                />
                <FormHelperText id='display-settings-slideshow-interval-description'>
                    {globalize.translate('LabelSlideshowIntervalHelp')}
                </FormHelperText>
            </FormControl>

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
