import {
  Workspace,
  Space,
  Folder,
  List,
  Status,
  StatusCategory,
  StatusColorToken,
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

export interface CreateTaskInput {
  listId: string;
  title: string;
  statusId?: string;
  description?: string;
  priority?: import('@/domain/types').TaskPriority;
  assigneeIds?: string[];
  dueDate?: string | null;
}

export interface UpdateTaskPatch {
  title?: string;
  description?: string;
  priority?: import('@/domain/types').TaskPriority;
  assigneeIds?: string[];
  dueDate?: string | null;
}

export interface TaskSyncSlice {
  createTaskSync: (input: CreateTaskInput) => Result<Task>;
  updateTaskSync: (id: string, patch: UpdateTaskPatch) => Result<Task>;
  changeTaskStatusSync: (
    id: string,
    statusId: string,
    index?: number
  ) => Result<Task>;
  reorderTaskSync: (id: string, newIndex: number) => Result<Task>;
  moveTaskToListSync: (id: string, targetListId: string) => Result<Task>;
  deleteTaskSync: (id: string) => Result<void>;
}

export interface TaskAsyncSlice {
  createTask: (input: CreateTaskInput) => Promise<Result<Task>>;
  updateTask: (id: string, patch: UpdateTaskPatch) => Promise<Result<Task>>;
  changeTaskStatus: (
    id: string,
    statusId: string,
    index?: number
  ) => Promise<Result<Task>>;
  reorderTask: (id: string, newIndex: number) => Promise<Result<Task>>;
  moveTaskToList: (id: string, targetListId: string) => Promise<Result<Task>>;
  deleteTask: (id: string) => Promise<Result<void>>;
}

export interface CreateStatusInput {
  listId: string;
  name: string;
  category: StatusCategory;
  color?: StatusColorToken;
}

export interface UpdateStatusPatch {
  name?: string;
  color?: StatusColorToken;
}

export interface StatusSyncSlice {
  createStatusSync: (input: CreateStatusInput) => Result<Status>;
  updateStatusSync: (id: string, patch: UpdateStatusPatch) => Result<Status>;
  reorderStatusSync: (id: string, newIndex: number) => Result<Status>;
  deleteStatusSync: (id: string, fallbackStatusId?: string) => Result<void>;
}

export interface StatusAsyncSlice {
  createStatus: (input: CreateStatusInput) => Promise<Result<Status>>;
  updateStatus: (
    id: string,
    patch: UpdateStatusPatch
  ) => Promise<Result<Status>>;
  reorderStatus: (id: string, newIndex: number) => Promise<Result<Status>>;
  deleteStatus: (
    id: string,
    fallbackStatusId?: string
  ) => Promise<Result<void>>;
}

export interface FlowboardStoreState
  extends
    FlowboardDataState,
    SessionSlice,
    ContainerSyncSlice,
    ContainerAsyncSlice,
    TaskSyncSlice,
    TaskAsyncSlice,
    StatusSyncSlice,
    StatusAsyncSlice {}

export type SetStoreState = (
  fn: (state: FlowboardStoreState) => Partial<FlowboardStoreState>
) => void;

export type GetStoreState = () => FlowboardStoreState;
