import type { FolderStorageDto } from '@jellyfin/sdk/lib/generated-client/models/folder-storage-dto';

export const calculateTotal = (folder?: FolderStorageDto) => {
    if (!folder) return -1;

    const folderSize = (folder as any)?.FolderSizeBytes ?? (folder as any)?.SizeBytes ?? (folder as any)?.Size;
    if (typeof folderSize === 'number' && folderSize >= 0) return folderSize;

    if (typeof folder?.UsedSpace === 'undefined' || folder.UsedSpace < 0) return -1;

    const freeSpace = Math.max(0, folder.FreeSpace || 0);
    const usedSpace = Math.max(0, folder.UsedSpace);
    return freeSpace + usedSpace;
};

export const calculateUsedPercentage = (folder?: FolderStorageDto) => {
    if (!folder) return 0;

    const used = Math.max(0, folder.UsedSpace || 0);

    const driveTotal = (folder as any)?.DriveTotalBytes ?? (folder as any)?.DriveCapacity;
    const folderTotal = (folder as any)?.FolderSizeBytes ?? (folder as any)?.SizeBytes ?? (folder as any)?.Size;

    const total = (typeof driveTotal === 'number' && driveTotal > 0) ? driveTotal
        : (typeof folderTotal === 'number' && folderTotal > 0) ? folderTotal
        : calculateTotal(folder);

    if (total <= 0) return 0;

    return Math.min(100, (used / total) * 100);
};