const getProviderConfigurationUrl = (providerId: string) => {
    switch (providerId?.toLowerCase()) {
        case 'xmltv':
            return '/dashboard/livetv/guide?type=xmltv';
        case 'schedulesdirect':
            return '/dashboard/livetv/guide?type=schedulesdirect';
    }
};

export default getProviderConfigurationUrl;
