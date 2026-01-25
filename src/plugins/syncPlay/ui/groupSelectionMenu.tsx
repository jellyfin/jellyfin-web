import React from 'react';
import { createRoot } from 'react-dom/client';
import SyncPlayGroupMenu from './SyncPlayGroupMenu';

class GroupSelectionMenu {
    show(button: HTMLElement) {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const handleClose = () => {
            root.unmount();
            container.remove();
        };

        root.render(<SyncPlayGroupMenu open={true} anchorEl={button} onClose={handleClose} />);
    }
}

const groupSelectionMenu = new GroupSelectionMenu();
export default groupSelectionMenu;
