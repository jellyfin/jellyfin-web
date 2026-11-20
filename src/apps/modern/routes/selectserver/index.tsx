import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type AvailableServer, useActiveServerId, useAvailableServers, useDeleteServer } from 'apps/modern/features/session/api/useAvailableServers';
import { useConnectToServer } from 'apps/modern/features/session/api/useConnectToServer';
import ConnectionProblemAlert from 'apps/modern/features/session/components/ConnectionProblemAlert';
import DeleteServerDialog from 'apps/modern/features/session/components/DeleteServerDialog';
import ServerList, { getServerDisplayName } from 'apps/modern/features/session/components/ServerList';
import { useConnectionOutcomeNavigation } from 'apps/modern/features/session/hooks/useConnectionOutcomeNavigation';
import { type ConnectionOutcome, type ConnectionProblem, UNAVAILABLE_OUTCOME } from 'apps/modern/features/session/utils/connectionOutcome';
import { toLoggableError } from 'apps/modern/features/session/utils/loggableError';
import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
import LoadingComponent from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';

const CARD_SX = { width: '100%', p: { xs: 2, sm: 3 }, maxWidth: '25rem' };
/** The first control of the card, which is the first server when there are any */
const FIRST_CONTROL_SELECTOR = 'button:not([disabled])';

/** A connection problem to show, for the server it happened with */
interface ServerProblem {
    problem: ConnectionProblem
    server: AvailableServer
    /** Changes with every new attempt, so a repeated problem is announced again */
    id: number
}

/** Where to return the focus after a server was deleted, since the focused delete button is removed with it */
interface ReturnFocus {
    serverId: string
    /** Where the server was listed, so the focus continues with the server that took its place */
    index: number
}

