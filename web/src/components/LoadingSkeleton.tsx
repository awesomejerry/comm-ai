/**
 * Loading skeleton components for better perceived performance
 */

/**
 * Skeleton for a question chat bubble
 */
export function QuestionSkeleton() {
  return (
    <div
      className="flex items-start gap-3 mb-4 animate-pulse"
      role="status"
      aria-label="Loading question"
    >
      {/* Avatar skeleton */}
      <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full" />

      {/* Content skeleton */}
      <div className="flex-1 bg-gray-100 rounded-lg p-4">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-300 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton for progress tracker
 */
export function ProgressSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading progress">
      <div className="h-4 bg-gray-300 rounded w-32 mb-2" />
      <div className="h-2 bg-gray-200 rounded w-full mb-2" />
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Full Q&A interface loading skeleton
 */
export function QAInterfaceSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Progress tracker skeleton */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <ProgressSkeleton />
      </div>

      {/* Questions skeleton */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <QuestionSkeleton />
        <QuestionSkeleton />
        <QuestionSkeleton />
      </div>

      {/* Navigation skeleton */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between animate-pulse">
          <div className="h-10 bg-gray-300 rounded w-24" />
          <div className="h-4 bg-gray-300 rounded w-32" />
          <div className="h-10 bg-gray-300 rounded w-24" />
        </div>
      </div>

      {/* Recording area skeleton */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-48 mb-3" />
          <div className="h-12 bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}
