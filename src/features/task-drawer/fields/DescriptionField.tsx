import React from 'react';

interface DescriptionFieldProps {
  description: string;
  canEdit: boolean;
  onChange: (description: string) => void;
}

export const DescriptionField: React.FC<DescriptionFieldProps> = ({
  description,
  canEdit,
  onChange,
}) => {
  if (!canEdit) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Description
        </span>
        <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-100 min-h-[4rem] dark:text-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
          {description ? (
            description
          ) : (
            <span className="text-slate-400 italic dark:text-slate-500">
              No description provided.
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="drawer-description-input"
        className="text-xs font-medium text-slate-700 dark:text-slate-300"
      >
        Description
      </label>
      <textarea
        id="drawer-description-input"
        data-testid="drawer-description-input"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Add details about this task..."
        className="w-full text-sm leading-relaxed text-slate-800 rounded-lg border border-slate-300 bg-white p-3 shadow-xs hover:border-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-y dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  );
};
