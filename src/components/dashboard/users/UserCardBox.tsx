import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FunctionComponent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleWithSuffix } from '../../../utils/dateFnsLocale';
import globalize from '../../../lib/globalize';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import AspectRatio from '@mui/joy/AspectRatio';
import Avatar from '@mui/joy/Avatar';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link } from 'react-router-dom';

type IProps = {
    user?: UserDto;
    onMenuClick?: (e: React.MouseEvent<HTMLElement>) => void;
};

const getLastSeenText = (lastActivityDate?: string | null) => {
    if (lastActivityDate) {
        try {
            return globalize.translate('LastSeen', formatDistanceToNow(new Date(lastActivityDate), getLocaleWithSuffix()));
        } catch (e) {
            return '';
        }
    }
    return '';
};

const UserCardBox: FunctionComponent<IProps> = ({ user = {}, onMenuClick }: IProps) => {
    let imgUrl;

    if (user.PrimaryImageTag && user.Id) {
        imgUrl = window.ApiClient.getUserImageUrl(user.Id, {
            width: 300,
            tag: user.PrimaryImageTag,
            type: 'Primary'
        });
    }

    const lastSeen = getLastSeenText(user.LastActivityDate);
    const isDisabled = user.Policy?.IsDisabled;

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 'md' },
                ...(isDisabled && { filter: 'grayscale(1)', opacity: 0.7 })
            }}
        >
            <Box sx={{ position: 'relative' }}>
                <Link to={`/dashboard/users/profile?userId=${user.Id}`}>
                    <AspectRatio ratio="1">
                        {imgUrl ? (
                            <img src={imgUrl} alt={user.Name || ''} />
                        ) : (
                            <Avatar variant="soft" color="primary" sx={{ borderRadius: 0, width: '100%', height: '100%' }}>
                                <Typography level="h1">👤</Typography>
                            </Avatar>
                        )}
                    </AspectRatio>
                </Link>
                {isDisabled && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }}
                    >
                        <Typography level="title-md" color="white" sx={{ fontWeight: 'bold' }}>
                            {globalize.translate('LabelDisabled')}
                        </Typography>
                    </Box>
                )}
            </Box>
            <CardContent sx={{ pt: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography level="title-md" noWrap>
                            {user.Name}
                        </Typography>
                        <Typography level="body-xs" color="neutral" noWrap>
                            {lastSeen || '\u00A0'}
                        </Typography>
                    </Box>
                    <IconButton
                        variant="plain"
                        color="neutral"
                        size="sm"
                        onClick={onMenuClick}
                    >
                        <MoreVertIcon />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

export default UserCardBox;