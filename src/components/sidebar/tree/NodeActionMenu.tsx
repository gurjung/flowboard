import React from 'react';
import { Menu } from '@headlessui/react';
import { TreeNode } from '@/domain/selectors';
import { ContainerType } from '@/domain/types';
import {
  MoreVertical,
  Plus,
  Edit2,
  ArrowUp,
  ArrowDown,
  Archive,
} from 'lucide-react';

import { useToast } from '@/components/toasts';
import { Result } from '@/domain/result';

interface NodeActionMenuProps {
  node: TreeNode;
  childType: ContainerType | null;
  currentIndex: number;
  isFirst: boolean;
  isLast: boolean;
  reorderContainer: (
    id: string,
    newIndex: number
  ) => Promise<Result<void>> | Result<void>;
  onOpenCreate: () => void;
  onOpenRename: () => void;
  onOpenArchive: () => void;
}

export const NodeActionMenu: React.FC<NodeActionMenuProps> = ({
  node,
  childType,
  currentIndex,
  isFirst,
  isLast,
  reorderContainer,
  onOpenCreate,
  onOpenRename,
  onOpenArchive,
}) => {
  const toast = useToast();

  const handleMove = async (newIndex: number) => {
    const result = await reorderContainer(node.id, newIndex);
    if (result && !result.success) {
      toast.error(result.error.message);
    }
  };
  return (
    <div
      className="opacity-0 group-hover:opacity-100 focus-within:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button
          type="button"
          aria-label="Container actions"
          className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          data-testid={`row-menu-btn-${node.id}`}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Menu.Button>

        <Menu.Items className="absolute right-0 z-40 mt-1 w-36 origin-top-right rounded-md border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-slate-700 dark:bg-slate-800">
          {childType && (
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={onOpenCreate}
                  data-testid={`menu-create-child-${node.id}`}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                    active
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add {childType}</span>
                </button>
              )}
            </Menu.Item>
          )}

          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={onOpenRename}
                data-testid={`menu-rename-${node.id}`}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                  active
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Rename</span>
              </button>
            )}
          </Menu.Item>

          {node.type !== 'workspace' && (
            <>
              <Menu.Item disabled={isFirst}>
                {({ active, disabled }) => (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleMove(currentIndex - 1)}
                    data-testid={`menu-move-up-${node.id}`}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                      disabled
                        ? 'cursor-not-allowed opacity-40 text-slate-400'
                        : active
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span>Move up</span>
                  </button>
                )}
              </Menu.Item>

              <Menu.Item disabled={isLast}>
                {({ active, disabled }) => (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleMove(currentIndex + 1)}
                    data-testid={`menu-move-down-${node.id}`}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                      disabled
                        ? 'cursor-not-allowed opacity-40 text-slate-400'
                        : active
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    <span>Move down</span>
                  </button>
                )}
              </Menu.Item>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onOpenArchive}
                    data-testid={`menu-archive-${node.id}`}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-rose-600 dark:text-rose-400 ${
                      active ? 'bg-rose-50 dark:bg-rose-950/40' : ''
                    }`}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Archive</span>
                  </button>
                )}
              </Menu.Item>
            </>
          )}
        </Menu.Items>
      </Menu>
    </div>
  );
};
