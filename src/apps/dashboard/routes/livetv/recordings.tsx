import React, { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box/Box';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Stack from '@mui/material/Stack/Stack';
import TextField from '@mui/material/TextField/TextField';
import Typography from '@mui/material/Typography/Typography';
import Page from 'components/Page';
import { QUERY_KEY, useNamedConfiguration } from 'hooks/useNamedConfiguration';
import globalize from 'lib/globalize';
import { ActionFunctionArgs, Form, useActionData, useNavigation, useSubmit } from 'react-router-dom';
import type { LiveTvOptions } from '@jellyfin/sdk/lib/generated-client/models/live-tv-options';
import Loading from 'components/loading/LoadingComponent';
import Alert from '@mui/material/Alert/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import DirectoryBrowser from 'components/directorybrowser/directorybrowser';
import FormControl from '@mui/material/FormControl/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel';
import Checkbox from '@mui/material/Checkbox/Checkbox';
import FormHelperText from '@mui/material/FormHelperText/FormHelperText';
import Button from '@mui/material/Button/Button';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from 'utils/query/queryClient';
import { ActionData } from 'types/actionData';

const CONFIG_KEY = 'livetv';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const data = await request.json() as LiveTvOptions;

    await getConfigurationApi(api)
        .updateNamedConfiguration({ key: CONFIG_KEY, body: data });

    void queryClient.invalidateQueries({
        queryKey: [ QUERY_KEY, CONFIG_KEY ]
    });

    return {
        isSaved: true
    };
};

