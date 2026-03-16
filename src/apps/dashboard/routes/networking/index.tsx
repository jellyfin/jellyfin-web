import React, { useCallback, useEffect, useState } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';
import { useNamedConfiguration } from 'hooks/useNamedConfiguration';
import type { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client/models/network-configuration';
import TextField from '@mui/material/TextField/TextField';
import Loading from 'components/loading/LoadingComponent';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import DirectoryBrowser from 'components/directorybrowser/directorybrowser';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { QUERY_KEY as CONFIG_QUERY_KEY } from 'hooks/useConfiguration';
import { queryClient } from 'utils/query/queryClient';
import { encodePublishedServerUris, getPublishedServerUris, PublishedServerUris, splitString } from 'apps/dashboard/features/networking/utils';
import { ActionData } from 'types/actionData';
import Switch from '@mui/material/Switch';

const CONFIG_KEY = 'network';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const newConfig: NetworkConfiguration = {
        BaseUrl: data.BaseUrl?.toString(),
        EnableHttps: data.EnableHttps?.toString() === 'on',
        RequireHttps: data.RequireHttps?.toString() === 'on',
        CertificatePath: data.CertificatePath?.toString(),
        CertificatePassword: data.CertificatePassword?.toString(),
        InternalHttpPort: parseInt(data.InternalHttpPort?.toString(), 10),
        InternalHttpsPort: parseInt(data.InternalHttpsPort?.toString(), 10),
        PublicHttpPort: parseInt(data.PublicHttpPort?.toString(), 10),
        PublicHttpsPort: parseInt(data.PublicHttpsPort?.toString(), 10),
        AutoDiscovery: data.AutoDiscovery?.toString() === 'on',
        EnableIPv4: data.EnableIPv4?.toString() === 'on',
        EnableIPv6: data.EnableIPv6?.toString() === 'on',
        EnableRemoteAccess: data.EnableRemoteAccess?.toString() === 'on',
        LocalNetworkSubnets: splitString(data.LocalNetworkSubnets?.toString()),
        LocalNetworkAddresses: splitString(data.LocalNetworkAddresses?.toString()),
        KnownProxies: splitString(data.KnownProxies?.toString()),
        RemoteIPFilter: splitString(data.RemoteIPFilter?.toString()),
        IsRemoteIPFilterBlacklist: data.IsRemoteIPFilterBlacklist?.toString() === 'blacklist'
    };

    const publishedServerUri: PublishedServerUris = {};

    if (data.PublishedServerUri) {
        publishedServerUri.all = data.PublishedServerUri?.toString();
    } else {
        publishedServerUri.internal = data.InternalPublishedServerUri?.toString();
        publishedServerUri.external = data.ExternalPublishedServerUri?.toString();
    }

    newConfig.PublishedServerUriBySubnet = encodePublishedServerUris(publishedServerUri);

    await getConfigurationApi(api)
        .updateNamedConfiguration({ key: CONFIG_KEY, body: newConfig });

    void queryClient.invalidateQueries({
        queryKey: [ CONFIG_QUERY_KEY ]
    });

    return {
        isSaved: true
    };
};

