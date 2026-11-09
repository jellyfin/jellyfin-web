import Paper from '@mui/material/Paper';
import createDOMPurify from 'dompurify';
import markdownIt from 'markdown-it';
import React, { type FC, useMemo } from 'react';

import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
import globalize from 'lib/globalize';

const HEADING_TAGS = [ 'H1', 'H2', 'H3', 'H4', 'H5', 'H6' ];
/** Marks the hidden hint appended to links. Styled by the component, since inline styles are sanitized away */
const NEW_WINDOW_HINT_CLASS = 'loginDisclaimer-newWindowHint';
/** The headings created by the hook, so they are not shifted again when DOMPurify visits the replacement */
const shiftedHeadings = new WeakSet<Element>();

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
// Shift headings down a level, so the page keeps its single h1 whatever the disclaimer contains. This runs
// before the attributes are sanitized: DOMPurify continues with the replacement (and its children), so the
// copied attributes are sanitized exactly once there
domPurify.addHook('uponSanitizeElement', node => {
    if (!(node instanceof Element) || shiftedHeadings.has(node)) return;

    const level = HEADING_TAGS.indexOf(node.tagName);
    if (level === -1 || level === HEADING_TAGS.length - 1) return;

    const heading = node.ownerDocument.createElement(HEADING_TAGS[level + 1]);
    for (const { name, value } of Array.from(node.attributes)) {
        heading.setAttribute(name, value);
    }
    heading.append(...Array.from(node.childNodes));
    shiftedHeadings.add(heading);
    node.replaceWith(heading);
});

/**
 * Whether a link leads to another page, so it is worth opening in a new window. Links within the page and links
 * handed to another application (mailto:, tel:) are not.
 */
const leadsToAnotherPage = (link: Element) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return false;

    try {
        return /^https?:$/.test(new URL(href, link.baseURI).protocol);
    } catch {
        return false;
    }
};

// Open disclaimer links in a new window, and say so for assistive technology, which gets no visual cue. This
// runs once the href is sanitized, so links that lost a forbidden destination are left alone
domPurify.addHook('afterSanitizeAttributes', node => {
    if (node.tagName !== 'A' || !leadsToAnotherPage(node)) return;

    node.setAttribute('rel', 'noopener noreferrer');
    node.setAttribute('target', '_blank');

    // The hidden hint is block-level, so it is read apart from the link text ("Terms, opens in a new window")
    const hint = node.ownerDocument.createElement('span');
    hint.className = NEW_WINDOW_HINT_CLASS;
    hint.textContent = globalize.translate('OpensInNewWindow');
    node.appendChild(hint);
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
                },
                [`.${NEW_WINDOW_HINT_CLASS}`]: VISUALLY_HIDDEN_STYLE
            }}
        />
    );
};

export default LoginDisclaimer;
