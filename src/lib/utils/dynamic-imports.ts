import dynamic from 'next/dynamic';

// Chart components with loading fallback
export const DynamicPerformanceChart = dynamic(
  () => import('@/components/charts/PerformanceChart').then(mod => mod.PerformanceChart),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded-lg h-[300px]" />
    ),
    ssr: false,
  }
);

// Heavy feature components
export const DynamicBacktestPanel = dynamic(
  () => import('@/components/backtesting/BacktestPanel').then(mod => mod.BacktestPanel),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    ),
  }
);

export const DynamicSuggestionPanel = dynamic(
  () => import('@/components/ai/SuggestionPanel').then(mod => mod.SuggestionPanel),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-96 bg-gray-100 rounded" />
      </div>
    ),
  }
);

export const DynamicComparisonPanel = dynamic(
  () => import('@/components/comparison/ComparisonPanel').then(mod => mod.ComparisonPanel),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-96 bg-gray-100 rounded" />
      </div>
    ),
  }
);
