import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useConnectToAddress } from 'apps/modern/features/session/api/useConnectToServer';
import AddServerForm from 'apps/modern/features/session/components/AddServerForm';
import ConnectionProblemAlert from 'apps/modern/features/session/components/ConnectionProblemAlert';
import { useConnectionOutcomeNavigation } from 'apps/modern/features/session/hooks/useConnectionOutcomeNavigation';
import { type ConnectionProblem, UNAVAILABLE_OUTCOME } from 'apps/modern/features/session/utils/connectionOutcome';
import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
import Page from 'components/Page';
import globalize from 'lib/globalize';

const CARD_SX = { width: '100%', maxWidth: '25rem', p: { xs: 2, sm: 3 } };
const COLUMN_SX = { width: '100%', maxWidth: '25rem' };

/** A connection problem shown above the form */
interface AddServerProblem {
    problem: ConnectionProblem
    /** Changes with every failure, so repeated failures are announced again */
    id: number
}

export const AddServerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const connectToAddress = useConnectToAddress();
    const navigateForOutcome = useConnectionOutcomeNavigation();

    const [ problem, setProblem ] = useState<AddServerProblem>();
    // Stays set once the connection is made, so the controls are not re-enabled while navigating away.
    // The ref guards against re-entry before the state update is rendered.
    const [ isConnecting, setIsConnecting ] = useState(false);
    const isConnectingRef = useRef(false);
    const problemIdRef = useRef(0);
    // The address of the last attempt, which the retry action of the alert connects to again
    const lastAddressRef = useRef<string>();
    const cardRef = useRef<HTMLDivElement>(null);

    const connect = useCallback(async (address: string) => {
        if (isConnectingRef.current) return;

        isConnectingRef.current = true;
        setIsConnecting(true);
        lastAddressRef.current = address;
        setProblem(undefined);

        // The mutation logs its failures and reports them as an outcome. The fallback only keeps the page from
        // being stuck in the connecting state, should it reject anyway
        const outcome = await connectToAddress.mutateAsync(address).catch(() => UNAVAILABLE_OUTCOME);

        const nextProblem = navigateForOutcome(outcome);
        // The connection stays in progress while navigating away
        if (!nextProblem) return;

        isConnectingRef.current = false;
        setIsConnecting(false);
        problemIdRef.current += 1;
        setProblem({ problem: nextProblem, id: problemIdRef.current });
    }, [ connectToAddress, navigateForOutcome ]);

    const onSubmit = useCallback((address: string) => {
        void connect(address);
    }, [ connect ]);

    /** Moves the focus into the form before the focused alert is removed, so it does not fall back to the top of the page */
    const focusCardControl = useCallback((selector: string) => {
        cardRef.current?.querySelector<HTMLElement>(selector)?.focus();
    }, []);

    const onRetry = useCallback(() => {
        const address = lastAddressRef.current;
        if (!address || isConnectingRef.current) return;

        // The connect button keeps the focus while connecting, as when the form is submitted
        focusCardControl('button[type="submit"]');
        void connect(address);
    }, [ connect, focusCardControl ]);

    const onProblemClose = useCallback(() => {
        focusCardControl('input');
        setProblem(undefined);
    }, [ focusCardControl ]);

    const onCancel = useCallback(() => {
        // A deep linked or reloaded page has no previous page in the app to return to
        if (location.key === 'default') {
            navigate('/selectserver', { replace: true });
        } else {
            navigate(-1);
        }
    }, [ location.key, navigate ]);

    return (
        <Page
            id='addServerPage'
            className='mainAnimatedPage standalonePage'
            backDropType={[ 'splashscreen' ]}
            isBackButtonEnabled={false}
        >
            <Box
                className='padded-left padded-right padded-bottom-page'
                // border-box keeps the padded-* gutters inside the full width instead of overflowing on small screens
                sx={{ maxWidth: '50rem', mx: 'auto', my: 'auto', width: '100%', boxSizing: 'border-box' }}
            >
                <Stack spacing={3} alignItems='center'>
                    <Typography
                        variant='h1'
                        textAlign='center'
                        // The theme's light h1 is hard to read over the backdrop, as on the login page
                        sx={{ fontWeight: 500 }}
                    >
                        {globalize.translate('HeaderConnectToServer')}
                    </Typography>

                    {/* The connect button's spinner has no label, so the connection in progress is announced here.
                        The region stays mounted, since a change of its text is announced more reliably than a
                        region that is added with its text */}
                    <Box component='span' role='status' sx={VISUALLY_HIDDEN_STYLE}>
                        {isConnecting && globalize.translate('MessageConnecting')}
                    </Box>

                    <Paper ref={cardRef} sx={CARD_SX}>
                        <Stack spacing={2} alignItems='center'>
                            {problem && (
                                <Box sx={COLUMN_SX}>
                                    <ConnectionProblemAlert
                                        // Remount on every failure, so a repeated problem is announced again
                                        key={problem.id}
                                        problem={problem.problem}
                                        onClose={onProblemClose}
                                        onRetry={onRetry}
                                    />
                                </Box>
                            )}

                            <Box sx={COLUMN_SX}>
                                <AddServerForm
                                    isSubmitting={isConnecting}
                                    onSubmit={onSubmit}
                                    onCancel={onCancel}
                                />
                            </Box>
                        </Stack>
                    </Paper>
                </Stack>
            </Box>
        </Page>
    );
};

export default AddServerPage;
