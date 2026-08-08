import type { Api } from '@jellyfin/sdk';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { getLibraryStructureApi } from '@jellyfin/sdk/lib/utils/api/library-structure-api';
import type { StartupConfigurationDto } from '@jellyfin/sdk/lib/generated-client/models/startup-configuration-dto';
import type { StartupUserDto } from '@jellyfin/sdk/lib/generated-client/models/startup-user-dto';
import type { StartupRemoteAccessDto } from '@jellyfin/sdk/lib/generated-client/models/startup-remote-access-dto';
import type { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client/models/network-configuration';
import type { EncodingOptions } from '@jellyfin/sdk/lib/generated-client/models/encoding-options';
import type { LibraryOptions } from '@jellyfin/sdk/lib/generated-client/models/library-options';
import type { CollectionTypeOptions } from '@jellyfin/sdk/lib/generated-client/models/collection-type-options';

export interface WizardDraftLibrary {
    Name: string;
    CollectionType?: CollectionTypeOptions;
    LibraryOptions?: LibraryOptions;
}

export type WizardStage = 'config' | 'users' | 'remoteAccess' | 'encoding' | 'libraries' | 'network' | 'complete';

export interface WizardApplyError extends Error {
    wizardStage?: WizardStage;
}

interface WizardDraft {
    config: Partial<StartupConfigurationDto>;
    users: StartupUserDto[];
    remoteAccess: Partial<StartupRemoteAccessDto>;
    network: Partial<NetworkConfiguration>;
    encoding: Partial<EncodingOptions>;
    libraries: WizardDraftLibrary[];
}

// In-memory only, lost on reload by design - avoids persisting plaintext passwords.
const draft: WizardDraft = {
    config: {},
    users: [],
    remoteAccess: {},
    network: {},
    encoding: {},
    libraries: []
};

// Tracks succeeded apply stages so a retry skips redoing work or re-POSTing Complete.
const appliedStages = new Set<WizardStage>();
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
window.addEventListener('beforeunload', e => {
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

async function applyConfig(api: Api) {
    if (Object.keys(draft.config).length === 0) return;

    const { data: config } = await getStartupApi(api).getStartupConfiguration();
    // Read-modify-write: a concurrent external edit to these fields is lost (no partial-update API).
    const merged: StartupConfigurationDto = { ...config, ...draft.config };
    await getStartupApi(api).updateInitialConfiguration({ startupConfigurationDto: merged });
}

async function applyUsers(api: Api) {
    if (draft.users.length === 0) return;

    const { data: existingUsers } = await getUserApi(api).getUsers();
    const existingNames = new Set(existingUsers.map(u => (u.Name ?? '').toLowerCase()));
    const usersToCreate = draft.users.filter(u => !existingNames.has((u.Name ?? '').toLowerCase()));

    for (const user of usersToCreate) {
        await getUserApi(api).createUserByName({
            createUserByName: { Name: user.Name ?? '', Password: user.Password }
        });
    }
}

async function applyRemoteAccess(api: Api) {
    if (Object.keys(draft.remoteAccess).length === 0) return;

    await getStartupApi(api).setRemoteAccess({
        startupRemoteAccessDto: draft.remoteAccess as StartupRemoteAccessDto
    });
}

async function applyNetwork(api: Api) {
    if (Object.keys(draft.network).length === 0) return;

    const { data: networkConfig } = await getSystemApi(api).getNamedConfiguration({ key: 'network' });
    const merged = { ...(networkConfig as NetworkConfiguration), ...draft.network };
    await getSystemApi(api).updateNamedConfiguration({ key: 'network', body: merged });
}

async function applyEncoding(api: Api) {
    if (Object.keys(draft.encoding).length === 0) return;

    try {
        const { data: encodingConfig } = await getSystemApi(api).getNamedConfiguration({ key: 'encoding' });
        const merged = { ...(encodingConfig as EncodingOptions), ...draft.encoding };
        await getSystemApi(api).updateNamedConfiguration({ key: 'encoding', body: merged });
    } catch (err) {
        // A bad FFmpeg path is non-fatal; warn and continue, matching the original per-step behavior.
        console.error('[Wizard] failed to apply encoding settings', err);
    }
}

async function applyLibraries(api: Api) {
    if (draft.libraries.length === 0) return;

    const { data: existingFolders } = await getLibraryStructureApi(api).getVirtualFolders();
    const existingNames = new Set(existingFolders.map(f => (f.Name ?? '').toLowerCase()));
    const librariesToCreate = draft.libraries.filter(l => !existingNames.has(l.Name.toLowerCase()));

    for (const library of librariesToCreate) {
        const paths = (library.LibraryOptions?.PathInfos ?? [])
            .map(p => p.Path)
            .filter((p): p is string => !!p);

        await getLibraryStructureApi(api).addVirtualFolder({
            name: library.Name,
            collectionType: library.CollectionType,
            paths,
            refreshLibrary: true,
            addVirtualFolderDto: { LibraryOptions: library.LibraryOptions }
        });
    }
}

async function applyComplete(api: Api) {
    await getStartupApi(api).completeWizard();
}

const STAGES: Array<[ WizardStage, (api: Api) => Promise<void> ]> = [
    [ 'config', applyConfig ],
    [ 'users', applyUsers ],
    [ 'remoteAccess', applyRemoteAccess ],
    [ 'encoding', applyEncoding ],
    [ 'libraries', applyLibraries ],
    [ 'network', applyNetwork ],
    [ 'complete', applyComplete ]
];

export async function applyWizardDraft(api: Api) {
    for (const [ stage, apply ] of STAGES) {
        if (appliedStages.has(stage)) continue;
        try {
            await apply(api);
            appliedStages.add(stage);
        } catch (err) {
            (err as WizardApplyError).wizardStage = stage;
            throw err;
        }
    }
}
