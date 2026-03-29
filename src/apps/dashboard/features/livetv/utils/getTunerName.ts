const getTunerName = (providerId: string | null | undefined) => {
    switch (providerId?.toLowerCase()) {
        case 'm3u':
            return 'M3U';
        case 'hdhomerun':
            return 'HDHomeRun';
        case 'hauppauge':
            return 'Hauppauge';
        case 'satip':
            return 'DVB';
        default:
            return 'Unknown';
    }
};

export default getTunerName;
