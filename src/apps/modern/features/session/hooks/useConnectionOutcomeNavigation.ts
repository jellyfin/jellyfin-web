import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { type ConnectionOutcome, type ConnectionProblem, isConnectionProblem } from '../utils/connectionOutcome';

/**
 * Returns a function that continues with a connection outcome. It returns the problem the page has to show, or
 * undefined when it navigated.
 */
export const useConnectionOutcomeNavigation = () => {
    const navigate = useNavigate();

    return useCallback((outcome: ConnectionOutcome): ConnectionProblem | undefined => {
        if (isConnectionProblem(outcome)) return outcome;

        switch (outcome.kind) {
            case 'signedIn':
                navigate('/home', { replace: true });
                break;
            case 'serverSignIn':
                // Pushed, so going back returns to the page the server was chosen on
                navigate(`/login?serverid=${encodeURIComponent(outcome.serverId)}`);
                break;
            case 'wizard':
                navigate('/wizard/start');
                break;
            case 'serverSelection':
                navigate('/selectserver');
                break;
        }
    }, [ navigate ]);
};
