/**
 * Centralized user-facing messages, toast texts, and error descriptions.
 */
export const TOAST_MESSAGES = {
  TASK_CREATED: 'Task created',
  TASK_UPDATED: 'Task updated',
  TASK_DELETED: 'Task deleted',
  CONTAINER_CREATED: 'Container created',
  CONTAINER_ARCHIVED: 'Container archived',
  CONTAINER_RENAMED: 'Container renamed',
  SIMULATE_FAILURE_ACTIVE:
    'Simulated API errors enabled (HTTP 500). Mutations will fail & rollback.',
  SIMULATE_FAILURE_INACTIVE:
    'Simulated API errors disabled. Mutations will succeed normally.',
  SIMULATE_FAILURE_ENABLED:
    'Simulated failure mode enabled (mutations will fail)',
  SIMULATE_FAILURE_DISABLED:
    'Simulated failure mode disabled (mutations normal)',
} as const;

export const ERROR_MESSAGES = {
  SIMULATED_FAILURE:
    'Simulated network failure (HTTP 500): Server temporarily unavailable',
  PERMISSION_DENIED_VIEW: 'Permission denied: cannot view this container',
  PERMISSION_DENIED_MODIFY:
    'You do not have permission to modify tasks in this list',
  PERMISSION_DENIED_CONTAINER: 'Permission denied',
  CONTAINER_NAME_REQUIRED: 'Container name cannot be empty',
  CONTAINER_NAME_TOO_LONG: 'Container name cannot exceed 100 characters',
  CONTAINER_NAME_INVALID: 'Container name must be a string',
  TASK_TITLE_REQUIRED: 'Task title cannot be empty',
  TASK_TITLE_TOO_LONG: 'Task title exceeds maximum length of 500 characters',
  TASK_TITLE_INVALID: 'Task title must be a string',
  TASK_DESCRIPTION_INVALID: 'Task description must be a string',
  DUE_DATE_PAST: 'Due date cannot be in the past',
  DELETE_TASK_FAILED: 'Failed to delete task. Please try again.',
} as const;
