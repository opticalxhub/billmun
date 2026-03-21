"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Footer } from "@/components/footer";

export default function Gallery() {
  const [committees, setCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchCommittees() {
      const { data, error } = await supabase
        .from("committees")
        .select("id, abbreviation, name, topic, image_url")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (mounted && data) {
        setCommittees(data);
      }
      setLoading(false);
      if (error) {
        console.error("Failed to load committees for gallery", error);
      }
    }

    fetchCommittees();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-inter">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="mb-10">
          <h1 className="font-jotia text-5xl md:text-6xl mb-3">Gallery</h1>
          <p className="text-text-secondary">Explore active committee highlights and resources.</p>
        </div>

        {loading ? (
          <div className="text-text-secondary">Loading gallery...</div>
        ) : committees.length === 0 ? (
          <div className="text-text-secondary">No committee gallery items available yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((committee) => (
              <div key={committee.id} className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
                <div className="h-56 relative bg-gradient-to-br from-[#111111] to-[#1b1b1b] overflow-hidden">
                  {committee.image_url ? (
                    <img
                      src={committee.image_url}
                      alt={committee.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-secondary text-sm">No image available</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-text-tertiary uppercase tracking-wider mb-1">{committee.abbreviation || "COMMITTEE"}</p>
                  <h2 className="font-semibold text-xl text-text-primary mb-2">{committee.name}</h2>
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">{committee.topic || "No topic available"}</p>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-lg px-3 py-2 bg-text-primary text-bg-base text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Register to access
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
