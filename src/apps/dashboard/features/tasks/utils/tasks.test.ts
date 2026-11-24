import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import { describe, expect, it } from 'vitest';

import { mergeTaskUpdates } from './tasks';

describe('mergeTaskUpdates()', () => {
    const currentTask = {
        Id: 'task-id',
        Name: 'Task Name',
        Description: 'Task Description',
        Category: 'Task Category',
        State: 'Idle'
    } as TaskInfo;

    it('should return the updated tasks when there are no current tasks', () => {
        const updatedTasks = [ { Id: 'task-id', Name: 'Task Name', State: 'Running' } ] as TaskInfo[];

        expect(mergeTaskUpdates(updatedTasks)).toBe(updatedTasks);
    });

    it('should preserve localized values from the current tasks', () => {
        const updatedTasks = [ {
            Id: 'task-id',
            Name: 'Aufgabenname',
            Description: 'Aufgabenbeschreibung',
            Category: 'Aufgabenkategorie',
            State: 'Running'
        } ] as TaskInfo[];

        expect(mergeTaskUpdates(updatedTasks, [ currentTask ])).toEqual([ {
            ...updatedTasks[0],
            Name: currentTask.Name,
            Description: currentTask.Description,
            Category: currentTask.Category
        } ]);
    });

    it('should use the updated tasks for values missing from the current tasks', () => {
        const updatedTasks = [ {
            Id: 'task-id',
            Name: 'Task Name',
            Description: 'Task Description',
            Category: 'Task Category',
            State: 'Running'
        } ] as TaskInfo[];
        const currentTaskWithoutValues = { Id: 'task-id', State: 'Idle' } as TaskInfo;

        expect(mergeTaskUpdates(updatedTasks, [ currentTaskWithoutValues ])).toEqual(updatedTasks);
    });

    it('should not overwrite tasks without a matching current task', () => {
        const updatedTasks = [ { Id: 'other-task-id', Name: 'Other Task', State: 'Running' } ] as TaskInfo[];

        expect(mergeTaskUpdates(updatedTasks, [ currentTask ])).toEqual(updatedTasks);
    });
});
