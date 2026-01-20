import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { styled } from '@mui/joy/styles';
import { ServerConnections } from 'lib/jellyfin-apiclient';

const StyledChannelHeader = styled(Box)(({ theme }) => ({
    height: 80,
    width: 120,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid',
    borderRight: '1px solid',
    borderColor: theme.vars.palette.divider,
    backgroundColor: theme.vars.palette.background.surface,
    padding: theme.spacing(1),
    textAlign: 'center',
}));

interface ChannelHeaderProps {
    channel: any;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel }) => {
    const apiClient = ServerConnections.getApiClient(channel.ServerId);
    const imageUrl = channel.ImageTags?.Primary ? apiClient.getScaledImageUrl(channel.Id, {
        maxHeight: 100,
        tag: channel.ImageTags.Primary,
        type: 'Primary'
    }) : null;

    return (
        <StyledChannelHeader>
            {imageUrl ? (
                <img src={imageUrl} alt={channel.Name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
                <Typography level="body-xs" noWrap>{channel.Name}</Typography>
            )}
            {channel.ChannelNumber && (
                <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>{channel.ChannelNumber}</Typography>
            )}
        </StyledChannelHeader>
    );
};

export default ChannelHeader;
