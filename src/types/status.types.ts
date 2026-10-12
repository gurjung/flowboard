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
