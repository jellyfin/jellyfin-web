import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { NowPlayingBar } from './ReactNowPlayingBar';

let root: Root | null = null;

export function mountNowPlayingBar(container: HTMLElement): void {
    if (root === null) {
        // Create a wrapper div for the React root
        const wrapper = document.createElement('div');
        wrapper.id = 'react-now-playing-bar-root';
        container.appendChild(wrapper);

        root = createRoot(wrapper);
    }

    root.render(<NowPlayingBar />);
}

export function unmountNowPlayingBar(): void {
    if (root !== null) {
        root.unmount();
        root = null;
        const wrapper = document.getElementById('react-now-playing-bar-root');
        if (wrapper) {
            wrapper.remove();
        }
    }
}
