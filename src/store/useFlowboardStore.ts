import { useStore } from 'zustand';
import { createFlowboardStore } from './createFlowboardStore';
import { FlowboardStoreState } from './types';
import { createSeedState } from '@/domain/fixtures';

export const flowboardStore = createFlowboardStore(createSeedState(), {
  latencyMs: 400,
});

export function useFlowboardStore<T = FlowboardStoreState>(
  selector?: (state: FlowboardStoreState) => T
): T {
  return useStore(
    flowboardStore,
    selector ?? ((state: FlowboardStoreState) => state as unknown as T)
  );
}

useFlowboardStore.getState = flowboardStore.getState;
useFlowboardStore.setState = flowboardStore.setState;
useFlowboardStore.subscribe = flowboardStore.subscribe;
