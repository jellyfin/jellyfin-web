var SyncTimeThreshold = 2000; // milliseconds, overwritten by startSyncWatcher
var SyncWatcherInterval = 1000; // milliseconds, overwritten by startSyncWatcher
var lastSyncTime = new Date(); // internal state
var syncWatcher; // holds value from setInterval

/**
 * Sends a message to the UI worker.
 * @param {string} type 
 * @param {*} data 
 */
function sendMessage (type, data) {
    postMessage({
        type: type,
        data: data
    });

}

/**
 * Updates the state.
 * @param {Date} syncTime The new state.
 */
function updateLastSyncTime (syncTime) {
    lastSyncTime = syncTime;
}

/**
 * Starts sync watcher.
 * @param {Object} options Additional options to configure the watcher, like _interval_ and _threshold_.
 */
function startSyncWatcher(options) {
    stopSyncWatcher();
    if (options) {
        if (options.interval) {
            SyncWatcherInterval = options.interval;
        }
        if (options.threshold) {
            SyncTimeThreshold = options.threshold;
        }
    }
    syncWatcher = setInterval(syncWatcherCallback, SyncWatcherInterval);
}

/**
 * Stops sync watcher.
 */
function stopSyncWatcher () {
    if (syncWatcher) {
        clearInterval(syncWatcher);
        syncWatcher = null;
    }
}

/**
 * Oversees playback sync and makes sure that it gets called regularly.
 */
function syncWatcherCallback () {
    const currentTime = new Date();
    const elapsed = currentTime - lastSyncTime;
    if (elapsed > SyncTimeThreshold) {
        sendMessage("TriggerSync");
    }
}

/**
 * Handles messages from UI worker.
 * @param {MessageEvent} event The message to handle.
 */
function handleMessage (event) {
    const message = event.data;
    switch (message.type) {
        case "UpdateLastSyncTime":
            updateLastSyncTime(message.data);
            break;
        case "StartSyncWatcher":
            startSyncWatcher(message.data);
            break;
        case "StopSyncWatcher":
            stopSyncWatcher();
            break;
        default:
            console.error("Unknown message type:", message.type);
            break;
    }
}

// Listen for messages
addEventListener("message", function (event) {
    handleMessage(event);
});
