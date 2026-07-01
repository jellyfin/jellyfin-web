// In-memory only, lost on reload by design - avoids persisting plaintext passwords.
const draft = {
    config: {},
    users: [],
    remoteAccess: {},
    network: {},
    encoding: {},
    libraries: []
};

// Tracks succeeded apply stages so a retry skips redoing work or re-POSTing Complete.
const appliedStages = new Set();
let completed = false;

function hasDraftData() {
    return Object.keys(draft.config).length > 0
        || draft.users.length > 0
        || Object.keys(draft.remoteAccess).length > 0
        || Object.keys(draft.network).length > 0
        || Object.keys(draft.encoding).length > 0
        || draft.libraries.length > 0;
}

// Only warn once data exists and before the wizard finishes, to avoid losing the draft.
window.addEventListener('beforeunload', function (e) {
    if (!completed && hasDraftData()) {
        e.preventDefault();
        e.returnValue = '';
    }
});

export function getWizardDraft() {
    return draft;
}

export function markWizardCompleted() {
    completed = true;
}

function applyConfig(apiClient) {
    if (Object.keys(draft.config).length === 0) return Promise.resolve();
    return apiClient.getJSON(apiClient.getUrl('Startup/Configuration')).then(function (config) {
        // Read-modify-write: a concurrent external edit to these fields is lost (no partial-update API).
        const merged = Object.assign(config || {}, draft.config);
        return apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(merged),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
    });
}

function applyUsers(apiClient) {
    if (draft.users.length === 0) return Promise.resolve();
    return apiClient.getJSON(apiClient.getUrl('Users')).then(function (existingUsers) {
        const existingNames = new Set(existingUsers.map(u => u.Name.toLowerCase()));
        const usersToCreate = draft.users.filter(u => !existingNames.has(u.Name.toLowerCase()));
        return usersToCreate.reduce(function (promise, user) {
            return promise.then(() => apiClient.createUser({ Name: user.Name, Password: user.Password }));
        }, Promise.resolve());
    });
}

function applyRemoteAccess(apiClient) {
    if (Object.keys(draft.remoteAccess).length === 0) return Promise.resolve();
    return apiClient.ajax({
        type: 'POST',
        data: JSON.stringify(draft.remoteAccess),
        url: apiClient.getUrl('Startup/RemoteAccess'),
        contentType: 'application/json'
    });
}

function applyNetwork(apiClient) {
    if (Object.keys(draft.network).length === 0) return Promise.resolve();
    return apiClient.getNamedConfiguration('network').then(function (networkConfig) {
        const merged = Object.assign(networkConfig || {}, draft.network);
        return apiClient.updateNamedConfiguration('network', merged);
    });
}

function applyEncoding(apiClient) {
    if (Object.keys(draft.encoding).length === 0) return Promise.resolve();
    return apiClient.getNamedConfiguration('encoding').then(function (encodingConfig) {
        const merged = Object.assign(encodingConfig || {}, draft.encoding);
        return apiClient.updateNamedConfiguration('encoding', merged);
    }).catch(function (err) {
        // A bad FFmpeg path is non-fatal; warn and continue, matching the original per-step behavior.
        console.error('[Wizard] failed to apply encoding settings', err);
    });
}

function applyLibraries(apiClient) {
    if (draft.libraries.length === 0) return Promise.resolve();
    return apiClient.getVirtualFolders().then(function (existingFolders) {
        const existingNames = new Set(existingFolders.map(f => f.Name.toLowerCase()));
        const librariesToCreate = draft.libraries.filter(l => !existingNames.has(l.Name.toLowerCase()));
        return librariesToCreate.reduce(function (promise, library) {
            return promise.then(() => apiClient.addVirtualFolder(library.Name, library.CollectionType, true, library.LibraryOptions));
        }, Promise.resolve());
    });
}

function applyComplete(apiClient) {
    return apiClient.ajax({
        url: apiClient.getUrl('Startup/Complete'),
        type: 'POST'
    });
}

export async function applyWizardDraft(apiClient) {
    const stages = [
        ['config', applyConfig],
        ['users', applyUsers],
        ['remoteAccess', applyRemoteAccess],
        ['encoding', applyEncoding],
        ['libraries', applyLibraries],
        ['network', applyNetwork],
        ['complete', applyComplete]
    ];

    for (const [stage, apply] of stages) {
        if (appliedStages.has(stage)) continue;
        try {
            await apply(apiClient);
            appliedStages.add(stage);
        } catch (err) {
            err.wizardStage = stage;
            throw err;
        }
    }
}
