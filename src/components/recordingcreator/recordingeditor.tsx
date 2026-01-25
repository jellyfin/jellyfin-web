import React from 'react';
import { createRoot } from 'react-dom/client';
import { RecordingEditorDialog } from './RecordingEditorDialog';

interface ShowOptions {
    enableCancel?: boolean;
}

export function show(
    itemId: string,
    serverId: string,
    options?: ShowOptions
): Promise<{ updated: boolean; deleted?: boolean }> {
    return new Promise(resolve => {
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

        const handleClose = (result: { updated: boolean; deleted?: boolean }) => {
            if (hasClosed) return;
            hasClosed = true;
            cleanup();
            resolve(result);
        };

        root.render(
            <RecordingEditorDialog
                itemId={itemId}
                serverId={serverId}
                enableCancel={options?.enableCancel}
                onClose={handleClose}
            />
        );
    });
}

const recordingEditor = { show };
export default recordingEditor;
