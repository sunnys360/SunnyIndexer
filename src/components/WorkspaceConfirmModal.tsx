import React from 'react';
import { AlertTriangle, FileSpreadsheet, HardDrive, Check, X } from 'lucide-react';

interface WorkspaceConfirmModalProps {
  isOpen: boolean;
  actionType: 'export_sheets' | 'export_drive' | 'import_sheets';
  title: string;
  description: string;
  itemCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const WorkspaceConfirmModal: React.FC<WorkspaceConfirmModalProps> = ({
  isOpen,
  actionType,
  title,
  description,
  itemCount,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (actionType) {
      case 'export_sheets':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'export_drive':
        return <HardDrive className="w-5 h-5 text-sky-400" />;
      default:
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2.5 bg-slate-900/90">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-[11px] text-slate-400">Google Workspace Confirmation</p>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            {description}
          </p>

          {itemCount !== undefined && (
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Records to write:</span>
              <span className="text-emerald-400 font-semibold">{itemCount} items</span>
            </div>
          )}

          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-[11px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This will create or access a file in your authorized Google account with your explicit permission.
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/60">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-slate-400 hover:text-white text-xs font-medium rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-500/20"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Proceed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
