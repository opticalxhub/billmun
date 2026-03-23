"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { Card, Input, SectionLabel } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DashboardLoadingState } from "@/components/dashboard-shell";

const PAGE_SIZE = 50;

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['audit-logs'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, actor:actor_id(full_name, role)")
        .order("performed_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    staleTime: 60 * 1000,
  });

  const allRows = useMemo(() => data?.pages.flat() || [], [data]);

  const filtered = useMemo(() => 
    allRows.filter((r) => 
      `${r.action || ""} ${r.target_type || ""} ${r.target_id || ""}`.toLowerCase().includes(search.toLowerCase())
    ), [allRows, search]
  );

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Load more when scrolling to bottom
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= filtered.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, filtered.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <DashboardLoadingState type="overview" />;
  if (isError) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load audit logs.</p><button onClick={() => refetch()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <SectionLabel>Audit Log</SectionLabel>
          <h1 className="font-jotia text-3xl uppercase tracking-tight">System Audit</h1>
        </div>
        <button onClick={() => refetch()} className="text-xs text-text-dimmed hover:text-text-primary underline">Refresh</button>
      </div>
      <Card>
        <Input placeholder="Search loaded audit entries" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>
      
      <Card className="p-0 overflow-hidden border-border-subtle bg-bg-card">
        <div 
          ref={parentRef}
          className="h-[700px] overflow-auto scrollbar-hide"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualItem) => {
              const row = filtered[virtualItem.index];
              return (
                <div
                  key={row.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full border-b border-border-subtle p-4 hover:bg-bg-raised/50 transition-colors"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-text-primary">{row.action || "Action"}</p>
                    <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                      {(row.performed_at || row.created_at) ? new Date(row.performed_at || row.created_at).toLocaleString() : "-"}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs text-text-dimmed">
                    <span><strong className="text-text-secondary">Actor:</strong> {row.actor?.full_name || "System"} {row.actor?.role ? `(${row.actor.role})` : ""}</span>
                    <span><strong className="text-text-secondary">Target:</strong> {row.target_type || "-"} {row.target_id ? `(${row.target_id})` : ""}</span>
                  </div>
                  {row.metadata && (
                    <div className="mt-2 p-2 bg-bg-base/50 rounded border border-border-subtle text-[10px] font-mono overflow-x-auto max-h-32">
                      <pre>{JSON.stringify(row.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {isFetchingNextPage && (
            <div className="p-4 text-center text-xs text-text-dimmed font-jotia animate-pulse">
              Loading more audit entries...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
