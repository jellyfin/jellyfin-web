// butterchurnWorker.js — Off-screen-canvas worker for butterchurn rendering

let canvas;
let ctx;
let visualizer;

globalThis.onmessage = function (event) {
    const { type, data } = event.data;

    if (type === 'init') {
        canvas = data.canvas;
        ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        // Initialize butterchurn here if possible
        // But since butterchurn needs audio context, perhaps pass audio data
    } else if (type === 'render') {
        // Render frame
        if (visualizer) {
            visualizer.render();
        }
    } else if (type === 'update') {
        // Update settings
    }
};
