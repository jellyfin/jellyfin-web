import Box from '@mui/material/Box/Box';
import DOMPurify from 'dompurify';
import markdownIt from 'markdown-it';
import React, { type FC } from 'react';

interface MarkdownBoxProps {
    markdown?: string | null
    fallback?: string
}

/** A component to render Markdown content within a MUI Box component. */
const MarkdownBox: FC<MarkdownBoxProps> = ({
    markdown,
    fallback
}) => (
    <Box
        dangerouslySetInnerHTML={
            markdown ?
                { __html: DOMPurify.sanitize(markdownIt({ html: true }).render(markdown)) } :
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
