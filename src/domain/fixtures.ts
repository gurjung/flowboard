import {
  Workspace,
  Space,
  Folder,
  List,
  Status,
  Task,
  User,
  Grant,
  SeedState,
} from './types';

const FIXED_DATE = '2026-10-01T09:00:00.000Z';
const FIXED_UPDATE_DATE = '2026-10-02T14:30:00.000Z';

export function createSeedState(): SeedState {
  const workspaces: Record<string, Workspace> = {
    'ws-1': {
      id: 'ws-1',
      name: 'Acme Corporation',
      type: 'workspace',
      parentId: null,
      position: 0,
      visibility: 'public',
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
  };

  const spaces: Record<string, Space> = {
    'space-1': {
      id: 'space-1',
      name: 'Product & Engineering',
      type: 'space',
      parentId: 'ws-1',
      position: 0,
      visibility: 'public',
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'space-2': {
      id: 'space-2',
      name: 'Marketing & Growth',
      type: 'space',
      parentId: 'ws-1',
      position: 1,
      visibility: 'public',
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
  };

  const folders: Record<string, Folder> = {
    'folder-1': {
      id: 'folder-1',
      name: 'Core Platform',
      type: 'folder',
      parentId: 'space-1',
      position: 0,
      visibility: 'public',
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'folder-2': {
      id: 'folder-2',
      name: 'Security & Compliance',
      type: 'folder',
      parentId: 'space-1',
      position: 1,
      visibility: 'private', // Private container: Carol granted allow, Bob has NO grant
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
  };

  const lists: Record<string, List> = {
    'list-1': {
      id: 'list-1',
      name: 'Sprint Backlog',
      type: 'list',
      parentId: 'folder-1',
      position: 0,
      visibility: 'public',
      archivedAt: null,
      statusIds: [
        'status-1-todo',
        'status-1-prog',
        'status-1-qa',
        'status-1-done',
      ],
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'list-2': {
      id: 'list-2',
      name: 'Bug Triage',
      type: 'list',
      parentId: 'folder-1',
      position: 1,
      visibility: 'public', // Carol has explicit deny grant
      archivedAt: null,
      statusIds: ['status-2-todo', 'status-2-prog', 'status-2-done'],
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'list-3': {
      id: 'list-3',
      name: 'Vulnerabilities',
      type: 'list',
      parentId: 'folder-2', // Inherits private context from folder-2
      position: 0,
      visibility: 'public',
      archivedAt: null,
      statusIds: ['status-3-todo', 'status-3-prog', 'status-3-done'],
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
  };

  const statuses: Record<string, Status> = {
    // List 1 statuses
    'status-1-todo': {
      id: 'status-1-todo',
      listId: 'list-1',
      name: 'To Do',
      category: 'todo',
      color: '#64748b',
      position: 0,
    },
    'status-1-prog': {
      id: 'status-1-prog',
      listId: 'list-1',
      name: 'In Progress',
      category: 'in_progress',
      color: '#2563eb',
      position: 1,
    },
    'status-1-qa': {
      id: 'status-1-qa',
      listId: 'list-1',
      name: 'QA',
      category: 'in_progress',
      color: 'amber',
      position: 2,
    },
    'status-1-done': {
      id: 'status-1-done',
      listId: 'list-1',
      name: 'Done',
      category: 'done',
      color: '#16a34a',
      position: 3,
    },
    // List 2 statuses
    'status-2-todo': {
      id: 'status-2-todo',
      listId: 'list-2',
      name: 'Open',
      category: 'todo',
      color: '#64748b',
      position: 0,
    },
    'status-2-prog': {
      id: 'status-2-prog',
      listId: 'list-2',
      name: 'Investigating',
      category: 'in_progress',
      color: '#2563eb',
      position: 1,
    },
    'status-2-done': {
      id: 'status-2-done',
      listId: 'list-2',
      name: 'Resolved',
      category: 'done',
      color: '#16a34a',
      position: 2,
    },
    // List 3 statuses
    'status-3-todo': {
      id: 'status-3-todo',
      listId: 'list-3',
      name: 'Reported',
      category: 'todo',
      color: '#64748b',
      position: 0,
    },
    'status-3-prog': {
      id: 'status-3-prog',
      listId: 'list-3',
      name: 'Patching',
      category: 'in_progress',
      color: '#2563eb',
      position: 1,
    },
    'status-3-done': {
      id: 'status-3-done',
      listId: 'list-3',
      name: 'Patched',
      category: 'done',
      color: '#16a34a',
      position: 2,
    },
  };

  const users: Record<string, User> = {
    'user-alice': {
      id: 'user-alice',
      name: 'Alice Admin',
      email: 'alice@acme.com',
      role: 'admin',
    },
    'user-bob': {
      id: 'user-bob',
      name: 'Bob Member',
      email: 'bob@acme.com',
      role: 'member',
    },
    'user-carol': {
      id: 'user-carol',
      name: 'Carol Member',
      email: 'carol@acme.com',
      role: 'member',
    },
  };

  const grants: Record<string, Grant> = {
    'grant-1': {
      id: 'grant-1',
      resourceId: 'folder-2', // Carol has allow on private Security & Compliance folder
      userId: 'user-carol',
      mode: 'allow',
    },
    'grant-2': {
      id: 'grant-2',
      resourceId: 'list-2', // Carol has explicit deny on Bug Triage list
      userId: 'user-carol',
      mode: 'deny',
    },
  };

  const tasks: Record<string, Task> = {
    // List 1 (Sprint Backlog) - 6 tasks
    'task-1': {
      id: 'task-1',
      primaryListId: 'list-1',
      title: 'Implement token refresh rotation flow',
      description:
        'Secure silent authentication token refresh using short-lived JWTs.',
      statusId: 'status-1-todo',
      priority: 'high',
      assigneeIds: ['user-alice'],
      dueDate: '2026-10-15T18:00:00.000Z',
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-2': {
      id: 'task-2',
      primaryListId: 'list-1',
      title: 'Add database index on workspace_id column',
      description:
        'Mitigate sequential table scans on multi-tenant workspace queries.',
      statusId: 'status-1-prog',
      priority: 'urgent',
      assigneeIds: ['user-bob'],
      dueDate: '2026-10-12T12:00:00.000Z',
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-3': {
      id: 'task-3',
      primaryListId: 'list-1',
      title: 'Implement auto-scrolling during drag-and-drop gestures',
      description:
        'When dragging near viewport boundaries, automatically scroll the column container.',
      statusId: 'status-1-prog',
      priority: 'normal',
      assigneeIds: ['user-bob'],
      dueDate: '2026-10-18T17:00:00.000Z',
      position: 1,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-4': {
      id: 'task-4',
      primaryListId: 'list-1',
      title: 'Publish webhook payload schema documentation',
      description:
        'Document event schemas for task.created and task.status_changed.',
      statusId: 'status-1-done',
      priority: 'low',
      assigneeIds: ['user-carol'],
      dueDate: null,
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_UPDATE_DATE,
    },
    'task-5': {
      id: 'task-5',
      primaryListId: 'list-1',
      title: 'Integrate automated schema validation in CI pipeline',
      description:
        'Run migration compatibility checks against pull request commits.',
      statusId: 'status-1-todo',
      priority: 'normal',
      assigneeIds: ['user-alice', 'user-bob'],
      dueDate: '2026-10-20T00:00:00.000Z',
      position: 1,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-6': {
      id: 'task-6',
      primaryListId: 'list-1',
      title: 'Audit third-party dependencies and purge unused packages',
      description:
        'Verify production bundle size remains under 200kB gzip threshold.',
      statusId: 'status-1-todo',
      priority: 'none',
      assigneeIds: [], // Unassigned task per D-004
      dueDate: null,
      position: 2,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },

    // List 2 (Bug Triage) - 5 tasks
    'task-7': {
      id: 'task-7',
      primaryListId: 'list-2',
      title: 'Kanban card snap jitter on rapid drag gestures',
      description:
        'Rapid collision calculations cause occasional jitter in sortable list.',
      statusId: 'status-2-prog',
      priority: 'urgent',
      assigneeIds: ['user-bob'],
      dueDate: '2026-10-11T16:00:00.000Z',
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-8': {
      id: 'task-8',
      primaryListId: 'list-2',
      title: 'Task drawer Escape key fails when description editor has focus',
      description:
        'Headless UI dialog escape listener must retain priority over internal inputs.',
      statusId: 'status-2-todo',
      priority: 'high',
      assigneeIds: ['user-alice'],
      dueDate: '2026-10-14T10:00:00.000Z',
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-9': {
      id: 'task-9',
      primaryListId: 'list-2',
      title: 'Horizontal layout overflow on narrow browser windows',
      description:
        'Ensure main content view contains overflow-x correctly without clipping sidebar.',
      statusId: 'status-2-todo',
      priority: 'low',
      assigneeIds: [],
      dueDate: null,
      position: 1,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-10': {
      id: 'task-10',
      primaryListId: 'list-2',
      title: 'Flicker in action menu tooltip on mouse leave',
      description:
        'Debounce hover transitions on popover triggers to avoid DOM re-mount thrash.',
      statusId: 'status-2-done',
      priority: 'none',
      assigneeIds: ['user-bob'],
      dueDate: null,
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_UPDATE_DATE,
    },
    'task-11': {
      id: 'task-11',
      primaryListId: 'list-2',
      title: 'Zustand selector memoization failure on active list changes',
      description:
        'Ensure derived task selector does not trigger extraneous parent re-renders.',
      statusId: 'status-2-prog',
      priority: 'high',
      assigneeIds: ['user-alice'],
      dueDate: '2026-10-13T15:00:00.000Z',
      position: 1,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },

    // List 3 (Vulnerabilities) - 5 tasks
    'task-12': {
      id: 'task-12',
      primaryListId: 'list-3',
      title: 'Rotate expired staging JWT certificate pair',
      description:
        'Generate new RSA 4096-bit key pair and push to AWS Secrets Manager.',
      statusId: 'status-3-prog',
      priority: 'urgent',
      assigneeIds: ['user-carol'],
      dueDate: '2026-10-11T08:00:00.000Z',
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-13': {
      id: 'task-13',
      primaryListId: 'list-3',
      title: 'Patch transitive dependency prototype pollution advisory',
      description:
        'Bump upstream lodash-es lockfile reference to latest secure patch.',
      statusId: 'status-3-done',
      priority: 'high',
      assigneeIds: ['user-alice'],
      dueDate: '2026-10-09T18:00:00.000Z',
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_UPDATE_DATE,
    },
    'task-14': {
      id: 'task-14',
      primaryListId: 'list-3',
      title: 'Enforce strict Content Security Policy script-src directives',
      description:
        'Eliminate unsafe-inline scripts across all production HTML endpoints.',
      statusId: 'status-3-todo',
      priority: 'normal',
      assigneeIds: ['user-carol'],
      dueDate: '2026-10-22T17:00:00.000Z',
      position: 0,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-15': {
      id: 'task-15',
      primaryListId: 'list-3',
      title: 'Implement rate limiting for public container lookups',
      description:
        'Apply sliding-window rate limit of 60 req/min per IP address.',
      statusId: 'status-3-todo',
      priority: 'high',
      assigneeIds: [],
      dueDate: '2026-10-25T12:00:00.000Z',
      position: 1,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
    'task-16': {
      id: 'task-16',
      primaryListId: 'list-3',
      title: 'Quarterly penetration test vulnerability report remediation',
      description:
        'Review external audit findings and categorize actionable remediations.',
      statusId: 'status-3-todo',
      priority: 'normal',
      assigneeIds: ['user-carol', 'user-alice'],
      dueDate: '2026-10-30T17:00:00.000Z',
      position: 2,
      archivedAt: null,
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    },
  };

  return {
    workspaces,
    spaces,
    folders,
    lists,
    statuses,
    tasks,
    users,
    grants,
    currentUserId: 'user-alice',
    selectedListId: 'list-1',
  };
}
