const getProviderName = (providerId: string | null | undefined) => {
    switch (providerId?.toLowerCase()) {
        case 'schedulesdirect':
            return 'Schedules Direct';
        case 'xmltv':
            return 'XMLTV';
        default:
            return 'Unknown';
    }
};

export default getProviderName;
