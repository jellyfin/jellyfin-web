import type { ProcessPriorityClass, ServerConfiguration, TrickplayScanBehavior } from '@jellyfin/sdk/lib/generated-client';
import React, { type FunctionComponent, useCallback, useEffect, useRef } from 'react';

import globalize from '../../../../scripts/globalize';
import Page from '../../../../components/Page';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import ButtonElement from '../../../../elements/ButtonElement';
import CheckBoxElement from '../../../../elements/CheckBoxElement';
import SelectElement from '../../../../elements/SelectElement';
import InputElement from '../../../../elements/InputElement';
import loading from '../../../../components/loading/loading';
import toast from '../../../../components/toast/toast';
import ServerConnections from '../../../../components/ServerConnections';

function onSaveComplete() {
    loading.hide();
    toast(globalize.translate('SettingsSaved'));
}

const PlaybackTrickplay: FunctionComponent = () => {
    const element = useRef<HTMLDivElement>(null);

    const loadConfig = useCallback((config) => {
        const page = element.current;
        const options = config.TrickplayOptions;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        (page.querySelector('.chkEnableHwAcceleration') as HTMLInputElement).checked = options.EnableHwAcceleration;
        (page.querySelector('.chkEnableHwEncoding') as HTMLInputElement).checked = options.EnableHwEncoding;
        (page.querySelector('#selectScanBehavior') as HTMLSelectElement).value = options.ScanBehavior;
        (page.querySelector('#selectProcessPriority') as HTMLSelectElement).value = options.ProcessPriority;
        (page.querySelector('#txtInterval') as HTMLInputElement).value = options.Interval;
        (page.querySelector('#txtWidthResolutions') as HTMLInputElement).value = options.WidthResolutions.join(',');
        (page.querySelector('#txtTileWidth') as HTMLInputElement).value = options.TileWidth;
        (page.querySelector('#txtTileHeight') as HTMLInputElement).value = options.TileHeight;
        (page.querySelector('#txtQscale') as HTMLInputElement).value = options.Qscale;
        (page.querySelector('#txtJpegQuality') as HTMLInputElement).value = options.JpegQuality;
        (page.querySelector('#txtProcessThreads') as HTMLInputElement).value = options.ProcessThreads;

        loading.hide();
    }, []);

    const loadData = useCallback(() => {
        loading.show();

        ServerConnections.currentApiClient()?.getServerConfiguration().then(function (config) {
            loadConfig(config);
        }).catch(err => {
            console.error('[PlaybackTrickplay] failed to fetch server config', err);
        });
    }, [loadConfig]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const saveConfig = (config: ServerConfiguration) => {
            const apiClient = ServerConnections.currentApiClient();

            if (!apiClient) {
                console.error('[PlaybackTrickplay] No current apiclient instance');
                return;
            }

            if (!config.TrickplayOptions) {
                throw new Error('Unexpected null TrickplayOptions');
            }

            const options = config.TrickplayOptions;
            options.EnableHwAcceleration = (page.querySelector('.chkEnableHwAcceleration') as HTMLInputElement).checked;
            options.EnableHwEncoding = (page.querySelector('.chkEnableHwEncoding') as HTMLInputElement).checked;
            options.ScanBehavior = (page.querySelector('#selectScanBehavior') as HTMLSelectElement).value as TrickplayScanBehavior;
            options.ProcessPriority = (page.querySelector('#selectProcessPriority') as HTMLSelectElement).value as ProcessPriorityClass;
            options.Interval = Math.max(1, parseInt((page.querySelector('#txtInterval') as HTMLInputElement).value || '10000', 10));
            options.WidthResolutions = (page.querySelector('#txtWidthResolutions') as HTMLInputElement).value.replace(' ', '').split(',').map(Number);
            options.TileWidth = Math.max(1, parseInt((page.querySelector('#txtTileWidth') as HTMLInputElement).value || '10', 10));
            options.TileHeight = Math.max(1, parseInt((page.querySelector('#txtTileHeight') as HTMLInputElement).value || '10', 10));
            options.Qscale = Math.min(31, parseInt((page.querySelector('#txtQscale') as HTMLInputElement).value || '4', 10));
            options.JpegQuality = Math.min(100, parseInt((page.querySelector('#txtJpegQuality') as HTMLInputElement).value || '90', 10));
            options.ProcessThreads = parseInt((page.querySelector('#txtProcessThreads') as HTMLInputElement).value || '1', 10);

            apiClient.updateServerConfiguration(config).then(() => {
                onSaveComplete();
            }).catch(err => {
                console.error('[PlaybackTrickplay] failed to update config', err);
            });
        };

        const onSubmit = (e: Event) => {
            const apiClient = ServerConnections.currentApiClient();

            if (!apiClient) {
                console.error('[PlaybackTrickplay] No current apiclient instance');
                return;
            }

            loading.show();
            apiClient.getServerConfiguration().then(function (config) {
                saveConfig(config);
            }).catch(err => {
                console.error('[PlaybackTrickplay] failed to fetch server config', err);
            });

            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        (page.querySelector('.trickplayConfigurationForm') as HTMLFormElement).addEventListener('submit', onSubmit);

        loadData();
    }, [loadData]);

    const optionScanBehavior = () => {
        let content = '';
        content += `<option value='NonBlocking'>${globalize.translate('NonBlockingScan')}</option>`;
        content += `<option value='Blocking'>${globalize.translate('BlockingScan')}</option>`;
        return content;
    };

    const optionProcessPriority = () => {
        let content = '';
        content += `<option value='High'>${globalize.translate('PriorityHigh')}</option>`;
        content += `<option value='AboveNormal'>${globalize.translate('PriorityAboveNormal')}</option>`;
        content += `<option value='Normal'>${globalize.translate('PriorityNormal')}</option>`;
        content += `<option value='BelowNormal'>${globalize.translate('PriorityBelowNormal')}</option>`;
        content += `<option value='Idle'>${globalize.translate('PriorityIdle')}</option>`;
        return content;
    };

    return (
        <Page
            id='trickplayConfigurationPage'
            className='mainAnimatedPage type-interior playbackConfigurationPage'
        >
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={globalize.translate('Trickplay')}
                        isLinkVisible={false}
                    />
                </div>

                <form className='trickplayConfigurationForm'>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            className='chkEnableHwAcceleration'
                            title='LabelTrickplayAccel'
                        />
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            className='chkEnableHwEncoding'
                            title='LabelTrickplayAccelEncoding'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            <div className='fieldDescription'>
                                {globalize.translate('LabelTrickplayAccelEncodingHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='selectContainer fldSelectScanBehavior'>
                            <SelectElement
                                id='selectScanBehavior'
                                label='LabelScanBehavior'
                            >
                                {optionScanBehavior()}
                            </SelectElement>
                            <div className='fieldDescription'>
                                {globalize.translate('LabelScanBehaviorHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='selectContainer fldSelectProcessPriority'>
                            <SelectElement
                                id='selectProcessPriority'
                                label='LabelProcessPriority'
                            >
                                {optionProcessPriority()}
                            </SelectElement>
                            <div className='fieldDescription'>
                                {globalize.translate('LabelProcessPriorityHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='inputContainer'>
                            <InputElement
                                type='number'
                                id='txtInterval'
                                label='LabelImageInterval'
                                options={'required inputMode="numeric" pattern="[0-9]*" min="1"'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelImageIntervalHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='inputContainer'>
                            <InputElement
                                type='text'
                                id='txtWidthResolutions'
                                label='LabelWidthResolutions'
                                options={'required pattern="[0-9,]*"'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelWidthResolutionsHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='inputContainer'>
                            <InputElement
                                type='number'
                                id='txtTileWidth'
                                label='LabelTileWidth'
                                options={'required inputMode="numeric" pattern="[0-9]*" min="1"'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelTileWidthHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='inputContainer'>
                            <InputElement
                                type='number'
                                id='txtTileHeight'
                                label='LabelTileHeight'
                                options={'required inputMode="numeric" pattern="[0-9]*" min="1"'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelTileHeightHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='inputContainer'>
                            <InputElement
                                type='number'
                                id='txtJpegQuality'
                                label='LabelJpegQuality'
                                options={'required inputMode="numeric" pattern="[0-9]*" min="1" max="100"'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelJpegQualityHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='inputContainer'>
                            <InputElement
                                type='number'
                                id='txtQscale'
                                label='LabelQscale'
                                options={'required inputMode="numeric" pattern="[0-9]*" min="2" max="31"'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelQscaleHelp')}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <div className='inputContainer'>
                            <InputElement
                                type='number'
                                id='txtProcessThreads'
                                label='LabelTrickplayThreads'
                                options={'required inputMode="numeric" pattern="[0-9]*" min="0"'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelTrickplayThreadsHelp')}
                            </div>
                        </div>
                    </div>

                    <div>
                        <ButtonElement
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                        />
                    </div>
                </form>
            </div>
        </Page>
    );
};

export default PlaybackTrickplay;
