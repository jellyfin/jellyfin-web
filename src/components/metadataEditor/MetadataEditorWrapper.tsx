import React from 'react';
import { createRoot } from 'react-dom/client';
import { MetadataEditorDialog } from './MetadataEditorDialog';

export function show(itemId: string, serverId: string): Promise<void> {
    return new Promise((resolve) => {
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

        const handleClose = () => {
            if (hasClosed) return;
            hasClosed = true;
            cleanup();
            resolve();
        };

        root.render(
            <MetadataEditorDialog itemId={itemId} serverId={serverId} onClose={handleClose} />
        );
    });
}

const metadataEditor = { show };
export default metadataEditor;
