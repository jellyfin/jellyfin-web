import React from 'react';
import { useLocation } from '@tanstack/react-router';

import { HelpLinks } from 'apps/dashboard/constants/helpLinks';
import globalize from 'lib/globalize';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';

const HelpButton = (): React.ReactElement | null => {
    const location = useLocation();
    const matchedLink = HelpLinks.find(({ paths }) => paths.some(path => location.pathname.startsWith(path)));

    if (!matchedLink) {
        return null;
    }

    return (
        <Tooltip title={globalize.translate('Help')}>
            <a
                href={matchedLink.url}
                rel="noopener noreferrer"
                target="_blank"
                style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}
            >
                <IconButton variant="plain" size="lg" title={globalize.translate('Help')}>
                    <QuestionMarkCircledIcon />
                </IconButton>
            </a>
        </Tooltip>
    );
};

export default HelpButton;
