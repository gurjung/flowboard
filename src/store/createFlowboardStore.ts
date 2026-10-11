import { createStore, StoreApi } from 'zustand/vanilla';
import { FlowboardStoreState, StoreDeps, CreateContainerInput } from './types';
import { SeedState } from '@/domain/types';
import { createSeedState } from '@/domain/fixtures';
import { createSessionSlice } from './slices/sessionSlice';
import { createContainerSyncSlice } from './slices/containerSlice';
import { createTaskSlice } from './slices/taskSlice';
import { createStatusSlice } from './slices/statusSlice';

const defaultDeps: StoreDeps = {
  now: () => new Date().toISOString(),
  newId: () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  },
  latencyMs: 0,
};

const delay = (ms: number): Promise<void> =>
  ms > 0 ? new Promise((res) => setTimeout(res, ms)) : Promise.resolve();

export function createFlowboardStore(
  initialState: SeedState = createSeedState(),
  depsOverrides?: Partial<StoreDeps>
): StoreApi<FlowboardStoreState> {
  const deps: StoreDeps = {
    ...defaultDeps,
    ...depsOverrides,
  };

  return createStore<FlowboardStoreState>((set, get) => {
    const sessionSlice = createSessionSlice(set, get);
    const containerSyncSlice = createContainerSyncSlice(set, get, deps);
    const taskSlice = createTaskSlice(set, get, deps);
    const statusSlice = createStatusSlice(set, get, deps);

    return {
      // Data state initialized from fixtures / parameter
      workspaces: initialState.workspaces,
      spaces: initialState.spaces,
      folders: initialState.folders,
      lists: initialState.lists,
      statuses: initialState.statuses,
      tasks: initialState.tasks,
      users: initialState.users,
      grants: initialState.grants,

      // Session state & actions
      ...sessionSlice,
      currentUserId: initialState.currentUserId,
      selectedListId: initialState.selectedListId,

      // Synchronous container mutations (for tests and wrapper)
      ...containerSyncSlice,

      // Latency-wrapped container actions (identity-bound before delay)
      createContainer: async (input: CreateContainerInput) => {
        const result = get().createContainerSync(input);
        if (deps.latencyMs) {
          await delay(deps.latencyMs);
        }
        return result;
      },

      renameContainer: async (id: string, name: string) => {
        const result = get().renameContainerSync(id, name);
        if (deps.latencyMs) {
          await delay(deps.latencyMs);
        }
        return result;
      },

      reorderContainer: async (id: string, newIndex: number) => {
        const result = get().reorderContainerSync(id, newIndex);
        if (deps.latencyMs) {
          await delay(deps.latencyMs);
        }
        return result;
      },

      archiveContainer: async (id: string) => {
        const result = get().archiveContainerSync(id);
        if (deps.latencyMs) {
          await delay(deps.latencyMs);
        }
        return result;
      },

      restoreContainer: async (id: string) => {
        const result = get().restoreContainerSync(id);
        if (deps.latencyMs) {
          await delay(deps.latencyMs);
        }
        return result;
      },

      // Task operations (sync + async with latency)
      ...taskSlice,

      // Status operations (sync + async with latency)
      ...statusSlice,
    };
  });
}
