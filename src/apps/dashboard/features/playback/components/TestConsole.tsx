import React, { type FC, useEffect, useMemo, useRef } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import globalize from 'lib/globalize';

interface TestConsoleProps {
    log: { Seconds: number, Message: string }[]
}

/** The raw test log, collapsed by default, for advanced users and bug reports. */
const TestConsole: FC<TestConsoleProps> = ({ log }) => {
    const consoleRef = useRef<HTMLPreElement | null>(null);
    const text = useMemo(() => (
        log.map(l => `${l.Seconds.toFixed(1).padStart(7)}  ${l.Message}`).join('\n')
    ), [ log ]);

    useEffect(() => {
        const element = consoleRef.current;
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }, [ text ]);

    if (!text) {
        return null;
    }

    return (
        <Accordion variant='outlined' disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{globalize.translate('HeaderTranscodingTestLog')}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box
                    component='pre'
                    ref={consoleRef}
                    sx={{
                        m: 0,
                        maxHeight: 320,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem'
                    }}
                >
                    {text}
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};

export default TestConsole;
