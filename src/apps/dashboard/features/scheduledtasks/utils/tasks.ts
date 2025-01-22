import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';

export function getCategories(tasks: TaskInfo[] | undefined) {
    if (!tasks) return [];

    const categories: string[] = [];

    for (const task of tasks) {
        if (task.Category && !categories.includes(task.Category)) {
            categories.push(task.Category);
        }
    }

    return categories.sort();
}

export function getTasksByCategory(tasks: TaskInfo[] | undefined, category: string) {
    if (!tasks) return [];

    return tasks.filter(task => task.Category == category).sort();
}
