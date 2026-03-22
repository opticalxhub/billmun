"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge, Card, Modal, SectionLabel, Input, Textarea } from "@/components/ui";
import { Button } from "@/components/button";

function generateInviteCode() {
  // 6-character uppercase invite code.
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

export default function BlocManager(props: { user?: any; committeeAssignment?: any }) {
  const { user, committeeAssignment } = props;

  const isEmergency = useMemo(() => {
    if (typeof document === "undefined") return false;
    return document.cookie.includes("emergency_expires=");
  }, []);

  const committeeId = committeeAssignment?.committeeId ?? committeeAssignment?.committee_id;
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [blocs, setBlocs] = useState<any[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createInviteCode, setCreateInviteCode] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchMyBlocs = async () => {
    if (!userId) {
      setBlocs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // bloc_members has bloc_id -> blocs relationship for details.
    const { data, error: qErr } = await supabase
      .from("bloc_members")
      .select("bloc_id, joined_at, blocs(id, name, description, invite_code, committee_id, created_at)")
      .eq("user_id", userId);

    if (qErr) {
      setError(qErr.message);
      setBlocs([]);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((m: any) => ({
      id: m.bloc_id,
      joined_at: m.joined_at,
      ...m.blocs,
    }));

    // Enrich with member counts.
    const memberCounts = await Promise.all(
      mapped.map(async (b) => {
        const { count } = await supabase
          .from("bloc_members")
          .select("*", { count: "exact", head: true })
          .eq("bloc_id", b.id);
        return { bloc_id: b.id, count: count || 0 };
      }),
    );

    const countMap = memberCounts.reduce((acc: Record<string, number>, curr) => {
      acc[curr.bloc_id] = curr.count;
      return acc;
    }, {});

    setBlocs(mapped.map((b) => ({ ...b, memberCount: countMap[b.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => {
    fetchMyBlocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleCreate = async () => {
    setError(null);
    if (isEmergency) {
      setError("Bloc creation is disabled during emergency access.");
      return;
    }
    if (!userId) {
      setError("User id is missing.");
      return;
    }
    if (!committeeId) {
      setError("Committee assignment is missing.");
      return;
    }
    if (!createName.trim()) {
      setError("Bloc name is required.");
      return;
    }

    // Generate a unique invite code; retry a few times to avoid collisions.
    const maxAttempts = 6;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const invite = generateInviteCode();
      const { data: existing } = await supabase.from("blocs").select("id").eq("invite_code", invite).maybeSingle();
      if (existing) continue;

      const { data: created, error: cErr } = await supabase
        .from("blocs")
        .insert({
          name: createName.trim(),
          description: createDescription.trim() || null,
          committee_id: committeeId,
          creator_id: userId,
          invite_code: invite,
        })
        .select("id, invite_code")
        .single();

      if (cErr) {
        setError(cErr.message);
        return;
      }

      const { error: mErr } = await supabase.from("bloc_members").insert({
        bloc_id: created.id,
        user_id: userId,
        individual_contribution: null,
      });

      if (mErr) {
        setError(mErr.message);
        return;
      }

      setCreateInviteCode(invite);
      setCreateOpen(false);
      setCreateName("");
      setCreateDescription("");
      await fetchMyBlocs();
      return;
    }

    setError("Unable to generate a unique invite code. Try again.");
  };

  const handleJoin = async () => {
    setError(null);
    if (isEmergency) {
      setError("Bloc joining is disabled during emergency access.");
      return;
    }
    if (!userId) {
      setError("User id is missing.");
      return;
    }
    if (!joinCode.trim()) {
      setError("Invite code is required.");
      return;
    }

    const code = joinCode.trim().toUpperCase();
    const { data: blocRow, error: bErr } = await supabase
      .from("blocs")
      .select("id")
      .eq("invite_code", code)
      .maybeSingle();

    if (bErr) {
      setError(bErr.message);
      return;
    }
    if (!blocRow?.id) {
      setError("Invalid invite code.");
      return;
    }

    const { error: mErr } = await supabase.from("bloc_members").insert({
      bloc_id: blocRow.id,
      user_id: userId,
      individual_contribution: null,
    });

    if (mErr) {
      setError(mErr.message);
      return;
    }

    setJoinOpen(false);
    setJoinCode("");
    await fetchMyBlocs();
  };

  return (
    <Card className="w-full">
      <div className="flex items-start justify-between gap-6 mb-4">
        <div>
          <SectionLabel className="mb-0">Blocs</SectionLabel>
          <p className="text-sm text-text-dimmed mt-2">
            Create or join working blocs tied to your committee. Collaboration stays inside the bloc workspace.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)} disabled={isEmergency}>
            Create
          </Button>
          <Button variant="default" size="sm" onClick={() => setJoinOpen(true)} disabled={isEmergency}>
            Join
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 p-3 border border-border-subtle rounded-card text-sm text-text-secondary">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 text-center text-text-dimmed">Loading…</div>
      ) : blocs.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-text-dimmed mb-2">You are not a member of any blocs yet.</p>
          <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)} disabled={isEmergency}>
            Join with an invite code
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blocs.map((b) => (
            <div key={b.id} className="p-4 border border-border-subtle rounded-card bg-bg-raised">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-jotia text-lg text-text-primary truncate">{b.name}</div>
                  <div className="text-sm text-text-secondary mt-1 line-clamp-2">{b.description || "No description."}</div>
                </div>
                <Badge variant="default">{b.memberCount || 0} members</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-text-dimmed">
                  Joined: {b.joinedAt ? new Date(b.joinedAt).toLocaleDateString() : "—"}
                </div>
                <div className="text-xs text-text-tertiary">
                  Committee: {b.committee_id ? String(b.committee_id).slice(0, 8) : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <SectionLabel className="mb-0">Create a Bloc</SectionLabel>
        <div className="space-y-4 mt-6">
          <div>
            <div className="text-sm text-text-dimmed mb-2">Bloc name</div>
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g., Alliance Bloc" />
          </div>
          <div>
            <div className="text-sm text-text-dimmed mb-2">Optional description</div>
            <Textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="What directives or working topics will this bloc focus on?" />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleCreate} disabled={!committeeId || !userId}>
              Create
            </Button>
          </div>
        </div>

        {createInviteCode ? (
          <div className="mt-6 p-4 border border-border-subtle rounded-card bg-bg-raised text-sm text-text-secondary">
            Invite code: <span className="text-text-primary font-semibold">{createInviteCode}</span>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={joinOpen} onClose={() => setJoinOpen(false)}>
        <SectionLabel className="mb-0">Join a Bloc</SectionLabel>
        <div className="space-y-4 mt-6">
          <div>
            <div className="text-sm text-text-dimmed mb-2">Invite code</div>
            <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="6-character code" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setJoinOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleJoin}>
              Join
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
