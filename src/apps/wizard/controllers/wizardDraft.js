// Single in-memory draft accumulating every wizard step's changes until Finish.
// Lost on a hard reload by design - avoids persisting plaintext passwords.
const draft = {
    config: {},
    users: [],
    remoteAccess: {},
    network: {},
    encoding: {},
    libraries: []
};

export function getWizardDraft() {
    return draft;
}

function applyConfig(apiClient) {
    if (Object.keys(draft.config).length === 0) return Promise.resolve();
    return apiClient.getJSON(apiClient.getUrl('Startup/Configuration')).then(function (config) {
        Object.assign(config, draft.config);
        return apiClient.ajax({
            type: 'POST',
            data: JSON.stringify(config),
            url: apiClient.getUrl('Startup/Configuration'),
            contentType: 'application/json'
        });
    });
}

function applyUsers(apiClient) {
    if (draft.users.length === 0) return Promise.resolve();
    return apiClient.getJSON(apiClient.getUrl('Users')).then(function (existingUsers) {
        const existingNames = existingUsers.map(u => u.Name.toLowerCase());
        const usersToCreate = draft.users.filter(u => !existingNames.includes(u.Name.toLowerCase()));
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
        Object.assign(networkConfig, draft.network);
        return apiClient.updateNamedConfiguration('network', networkConfig);
    });
}

function applyEncoding(apiClient) {
    if (Object.keys(draft.encoding).length === 0) return Promise.resolve();
    return apiClient.getNamedConfiguration('encoding').then(function (encodingConfig) {
        Object.assign(encodingConfig, draft.encoding);
        return apiClient.updateNamedConfiguration('encoding', encodingConfig);
    }).catch(function (err) {
        // A bad FFmpeg path is non-fatal; warn and continue, matching the original per-step behavior.
        console.error('[Wizard] failed to apply encoding settings', err);
    });
}

function applyLibraries(apiClient) {
    if (draft.libraries.length === 0) return Promise.resolve();
    return apiClient.getVirtualFolders().then(function (existingFolders) {
        const existingNames = existingFolders.map(f => f.Name.toLowerCase());
        const librariesToCreate = draft.libraries.filter(l => !existingNames.includes(l.Name.toLowerCase()));
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
        ['complete', applyComplete],
        ['network', applyNetwork]
    ];

    for (const [stage, apply] of stages) {
        try {
            await apply(apiClient);
        } catch (err) {
            err.wizardStage = stage;
            throw err;
        }
    }
}
