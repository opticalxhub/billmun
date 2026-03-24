import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ServerError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-text-primary">500</h1>
        <h2 className="text-2xl font-semibold text-text-secondary">Server Error</h2>
        <p className="text-text-dimmed max-w-md mx-auto">
          A server error occurred. Please try again later or contact support if the problem persists.
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
