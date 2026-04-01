"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Input, SectionLabel, Textarea } from "@/components/ui";
import { Button } from "@/components/button";
import { DashboardAnimatedTabPanel, DashboardTabBar, DashboardLoadingState } from "@/components/dashboard-shell";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Mail, Bell, Filter, Send } from "lucide-react";

type TabName = "Announcements" | "Mass Email" | "In-Portal Notifications";
const TABS: TabName[] = ["Announcements", "Mass Email", "In-Portal Notifications"];

const ROLES = ["DELEGATE", "CHAIR", "ADMIN", "MEDIA", "SECURITY", "EXECUTIVE_BOARD"];

export default function CommunicationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabName>("Announcements");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [sentEmails, setSentEmails] = useState<any[]>([]);

  // Announcement Form
  const [annId, setAnnId] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annTargetRoles, setAnnTargetRoles] = useState<string[]>([]);
  const [annCommittee, setAnnCommittee] = useState("ALL");
  const [annPinned, setAnnPinned] = useState(false);
  const [annSchedule, setAnnSchedule] = useState(false);
  const [annScheduleDate, setAnnScheduleDate] = useState("");

  // Email & Notification Form
  const [filters, setFilters] = useState({ roles: [] as string[], status: "ALL", committee_id: "ALL" });
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [matchedCount, setMatchedCount] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    setCurrentUser(userData.user?.id || null);

    const [{ data: anns }, { data: comms }, { data: emails }] = await Promise.all([
      supabase.from("announcements").select("*, author:author_id(full_name), user_announcement_dismissals(count)").order("created_at", { ascending: false }),
      supabase.from("committees").select("id, name"),
      supabase.from("mass_emails").select("*, sender:sent_by(full_name)").order("sent_at", { ascending: false }).then(res => res.error ? { data: [] } : res)
    ]);

    setAnnouncements(anns || []);
    setCommittees(comms || []);
    setSentEmails(emails || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Recalculate matched users when filters change — uses server-side endpoint to bypass RLS
  useEffect(() => {
    const calcMatches = async () => {
      try {
        const res = await fetch("/api/eb/matched-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roles: filters.roles,
            status: filters.status,
            committee_id: filters.committee_id,
          }),
        });
        if (!res.ok) {
          console.error("Error calculating matches:", await res.text());
          setMatchedCount(0);
          return;
        }
        const data = await res.json();
        setMatchedCount(data.count ?? 0);
      } catch (err) {
        console.error("Unexpected error calculating matches:", err);
        setMatchedCount(0);
      }
    };
    calcMatches();
  }, [filters]);

  const resetAnnForm = () => {
    setAnnId(""); setAnnTitle(""); setAnnBody(""); setAnnTargetRoles([]);
    setAnnCommittee("ALL"); setAnnPinned(false); setAnnSchedule(false); setAnnScheduleDate("");
  };

  const saveAnn = async () => {
    if (!annTitle || !annBody) return;
    setSubmitting(true);
    const payload = {
      action: annId ? "update" : "create",
      id: annId || undefined,
      title: annTitle,
      body: annBody,
      is_pinned: annPinned,
      target_roles: annTargetRoles,
      committee_id: annCommittee,
      scheduled_for: annSchedule && annScheduleDate ? new Date(annScheduleDate).toISOString() : null,
      ebUserId: currentUser
    };
    const res = await fetch("/api/eb/announcements/action", { method: "POST", body: JSON.stringify(payload) });
    setSubmitting(false);
    if (res.ok) { resetAnnForm(); queryClient.invalidateQueries({ queryKey: ['communications-dashboard'] }); }
    else { alert("Failed to save"); }
  };

  const sendMassEmail = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/eb/mass-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: emailSubject, bodyText: emailBody, filters })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success! Sent email to ${data.sentCount || matchedCount} recipients.`);
        setEmailSubject("");
        setEmailBody("");
        loadData();
      } else {
        alert(data.error || "Failed to send email");
      }
    } catch {
      alert("Error sending mass email.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendTestEmail = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/eb/mass-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: emailSubject, bodyText: emailBody, filters, testEmail: true })
      });
      const data = await res.json();
      if (res.ok) alert("Test email sent to your inbox!");
      else alert(data.error || "Failed to send test email");
    } catch {
      alert("Error sending test email.");
    } finally {
      setSendingTest(false);
    }
  };

  const emailPreviewHtml = (() => {
    if (!emailSubject && !emailBody) return "";
    const sanitize = (t: string) => t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const bodyHtml = sanitize(emailBody || "").split(/\n\n+/).map(p => `<p style="margin:0 0 16px 0;line-height:1.7;color:#fff;font-size:15px;">${p.split("\n").join("<br/>")}</p>`).join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;"><tr><td align="center" style="padding:40px 20px;"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;"><tr><td align="center" style="padding:0 0 24px 0;"><img src="/billmun.png" alt="BILLMUN" width="120" style="display:block;max-width:120px;filter:invert(1);"/></td></tr><tr><td style="padding:0 0 32px 0;"><div style="height:1px;background:#222;"></div></td></tr><tr><td style="padding:0 0 24px 0;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:0.02em;">${sanitize(emailSubject || "Subject")}</h1></td></tr><tr><td style="padding:0 0 32px 0;"><p style="margin:0 0 16px 0;line-height:1.7;color:#fff;font-size:15px;">Dear [Recipient Name],</p>${bodyHtml}</td></tr><tr><td style="padding:0 0 24px 0;"><div style="height:1px;background:#222;"></div></td></tr><tr><td style="padding:0;"><p style="margin:0 0 8px 0;font-size:12px;color:#666;text-align:center;">© 2026 BILLMUN. All rights reserved.</p><p style="margin:0 0 8px 0;font-size:12px;color:#666;text-align:center;"><a href="https://instagram.com/billmun.sa" style="color:#999;text-decoration:underline;">Instagram</a> · <a href="https://billmun.sa" style="color:#999;text-decoration:underline;">billmun.sa</a></p><p style="margin:0;font-size:11px;color:#666;text-align:center;line-height:1.5;">This email was sent because you registered for BILLMUN.<br/>Contact <a href="mailto:pr@billmun.gomarai.com" style="color:#999;">pr@billmun.gomarai.com</a> if this was a mistake.</p></td></tr></table></td></tr></table></body></html>`;
  })();

  const sendNotification = async () => {
    if (!confirm(`Send portal notification to ${matchedCount} users?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/eb/mass-notification", { method: "POST", body: JSON.stringify({ title: notifTitle, message: notifMessage, filters, ebUserId: currentUser }) });
      setSubmitting(false);
      if (res.ok) { 
        alert("Notifications sent!"); 
        setNotifTitle(""); 
        setNotifMessage(""); 
        queryClient.invalidateQueries({ queryKey: ['communications-dashboard'] });
      } else { 
        alert("Failed to send"); 
      }
    } catch (err) {
      setSubmitting(false);
      console.error("Error sending notification:", err);
      alert("Error sending notification.");
    }
  };

  const toggleRoleFilter = (r: string) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(r) ? prev.roles.filter(x => x !== r) : [...prev.roles, r]
    }));
  };

  const FilterPanel = () => (
    <Card className="mb-8 border-border-emphasized/30 bg-bg-raised/30">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="font-jotia text-xl text-text-primary">Target Audience ({matchedCount !== null ? `${matchedCount} users match` : "Calculating..."})</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-3">
          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Roles (Empty = All)</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map(r => (
              <button 
                key={r} 
                onClick={() => toggleRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                  filters.roles.includes(r) 
                    ? 'bg-status-approved-bg text-status-approved-text border-status-approved-border shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                    : 'bg-bg-card text-text-dimmed border-border-subtle hover:border-border-strong'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Committee</p>
          <select 
            className="w-full h-10 rounded-input border border-border-input bg-bg-card px-3 text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none"
            value={filters.committee_id}
            onChange={e => setFilters({...filters, committee_id: e.target.value})}
          >
            <option value="ALL">All Committees</option>
            {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Status</p>
          <select 
            className="w-full h-10 rounded-input border border-border-input bg-bg-card px-3 text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
        </div>
      </div>
    </Card>
  );

  if (loading && announcements.length === 0) return <DashboardLoadingState type="overview" />;

  return (
    <div className="space-y-6 font-inter h-full">
      <div>
        <h1 className="font-jotia-bold text-3xl uppercase tracking-tight">Communications</h1>
        <p className="text-text-dimmed text-sm">Manage global announcements, mass emails, and portal notifications.</p>
      </div>

      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={(t) => setActiveTab(t as TabName)} />

      <DashboardAnimatedTabPanel activeKey={activeTab}>
        {activeTab === "Announcements" && (
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <SectionLabel className="mb-0">Broadcast Announcement</SectionLabel>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Title</label>
                  <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Urgent: Room Change..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Content</label>
                  <Textarea value={annBody} onChange={e => setAnnBody(e.target.value)} placeholder="All delegates must report to..." rows={6} />
                </div>
                <Button 
                  onClick={() => void saveAnn()} 
                  disabled={submitting || !annTitle || !annBody} 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <div className="flex items-center gap-2"><Send className="w-4 h-4" /> <span>Broadcast to {matchedCount} Users</span></div>}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "Mass Email" && (
          <div className="max-w-6xl mx-auto">
            <FilterPanel />

            {/* Compose + Preview Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compose Side */}
              <Card className="border-primary/20">
                <div className="flex items-center gap-2 mb-6">
                  <Mail className="w-5 h-5 text-primary" />
                  <SectionLabel className="mb-0">Compose Email</SectionLabel>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Subject</label>
                    <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Important Information..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Body (plain text — auto-wrapped in branded template)</label>
                    <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Write your email content here. Each recipient will be greeted personally with 'Dear [Name]'." rows={12} />
                    <p className="text-[10px] text-text-dimmed">{emailBody.length} characters</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => void sendTestEmail()} 
                      disabled={sendingTest || !emailSubject || !emailBody}
                      className="flex-1 h-12"
                    >
                      {sendingTest ? <LoadingSpinner size="sm" /> : "Send Test to My Inbox"}
                    </Button>
                    <Button 
                      onClick={() => setShowConfirm(true)} 
                      disabled={submitting || !emailSubject || !emailBody || matchedCount === 0} 
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest"
                    >
                      {submitting ? <LoadingSpinner size="sm" /> : <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> <span>Send to {matchedCount}</span></div>}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Preview Side */}
              <Card>
                <SectionLabel>Live Preview</SectionLabel>
                <div className="border border-border-subtle rounded-card overflow-hidden bg-[#0a0a0a]" style={{ minHeight: 400 }}>
                  {emailPreviewHtml ? (
                    <iframe
                      srcDoc={emailPreviewHtml}
                      className="w-full border-0"
                      style={{ height: 500 }}
                      title="Email Preview"
                      sandbox=""
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-text-dimmed text-sm">
                      Start typing to see preview
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Send Confirmation Modal */}
            {showConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
                <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="font-jotia text-xl text-text-primary mb-4">Confirm Send</h3>
                  <div className="space-y-3 text-sm text-text-secondary mb-6">
                    <p><strong className="text-text-primary">Recipients:</strong> {matchedCount} users</p>
                    <p><strong className="text-text-primary">Subject:</strong> {emailSubject}</p>
                    <p><strong className="text-text-primary">Preview:</strong> {emailBody.slice(0, 100)}{emailBody.length > 100 ? "..." : ""}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">Cancel</Button>
                    <Button onClick={() => void sendMassEmail()} className="flex-1 bg-primary text-white">Confirm Send</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sent History */}
            <div className="mt-8 space-y-4">
              <SectionLabel>Sent Mass Emails</SectionLabel>
              {sentEmails.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No emails sent yet.</p>}
              {sentEmails.map(e => (
                <div key={e.id} className="p-4 border border-border-subtle rounded-card bg-bg-raised flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{e.subject}</p>
                      <p className="text-[10px] text-text-dimmed uppercase font-bold tracking-widest">Sent by {e.sender?.full_name} &middot; {new Date(e.sent_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="default">{e.recipient_count} Recipients</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "In-Portal Notifications" && (
          <div className="max-w-4xl mx-auto">
            <FilterPanel />
            <Card className="border-primary/20">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <SectionLabel className="mb-0">Send Notification</SectionLabel>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Title</label>
                  <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Action Required" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Message</label>
                  <Textarea rows={4} value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Please check your documents..." />
                </div>
                <Button 
                  onClick={() => void sendNotification()} 
                  disabled={submitting || !notifTitle || !notifMessage || matchedCount === 0} 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <div className="flex items-center gap-2"><Bell className="w-4 h-4" /> <span>Broadcast to {matchedCount} Users</span></div>}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </DashboardAnimatedTabPanel>
    </div>
  );
}
