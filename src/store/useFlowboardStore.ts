import { useStore } from 'zustand';
import { createFlowboardStore } from './createFlowboardStore';
import { FlowboardStoreState } from './types';
import { createSeedState } from '@/domain/fixtures';

export const flowboardStore = createFlowboardStore(createSeedState(), {
  latencyMs: 400,
});

export function useFlowboardStore<T>(
  selector: (state: FlowboardStoreState) => T
): T {
  return useStore(flowboardStore, selector);
}
