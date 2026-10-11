import {
  StatusSyncSlice,
  StatusAsyncSlice,
  CreateStatusInput,
  UpdateStatusPatch,
  StoreDeps,
  SetStoreState,
  GetStoreState,
} from '../types';
import { Status } from '@/domain/types';
import { Result } from '@/domain/result';
import { executeCreateStatus } from './createStatusOperation';
import { executeUpdateStatus } from './updateStatusOperation';
import { executeReorderStatus } from './reorderStatusOperation';
import { executeDeleteStatus } from './deleteStatusOperation';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createStatusSlice(
  set: SetStoreState,
  get: GetStoreState,
  deps: StoreDeps
): StatusSyncSlice & StatusAsyncSlice {
  const syncSlice: StatusSyncSlice = {
    createStatusSync: (input: CreateStatusInput) =>
      executeCreateStatus(get(), set, deps, input),

    updateStatusSync: (id: string, patch: UpdateStatusPatch) =>
      executeUpdateStatus(get(), set, deps, id, patch),

    reorderStatusSync: (id: string, newIndex: number) =>
      executeReorderStatus(get(), set, deps, id, newIndex),

    deleteStatusSync: (id: string, fallbackStatusId?: string) =>
      executeDeleteStatus(get(), set, deps, id, fallbackStatusId),
  };

  const latency = deps.latencyMs ?? 150;

  const asyncSlice: StatusAsyncSlice = {
    createStatus: async (input: CreateStatusInput): Promise<Result<Status>> => {
      const res = syncSlice.createStatusSync(input);
      if (latency > 0) await sleep(latency);
      return res;
    },

    updateStatus: async (
      id: string,
      patch: UpdateStatusPatch
    ): Promise<Result<Status>> => {
      const res = syncSlice.updateStatusSync(id, patch);
      if (latency > 0) await sleep(latency);
      return res;
    },

    reorderStatus: async (
      id: string,
      newIndex: number
    ): Promise<Result<Status>> => {
      const res = syncSlice.reorderStatusSync(id, newIndex);
      if (latency > 0) await sleep(latency);
      return res;
    },

    deleteStatus: async (
      id: string,
      fallbackStatusId?: string
    ): Promise<Result<void>> => {
      const res = syncSlice.deleteStatusSync(id, fallbackStatusId);
      if (latency > 0) await sleep(latency);
      return res;
    },
  };

  return { ...syncSlice, ...asyncSlice };
}
