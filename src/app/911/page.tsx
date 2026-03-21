"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyEmergencyPassphrase } from "./action";

export default function EmergencyPage() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const expires = decodeURIComponent(document.cookie
      .split('; ')
      .find((row) => row.startsWith('emergency_expires='))
      ?.split('=')[1] || '');

    if (expires) {
      const expDate = new Date(expires);
      if (expDate.getTime() > Date.now()) {
        router.push('/eb/dash');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await verifyEmergencyPassphrase(passphrase);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/911/dash');
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="mb-12">
        <img
          src="/billmun.png"
          alt="BILLMUN"
          className="mx-auto mb-8 opacity-50"
          style={{ width: '400px', height: 'auto' }}
        />
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          type="password"
          placeholder="PASSPHRASE"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full bg-transparent border-b border-[#333333] pb-2 text-center text-[#F0EDE6] text-sm tracking-widest placeholder:text-[#333333] focus:outline-none focus:border-[#F0EDE6] transition-colors"
          readOnly={loading}
          autoFocus
        />
        {error && (
          <p className="text-red-500 text-xs text-center mt-4 tracking-wider">{error}</p>
        )}
      </form>
    </div>
  );
}
