import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEBContext } from "@/lib/eb-auth";
import {
  runOnUserApproved,
  runOnUserRejected,
  runOnUserSuspended,
  runOnRoleChange,
  runOnCommitteeAssigned,
  runOnCommitteeAssignmentRemoved,
} from "@/lib/automation";

const EDITABLE_FIELDS = [
  "full_name",
  "email",
  "date_of_birth",
  "grade",
  "phone_number",
  "emergency_contact_name",
  "emergency_contact_relation",
  "emergency_contact_phone",
  "dietary_restrictions",
  "preferred_committee",
  "allocated_country",
  "role",
  "status",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function POST(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const body = await req.json();
    const { action, user_id } = body;
    const actorId = context.ebUserId;

    if (!action || !user_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: targetUser, error: uErr } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, full_name, role, status, preferred_committee, allocated_country, date_of_birth, grade, phone_number, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, dietary_restrictions",
      )
      .eq("id", user_id)
      .single();
    if (uErr || !targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const logAudit = async (desc: string, metadata: Record<string, unknown> | null = null) => {
      try {
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: actorId,
          action: desc,
          target_type: "USER",
          target_id: user_id,
          metadata,
        });
      } catch (err) {
        console.error("Audit logging failed:", err);
      }
    };

    if (action === "approve") {
      await supabaseAdmin
        .from("users")
        .update({
          status: "APPROVED",
          approved_at: new Date().toISOString(),
          approved_by_id: actorId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id);
      try {
        await (supabaseAdmin as unknown as { auth: { admin: { updateUserById: (id: string, p: { email_confirm: boolean }) => Promise<unknown> } } }).auth.admin.updateUserById(user_id, {
          email_confirm: true,
        });
      } catch {
        /* ignore */
      }
      await logAudit(`Approved user ${targetUser.email}`);
      await runOnUserApproved(user_id, actorId);
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      const { reason } = body;
      await supabaseAdmin
        .from("users")
        .update({ status: "REJECTED", updated_at: new Date().toISOString() })
        .eq("id", user_id);
      await logAudit(`Rejected user ${targetUser.email}`);
      await runOnUserRejected(user_id, targetUser.email, targetUser.full_name, reason);
      return NextResponse.json({ ok: true });
    }

    if (action === "suspend") {
      const { reason } = body;
      await supabaseAdmin
        .from("users")
        .update({ status: "SUSPENDED", updated_at: new Date().toISOString() })
        .eq("id", user_id);
      await logAudit(`Suspended user ${targetUser.email} for: ${reason}`);
      await runOnUserSuspended(user_id, reason);
      return NextResponse.json({ ok: true });
    }

    if (action === "reinstate") {
      await supabaseAdmin
        .from("users")
        .update({
          status: "APPROVED",
          approved_at: new Date().toISOString(),
          approved_by_id: actorId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id);
      await logAudit(`Reinstated user ${targetUser.email}`);
      await runOnUserApproved(user_id, actorId);
      return NextResponse.json({ ok: true });
    }

    if (action === "change_role") {
      const { role, committee_id, country, seat_number } = body;
      const oldRole = targetUser.role;
      await supabaseAdmin
        .from("users")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", user_id);

      await runOnRoleChange(user_id, oldRole, role, actorId);

      if (["CHAIR", "CO_CHAIR", "ADMIN"].includes(role) && committee_id) {
        const { data: existing } = await supabaseAdmin
          .from("committee_assignments")
          .select("id")
          .eq("user_id", user_id)
          .maybeSingle();
        if (existing) {
          await supabaseAdmin
            .from("committee_assignments")
            .update({
              committee_id,
              country: country || "",
              seat_number: seat_number || "",
            })
            .eq("id", existing.id);
        } else {
          await supabaseAdmin.from("committee_assignments").insert({
            user_id,
            committee_id,
            country: country || "",
            seat_number: seat_number || "",
            assigned_by_id: actorId,
          });
        }
        await runOnCommitteeAssigned(user_id, committee_id, actorId);
      }

      await logAudit(`Changed user ${targetUser.email} role to ${role}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "assign_committee") {
      const { committee_id, country, seat_number } = body;
      const { data: existing } = await supabaseAdmin
        .from("committee_assignments")
        .select("id, committee_id")
        .eq("user_id", user_id)
        .maybeSingle();
      if (existing) {
        if (existing.committee_id && existing.committee_id !== committee_id) {
          await runOnCommitteeAssignmentRemoved(user_id, existing.committee_id as string);
        }
        await supabaseAdmin
          .from("committee_assignments")
          .update({ committee_id, country, seat_number })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("committee_assignments").insert({
          user_id,
          committee_id,
          country,
          seat_number,
          assigned_by_id: actorId,
        });
      }
      await runOnCommitteeAssigned(user_id, committee_id, actorId);
      await logAudit(`Assigned user ${targetUser.email} to committee ${committee_id}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "remove_assignment") {
      const { data: row } = await supabaseAdmin
        .from("committee_assignments")
        .select("committee_id")
        .eq("user_id", user_id)
        .maybeSingle();
      await supabaseAdmin.from("committee_assignments").delete().eq("user_id", user_id);
      if (row?.committee_id) {
        await runOnCommitteeAssignmentRemoved(user_id, row.committee_id as string);
      }
      await logAudit(`Removed committee assignment for user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "add_note") {
      const { content } = body;
      await supabaseAdmin.from("user_notes").insert({ user_id, content, author_id: actorId });
      await logAudit(`Added internal note to user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "revert_user_field") {
      const { history_id } = body;
      if (!history_id) return NextResponse.json({ error: "Missing history_id" }, { status: 400 });

      const { data: hist, error: hErr } = await supabaseAdmin
        .from("user_field_history")
        .select("*")
        .eq("id", history_id)
        .single();
      if (hErr || !hist || hist.user_id !== user_id) {
        return NextResponse.json({ error: "History entry not found" }, { status: 404 });
      }

      const field = hist.field_name as EditableField;
      if (!EDITABLE_FIELDS.includes(field)) {
        return NextResponse.json({ error: "Invalid field in history" }, { status: 400 });
      }

      const { data: before } = await supabaseAdmin
        .from("users")
        .select(field)
        .eq("id", user_id)
        .single();

      const oldVal = before?.[field as keyof typeof before];
      const revertTo = hist.old_value ?? "";

      await supabaseAdmin
        .from("users")
        .update({ [field]: revertTo === "" ? null : revertTo, updated_at: new Date().toISOString() })
        .eq("id", user_id);

      await supabaseAdmin.from("user_field_history").insert({
        user_id,
        field_name: field,
        old_value: oldVal != null ? String(oldVal) : "",
        new_value: revertTo,
        changed_by_id: actorId,
      });

      await logAudit(`Reverted field ${field} for user ${targetUser.email}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "update_user_data") {
      const { updatedData, confirmDatabaseWrite } = body;
      if (!confirmDatabaseWrite) {
        return NextResponse.json(
          { error: "confirmDatabaseWrite must be true to save profile changes" },
          { status: 400 },
        );
      }

      const { data: currentRaw, error: currentErr } = await supabaseAdmin
        .from("users")
        .select(EDITABLE_FIELDS.join(","))
        .eq("id", user_id)
        .single();
      if (currentErr || !currentRaw) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const current = currentRaw as unknown as Record<EditableField, string | null | undefined>;

      const cleanData: Record<string, string | null> = {};
      const oldRole = String(current.role ?? "");

      for (const field of EDITABLE_FIELDS) {
        if (updatedData[field] === undefined) continue;
        const nextVal = updatedData[field];
        const curVal = current[field as keyof typeof current];
        const a = curVal == null ? "" : String(curVal);
        const b = nextVal == null ? "" : String(nextVal);
        if (a !== b) {
          cleanData[field] = nextVal === "" ? null : String(nextVal);
        }
      }

      if (Object.keys(cleanData).length === 0) {
        return NextResponse.json({ ok: true, message: "No changes detected" });
      }

      if (cleanData.role && cleanData.role !== oldRole) {
        await runOnRoleChange(user_id, oldRole, cleanData.role, actorId);
      }

      for (const field of Object.keys(cleanData)) {
        const f = field as EditableField;
        const prev = current[f as keyof typeof current];
        await supabaseAdmin.from("user_field_history").insert({
          user_id,
          field_name: f,
          old_value: prev != null ? String(prev) : "",
          new_value: cleanData[f] != null ? String(cleanData[f]) : "",
          changed_by_id: actorId,
        });
      }

      const prevStatus = String(current.status ?? "");

      const { error: updateErr } = await supabaseAdmin
        .from("users")
        .update({ ...cleanData, updated_at: new Date().toISOString() })
        .eq("id", user_id);

      if (updateErr) throw updateErr;

      if (cleanData.status === "APPROVED" && prevStatus !== "APPROVED") {
        await supabaseAdmin
          .from("users")
          .update({
            approved_at: new Date().toISOString(),
            approved_by_id: actorId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user_id);
        try {
          await (supabaseAdmin as { auth: { admin: { updateUserById: (id: string, p: { email_confirm: boolean }) => Promise<unknown> } } }).auth.admin.updateUserById(user_id, {
            email_confirm: true,
          });
        } catch {
          /* ignore */
        }
        await runOnUserApproved(user_id, actorId);
      }
      if (cleanData.status === "REJECTED" && prevStatus !== "REJECTED") {
        const email = cleanData.email ?? targetUser.email;
        const name = cleanData.full_name ?? targetUser.full_name;
        await runOnUserRejected(user_id, email, name, undefined);
      }
      if (cleanData.status === "SUSPENDED" && prevStatus !== "SUSPENDED") {
        await runOnUserSuspended(user_id, undefined);
      }

      await logAudit(`Updated user ${targetUser.email} data: ${Object.keys(cleanData).join(", ")}`, {
        fields: Object.keys(cleanData),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
