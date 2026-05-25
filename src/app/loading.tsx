import { LoadingSpinner } from '@/components/loading-spinner';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Loading NXTPortal...</h2>
        <p className="text-text-secondary">Preparing your experience</p>
      </div>
    </div>
  );
}
