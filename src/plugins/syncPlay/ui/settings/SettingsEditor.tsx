import React from 'react';
import { createRoot } from 'react-dom/client';
import SyncPlaySettingsDialog from './SyncPlaySettingsDialog';

class SettingsEditor {
    private apiClient: any;
    private options: any;

    constructor(apiClient: any, _timeSyncCore: any, options = {}) {
        this.apiClient = apiClient;
        this.options = options;
    }

    async embed(): Promise<void> {
        return new Promise(resolve => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const root = createRoot(container);

            const handleClose = () => {
                root.unmount();
                container.remove();
                resolve();
            };

            root.render(<SyncPlaySettingsDialog open={true} onClose={handleClose} />);
        });
    }
}

export { SettingsEditor };
export default SettingsEditor;
