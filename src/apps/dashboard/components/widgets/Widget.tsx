import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import Typography from '@mui/material/Typography/Typography';
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
        <Box>
            <Button
                component={RouterLink}
                to={href}
                variant='text'
                color='inherit'
                endIcon={<ChevronRight />}
                sx={{
                    marginTop: 1,
                    marginBottom: 1
                }}
            >
                <Typography variant='h3' component='span'>
                    {title}
                </Typography>
            </Button>

            {children}
        </Box>
    );
};

export default Widget;
