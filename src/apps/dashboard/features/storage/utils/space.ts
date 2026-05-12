import type { FolderStorageDto } from '@jellyfin/sdk/lib/generated-client/models/folder-storage-dto';

export const calculateTotal = (folder?: FolderStorageDto) => {
    if (typeof folder?.UsedSpace === 'undefined' || folder.UsedSpace < 0) {
        return -1;
    }

    const freeSpace = Math.max(0, folder.FreeSpace || 0);
    const usedSpace = Math.max(0, folder.UsedSpace);
    return freeSpace + usedSpace;
};

export const calculateUsedPercentage = (folder?: FolderStorageDto) => {
    const totalSpace = calculateTotal(folder);
    if (totalSpace <= 0) return 0;

    const usedSpace = folder?.UsedSpace || 0;

    return Math.min(100, (usedSpace / totalSpace) * 100);
};
