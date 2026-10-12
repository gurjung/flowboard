/**
 * Centralized domain enums and union literal collections.
 */
export const CONTAINER_TYPES = [
  'workspace',
  'space',
  'folder',
  'list',
] as const;

export const TASK_PRIORITIES = [
  'urgent',
  'high',
  'normal',
  'low',
  'none',
] as const;

export const STATUS_CATEGORIES = ['todo', 'in_progress', 'done'] as const;

export const USER_ROLES = ['admin', 'member'] as const;

export const GRANT_MODES = ['allow', 'deny'] as const;

export const VISIBILITIES = ['public', 'private'] as const;

export const THEME_MODES = ['light', 'dark', 'system'] as const;

export const ACTIVE_VIEWS = ['kanban', 'list'] as const;
