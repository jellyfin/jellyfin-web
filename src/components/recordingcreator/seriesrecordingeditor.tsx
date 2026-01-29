import React from 'react';
import { createRoot } from 'react-dom/client';
import { SeriesRecordingEditorDialog } from './SeriesRecordingEditorDialog';

interface ShowOptions {
    enableCancel?: boolean;
}

interface EmbedOptions {
    context: HTMLElement;
}

export function show(
    itemId: string,
    serverId: string,
    options?: ShowOptions
): Promise<{ updated: boolean; deleted?: boolean }> {
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

        const handleClose = (result: { updated: boolean; deleted?: boolean }) => {
            if (hasClosed) return;
            hasClosed = true;
            cleanup();
            resolve(result);
        };

        root.render(
            <SeriesRecordingEditorDialog
                itemId={itemId}
                serverId={serverId}
                enableCancel={options?.enableCancel}
                onClose={handleClose}
            />
        );
    });
}

export function embed(itemId: string, serverId: string, options: EmbedOptions): void {
    const container = options.context;
    container.classList.remove('hide');
    container.innerHTML = '';
    const root = createRoot(container);

    const handleClose = () => {
        root.unmount();
        container.classList.add('hide');
    };

    root.render(
        <SeriesRecordingEditorDialog
            itemId={itemId}
            serverId={serverId}
            enableCancel={false}
            onClose={handleClose}
        />
    );
}

const seriesRecordingEditor = { show, embed };
export default seriesRecordingEditor;
