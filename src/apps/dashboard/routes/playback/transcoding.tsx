import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Form } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import { useNamedConfiguration } from 'hooks/useNamedConfiguration';
import Loading from 'components/loading/LoadingComponent';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import { FormControlLabel } from '@mui/material';
import { CODECS, HEVC_REXT_DECODING_TYPES, HEVC_VP9_HW_DECODING_TYPES } from 'apps/dashboard/features/playback/constants/codecs';

export const Component = () => {
    const { data: config, isPending, isError } = useNamedConfiguration('encoding');
    const [ hardwareAccelType, setHardwareAccelType ] = useState<string | null>(null);

    useEffect(() => {
        if (!isPending && !isError && !hardwareAccelType) {
            setHardwareAccelType(config.HardwareAccelerationType as string);
        }
    }, [ config, isPending, isError, hardwareAccelType ]);

    const onHardwareAccelTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setHardwareAccelType(e.target.value);
    }, []);

    const isHwaSelected = [ 'amf', 'nvenc', 'qsv', 'vaapi', 'rkmpp', 'videotoolbox' ].includes(hardwareAccelType || 'none');

    const availableCodecs = useMemo(() => (
        CODECS.filter(codec => codec.types.includes(hardwareAccelType || ''))
    ), [hardwareAccelType]);

    if (isPending || !hardwareAccelType) return <Loading />;

    return (
        <Page
            id='encodingSettingsPage'
            className='mainAnimatedPage type-interior'
            title={globalize.translate('TitlePlayback')}
        >
            <Box className='content-primary'>
                {isError ? (
                    <></>
                ) : (
                    <Form method='POST'>
                        <Stack spacing={3}>
                            <Typography variant='h1'>{globalize.translate('Transcoding')}</Typography>

                            <TextField
                                name='HardwareAccelerationType'
                                select
                                label={globalize.translate('LabelHardwareAccelerationType')}
                                value={hardwareAccelType || 'none'}
                                onChange={onHardwareAccelTypeChange}
                                helperText={(
                                    <Link href='https://jellyfin.org/docs/general/administration/hardware-acceleration' target='_blank'>
                                        {globalize.translate('LabelHardwareAccelerationTypeHelp')}
                                    </Link>
                                )}
                            >
                                <MenuItem value='none'>{globalize.translate('None')}</MenuItem>
                                <MenuItem value='amf'>AMD AMF</MenuItem>
                                <MenuItem value='nvenc'>Nvidia NVENC</MenuItem>
                                <MenuItem value='qsv'>Intel Quicksync (QSV)</MenuItem>
                                <MenuItem value='vaapi'>Video Acceleration API (VAAPI)</MenuItem>
                                <MenuItem value='rkmpp'>Rockchip MPP (RKMPP)</MenuItem>
                                <MenuItem value='videotoolbox'>Apple VideoToolBox</MenuItem>
                                <MenuItem value='v4l2m2m'>Video4Linux2 (V4L2)</MenuItem>
                            </TextField>

                            {hardwareAccelType !== 'none' && (
                                <FormControl variant='standard'>
                                    <Typography variant='h3'>{globalize.translate('LabelEnableHardwareDecodingFor')}</Typography>
                                    <FormGroup>
                                        {availableCodecs.map(codec => (
                                            <FormControlLabel
                                                key={codec.name}
                                                label={codec.name}
                                                control={
                                                    <Checkbox
                                                        name={codec.codec}
                                                        defaultChecked={(config.HardwareDecodingCodecs as string[]).includes(codec.codec)}
                                                    />
                                                }
                                            />
                                        ))}

                                        {HEVC_VP9_HW_DECODING_TYPES.includes(hardwareAccelType) && (
                                            <>
                                                <FormControlLabel
                                                    label={'HEVC 10bit'}
                                                    control={
                                                        <Checkbox
                                                            name={'EnableDecodingColorDepth10Hevc'}
                                                            defaultChecked={config.EnableDecodingColorDepth10Hevc as boolean}
                                                        />
                                                    }
                                                />

                                                <FormControlLabel
                                                    label={'VP9 10bit'}
                                                    control={
                                                        <Checkbox
                                                            name={'EnableDecodingColorDepth10Vp9'}
                                                            defaultChecked={config.EnableDecodingColorDepth10Vp9 as boolean}
                                                        />
                                                    }
                                                />
                                            </>
                                        )}

                                        {HEVC_REXT_DECODING_TYPES.includes(hardwareAccelType) && (
                                            <>
                                                <FormControlLabel
                                                    label={'HEVC RExt 8/10bit'}
                                                    control={
                                                        <Checkbox
                                                            name={'EnableDecodingColorDepth10HevcRext'}
                                                            defaultChecked={config.EnableDecodingColorDepth10HevcRext as boolean}
                                                        />
                                                    }
                                                />

                                                <FormControlLabel
                                                    label={'HEVC RExt 12bit'}
                                                    control={
                                                        <Checkbox
                                                            name={'EnableDecodingColorDepth12HevcRext'}
                                                            defaultChecked={config.EnableDecodingColorDepth12HevcRext as boolean}
                                                        />
                                                    }
                                                />
                                            </>
                                        )}
                                    </FormGroup>
                                </FormControl>
                            )}

                            <FormControl variant='standard'>
                                <Typography variant='h3'>{globalize.translate('LabelEncodingFormatOptions')}</Typography>
                                <FormHelperText>{globalize.translate('EncodingFormatHelp')}</FormHelperText>
                                <FormGroup>
                                    <FormControlLabel
                                        label={globalize.translate('AllowHevcEncoding')}
                                        control={
                                            <Checkbox name='AllowHevcEncoding' defaultChecked={config.AllowHevcEncoding as boolean} />
                                        }
                                    />
                                    <FormControlLabel
                                        label={globalize.translate('AllowAv1Encoding')}
                                        control={
                                            <Checkbox name='AllowAv1Encoding' defaultChecked={config.AllowAv1Encoding as boolean} />
                                        }
                                    />
                                </FormGroup>
                            </FormControl>

                            {(hardwareAccelType === 'none' || isHwaSelected) && (
                                <>
                                    {isHwaSelected && (
                                        <FormControl>
                                            <FormControlLabel
                                                label={globalize.translate('EnableTonemapping')}
                                                control={
                                                    <Checkbox name='EnableTonemapping' defaultChecked={config.EnableTonemapping as boolean} />
                                                }
                                            />
                                            <FormHelperText>{globalize.translate(isHwaSelected ? 'AllowTonemappingHelp' : 'AllowTonemappingSoftwareHelp')}</FormHelperText>
                                        </FormControl>
                                    )}

                                    <TextField
                                        name='TonemappingAlgorithm'
                                        select
                                        label={globalize.translate('LabelTonemappingAlgorithm')}
                                        defaultValue={config.TonemappingAlgorithm}
                                        helperText={(
                                            <Link href='https://ffmpeg.org/ffmpeg-all.html#tonemap_005fopencl' target='_blank'>
                                                {globalize.translate('TonemappingAlgorithmHelp')}
                                            </Link>
                                        )}
                                    >
                                        <MenuItem value='none'>{globalize.translate('None')}</MenuItem>
                                        <MenuItem value='clip'>Clip</MenuItem>
                                        <MenuItem value='linear'>Linear</MenuItem>
                                        <MenuItem value='gamma'>Gamma</MenuItem>
                                        <MenuItem value='reinhard'>Reinhard</MenuItem>
                                        <MenuItem value='hable'>Hable</MenuItem>
                                        <MenuItem value='mobius'>Mobius</MenuItem>
                                        <MenuItem value='bt2390'>BT.2390</MenuItem>
                                    </TextField>

                                    {isHwaSelected && (
                                        <TextField
                                            name='TonemappingMode'
                                            select
                                            defaultValue={config.TonemappingMode}
                                            label={globalize.translate('LabelTonemappingMode')}
                                            helperText={globalize.translate('TonemappingModeHelp')}
                                        >
                                            <MenuItem value='auto'>{globalize.translate('Auto')}</MenuItem>
                                            <MenuItem value='max'>MAX</MenuItem>
                                            <MenuItem value='rgb'>RGB</MenuItem>
                                            <MenuItem value='lum'>LUM</MenuItem>
                                            <MenuItem value='itp'>ITP</MenuItem>
                                        </TextField>
                                    )}

                                    <TextField
                                        name='TonemappingRange'
                                        select
                                        defaultValue={config.TonemappingRange}
                                        label={globalize.translate('LabelTonemappingRange')}
                                        helperText={globalize.translate('TonemappingRangeHelp')}
                                    >
                                        <MenuItem value='auto'>{globalize.translate('Auto')}</MenuItem>
                                        <MenuItem value='tv'>TV</MenuItem>
                                        <MenuItem value='pc'>PC</MenuItem>
                                    </TextField>

                                    <TextField
                                        name='TonemappingDesat'
                                        defaultValue={config.TonemappingDesat}
                                        label={globalize.translate('LabelTonemappingDesat')}
                                        helperText={globalize.translate('LabelTonemappingDesatHelp')}
                                        slotProps={{
                                            htmlInput: {
                                                min: 0,
                                                max: 1.79769e+308,
                                                step: 0.00001
                                            }
                                        }}
                                    />
                                </>
                            )}
                        </Stack>
                    </Form>
                )}
            </Box>
        </Page>
    );
};
