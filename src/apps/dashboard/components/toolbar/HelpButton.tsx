import HelpOutline from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { HelpLinks } from '@/apps/dashboard/constants/helpLinks';
import globalize from '@/lib/globalize';

const HelpButton = () => (
    <Routes>
        {
            HelpLinks.map(({ paths, url }) => paths.map(path => (
                <Route
                    key={[url, path].join('-')}
                    path={path}
                    element={
                        <Tooltip title={globalize.translate('Help')}>
                            <IconButton
                                href={url}
                                rel='noopener noreferrer'
                                target='_blank'
                                size='large'
                                color='inherit'
                            >
                                <HelpOutline />
                            </IconButton>
                        </Tooltip>
                    }
                />
            ))).flat()
        }
    </Routes>
);

export default HelpButton;
