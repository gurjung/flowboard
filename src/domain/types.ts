export type ContainerType = 'workspace' | 'space' | 'folder' | 'list';

export type Visibility = 'public' | 'private';

export type GrantMode = 'allow' | 'deny';

export interface Grant {
  id: string;
  resourceId: string; // Targets a space, folder, or list
  userId: string;
  mode: GrantMode;
}

export interface BaseContainer {
  id: string;
  name: string;
  type: ContainerType;
  parentId: string | null;
  position: number;
  visibility: Visibility;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace extends BaseContainer {
  type: 'workspace';
  parentId: null;
}

export interface Space extends BaseContainer {
  type: 'space';
  parentId: string; // Belongs to a workspace
}

export interface Folder extends BaseContainer {
  type: 'folder';
  parentId: string; // Belongs to a space
}

export interface List extends BaseContainer {
  type: 'list';
  parentId: string; // Belongs to a folder (per D-002 strict hierarchy)
  statusIds: string[]; // Status IDs owned by this list
}

export type Container = Workspace | Space | Folder | List;

export type StatusCategory = 'todo' | 'in_progress' | 'done';

export type StatusColorToken =
  'slate' | 'blue' | 'amber' | 'green' | 'red' | 'violet';

export interface Status {
  id: string;
  listId: string;
  name: string;
  category: StatusCategory;
  color: StatusColorToken | string;
  position: number;
}

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low' | 'none';

export interface Task {
  id: string;
  primaryListId: string;
  title: string;
  description?: string;
  statusId: string;
  priority: TaskPriority;
  assigneeIds: string[];
  dueDate: string | null;
  position: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface SeedState {
  workspaces: Record<string, Workspace>;
  spaces: Record<string, Space>;
  folders: Record<string, Folder>;
  lists: Record<string, List>;
  statuses: Record<string, Status>;
  tasks: Record<string, Task>;
  users: Record<string, User>;
  grants: Record<string, Grant>;
  currentUserId: string;
  selectedListId: string | null;
}
