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
        <span className="text-xs font-medium text-slate-500">Description</span>
        <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-100 min-h-[4rem]">
          {description ? (
            description
          ) : (
            <span className="text-slate-400 italic">
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
        className="text-xs font-medium text-slate-500"
      >
        Description
      </label>
      <textarea
        id="drawer-description-input"
        data-testid="drawer-description-input"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Add more details about this task..."
        className="w-full text-xs text-slate-800 rounded-md border border-slate-200 bg-white p-2.5 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-y"
      />
    </div>
  );
};
