import Alert from '@mui/material/Alert/Alert';
import AlertTitle from '@mui/material/AlertTitle/AlertTitle';
import Box from '@mui/material/Box/Box';
import Paper from '@mui/material/Paper/Paper';
import Typography from '@mui/material/Typography/Typography';
import classNames from 'classnames';
import React, { type FC, useEffect } from 'react';
import { useRouteError } from 'react-router-dom';

import loading from '@/components/loading/loading';
import Page from '@/components/Page';

interface ErrorBoundaryParams {
    pageClasses?: string[]
}

const ErrorBoundary: FC<ErrorBoundaryParams> = ({
    pageClasses = [ 'libraryPage' ]
}) => {
    const error = useRouteError() as Error;

    useEffect(() => {
        loading.hide();
    }, []);

    return (
        <Page
            id='errorBoundary'
            className={classNames('mainAnimatedPage', pageClasses)}
        >
            <Box className='content-primary'>
                <Alert severity='error'>
                    <AlertTitle>
                        {error.name}
                    </AlertTitle>

                    <Typography>
                        {error.message}
                    </Typography>

                    {error.stack && (
                        <Paper
                            variant='outlined'
                            sx={{
                                marginTop: 1,
                                backgroundColor: 'transparent'
                            }}
                        >
                            <Box
                                component='pre'
                                sx={{
                                    overflow: 'auto',
                                    margin: 2,
                                    maxHeight: '25rem' // 20 lines
                                }}
                            >
                                {error.stack}
                            </Box>
                        </Paper>
                    )}
                </Alert>
            </Box>
        </Page>
    );
};

export default ErrorBoundary;
