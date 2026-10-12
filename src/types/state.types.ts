import {
  Workspace,
  Space,
  Folder,
  List,
  BaseContainer,
} from './container.types';
import { Status } from './status.types';
import { Task } from './task.types';
import { User, Grant } from './user.types';

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

export interface PermissionState {
  nodes: Record<string, BaseContainer>;
  grants: Record<string, Grant> | Grant[];
}
