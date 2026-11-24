import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';

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

/**
 * Merges task updates received from the WebSocket with the existing task data.
 *
 * The server localizes task names, descriptions, and categories using the
 * `Accept-Language` header of the request. Browsers do not allow setting custom
 * headers for WebSocket connections, so WebSocket payloads are localized using
 * the device language instead of the configured display language. Preserve the
 * values from the REST API, which uses the display language, to prevent the UI
 * language from changing when task updates are received.
 */
export function mergeTaskUpdates(updatedTasks: TaskInfo[], currentTasks?: TaskInfo[]) {
    if (!currentTasks) return updatedTasks;

    const currentTasksById = new Map(currentTasks.map(task => [ task.Id, task ]));

    return updatedTasks.map(updatedTask => {
        const currentTask = updatedTask.Id ? currentTasksById.get(updatedTask.Id) : undefined;
        if (!currentTask) return updatedTask;

        return {
            ...updatedTask,
            Name: currentTask.Name ?? updatedTask.Name,
            Description: currentTask.Description ?? updatedTask.Description,
            Category: currentTask.Category ?? updatedTask.Category
        };
    });
}
