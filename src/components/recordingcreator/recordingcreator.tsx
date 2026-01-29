import React from 'react';
import { createRoot } from 'react-dom/client';
import { RecordingCreatorDialog } from './RecordingCreatorDialog';

export function show(programId: string, serverId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        let hasClosed = false;

        const cleanup = () => {
            root.unmount();
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        };

        const handleClose = (result: { changed: boolean }) => {
            if (hasClosed) {
                return;
            }
            hasClosed = true;
            cleanup();
            if (result.changed) {
                resolve();
            } else {
                reject(new Error('Recording creator cancelled'));
            }
        };

        root.render(
            <RecordingCreatorDialog
                programId={programId}
                serverId={serverId}
                onClose={handleClose}
            />
        );
    });
}

const recordingCreator = { show };
export default recordingCreator;
