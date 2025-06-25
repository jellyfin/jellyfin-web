import ChevronRight from '@mui/icons-material/ChevronRight';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import { useSystemStorage } from 'apps/dashboard/features/storage/api/useSystemStorage';
import StorageListItem from 'apps/dashboard/features/storage/components/StorageListItem';
import globalize from 'lib/globalize';

const ServerPathWidget = () => {
    const { data: systemStorage } = useSystemStorage();

    return (
        <>
            <Button
                variant='text'
                color='inherit'
                endIcon={<ChevronRight />}
                sx={{
                    marginTop: 1,
                    marginBottom: 1
                }}
                // NOTE: We should use a react-router Link component, but components rendered in legacy views lack the
                // routing context
                href='#/dashboard/settings'
            >
                <Typography variant='h3' component='span'>
                    {globalize.translate('HeaderPaths')}
                </Typography>
            </Button>

            <List sx={{ bgcolor: 'background.paper' }}>
                <StorageListItem
                    label={globalize.translate('LabelCache')}
                    folder={systemStorage?.CacheFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelImageCache')}
                    folder={systemStorage?.ImageCacheFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelProgramData')}
                    folder={systemStorage?.ProgramDataFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelLogs')}
                    folder={systemStorage?.LogFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelMetadata')}
                    folder={systemStorage?.InternalMetadataFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelTranscodes')}
                    folder={systemStorage?.TranscodingTempFolder}
                />
                <StorageListItem
                    label={globalize.translate('LabelWeb')}
                    folder={systemStorage?.WebFolder}
                />
            </List>
        </>
    );
};

export default ServerPathWidget;
