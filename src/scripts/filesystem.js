export function fileExists(path) {
    if (window.NativeShell && window.NativeShell.FileSystem) {
        return window.NativeShell.FileSystem.fileExists(path);
    }
    return Promise.reject();
}

export function directoryExists(path) {
    if (window.NativeShell && window.NativeShell.FileSystem) {
        return window.NativeShell.FileSystem.directoryExists(path);
    }
    return Promise.reject();
}
