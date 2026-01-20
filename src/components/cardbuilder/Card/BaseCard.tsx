import React from 'react';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import AspectRatio from '@mui/joy/AspectRatio';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import Stack from '@mui/joy/Stack';
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
    height?: number | string;
    width?: number | string;
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
    const cardContent = (
        <>
            <AspectRatio ratio="16/9" sx={{ borderRadius: 'sm', overflow: 'hidden' }}>
                {image ? (
                    <img
                        src={image}
                        loading="lazy"
                        alt={title}
                    />
                ) : (
                    <Box
                        className={getDefaultBackgroundClass(title)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'neutral.softBg'
                        }}
                    >
                        {icon}
                    </Box>
                )}
            </AspectRatio>
            <CardContent sx={{ pt: 1.5 }}>
                <Stack direction='row' justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                            level="title-md"
                            sx={{
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {title}
                        </Typography>
                        {text && (
                            <Typography
                                level="body-xs"
                                sx={{
                                    lineBreak: 'anywhere',
                                    mt: 0.5
                                }}
                            >
                                {text}
                            </Typography>
                        )}
                    </Box>
                    {action && (
                        <IconButton
                            variant="plain"
                            color="neutral"
                            size="sm"
                            ref={actionRef}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onActionClick?.();
                            }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    )}
                </Stack>
            </CardContent>
        </>
    );

    const cardProps = {
        variant: "outlined",
        onClick,
        sx: {
            height: height || 'auto',
            width: width,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 'md',
                borderColor: 'primary.outlinedBorder',
                bgcolor: 'background.surface'
            },
            textDecoration: 'none'
        }
    };

    if (to) {
        return (
            <Card component={Link} to={to} {...(cardProps as any)}>
                {cardContent}
            </Card>
        );
    }

    return (
        <Card {...(cardProps as any)}>
            {cardContent}
        </Card>
    );
};

export default BaseCard;