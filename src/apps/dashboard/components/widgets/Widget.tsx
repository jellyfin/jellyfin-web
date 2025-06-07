import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ChevronRight from '@mui/icons-material/ChevronRight';
import React from 'react';

type IProps = {
    title: string;
    href?: string;
    children: React.ReactNode;
};

const Widget = ({ title, href, children }: IProps) => {
    return (
        <Box>
            <Button
                variant='text'
                color='inherit'
                endIcon={<ChevronRight />}
                sx={{
                    marginTop: 1,
                    marginBottom: 1
                }}
                href={href}
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
