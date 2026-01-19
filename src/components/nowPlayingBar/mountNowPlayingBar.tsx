import React from 'react';
import { createRoot } from 'react-dom/client';
import { NowPlayingBar } from './ReactNowPlayingBar';

let root: any = null;

export function mountNowPlayingBar(container: HTMLElement) {
    if (!root) {
        // Create a wrapper div for the React root
        const wrapper = document.createElement('div');
        wrapper.id = 'react-now-playing-bar-root';
        container.appendChild(wrapper);
        
        root = createRoot(wrapper);
    }
    
    root.render(<NowPlayingBar />);
}

export function unmountNowPlayingBar() {
    if (root) {
        root.unmount();
        root = null;
        const wrapper = document.getElementById('react-now-playing-bar-root');
        if (wrapper) wrapper.remove();
    }
}