export const Component = () => {
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const { data: initialConfig, isPending, isError } = useNamedConfiguration<LiveTvOptions>(CONFIG_KEY);
    const [ config, setConfig ] = useState<LiveTvOptions | null>(null);
    const [ prePaddingMinutes, setPrePaddingMinutes ] = useState('');
    const [ postPaddingMinutes, setPostPaddingMinutes ] = useState('');
    const isSubmitting = navigation.state === 'submitting';
    const submit = useSubmit();

    useEffect(() => {
        if (initialConfig && config == null) {
            setConfig(initialConfig);
            if (initialConfig.PrePaddingSeconds) {
                setPrePaddingMinutes((initialConfig.PrePaddingSeconds / 60).toString());
            }
            if (initialConfig.PostPaddingSeconds) {
                setPostPaddingMinutes((initialConfig.PostPaddingSeconds / 60).toString());
            }
        }
    }, [ initialConfig, config ]);

    const onPrePaddingMinutesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPrePaddingMinutes(e.target.value);
        setConfig({
            ...config,
            PrePaddingSeconds: parseInt(e.target.value, 10) * 60
        });
    }, [ config ]);

    const onPostPaddingMinutesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPostPaddingMinutes(e.target.value);
        setConfig({
            ...config,
            PostPaddingSeconds: parseInt(e.target.value, 10) * 60
        });
    }, [ config ]);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.value
        });
    }, [ config ]);

    const onCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.checked
        });
    }, [ config ]);

    const showRecordingPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: (path: string) => {
                if (path) {
                    setConfig({
                        ...config,
                        RecordingPath: path
                    });
                }

                picker.close();
            },
            validateWriteable: true
        });
    }, [ config ]);

    const showMovieRecordingPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: (path: string) => {
                if (path) {
                    setConfig({
                        ...config,
                        MovieRecordingPath: path
                    });
                }

                picker.close();
            },
            validateWriteable: true
        });
    }, [ config ]);

    const showSeriesRecordingPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: (path: string) => {
                if (path) {
                    setConfig({
                        ...config,
                        SeriesRecordingPath: path
                    });
                }

                picker.close();
            },
            validateWriteable: true
        });
    }, [ config ]);

    const showPostProcessorPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: (path: string) => {
                if (path) {
                    setConfig({
                        ...config,
                        RecordingPostProcessor: path
                    });
                }

                picker.close();
            },
            validateWriteable: true
        });
    }, [ config ]);

    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (config) {
            submit(
                JSON.stringify(config),
                { method: 'post', encType: 'application/json' }
            );
        }
    }, [ config, submit ]);

    if (isPending || !config) {
        return <Loading />;
    }

    return (
        <Page
            id='liveTvSettingsPage'
            title={globalize.translate('HeaderDVR')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                {isError ? (
                    <Alert severity='error'>{globalize.translate('LiveTVPageLoadError')}</Alert>
                ) : (
                    <Form method='POST' onSubmit={onSubmit}>
                        <Stack spacing={3}>
                            <Typography variant='h1'>{globalize.translate('HeaderDVR')}</Typography>

                            {(!isSubmitting && actionData?.isSaved) && (
                                <Alert severity='success'>
                                    {globalize.translate('SettingsSaved')}
                                </Alert>
                            )}

                            <TextField
                                select
                                name='GuideDays'
                                label={globalize.translate('LabelNumberOfGuideDays')}
                                helperText={globalize.translate('LabelNumberOfGuideDaysHelp')}
                                value={config.GuideDays || ''}
                                onChange={onChange}
                                slotProps={{
                                    select: {
                                        displayEmpty: true
                                    },

                                    inputLabel: {
                                        shrink: true
                                    }
                                }}
                            >
                                <MenuItem value=''>{globalize.translate('Auto')}</MenuItem>
                                <MenuItem value='1'>1</MenuItem>
                                <MenuItem value='2'>2</MenuItem>
                                <MenuItem value='3'>3</MenuItem>
                                <MenuItem value='4'>4</MenuItem>
                                <MenuItem value='5'>5</MenuItem>
                                <MenuItem value='6'>6</MenuItem>
                                <MenuItem value='7'>7</MenuItem>
                                <MenuItem value='8'>8</MenuItem>
                                <MenuItem value='9'>9</MenuItem>
                                <MenuItem value='10'>10</MenuItem>
                                <MenuItem value='11'>11</MenuItem>
                                <MenuItem value='12'>12</MenuItem>
                                <MenuItem value='13'>13</MenuItem>
                                <MenuItem value='14'>14</MenuItem>
                            </TextField>

                            <TextField
                                name='RecordingPath'
                                label={globalize.translate('LabelRecordingPath')}
                                helperText={globalize.translate('LabelRecordingPathHelp')}
                                value={config.RecordingPath}
                                onChange={onChange}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <IconButton edge='end' onClick={showRecordingPathPicker}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    },

                                    inputLabel: {
                                        shrink: !!config.RecordingPath
                                    }
                                }}
                            />

                            <TextField
                                name='MovieRecordingPath'
                                label={globalize.translate('LabelMovieRecordingPath')}
                                value={config.MovieRecordingPath}
                                onChange={onChange}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <IconButton edge='end' onClick={showMovieRecordingPathPicker}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    },

                                    inputLabel: {
                                        shrink: !!config.MovieRecordingPath
                                    }
                                }}
                            />

                            <TextField
                                name='SeriesRecordingPath'
                                label={globalize.translate('LabelSeriesRecordingPath')}
                                value={config.SeriesRecordingPath}
                                onChange={onChange}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <IconButton edge='end' onClick={showSeriesRecordingPathPicker}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    },

                                    inputLabel: {
                                        shrink: !!config.SeriesRecordingPath
                                    }
                                }}
                            />

                            <Typography variant='h2'>{globalize.translate('HeaderDefaultRecordingSettings')}</Typography>

                            <TextField
                                name='PrePaddingMinutes'
                                label={globalize.translate('LabelStartWhenPossible')}
                                value={prePaddingMinutes}
                                onChange={onPrePaddingMinutesChange}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <Typography variant='body1' color='text.secondary'>{globalize.translate('MinutesBefore')}</Typography>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <TextField
                                name='PostPaddingMinutes'
                                label={globalize.translate('LabelStopWhenPossible')}
                                value={postPaddingMinutes}
                                onChange={onPostPaddingMinutesChange}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <Typography variant='body1' color='text.secondary'>{globalize.translate('MinutesAfter')}</Typography>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <Typography variant='h2'>{globalize.translate('HeaderRecordingPostProcessing')}</Typography>

                            <TextField
                                name='RecordingPostProcessor'
                                label={globalize.translate('LabelPostProcessor')}
                                value={config.RecordingPostProcessor}
                                onChange={onChange}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <IconButton edge='end' onClick={showPostProcessorPicker}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    },

                                    inputLabel: {
                                        shrink: !!config.RecordingPostProcessor
                                    }
                                }}
                            />

                            <TextField
                                name='RecordingPostProcessorArguments'
                                label={globalize.translate('LabelPostProcessorArguments')}
                                helperText={globalize.translate('LabelPostProcessorArgumentsHelp')}
                                value={config.RecordingPostProcessorArguments}
                                onChange={onChange}
                            />

                            <Typography variant='h2'>{globalize.translate('HeaderRecordingMetadataSaving')}</Typography>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name='SaveRecordingNFO'
                                            checked={config.SaveRecordingNFO}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                    label={globalize.translate('SaveRecordingNFO')}
                                />
                                <FormHelperText>{globalize.translate('SaveRecordingNFOHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name='SaveRecordingImages'
                                            checked={config.SaveRecordingImages}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                    label={globalize.translate('SaveRecordingImages')}
                                />
                                <FormHelperText>{globalize.translate('SaveRecordingImagesHelp')}</FormHelperText>
                            </FormControl>

                            <Button type='submit' size='large'>
                                {globalize.translate('Save')}
                            </Button>
                        </Stack>
                    </Form>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'LiveTvRecordingsPage';
