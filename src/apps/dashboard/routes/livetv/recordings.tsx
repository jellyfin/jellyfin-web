import React, { useCallback, useEffect, useState } from 'react';
import Page from 'components/Page';
import { QUERY_KEY, useNamedConfiguration } from 'hooks/useNamedConfiguration';
import globalize from 'lib/globalize';
import { type ActionData } from 'types/actionData';
import type { LiveTvOptions } from '@jellyfin/sdk/lib/generated-client/models/live-tv-options';
import Loading from 'components/loading/LoadingComponent';
import { Alert } from 'ui-primitives/Alert';
import DirectoryBrowser from 'components/directorybrowser/directorybrowser';
import { Button } from 'ui-primitives/Button';
import { Checkbox } from 'ui-primitives/Checkbox';
import { Flex } from 'ui-primitives/Box';
import { FormControl, FormControlLabel, FormHelperText } from 'ui-primitives/FormControl';
import { Input } from 'ui-primitives/Input';
import { Text } from 'ui-primitives/Text';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives/Select';
import { IconButton } from 'ui-primitives/IconButton';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from 'utils/query/queryClient';

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
);

const CONFIG_KEY = 'livetv';

export const Component = (): React.ReactElement => {
    const [actionData, setActionData] = useState<ActionData | undefined>();
    const { data: initialConfig, isPending, isError } = useNamedConfiguration<LiveTvOptions>(CONFIG_KEY);
    const [config, setConfig] = useState<LiveTvOptions | null>(null);
    const [prePaddingMinutes, setPrePaddingMinutes] = useState('');
    const [postPaddingMinutes, setPostPaddingMinutes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
    }, [initialConfig, config]);

    const onPrePaddingMinutesChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setPrePaddingMinutes(e.target.value);
            setConfig({
                ...config,
                PrePaddingSeconds: parseInt(e.target.value, 10) * 60
            });
        },
        [config]
    );

    const onPostPaddingMinutesChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setPostPaddingMinutes(e.target.value);
            setConfig({
                ...config,
                PostPaddingSeconds: parseInt(e.target.value, 10) * 60
            });
        },
        [config]
    );

    const onChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setConfig({
                ...config,
                [e.target.name]: e.target.value
            });
        },
        [config]
    );

    const onCheckboxChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setConfig({
                ...config,
                [e.target.name]: e.target.checked
            });
        },
        [config]
    );

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
    }, [config]);

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
    }, [config]);

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
    }, [config]);

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
    }, [config]);

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!config) {
                return;
            }

            setIsSubmitting(true);
            try {
                const api = ServerConnections.getCurrentApi();
                if (!api) {
                    throw new Error('No Api instance available');
                }

                await getConfigurationApi(api).updateNamedConfiguration({ key: CONFIG_KEY, body: config });

                void queryClient.invalidateQueries({
                    queryKey: [QUERY_KEY, CONFIG_KEY]
                });

                setActionData({ isSaved: true });
            } catch (error) {
                setActionData({ isSaved: false });
            } finally {
                setIsSubmitting(false);
            }
        },
        [config]
    );

    if (isPending || !config) {
        return <Loading />;
    }

    return (
        <Page
            id="liveTvSettingsPage"
            title={globalize.translate('HeaderDVR')}
            className="mainAnimatedPage type-interior"
        >
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                {isError ? (
                    <Alert variant="error">{globalize.translate('LiveTVPageLoadError')}</Alert>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                            <Text as="h1" size="xl" weight="bold">
                                {globalize.translate('HeaderDVR')}
                            </Text>

                            {!isSubmitting && actionData?.isSaved && (
                                <Alert variant="success">{globalize.translate('SettingsSaved')}</Alert>
                            )}

                            <Select name="GuideDays" defaultValue={config.GuideDays?.toString() || ''}>
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue placeholder={globalize.translate('LabelNumberOfGuideDays')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{globalize.translate('Auto')}</SelectItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(num => (
                                        <SelectItem key={num} value={num.toString()}>
                                            {num}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                name="RecordingPath"
                                label={globalize.translate('LabelRecordingPath')}
                                defaultValue={config.RecordingPath ?? ''}
                            />

                            <Input
                                name="MovieRecordingPath"
                                label={globalize.translate('LabelMovieRecordingPath')}
                                defaultValue={config.MovieRecordingPath ?? ''}
                            />

                            <Input
                                name="SeriesRecordingPath"
                                label={globalize.translate('LabelSeriesRecordingPath')}
                                defaultValue={config.SeriesRecordingPath ?? ''}
                            />

                            <Text as="h2" size="lg" weight="bold">
                                {globalize.translate('HeaderDefaultRecordingSettings')}
                            </Text>

                            <Input
                                name="PrePaddingMinutes"
                                type="number"
                                label={globalize.translate('LabelStartWhenPossible')}
                                value={prePaddingMinutes}
                                onChange={onPrePaddingMinutesChange}
                            />

                            <Input
                                name="PostPaddingMinutes"
                                type="number"
                                label={globalize.translate('LabelStopWhenPossible')}
                                value={postPaddingMinutes}
                                onChange={onPostPaddingMinutesChange}
                            />

                            <Text as="h2" size="lg" weight="bold">
                                {globalize.translate('HeaderRecordingPostProcessing')}
                            </Text>

                            <Input
                                name="RecordingPostProcessor"
                                label={globalize.translate('LabelPostProcessor')}
                                defaultValue={config.RecordingPostProcessor ?? ''}
                            />

                            <Input
                                name="RecordingPostProcessorArguments"
                                label={globalize.translate('LabelPostProcessorArguments')}
                                helperText={globalize.translate('LabelPostProcessorArgumentsHelp')}
                                defaultValue={config.RecordingPostProcessorArguments ?? ''}
                            />

                            <Text as="h2" size="lg" weight="bold">
                                {globalize.translate('HeaderRecordingMetadataSaving')}
                            </Text>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="SaveRecordingNFO"
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
                                            name="SaveRecordingImages"
                                            checked={config.SaveRecordingImages}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                    label={globalize.translate('SaveRecordingImages')}
                                />
                                <FormHelperText>{globalize.translate('SaveRecordingImagesHelp')}</FormHelperText>
                            </FormControl>

                            <Button type="submit">{globalize.translate('Save')}</Button>
                        </Flex>
                    </form>
                )}
            </Flex>
        </Page>
    );
};

Component.displayName = 'LiveTvRecordingsPage';
