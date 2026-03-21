import { LoadingSpinner } from "./loading-spinner";

export function OverviewTabSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
      <LoadingSpinner size="lg" label="Loading overview..." />
    </div>
  );
}

export function ListTabSkeleton() {
  return (  
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
      <LoadingSpinner size="lg" label="Loading list..." />
    </div>
  );
}

export function GridTabSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
      <LoadingSpinner size="lg" label="Loading content..." />
    </div>
  );
}
