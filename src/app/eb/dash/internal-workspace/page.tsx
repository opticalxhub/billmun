"use client";

import { useEffect, useState } from "react";
import { Card, Input, SectionLabel, Textarea } from "@/components/ui";
import { Button } from "@/components/button";
import { supabase } from "@/lib/supabase";

export default function InternalWorkspacePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fetchError, setFetchError] = useState(false);

  const load = async () => {
    try {
      const { data, error } = await supabase.from("eb_tasks").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      setTasks(data || []);
      setFetchError(false);
    } catch { setFetchError(true); }
  };

  useEffect(() => {
    load();
  }, []);

  const createTask = async () => {
    if (!title.trim()) return;
    await supabase.from("eb_tasks").insert({
      title: title.trim(),
      description: description.trim() || null,
      status: "TODO",
      priority: "MEDIUM",
    });
    setTitle("");
    setDescription("");
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("eb_tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  if (fetchError) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load tasks.</p><button onClick={() => load()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;

  return (
    <div className="space-y-4">
      <div>
        <SectionLabel>Internal Workspace</SectionLabel>
        <h1 className="font-jotia text-3xl uppercase tracking-tight">EB Task Manager</h1>
      </div>
      <Card>
        <div className="space-y-3">
          <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea rows={3} placeholder="Task details" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={createTask}>Create Task</Button>
        </div>
      </Card>
      <Card>
        <SectionLabel>Tasks</SectionLabel>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="p-3 border border-border-subtle rounded-card bg-bg-raised">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{task.title}</p>
                <select className="h-9 rounded-input border border-border-input bg-bg-card px-2 text-xs" value={task.status} onChange={(e) => updateStatus(task.id, e.target.value)}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <p className="text-xs text-text-dimmed">{task.description || ""}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
