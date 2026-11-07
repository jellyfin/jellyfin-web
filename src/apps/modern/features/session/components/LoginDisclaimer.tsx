import Paper from '@mui/material/Paper';
import createDOMPurify from 'dompurify';
import markdownIt from 'markdown-it';
import React, { type FC, useMemo } from 'react';

const domPurify = createDOMPurify();
domPurify.setConfig({
    // eslint-disable-next-line @typescript-eslint/naming-convention, sonarjs/regex-complexity -- DOMPurify config option; customizes its default regex
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|callto|cid|xmpp|matrix|tg|whatsapp|signal|ircs?):|[^a-z]|[a-z+.-]+(?:[^-a-z+.:]|$))/i,
    // Prevent the disclaimer from imitating the login form or restyling the page
    // eslint-disable-next-line @typescript-eslint/naming-convention -- DOMPurify config option
    FORBID_TAGS: [ 'form', 'input', 'button', 'textarea', 'select', 'option', 'style' ],
    // eslint-disable-next-line @typescript-eslint/naming-convention -- DOMPurify config option
    FORBID_ATTR: [ 'style' ],
    // Prefix ids and names so they cannot clobber globals like window.NativeShell
    // eslint-disable-next-line @typescript-eslint/naming-convention -- DOMPurify config option
    SANITIZE_NAMED_PROPS: true
});
// Open disclaimer links in a new window
domPurify.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A') {
        node.setAttribute('rel', 'noopener noreferrer');
        node.setAttribute('target', '_blank');
    }
});

interface LoginDisclaimerProps {
    markdown?: string | null
}

const LoginDisclaimer: FC<LoginDisclaimerProps> = ({ markdown }) => {
    const html = useMemo(() => (
        // eslint-disable-next-line sonarjs/disabled-auto-escaping -- the rendered HTML is sanitized by DOMPurify
        markdown ? domPurify.sanitize(markdownIt({ html: true }).render(markdown)) : undefined
    ), [ markdown ]);

    if (!html) return null;

    return (
        <Paper
            variant='outlined'
            className='loginDisclaimer'
            dangerouslySetInnerHTML={{ __html: html }}
            sx={{
                maxWidth: '40rem',
                p: { xs: 2, sm: 3 },
                color: 'text.secondary',
                textAlign: 'center',
                'ol, ul': {
                    maxWidth: '40em',
                    mx: 'auto',
                    width: 'fit-content',
                    textAlign: 'start'
                },
                // Remove the outer margins of the rendered markdown so the padding is even
                '> :first-child': {
                    mt: 0
                },
                '> :last-child': {
                    mb: 0
                }
            }}
        />
    );
};

export default LoginDisclaimer;
