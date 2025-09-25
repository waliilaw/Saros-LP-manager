import dynamic from 'next/dynamic';

// Chart components
export const DynamicPerformanceChart = dynamic(
  () => import('@/components/charts/PerformanceChart').then(mod => mod.PerformanceChart),
  { ssr: false }
);
