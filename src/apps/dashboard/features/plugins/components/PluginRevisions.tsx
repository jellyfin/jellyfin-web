import type { VersionInfo } from '@jellyfin/sdk/lib/generated-client';
import MarkdownBox from 'components/MarkdownBox';
import globalize from 'lib/globalize';
import React, { type FC } from 'react';
import { getDisplayDateTime } from 'scripts/datetime';
import { vars } from 'styles/tokens.css.ts';
import { Accordion, AccordionDetails, AccordionSummary, Button, Flex } from 'ui-primitives';

import type { PluginDetails } from '../types/PluginDetails';

interface PluginRevisionsProps {
    pluginDetails?: PluginDetails;
    onInstall: (version?: VersionInfo) => () => void;
}

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
);

const DownloadDoneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
    </svg>
);

const ExpandMoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </svg>
);

const PluginRevisions: FC<PluginRevisionsProps> = ({ pluginDetails, onInstall }) =>
    pluginDetails?.versions?.map((version) => (
        <Accordion key={version.checksum}>
            <AccordionSummary>
                <Flex
                    style={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                >
                    <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                        <span style={{ fontWeight: vars.typography.fontWeightMedium }}>
                            {version.version}
                        </span>
                        {version.timestamp && (
                            <>
                                <span>&mdash;</span>
                                <span style={{ color: 'var(--colors-textSecondary)' }}>
                                    {getDisplayDateTime(version.timestamp)}
                                </span>
                            </>
                        )}
                    </Flex>
                    <ExpandMoreIcon />
                </Flex>
            </AccordionSummary>
            <AccordionDetails>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['4'] }}>
                    <MarkdownBox
                        fallback={globalize.translate('LabelNoChangelog')}
                        markdown={version.changelog}
                    />
                    {pluginDetails.status && version.version === pluginDetails.version?.version ? (
                        <Button variant="outlined" disabled startDecorator={<DownloadDoneIcon />}>
                            {globalize.translate('LabelInstalled')}
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            startDecorator={<DownloadIcon />}
                            onClick={onInstall(version)}
                        >
                            {globalize.translate('HeaderInstall')}
                        </Button>
                    )}
                </Flex>
            </AccordionDetails>
        </Accordion>
    ));

export default PluginRevisions;
