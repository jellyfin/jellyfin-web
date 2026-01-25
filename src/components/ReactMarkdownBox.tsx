import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { type FC } from 'react';
import { Box } from 'ui-primitives/Box';
import { container } from './ReactMarkdownBox.css';

interface ReactMarkdownBoxProps {
    markdown?: string | null;
    fallback?: string;
}

/** A React component to render Markdown content using react-markdown. */
const ReactMarkdownBox: FC<ReactMarkdownBoxProps> = ({ markdown, fallback }) => (
    <Box className={container}>
        {markdown ? (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom link handling for security and consistency
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    )
                }}
            >
                {markdown}
            </ReactMarkdown>
        ) : (
            fallback
        )}
    </Box>
);

export default ReactMarkdownBox;
