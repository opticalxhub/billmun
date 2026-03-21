import Link from 'next/link';
import { Button } from '@/components/button';

export default function RejectedPage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-bg-card p-10 border border-border-subtle rounded-lg shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-rejected-bg text-status-rejected-text mb-4">
          <span className="text-2xl font-bold">X</span>
        </div>
        <h1 className="font-jotia text-3xl text-text-primary">Application Rejected</h1>
        <p className="text-text-secondary">
          Unfortunately, your application to the BILLMUN portal has been rejected. This may be due to verification failure or capacity limits.
        </p>
        <p className="text-text-tertiary text-sm">
          Please contact support if you believe this is a mistake.
        </p>
        <div className="pt-6">
           <Link href="/" passHref>
             <Button variant="outline" className="w-full">Return Home</Button>
           </Link>
        </div>
      </div>
    </div>
  );
}
