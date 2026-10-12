import {
  TaskSyncSlice,
  TaskAsyncSlice,
  CreateTaskInput,
  UpdateTaskPatch,
  StoreDeps,
  SetStoreState,
  GetStoreState,
} from '../types';
import { Task } from '@/domain/types';
import { Result, fail } from '@/domain/result';
import { executeCreateTask, executeUpdateTask } from './taskOperations';
import {
  executeChangeTaskStatus,
  executeMoveTaskToList,
  executeDeleteTask,
} from './taskMovementOperations';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createTaskSlice(
  set: SetStoreState,
  get: GetStoreState,
  deps: StoreDeps
): TaskSyncSlice & TaskAsyncSlice {
  const syncSlice: TaskSyncSlice = {
    createTaskSync: (input: CreateTaskInput) =>
      executeCreateTask(get(), set, deps, input),

    updateTaskSync: (id: string, patch: UpdateTaskPatch) =>
      executeUpdateTask(get(), set, deps, id, patch),

    changeTaskStatusSync: (id: string, statusId: string, index?: number) =>
      executeChangeTaskStatus(get(), set, deps, id, statusId, index),

    reorderTaskSync: (id: string, newIndex: number) => {
      const task = get().tasks[id];
      if (!task) {
        // If task doesn't exist, changeTaskStatus will return NOT_FOUND correctly
        return executeChangeTaskStatus(get(), set, deps, id, '', newIndex);
      }
      return executeChangeTaskStatus(
        get(),
        set,
        deps,
        id,
        task.statusId,
        newIndex
      );
    },

    moveTaskToListSync: (id: string, targetListId: string) =>
      executeMoveTaskToList(get(), set, deps, id, targetListId),

    deleteTaskSync: (id: string) => executeDeleteTask(get(), set, deps, id),
  };

  const latency = deps.latencyMs ?? 150;

  const asyncSlice: TaskAsyncSlice = {
    createTask: async (input: CreateTaskInput): Promise<Result<Task>> => {
      if (get().simulateFailure) {
        if (latency > 0) await sleep(latency);
        return fail(
          'INTERNAL',
          'Simulated network failure (HTTP 500): Server temporarily unavailable'
        );
      }
      const res = syncSlice.createTaskSync(input);
      if (latency > 0) await sleep(latency);
      return res;
    },

    updateTask: async (
      id: string,
      patch: UpdateTaskPatch
    ): Promise<Result<Task>> => {
      if (get().simulateFailure) {
        if (latency > 0) await sleep(latency);
        return fail(
          'INTERNAL',
          'Simulated network failure (HTTP 500): Failed to update task'
        );
      }
      const res = syncSlice.updateTaskSync(id, patch);
      if (latency > 0) await sleep(latency);
      return res;
    },

    changeTaskStatus: async (
      id: string,
      statusId: string,
      index?: number
    ): Promise<Result<Task>> => {
      if (get().simulateFailure) {
        if (latency > 0) await sleep(latency);
        return fail(
          'INTERNAL',
          'Simulated network failure (HTTP 500): Failed to change status. Rolling back.'
        );
      }
      const res = syncSlice.changeTaskStatusSync(id, statusId, index);
      if (latency > 0) await sleep(latency);
      return res;
    },

    reorderTask: async (
      id: string,
      newIndex: number
    ): Promise<Result<Task>> => {
      if (get().simulateFailure) {
        if (latency > 0) await sleep(latency);
        return fail(
          'INTERNAL',
          'Simulated network failure (HTTP 500): Failed to reorder task'
        );
      }
      const res = syncSlice.reorderTaskSync(id, newIndex);
      if (latency > 0) await sleep(latency);
      return res;
    },

    moveTaskToList: async (
      id: string,
      targetListId: string
    ): Promise<Result<Task>> => {
      if (get().simulateFailure) {
        if (latency > 0) await sleep(latency);
        return fail(
          'INTERNAL',
          'Simulated network failure (HTTP 500): Failed to move task to list'
        );
      }
      const res = syncSlice.moveTaskToListSync(id, targetListId);
      if (latency > 0) await sleep(latency);
      return res;
    },

    deleteTask: async (id: string): Promise<Result<void>> => {
      if (get().simulateFailure) {
        if (latency > 0) await sleep(latency);
        return fail(
          'INTERNAL',
          'Simulated network failure (HTTP 500): Failed to delete task'
        );
      }
      const res = syncSlice.deleteTaskSync(id);
      if (latency > 0) await sleep(latency);
      return res;
    },
  };

  return { ...syncSlice, ...asyncSlice };
}
