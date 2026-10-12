export type ContainerType = 'workspace' | 'space' | 'folder' | 'list';

export type Visibility = 'public' | 'private';

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
  parentId: string;
}

export interface Folder extends BaseContainer {
  type: 'folder';
  parentId: string;
}

export interface List extends BaseContainer {
  type: 'list';
  parentId: string;
  statusIds: string[];
}

export type Container = Workspace | Space | Folder | List;

export type ArchiveStatus = 'active' | 'archived' | 'corrupt';
