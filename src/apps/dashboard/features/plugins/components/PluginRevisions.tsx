import type { VersionInfo } from '@jellyfin/sdk/lib/generated-client';
import Download from '@mui/icons-material/Download';
import DownloadDone from '@mui/icons-material/DownloadDone';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary/AccordionSummary';
import Button from '@mui/material/Button/Button';
import Stack from '@mui/material/Stack/Stack';
import React, { type FC } from 'react';

import MarkdownBox from 'components/MarkdownBox';
import { getDisplayDateTime } from 'scripts/datetime';
import globalize from 'lib/globalize';

import type { PluginDetails } from '../types/PluginDetails';

interface PluginRevisionsProps {
    pluginDetails?: PluginDetails,
    onInstall: (version?: VersionInfo) => () => void
}

const PluginRevisions: FC<PluginRevisionsProps> = ({
    pluginDetails,
    onInstall
}) => (
    pluginDetails?.versions?.map(version => (
        <Accordion key={version.checksum}>
            <AccordionSummary
                expandIcon={<ExpandMore />}
            >
                {version.version}
                {version.timestamp && (<>
                    &nbsp;&mdash;&nbsp;
                    {getDisplayDateTime(version.timestamp)}
                </>)}
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={2}>
                    <MarkdownBox
                        fallback={globalize.translate('LabelNoChangelog')}
                        markdown={version.changelog}
                    />
                    {pluginDetails.status && version.version === pluginDetails.version?.version ? (
                        <Button
                            disabled
                            startIcon={<DownloadDone />}
                            variant='outlined'
                        >
                            {globalize.translate('LabelInstalled')}
                        </Button>
                    ) : (
                        <Button
                            startIcon={<Download />}
                            variant='outlined'
                            onClick={onInstall(version)}
                        >
                            {globalize.translate('HeaderInstall')}
                        </Button>
                    )}
                </Stack>
            </AccordionDetails>
        </Accordion>
    ))
);

export default PluginRevisions;
