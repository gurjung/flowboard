import {
  Workspace,
  Space,
  Folder,
  List,
  Status,
  Task,
  User,
  Grant,
  ContainerType,
  Visibility,
  BaseContainer,
} from '@/domain/types';
import { Result } from '@/domain/result';

export interface StoreDeps {
  now: () => string;
  newId: () => string;
  latencyMs?: number;
}

export interface CreateContainerInput {
  type: ContainerType;
  parentId: string | null;
  name: string;
  visibility?: Visibility;
}

export interface SessionSlice {
  currentUserId: string;
  selectedListId: string | null;
  setCurrentUser: (userId: string) => Result<User>;
  setSelectedList: (listId: string | null) => Result<void>;
  selectList: (listId: string) => Result<List>;
  clearSelection: () => Result<void>;
}

export interface ContainerSyncSlice {
  createContainerSync: (input: CreateContainerInput) => Result<BaseContainer>;
  renameContainerSync: (id: string, name: string) => Result<BaseContainer>;
  reorderContainerSync: (id: string, newIndex: number) => Result<void>;
  archiveContainerSync: (id: string) => Result<BaseContainer>;
  restoreContainerSync: (id: string) => Result<BaseContainer>;
}

export interface ContainerAsyncSlice {
  createContainer: (
    input: CreateContainerInput
  ) => Promise<Result<BaseContainer>>;
  renameContainer: (id: string, name: string) => Promise<Result<BaseContainer>>;
  reorderContainer: (id: string, newIndex: number) => Promise<Result<void>>;
  archiveContainer: (id: string) => Promise<Result<BaseContainer>>;
  restoreContainer: (id: string) => Promise<Result<BaseContainer>>;
}

export interface FlowboardDataState {
  workspaces: Record<string, Workspace>;
  spaces: Record<string, Space>;
  folders: Record<string, Folder>;
  lists: Record<string, List>;
  statuses: Record<string, Status>;
  tasks: Record<string, Task>;
  users: Record<string, User>;
  grants: Record<string, Grant>;
}

export interface FlowboardStoreState
  extends
    FlowboardDataState,
    SessionSlice,
    ContainerSyncSlice,
    ContainerAsyncSlice {}

export type SetStoreState = (
  fn: (state: FlowboardStoreState) => Partial<FlowboardStoreState>
) => void;

export type GetStoreState = () => FlowboardStoreState;
