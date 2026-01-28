import React, { useCallback, useState } from 'react';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import Page from 'components/Page';
import Loading from 'components/loading/LoadingComponent';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { TrickplayScanBehavior } from '@jellyfin/sdk/lib/generated-client/models/trickplay-scan-behavior';
import { ProcessPriorityClass } from '@jellyfin/sdk/lib/generated-client/models/process-priority-class';
import { type ActionData } from 'types/actionData';
import { queryClient } from 'utils/query/queryClient';
import { Alert } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { FormControl, FormControlLabel, FormHelperText } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';

export const Component = (): React.ReactElement => {
    const { data: defaultConfig, isPending } = useConfiguration();
    const [actionData, setActionData] = useState<ActionData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const api = ServerConnections.getCurrentApi();
            if (!api) {
                throw new Error('No Api instance available');
            }

            const formData = new FormData(event.currentTarget);
            const data = Object.fromEntries(formData);

            const { data: config } = await getConfigurationApi(api).getConfiguration();

            const options = config.TrickplayOptions;
            if (!options) throw new Error('Unexpected null TrickplayOptions');

            options.EnableHwAcceleration = data.HwAcceleration?.toString() === 'on';
            options.EnableHwEncoding = data.HwEncoding?.toString() === 'on';
            options.EnableKeyFrameOnlyExtraction = data.KeyFrameOnlyExtraction?.toString() === 'on';
            options.ScanBehavior = data.ScanBehavior.toString() as TrickplayScanBehavior;
            options.ProcessPriority = data.ProcessPriority.toString() as ProcessPriorityClass;
            options.Interval = parseInt(data.ImageInterval.toString() || '10000', 10);
            options.WidthResolutions = data.WidthResolutions.toString().replace(' ', '').split(',').map(Number);
            options.TileWidth = parseInt(data.TileWidth.toString() || '10', 10);
            options.TileHeight = parseInt(data.TileHeight.toString() || '10', 10);
            options.Qscale = parseInt(data.Qscale.toString() || '4', 10);
            options.JpegQuality = parseInt(data.JpegQuality.toString() || '90', 10);
            options.ProcessThreads = parseInt(data.TrickplayThreads.toString() || '1', 10);

            await getConfigurationApi(api).updateConfiguration({ serverConfiguration: config });

            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY]
            });

            setActionData({ isSaved: true });
        } catch (error) {
            setActionData({ isSaved: false });
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    if (!defaultConfig || isPending) {
        return <Loading />;
    }

    return (
        <Page
            id="trickplayConfigurationPage"
            className="mainAnimatedPage type-interior"
            title={globalize.translate('Trickplay')}
        >
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                <form onSubmit={handleSubmit}>
                    <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                        <Text as="h1" size="xl" weight="bold">
                            {globalize.translate('Trickplay')}
                        </Text>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert variant="success">{globalize.translate('SettingsSaved')}</Alert>
                        )}

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="HwAcceleration"
                                        defaultChecked={defaultConfig.TrickplayOptions?.EnableHwAcceleration}
                                    />
                                }
                                label={globalize.translate('LabelTrickplayAccel')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="HwEncoding"
                                        defaultChecked={defaultConfig.TrickplayOptions?.EnableHwEncoding}
                                    />
                                }
                                label={globalize.translate('LabelTrickplayAccelEncoding')}
                            />
                            <FormHelperText>{globalize.translate('LabelTrickplayAccelEncodingHelp')}</FormHelperText>
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="KeyFrameOnlyExtraction"
                                        defaultChecked={defaultConfig.TrickplayOptions?.EnableKeyFrameOnlyExtraction}
                                    />
                                }
                                label={globalize.translate('LabelTrickplayKeyFrameOnlyExtraction')}
                            />
                            <FormHelperText>
                                {globalize.translate('LabelTrickplayKeyFrameOnlyExtractionHelp')}
                            </FormHelperText>
                        </FormControl>

                        <Select name="ScanBehavior" defaultValue={defaultConfig.TrickplayOptions?.ScanBehavior}>
                            <SelectTrigger style={{ width: '100%' }}>
                                <SelectValue placeholder={globalize.translate('LabelScanBehavior')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TrickplayScanBehavior.NonBlocking}>
                                    {globalize.translate('NonBlockingScan')}
                                </SelectItem>
                                <SelectItem value={TrickplayScanBehavior.Blocking}>
                                    {globalize.translate('BlockingScan')}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select name="ProcessPriority" defaultValue={defaultConfig.TrickplayOptions?.ProcessPriority}>
                            <SelectTrigger style={{ width: '100%' }}>
                                <SelectValue placeholder={globalize.translate('LabelProcessPriority')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ProcessPriorityClass.High}>
                                    {globalize.translate('PriorityHigh')}
                                </SelectItem>
                                <SelectItem value={ProcessPriorityClass.AboveNormal}>
                                    {globalize.translate('PriorityAboveNormal')}
                                </SelectItem>
                                <SelectItem value={ProcessPriorityClass.Normal}>
                                    {globalize.translate('PriorityNormal')}
                                </SelectItem>
                                <SelectItem value={ProcessPriorityClass.BelowNormal}>
                                    {globalize.translate('PriorityBelowNormal')}
                                </SelectItem>
                                <SelectItem value={ProcessPriorityClass.Idle}>
                                    {globalize.translate('PriorityIdle')}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            label={globalize.translate('LabelImageInterval')}
                            name="ImageInterval"
                            type="number"
                            inputMode="numeric"
                            defaultValue={defaultConfig.TrickplayOptions?.Interval}
                            min={1}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelWidthResolutions')}
                            name="WidthResolutions"
                            defaultValue={defaultConfig.TrickplayOptions?.WidthResolutions?.join(',')}
                            pattern="[0-9,]*"
                        />

                        <Input
                            label={globalize.translate('LabelTileWidth')}
                            name="TileWidth"
                            type="number"
                            inputMode="numeric"
                            defaultValue={defaultConfig.TrickplayOptions?.TileWidth}
                            min={1}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelTileHeight')}
                            name="TileHeight"
                            type="number"
                            inputMode="numeric"
                            defaultValue={defaultConfig.TrickplayOptions?.TileHeight}
                            min={1}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelJpegQuality')}
                            name="JpegQuality"
                            type="number"
                            inputMode="numeric"
                            defaultValue={defaultConfig.TrickplayOptions?.JpegQuality}
                            min={1}
                            max={100}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelQscale')}
                            name="Qscale"
                            type="number"
                            inputMode="numeric"
                            defaultValue={defaultConfig.TrickplayOptions?.Qscale}
                            min={2}
                            max={31}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelTrickplayThreads')}
                            name="TrickplayThreads"
                            type="number"
                            inputMode="numeric"
                            defaultValue={defaultConfig.TrickplayOptions?.ProcessThreads}
                            min={0}
                            required
                        />

                        <Button type="submit">{globalize.translate('Save')}</Button>
                    </Flex>
                </form>
            </Flex>
        </Page>
    );
};

Component.displayName = 'TrickplayPage';
