import Box from '@mui/material/Box/Box';
import DOMPurify from 'dompurify';
import markdownIt from 'markdown-it';
import React, { type FC } from 'react';

interface MarkdownBoxProps {
    markdown?: string | null
    fallback?: string
}

// eslint-disable-next-line sonarjs/disabled-auto-escaping
const md = markdownIt({ html: true });
const renderLinkOpen = md.renderer.rules.link_open
    ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    // External links in a changelog must leave the app. Without a target the
    // Android WebView navigates in place and the user cannot go back.
    tokens[idx]?.attrSet('target', '_blank');
    tokens[idx]?.attrSet('rel', 'noopener noreferrer');
    return renderLinkOpen(tokens, idx, options, env, self);
};

/** A component to render Markdown content within a MUI Box component. */
const MarkdownBox: FC<MarkdownBoxProps> = ({
    markdown,
    fallback
}) => (
    <Box
        dangerouslySetInnerHTML={
            markdown ?
                // eslint-disable-next-line @typescript-eslint/naming-convention
                { __html: DOMPurify.sanitize(md.render(markdown), { ADD_ATTR: ['target'] }) } :
                undefined
        }
        sx={{
            '> :first-child /* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason */': {
                marginTop: 0,
                paddingTop: 0
            },
            '> :last-child': {
                marginBottom: 0,
                paddingBottom: 0
            }
        }}
    >
        {markdown ? undefined : fallback}
    </Box>
);

export default MarkdownBox;
