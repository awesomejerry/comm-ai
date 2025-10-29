/**
 * Evaluation List Component
 *
 * Displays a list of evaluations with virtual scrolling support.
 */

import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EvaluationResult } from '../models/evaluation';

interface EvaluationListProps {
  evaluations: EvaluationResult[];
  onEvaluationClick?: (evaluation: EvaluationResult) => void;
}

const truncateText = (text: string | null, maxLength: number = 200): string => {
  if (!text) return '[Data unavailable]';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
};

export const EvaluationList: React.FC<EvaluationListProps> = ({
  evaluations,
  onEvaluationClick,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling for performance with large datasets
  const virtualizer = useVirtualizer({
    count: evaluations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimated row height
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: 'calc(100vh - 250px)' }}
      data-testid="evaluation-list"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const evaluation = evaluations[virtualItem.index];

          return (
            <div
              key={evaluation.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-2"
            >
              <div
                className="bg-white rounded-lg shadow p-6 mb-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onEvaluationClick?.(evaluation)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEvaluationClick?.(evaluation);
                  }
                }}
                aria-label={`View details for evaluation ${evaluation.id}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column: Metadata */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">ID</span>
                      <p className="text-sm font-mono text-gray-700 truncate">{evaluation.id}</p>
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
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Slides
                        </span>
                        <p className="text-sm text-gray-700">
                          {evaluation.startSlide} - {evaluation.endSlide}
                        </p>
                      </div>
                    )}
                    {evaluation.audience && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Audience
                        </span>
                        <p className="text-sm text-gray-700">{evaluation.audience}</p>
                      </div>
                    )}
                  </div>

                  {/* Right column: Content */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Input</span>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {truncateText(evaluation.input)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Output</span>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {truncateText(evaluation.output)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
