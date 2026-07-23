import React from 'react';
import { X, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${isDanger ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-800'}`}>
              {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <h3 className="text-base font-bold text-stone-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-stone-600 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200/60 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-sm transition-all disabled:opacity-50 ${
              isDanger
                ? 'bg-red-700 hover:bg-red-800 shadow-red-200'
                : 'bg-stone-800 hover:bg-stone-900 shadow-stone-200'
            }`}
          >
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
