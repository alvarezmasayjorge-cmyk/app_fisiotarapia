import { SkeletonList } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="h-8 w-48 animate-pulse bg-slate-200 rounded" />
      <SkeletonList count={3} />
    </div>
  );
}
