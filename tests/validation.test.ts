import { describe, it, expect } from 'vitest';
import {
  validateContainerName,
  isValidParentType,
  getArchiveStatus,
  isEffectivelyArchived,
} from '@/domain/validation';
import { createSeedState } from '@/domain/fixtures';
import { toPermissionState } from '@/domain/permissions';
import { BaseContainer } from '@/domain/types';

describe('Validation Domain Utilities', () => {
  describe('validateContainerName', () => {
    it('accepts valid trimmed names within 1 to 100 characters', () => {
      const result1 = validateContainerName('Backlog');
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data).toBe('Backlog');
      }

      const result2 = validateContainerName('  Sprint 42  ');
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data).toBe('Sprint 42');
      }
    });

    it('rejects empty or whitespace-only names with VALIDATION error', () => {
      const resEmpty = validateContainerName('');
      expect(resEmpty.success).toBe(false);
      if (!resEmpty.success) {
        expect(resEmpty.error.code).toBe('VALIDATION');
      }

      const resWhitespace = validateContainerName('   ');
      expect(resWhitespace.success).toBe(false);
      if (!resWhitespace.success) {
        expect(resWhitespace.error.code).toBe('VALIDATION');
      }
    });

    it('rejects names exceeding 100 characters with VALIDATION error', () => {
      const longName = 'a'.repeat(101);
      const res = validateContainerName(longName);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('VALIDATION');
      }
    });
  });

  describe('isValidParentType', () => {
    it('enforces exact spec container hierarchy: workspace -> space -> folder -> list', () => {
      expect(isValidParentType('space', 'workspace')).toBe(true);
      expect(isValidParentType('folder', 'space')).toBe(true);
      expect(isValidParentType('list', 'folder')).toBe(true);

      // Disallowed hierarchy pairings
      expect(isValidParentType('workspace', null)).toBe(false);
      expect(isValidParentType('space', 'space')).toBe(false);
      expect(isValidParentType('folder', 'workspace')).toBe(false);
      expect(isValidParentType('list', 'space')).toBe(false); // Strict hierarchy per D-002
      expect(isValidParentType('list', 'list')).toBe(false);
    });
  });

  describe('getArchiveStatus & isEffectivelyArchived', () => {
    const seed = createSeedState();
    const perm = toPermissionState(seed);
    const nodes = perm.nodes;

    it('returns "active" for unarchived containers in active hierarchy', () => {
      expect(getArchiveStatus('ws-1', nodes)).toBe('active');
      expect(getArchiveStatus('space-1', nodes)).toBe('active');
      expect(getArchiveStatus('folder-1', nodes)).toBe('active');
      expect(getArchiveStatus('list-1', nodes)).toBe('active');

      expect(isEffectivelyArchived('list-1', nodes)).toBe(false);
    });

    it('returns "archived" when node itself is archived', () => {
      const modifiedNodes: Record<string, BaseContainer> = {
        ...nodes,
        'list-1': {
          ...nodes['list-1']!,
          archivedAt: '2026-10-10T10:00:00.000Z',
        },
      };

      expect(getArchiveStatus('list-1', modifiedNodes)).toBe('archived');
      expect(isEffectivelyArchived('list-1', modifiedNodes)).toBe(true);
    });

    it('returns "archived" when an ancestor is archived, even if node itself has archivedAt null', () => {
      // Archive folder-1; list-1 has archivedAt null
      const modifiedNodes: Record<string, BaseContainer> = {
        ...nodes,
        'folder-1': {
          ...nodes['folder-1']!,
          archivedAt: '2026-10-10T10:00:00.000Z',
        },
      };

      expect(getArchiveStatus('folder-1', modifiedNodes)).toBe('archived');
      // list-1 itself is null, but effectively archived via folder-1
      expect(getArchiveStatus('list-1', modifiedNodes)).toBe('archived');
      expect(isEffectivelyArchived('list-1', modifiedNodes)).toBe(true);
    });

    it('returns "corrupt" on missing, broken, or cyclic hierarchies', () => {
      expect(getArchiveStatus('non-existent-id', nodes)).toBe('corrupt');

      const brokenNodes: Record<string, BaseContainer> = {
        orphan: {
          id: 'orphan',
          name: 'Broken',
          type: 'list',
          parentId: 'ghost-parent',
          position: 0,
          visibility: 'public',
          archivedAt: null,
          createdAt: '',
          updatedAt: '',
        },
      };
      expect(getArchiveStatus('orphan', brokenNodes)).toBe('corrupt');
      expect(isEffectivelyArchived('orphan', brokenNodes)).toBe(true);

      const cyclicNodes: Record<string, BaseContainer> = {
        'cycle-1': {
          id: 'cycle-1',
          name: 'C1',
          type: 'folder',
          parentId: 'cycle-2',
          position: 0,
          visibility: 'public',
          archivedAt: null,
          createdAt: '',
          updatedAt: '',
        },
        'cycle-2': {
          id: 'cycle-2',
          name: 'C2',
          type: 'folder',
          parentId: 'cycle-1',
          position: 1,
          visibility: 'public',
          archivedAt: null,
          createdAt: '',
          updatedAt: '',
        },
      };
      expect(getArchiveStatus('cycle-1', cyclicNodes)).toBe('corrupt');
      expect(getArchiveStatus('cycle-2', cyclicNodes)).toBe('corrupt');
      expect(isEffectivelyArchived('cycle-1', cyclicNodes)).toBe(true);
    });
  });
});
