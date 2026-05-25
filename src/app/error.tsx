"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-base font-inter">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border-status-rejected-border bg-status-rejected-bg/5 shadow-2xl">
        <div className="w-20 h-20 mx-auto bg-status-rejected-bg/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-status-rejected-text" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-jotia-bold text-text-primary tracking-tight uppercase">Something Went Wrong</h1>
          <p className="text-text-secondary text-sm">We encountered an unexpected error while loading this content. Our systems have logged this incident.</p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={reset}
            className="w-full font-bold shadow-lg"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            asChild
            className="w-full"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
