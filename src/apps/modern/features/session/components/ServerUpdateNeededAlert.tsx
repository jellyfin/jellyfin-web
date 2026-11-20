import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import React, { type FC } from 'react';

import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
import globalize from 'lib/globalize';

const UPDATE_URL = 'https://jellyfin.org/downloads/server/';
const UPDATE_LINK_TEXT = 'jellyfin.org/downloads/server';
/** Stands in for the link while the translation is split around it. Never part of a translation. */
const LINK_PLACEHOLDER = '\u0000';

export interface ServerUpdateNeededAlertProps {
    onClose?: () => void
}

const ServerUpdateNeededAlert: FC<ServerUpdateNeededAlertProps> = ({ onClose }) => {
    // The link is a component, so the translation is split around it instead of being given HTML. A translation
    // without the placeholder gets the link appended, so the link is never lost
    const [ before = '', after ] = globalize.translate('ServerUpdateNeeded', LINK_PLACEHOLDER).split(LINK_PLACEHOLDER);

    return (
        <Alert
            severity='warning'
            onClose={onClose}
            closeText={globalize.translate('ButtonClose')}
        >
            <AlertTitle>{globalize.translate('HeaderUpdateRequired')}</AlertTitle>
            {before}
            {after === undefined && ' '}
            <Link href={UPDATE_URL} target='_blank' rel='noopener noreferrer'>
                {UPDATE_LINK_TEXT}
                {' '}
                {/* The link opens in a new window, which assistive technology is not told otherwise */}
                <Box component='span' sx={VISUALLY_HIDDEN_STYLE}>{globalize.translate('OpensInNewWindow')}</Box>
            </Link>
            {after}
        </Alert>
    );
};

export default ServerUpdateNeededAlert;
