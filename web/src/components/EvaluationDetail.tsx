import { useEffect } from 'react';
import type { EvaluationResult } from '../models/evaluation';

interface EvaluationDetailProps {
  evaluation: EvaluationResult;
  onClose: () => void;
}

/**
 * Modal component displaying full details of an evaluation result.
 * Shows complete input/output content without truncation and all metadata.
 */
export const EvaluationDetail: React.FC<EvaluationDetailProps> = ({ evaluation, onClose }) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Evaluation Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Metadata Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">ID</span>
                  <p className="text-sm font-mono text-gray-700 break-all">{evaluation.id}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Created</span>
                  <p className="text-sm text-gray-700">{formatDate(evaluation.created_at)}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">User</span>
                  <p className="text-sm text-gray-700">N/A</p>
                </div>

                {evaluation.startSlide && evaluation.endSlide && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Slides</span>
                    <p className="text-sm text-gray-700">
                      {evaluation.startSlide} - {evaluation.endSlide}
                    </p>
                  </div>
                )}

                {evaluation.audience && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Audience</span>
                    <p className="text-sm text-gray-700">{evaluation.audience}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Input Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Input</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {evaluation.input ?? '[Data unavailable]'}
                </p>
              </div>
            </div>

            {/* Output Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Output</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {evaluation.output ?? '[Data unavailable]'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
