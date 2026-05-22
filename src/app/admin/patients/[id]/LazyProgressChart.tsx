'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

const ProgressChart = dynamic(() => import('./ProgressChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-48 md:h-64 w-full" />,
});

export default ProgressChart;