export const SelectServerPage = () => {
    const navigate = useNavigate();
    const navigateForOutcome = useConnectionOutcomeNavigation();
    const {
        data: servers = [],
        isPending: isServersPending,
        isFetching: isServersFetching,
        isError: isServersError,
        refetch: refetchServers
    } = useAvailableServers();
    const activeServerId = useActiveServerId();
    const connectToServer = useConnectToServer();
    const deleteServer = useDeleteServer();

    // Covers the connection and navigating away, so the controls stay disabled until the page is left. The ref
    // guards against re-entry before the state update is rendered.
    const [ connectingServer, setConnectingServer ] = useState<AvailableServer>();
    const isConnectingRef = useRef(false);
    const problemIdRef = useRef(0);
    const [ serverProblem, setServerProblem ] = useState<ServerProblem>();
    const [ deleteTarget, setDeleteTarget ] = useState<AvailableServer>();
    const [ deleteFailureId, setDeleteFailureId ] = useState<number>();
    const [ deletedName, setDeletedName ] = useState<string>();
    const returnFocusRef = useRef<ReturnFocus>();
    // The server the list focuses when it is shown
    const [ focusServerId, setFocusServerId ] = useState<string>();
    const addServerButtonRef = useRef<HTMLButtonElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    // Whether the servers are loaded again after a failed load. Kept here instead of being derived from the query,
    // which remembers its failures in the cache
    const [ isRetrying, setIsRetrying ] = useState(false);
    // Whether the current failure was retried. The alert announces a failure when it appears, but it stays in place
    // over a failed retry, so repeated failures are announced by the status
    const [ hasRetried, setHasRetried ] = useState(false);
    const wasRetryingRef = useRef(false);

    const hasServers = servers.length > 0;
    const hasLoadFailed = isServersError || isRetrying;
    const isLoading = isServersPending && isServersFetching && !isRetrying;
    const isConnecting = !!connectingServer;

    useEffect(() => {
        // The retry is over once the servers are no longer being fetched, whatever the outcome
        if (!isServersFetching) setIsRetrying(false);
    }, [ isServersFetching ]);

    const onRetryLoadClick = useCallback(() => {
        // The button is not disabled while retrying (to keep its focus), so guard against repeated clicks here
        if (isRetrying) return;

        setHasRetried(true);
        setIsRetrying(true);
        void refetchServers();
    }, [ isRetrying, refetchServers ]);

    useEffect(() => {
        if (isRetrying) {
            wasRetryingRef.current = true;
            return;
        }
        if (!wasRetryingRef.current) return;
        wasRetryingRef.current = false;

        // A failed retry keeps the error and its button, and the focus with it
        if (isServersError) return;

        // The failure is over, so the next one is announced by the alert appearing again
        setHasRetried(false);
        // A successful retry removes the error, and the focused retry button with it. Unless the focus was moved
        // meanwhile, it continues at the first control of the card instead of falling back to the top of the page
        if (document.activeElement !== document.body) return;

        cardRef.current?.querySelector<HTMLElement>(FIRST_CONTROL_SELECTOR)?.focus();
    }, [ isRetrying, isServersError ]);

    useEffect(() => {
        // Return the focus after a server was deleted, once the list no longer has it
        const returnFocus = returnFocusRef.current;
        if (!returnFocus || isServersFetching || servers.some(server => server.Id === returnFocus.serverId)) return;

        returnFocusRef.current = undefined;
        // Unless the focus was moved meanwhile
        if (document.activeElement && document.activeElement !== document.body) return;

        const nextServer = servers[Math.min(returnFocus.index, servers.length - 1)];
        if (nextServer) {
            setFocusServerId(nextServer.Id);
        } else {
            addServerButtonRef.current?.focus();
        }
    }, [ isServersFetching, servers ]);

    const connect = useCallback(async (server: AvailableServer) => {
        if (isConnectingRef.current) return;

        isConnectingRef.current = true;
        setConnectingServer(server);
        setDeletedName(undefined);
        setServerProblem(undefined);

        let outcome: ConnectionOutcome;
        try {
            outcome = await connectToServer.mutateAsync(server);
        } catch (error) {
            // The mutation reports failures as an outcome, so this is unexpected. The server is not logged, since
            // it carries an access token
            console.error('[SelectServerPage] unable to connect to the server', toLoggableError(error));
            outcome = UNAVAILABLE_OUTCOME;
        }
        const problem = navigateForOutcome(outcome);

        // Navigating away keeps the connection in progress, so the controls are not re-enabled meanwhile. Going
        // nowhere is for a result with nothing to show: the page is already on the server selection.
        if (!problem && outcome.kind !== 'serverSelection') return;

        isConnectingRef.current = false;
        setConnectingServer(undefined);
        problemIdRef.current += 1;
        setServerProblem(problem && { problem, server, id: problemIdRef.current });
    }, [ connectToServer, navigateForOutcome ]);

    const onConnect = useCallback((server: AvailableServer) => {
        void connect(server);
    }, [ connect ]);

    const onRetryConnectionClick = useCallback(() => {
        if (!serverProblem || isConnectingRef.current) return;

        // The retry button is removed with the alert, so the focus moves to the server being retried
        setFocusServerId(serverProblem.server.Id);
        void connect(serverProblem.server);
    }, [ connect, serverProblem ]);

    const onProblemClose = useCallback(() => {
        // The close button is removed with the alert, so the focus continues at the server it was about
        if (serverProblem) setFocusServerId(serverProblem.server.Id);
        setServerProblem(undefined);
    }, [ serverProblem ]);

    const onFocused = useCallback(() => {
        setFocusServerId(undefined);
    }, []);

    const onDelete = useCallback((server: AvailableServer) => {
        deleteServer.reset();
        setDeleteFailureId(undefined);
        setDeletedName(undefined);
        setDeleteTarget(server);
    }, [ deleteServer ]);

    const onDeleteClose = useCallback(() => {
        setDeleteTarget(undefined);
    }, []);

    const onDeleteConfirm = useCallback(() => {
        if (!deleteTarget || deleteServer.isPending) return;

        const { Id: serverId } = deleteTarget;
        const name = getServerDisplayName(deleteTarget);
        // The name is kept for the announcement, since the server is gone from the list afterwards
        // Set before deleting, so the focus effect does not depend on whether the list or this callback comes first.
        // It waits for the server to leave the list
        returnFocusRef.current = { serverId, index: servers.findIndex(server => server.Id === serverId) };
        deleteServer.mutate(serverId, {
            onSuccess: () => {
                setDeletedName(name);
                setDeleteTarget(undefined);
                setServerProblem(previous => previous?.server.Id === serverId ? undefined : previous);
            },
            onError: () => {
                returnFocusRef.current = undefined;
                setDeleteFailureId(previous => (previous ?? 0) + 1);
            }
        });
    }, [ deleteServer, deleteTarget, servers ]);

    const onAddServerClick = useCallback(() => {
        navigate('/addserver');
    }, [ navigate ]);

    const getStatus = () => {
        if (isLoading || isRetrying) return globalize.translate('Loading');
        if (connectingServer) return globalize.translate('MessageConnectingToServer', getServerDisplayName(connectingServer));
        if (deletedName) return globalize.translate('MessageServerDeleted', deletedName);
        if (hasRetried && hasLoadFailed) return globalize.translate('MessageSavedServersLoadFailed');
    };

    return (
        <Page
            id='selectServerPage'
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
                        // The theme's light h1 is hard to read over the backdrop, so the title is heavier
                        sx={{ fontWeight: 500 }}
                    >
                        {globalize.translate('SelectServer')}
                    </Typography>

                    {isLoading && <LoadingComponent />}
                    {/* The spinner is a global overlay without a label, so the loading state is announced here,
                        along with the progress of the actions. The region stays mounted, since a change of its text
                        is announced more reliably than a region that is added with its text */}
                    <Box component='span' role='status' sx={VISUALLY_HIDDEN_STYLE}>
                        {getStatus()}
                    </Box>

                    {!isLoading && (
                        <Paper ref={cardRef} sx={CARD_SX}>
                            <Stack spacing={2} alignItems='center'>
                                {hasLoadFailed && (
                                    <Alert
                                        severity='error'
                                        sx={{ width: '100%' }}
                                        action={
                                            <Button
                                                color='inherit'
                                                size='small'
                                                // aria-disabled instead of disabled keeps the focus on the button
                                                // while retrying, so it does not fall back to the top of the page
                                                aria-disabled={isRetrying || undefined}
                                                className={isRetrying ? 'Mui-disabled' : undefined}
                                                disableRipple={isRetrying}
                                                startIcon={isRetrying ?
                                                    <CircularProgress size={16} color='inherit' aria-hidden /> :
                                                    undefined}
                                                onClick={onRetryLoadClick}
                                            >
                                                {globalize.translate('Retry')}
                                            </Button>
                                        }
                                    >
                                        {globalize.translate('MessageSavedServersLoadFailed')}
                                    </Alert>
                                )}

                                {serverProblem && (
                                    <Box sx={{ width: '100%' }}>
                                        <ConnectionProblemAlert
                                            // Remount on every new attempt, so a repeated problem is announced again
                                            key={serverProblem.id}
                                            problem={serverProblem.problem}
                                            onRetry={onRetryConnectionClick}
                                            onClose={onProblemClose}
                                        />
                                    </Box>
                                )}

                                {hasServers ? (
                                    <>
                                        <ServerList
                                            servers={servers}
                                            activeServerId={activeServerId}
                                            connectingServerId={connectingServer?.Id}
                                            disabled={isConnecting}
                                            focusServerId={focusServerId}
                                            onFocused={onFocused}
                                            onConnect={onConnect}
                                            onDelete={onDelete}
                                        />
                                        <Divider flexItem />
                                    </>
                                ) : !hasLoadFailed && (
                                    <Typography variant='body1' textAlign='center'>
                                        {globalize.translate('MessageNoSavedServers')}
                                    </Typography>
                                )}

                                <Button
                                    variant={hasServers ? 'outlined' : 'contained'}
                                    size='large'
                                    fullWidth
                                    ref={addServerButtonRef}
                                    // Leaving the page would abandon the connection in progress
                                    disabled={isConnecting}
                                    onClick={onAddServerClick}
                                >
                                    {globalize.translate('ButtonAddServer')}
                                </Button>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Box>

            {deleteTarget && (
                <DeleteServerDialog
                    server={deleteTarget}
                    isActive={deleteTarget.Id === activeServerId}
                    isDeleting={deleteServer.isPending}
                    failureId={deleteFailureId}
                    onConfirm={onDeleteConfirm}
                    onClose={onDeleteClose}
                />
            )}
        </Page>
    );
};

export default SelectServerPage;
