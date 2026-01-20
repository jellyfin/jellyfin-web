import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import ChevronRight from '@mui/icons-material/ChevronRight';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

type WidgetProps = {
    title: string;
    href: string;
    children: React.ReactNode;
};

const Widget = ({ title, href, children }: WidgetProps) => {
    return (
        <Box sx={{ mb: 2 }}>
            <Button
                component={RouterLink}
                to={href}
                variant='plain'
                color='neutral'
                endDecorator={<ChevronRight />}
                sx={{
                    px: 0,
                    mb: 1,
                    '&:hover': { bgcolor: 'transparent', color: 'primary.plainColor' },
                    justifyContent: 'flex-start'
                }}
            >
                <Typography level='h3' component='span'>
                    {title}
                </Typography>
            </Button>

            {children}
        </Box>
    );
};

export default Widget;