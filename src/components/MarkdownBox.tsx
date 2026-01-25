import React, { type FC } from 'react';
import { Box } from 'ui-primitives/Box';
import * as styles from './MarkdownBox.css';
import ReactMarkdownBox from './ReactMarkdownBox';

interface MarkdownBoxProps {
    markdown?: string | null;
    fallback?: string;
}

/** A component to render Markdown content using react-markdown. */
const MarkdownBox: FC<MarkdownBoxProps> = ({ markdown, fallback }) => (
    <Box className={styles.container}>
        <ReactMarkdownBox markdown={markdown} fallback={fallback} />
    </Box>
);

export default MarkdownBox;
