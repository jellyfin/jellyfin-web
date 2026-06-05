import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import globalize from 'lib/globalize';

const TASK_KEY_TRANSLATIONS: Record<string, string> = {
    RefreshLibrary: 'ButtonScanAllLibraries'
};

export function getTaskDisplayName(task: TaskInfo): string {
    if (task.Key && TASK_KEY_TRANSLATIONS[task.Key]) {
        return globalize.translate(TASK_KEY_TRANSLATIONS[task.Key]);
    }
    return task.Name ?? '';
}

export function getCategories(tasks: TaskInfo[] | undefined) {
    if (!tasks) return [];

    const categories: string[] = [];

    for (const task of tasks) {
        if (task.Category && !categories.includes(task.Category)) {
            categories.push(task.Category);
        }
    }

    return categories.sort((a, b) => a.localeCompare(b));
}

export function getTasksByCategory(tasks: TaskInfo[] | undefined, category: string) {
    if (!tasks) return [];

    return tasks.filter(task => task.Category == category).sort((a, b) => {
        if (a.Name && b.Name) {
            return a.Name?.localeCompare(b.Name);
        } else {
            return 0;
        }
    });
}
