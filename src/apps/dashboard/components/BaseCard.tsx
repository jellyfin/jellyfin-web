import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';

interface IProps {
    title?: string;
    secondaryTitle?: string;
    text?: string;
    image?: string | null;
    icon?: React.ReactNode;
    onClick?: () => void;
    action?: boolean;
    actionRef?: React.MutableRefObject<HTMLButtonElement | null>;
    onActionClick?: () => void;
};

const BaseCard = ({ title, secondaryTitle, text, image, icon, onClick, action, actionRef, onActionClick }: IProps) => {
    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: 240
            }}
        >
            <CardActionArea onClick={onClick} sx={{
                display: 'flex',
                flexGrow: 1,
                alignItems: 'stretch'
            }}>
                {image ? (
                    <CardMedia
                        sx={{ flexGrow: 1 }}
                        image={image}
                        title={title}
                    />
                ) : (
                    <Box className={getDefaultBackgroundClass(title)} sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {icon}
                    </Box>
                )}
            </CardActionArea>
            <CardHeader
                title={
                    <Stack direction='row' gap={1} alignItems='center'>
                        <Typography sx={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                        }}>
                            {title}
                        </Typography>
                        {secondaryTitle && (
                            <Typography variant='body2' color='text.secondary'>{secondaryTitle}</Typography>
                        )}
                    </Stack>
                }
                subheader={text}
                action={
                    action ? (
                        <IconButton ref={actionRef} onClick={onActionClick}>
                            <MoreVertIcon />
                        </IconButton>
                    ) : null
                }
            />
        </Card>
    );
};

export default BaseCard;
