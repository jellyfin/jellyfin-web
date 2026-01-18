import React from 'react';
import Box from '@mui/material/Box/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton/IconButton';
import Typography from '@mui/material/Typography/Typography';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack/Stack';
import { Link, To } from 'react-router-dom';

interface BaseCardProps {
    title?: string;
    text?: string;
    image?: string | null;
    icon?: React.ReactNode;
    to?: To;
    onClick?: () => void;
    action?: boolean;
    actionRef?: React.MutableRefObject<HTMLButtonElement | null>;
    onActionClick?: () => void;
    height?: number;
    width?: number;
};

const BaseCard = ({
    title,
    text,
    image,
    icon,
    to,
    onClick,
    action,
    actionRef,
    onActionClick,
    height,
    width
}: BaseCardProps) => {
    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: height || 240,
                width: width
            }}
        >
            <CardActionArea
                {...(to && {
                    component: Link,
                    to: to
                })}
                onClick={onClick}
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                    alignItems: 'stretch'
                }}
            >
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
            <CardContent
                sx={{
                    minHeight: 50,
                    '&:last-child': {
                        paddingBottom: 2,
                        paddingRight: 1
                    }
                }}>
                <Stack flexGrow={1} direction='row'>
                    <Stack flexGrow={1}>
                        <Typography gutterBottom sx={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                        }}>
                            {title}
                        </Typography>
                        {text && (
                            <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{
                                    lineBreak: 'anywhere'
                                }}
                            >
                                {text}
                            </Typography>
                        )}
                    </Stack>
                    <Box>
                        {action ? (
                            <IconButton ref={actionRef} onClick={onActionClick}>
                                <MoreVertIcon />
                            </IconButton>
                        ) : null}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default BaseCard;