export const Component = () => {
    const { data: config, isPending, isError } = useNamedConfiguration<NetworkConfiguration>(CONFIG_KEY);
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';
    const [ certificatePath, setCertificatePath ] = useState<string | null | undefined>(null);
    const [ useSamePublishedUri, setUseSamePublishedUri ] = useState(true);
    const [ publishedUris, setPublishedUris ] = useState<PublishedServerUris | null>();
    const [ isUrisLoaded, setIsUrisLoaded ] = useState(false);

    const onCertificatePathChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setCertificatePath(event.target.value);
    }, []);

    const showCertificatePathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            path: certificatePath,
            callback: function (path: string) {
                if (path) {
                    setCertificatePath(path);
                }

                picker.close();
            },
            includeFiles: true,
            includeDirectories: true,
            header: globalize.translate('HeaderSelectCertificatePath')
        });
    }, [certificatePath]);

    const onPublishedUriChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUseSamePublishedUri(e.target.checked);
    }, []);

    useEffect(() => {
        if (!isPending && !isError) {
            setCertificatePath(config.CertificatePath);

            if (config.PublishedServerUriBySubnet && config.PublishedServerUriBySubnet.length > 0) {
                const uris = getPublishedServerUris(config.PublishedServerUriBySubnet);

                setPublishedUris(uris);
                setUseSamePublishedUri(!!uris.all);
            }
            setIsUrisLoaded(true);
        }
    }, [config, isPending, isError]);

    if (isPending || !isUrisLoaded) return <Loading />;

    return (
        <Page
            id='networkingPage'
            title={globalize.translate('TabNetworking')}
            className='type-interior mainAnimatedPage'
        >
            <Box className='content-primary'>
                {isError ? (
                    <Alert severity='error'>{globalize.translate('NetworkingPageLoadError')}</Alert>
                ) : (
                    <Form method='POST'>
                        <Stack spacing={6}>
                            {!isSubmitting && actionData?.isSaved && (
                                <Alert severity='success'>
                                    {globalize.translate('SettingsSaved')}
                                </Alert>
                            )}
                            <Typography variant='h1'>{globalize.translate('TabNetworking')}</Typography>

                            <Stack spacing={3}>
                                <Typography variant='h2'>{globalize.translate('HeaderServerAddressSettings')}</Typography>

                                <TextField
                                    name='InternalHttpPort'
                                    label={globalize.translate('LabelLocalHttpServerPortNumber')}
                                    helperText={globalize.translate('LabelLocalHttpServerPortNumberHelp')}
                                    defaultValue={config.InternalHttpPort}
                                />

                                <FormControl>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name='EnableHttps'
                                                defaultChecked={config.EnableHttps}
                                            />
                                        }
                                        label={globalize.translate('LabelEnableHttps')}
                                    />
                                    <FormHelperText>{globalize.translate('LabelEnableHttpsHelp')}</FormHelperText>
                                </FormControl>

                                <TextField
                                    name='InternalHttpsPort'
                                    label={globalize.translate('LabelHttpsPort')}
                                    helperText={globalize.translate('LabelHttpsPortHelp')}
                                    defaultValue={config.InternalHttpsPort}
                                />

                                <TextField
                                    name='BaseUrl'
                                    label={globalize.translate('LabelBaseUrl')}
                                    helperText={globalize.translate('LabelBaseUrlHelp')}
                                    defaultValue={config.BaseUrl}
                                />

                                <TextField
                                    name='LocalNetworkAddresses'
                                    label={globalize.translate('LabelBindToLocalNetworkAddress')}
                                    helperText={globalize.translate('LabelBindToLocalNetworkAddressHelp')}
                                    defaultValue={config.LocalNetworkAddresses?.join(', ') || ''}
                                />

                                <TextField
                                    name='LocalNetworkSubnets'
                                    label={globalize.translate('LabelLanNetworks')}
                                    helperText={globalize.translate('LanNetworksHelp')}
                                    defaultValue={config.LocalNetworkSubnets?.join(', ') || ''}
                                />

                                <TextField
                                    name='KnownProxies'
                                    label={globalize.translate('LabelKnownProxies')}
                                    helperText={globalize.translate('KnownProxiesHelp')}
                                    defaultValue={config.KnownProxies?.join(', ') || ''}
                                />
                            </Stack>

                            <Stack spacing={3}>
                                <Typography variant='h2'>{globalize.translate('HeaderHttpsSettings')}</Typography>

                                <FormControl>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name='RequireHttps'
                                                defaultChecked={config.RequireHttps}
                                            />
                                        }
                                        label={globalize.translate('LabelRequireHttps')}
                                    />
                                    <FormHelperText>{globalize.translate('LabelRequireHttpsHelp')}</FormHelperText>
                                </FormControl>

                                <TextField
                                    name='CertificatePath'
                                    value={certificatePath || ''}
                                    onChange={onCertificatePathChange}
                                    label={globalize.translate('LabelCustomCertificatePath')}
                                    helperText={globalize.translate('LabelCustomCertificatePathHelp')}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position='end'>
                                                    <IconButton edge='end' onClick={showCertificatePathPicker}>
                                                        <SearchIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />

                                <TextField
                                    name='CertificatePassword'
                                    label={globalize.translate('LabelCertificatePassword')}
                                    helperText={globalize.translate('LabelCertificatePasswordHelp')}
                                    defaultValue={config.CertificatePassword}
                                />
                            </Stack>

                            <Stack spacing={3}>
                                <Typography variant='h2'>{globalize.translate('HeaderRemoteAccessSettings')}</Typography>

                                <FormControl>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name='EnableRemoteAccess'
                                                defaultChecked={config.EnableRemoteAccess}
                                            />
                                        }
                                        label={globalize.translate('AllowRemoteAccess')}
                                    />
                                    <FormHelperText>{globalize.translate('AllowRemoteAccessHelp')}</FormHelperText>
                                </FormControl>

                                <TextField
                                    name='RemoteIPFilter'
                                    label={globalize.translate('LabelAllowedRemoteAddresses')}
                                    helperText={globalize.translate('AllowedRemoteAddressesHelp')}
                                    defaultValue={config.RemoteIPFilter?.join(', ') || ''}
                                />

                                <TextField
                                    name={'IsRemoteIPFilterBlacklist'}
                                    label={globalize.translate('LabelAllowedRemoteAddressesMode')}
                                    select
                                    defaultValue={config.IsRemoteIPFilterBlacklist ? 'blacklist' : 'whitelist'}
                                >
                                    <MenuItem value={'whitelist'}>{globalize.translate('Whitelist')}</MenuItem>
                                    <MenuItem value={'blacklist'}>{globalize.translate('Blacklist')}</MenuItem>
                                </TextField>

                                <TextField
                                    name='PublicHttpPort'
                                    label={globalize.translate('LabelPublicHttpPort')}
                                    helperText={globalize.translate('LabelPublicHttpPortHelp')}
                                    defaultValue={config.PublicHttpPort}
                                />

                                <TextField
                                    name='PublicHttpsPort'
                                    label={globalize.translate('LabelPublicHttpsPort')}
                                    helperText={globalize.translate('LabelPublicHttpsPortHelp')}
                                    defaultValue={config.PublicHttpsPort}
                                />
                            </Stack>

                            <Stack spacing={3}>
                                <Typography variant='h2'>{globalize.translate('HeaderNetworking')}</Typography>

                                <FormControl>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name='EnableIPv4'
                                                defaultChecked={config.EnableIPv4}
                                            />
                                        }
                                        label={globalize.translate('LabelEnableIP4')}
                                    />
                                    <FormHelperText>{globalize.translate('LabelEnableIP4Help')}</FormHelperText>
                                </FormControl>

                                <FormControl>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name='EnableIPv6'
                                                defaultChecked={config.EnableIPv6}
                                            />
                                        }
                                        label={globalize.translate('LabelEnableIP6')}
                                    />
                                    <FormHelperText>{globalize.translate('LabelEnableIP6Help')}</FormHelperText>
                                </FormControl>
                            </Stack>

                            <Stack spacing={3}>
                                <Typography variant='h2'>{globalize.translate('HeaderAutoDiscovery')}</Typography>

                                <FormControl>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name='AutoDiscovery'
                                                defaultChecked={config.AutoDiscovery}
                                            />
                                        }
                                        label={globalize.translate('LabelAutomaticDiscovery')}
                                    />
                                    <FormHelperText>{globalize.translate('LabelAutomaticDiscoveryHelp')}</FormHelperText>
                                </FormControl>
                            </Stack>

                            <Stack spacing={3}>
                                <Typography variant='h2'>{globalize.translate('HeaderPortRanges')}</Typography>

                                <FormControl>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                name='UseSamePublishedUri'
                                                checked={useSamePublishedUri}
                                                onChange={onPublishedUriChange}
                                            />
                                        }
                                        label={globalize.translate('LabelUseSamePublishedServerUri')}
                                    />
                                </FormControl>

                                {useSamePublishedUri ? (
                                    <TextField
                                        name='PublishedServerUri'
                                        label={globalize.translate('LabelPublishedServerUri')}
                                        helperText={globalize.translate('LabelPublishedServerUriHelp')}
                                        defaultValue={publishedUris?.all}
                                    />
                                ) : (
                                    <Stack direction='row' gap={1}>
                                        <TextField
                                            sx={{ flexGrow: 1 }}
                                            name='InternalPublishedServerUri'
                                            label={globalize.translate('LabelInternalServerUri')}
                                            helperText={globalize.translate('LabelInternalServerUriHelp')}
                                            defaultValue={publishedUris?.internal}
                                        />
                                        <TextField
                                            sx={{ flexGrow: 1 }}
                                            name='ExternalPublishedServerUri'
                                            label={globalize.translate('LabelExternalServerUri')}
                                            helperText={globalize.translate('LabelExternalServerUriHelp')}
                                            defaultValue={publishedUris?.internal}
                                        />
                                    </Stack>
                                )}

                            </Stack>

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

Component.displayName = 'NetworkingPage';
