'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Button } from '@/components/ui';
import { 
  AlertTriangle, 
  Search, 
  ChevronRight, 
  Clock, 
  User, 
  Loader2,
  X,
  MapPin,
  Stethoscope,
  Flame,
  Monitor,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { displayRole, formatLabel } from '@/lib/roles';

export default function EBReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchReports = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      let query = supabase
        .from('issue_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'ALL') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (e) {
      console.error(e);
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('issue_reports')
      .update({ status })
      .eq('id', id);

    if (!error) {
      fetchReports();
      if (selectedReport?.id === id) {
        setSelectedReport({ ...selectedReport, status });
      }
    }
  };

  const filteredReports = reports.filter(r => 
    r.report_id.toLowerCase().includes(search.toLowerCase()) ||
    r.user_details.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  if (fetchError) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load reports.</p><button onClick={() => fetchReports()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-jotia text-2xl uppercase tracking-tight text-text-primary">Reports Panel</h1>
          <p className="text-xs text-text-dimmed mt-1">Manage portal bugs, in-person incidents, and medical emergencies.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 pr-4 bg-bg-raised border border-border-subtle rounded-button text-sm text-text-primary focus:border-border-emphasized outline-none w-64"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 bg-bg-raised border border-border-subtle rounded-button text-sm text-text-primary focus:border-border-emphasized outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
          </div>
        ) : filteredReports.length === 0 ? (
          <Card className="py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-20" />
            <p className="text-text-dimmed">No reports found matching your criteria.</p>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="flex items-center gap-4 p-4 rounded-card border border-border-subtle bg-bg-card hover:bg-bg-raised hover:border-border-emphasized transition-all cursor-pointer group"
            >
              <div className={`p-3 rounded-lg ${
                report.category === 'MEDICAL' ? 'bg-status-rejected-bg/10 text-status-rejected-text border border-status-rejected-border/20' :
                report.category === 'PORTAL' ? 'bg-text-primary/5 text-text-primary border border-border-subtle' :
                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
              }`}>
                {report.category === 'MEDICAL' ? <Flame className="w-5 h-5" /> :
                 report.category === 'PORTAL' ? <Monitor className="w-5 h-5" /> :
                 <Users className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary font-mono">{report.report_id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    report.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    report.status === 'REVIEWED' ? 'bg-text-primary/10 text-text-primary border-border-emphasized' :
                    'bg-status-approved-bg/10 text-status-approved-text border-status-approved-border/20'
                  }`}>
                    {formatLabel(report.status)}
                  </span>
                </div>
                <h4 className="font-bold text-text-primary truncate">{report.issue_type}</h4>
                <p className="text-xs text-text-dimmed truncate mt-0.5">{report.description}</p>
              </div>
              <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <User className="w-3 h-3" />
                  {report.user_details.full_name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  {new Date(report.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(report.created_at).toLocaleDateString()}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[110] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-bg-base/60 backdrop-blur-sm"
              onClick={() => setSelectedReport(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-bg-card border-l border-border-emphasized shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 z-10 border-b border-border-subtle bg-bg-raised/80 backdrop-blur-md p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-black uppercase tracking-widest text-text-tertiary font-mono">{selectedReport.report_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      selectedReport.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      selectedReport.status === 'REVIEWED' ? 'bg-text-primary/10 text-text-primary border-border-emphasized' :
                      'bg-status-approved-bg/10 text-status-approved-text border-status-approved-border/20'
                    }`}>
                      {formatLabel(selectedReport.status)}
                    </span>
                  </div>
                  <h2 className="font-jotia text-2xl uppercase tracking-tight text-text-primary">{selectedReport.issue_type}</h2>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 text-text-dimmed hover:text-text-primary transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Description */}
                <section>
                  <SectionLabel className="mb-4">Description</SectionLabel>
                  <div className="p-6 rounded-card bg-bg-raised border border-border-subtle text-text-primary whitespace-pre-wrap leading-relaxed">
                    {selectedReport.description}
                  </div>
                </section>

                {/* Specific Metadata */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReport.category === 'PORTAL' && (
                    <div className="p-4 rounded-card border border-border-subtle bg-bg-raised flex items-center gap-3">
                      <div className="p-2 rounded bg-text-primary/5 text-text-primary"><Stethoscope className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Engineer Requested</p>
                        <p className="text-sm font-bold text-text-primary">{selectedReport.metadata.request_engineer ? 'YES' : 'No'}</p>
                      </div>
                    </div>
                  )}
                  {selectedReport.metadata.location && (
                    <div className="p-4 rounded-card border border-border-subtle bg-bg-raised flex items-center gap-3">
                      <div className="p-2 rounded bg-text-primary/5 text-text-primary"><MapPin className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Location</p>
                        <p className="text-sm font-bold text-text-primary">{selectedReport.metadata.location}</p>
                      </div>
                    </div>
                  )}
                  {selectedReport.metadata.time && (
                    <div className="p-4 rounded-card border border-border-subtle bg-bg-raised flex items-center gap-3">
                      <div className="p-2 rounded bg-text-primary/5 text-text-primary"><Clock className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Time Reported</p>
                        <p className="text-sm font-bold text-text-primary">{selectedReport.metadata.time}</p>
                      </div>
                    </div>
                  )}
                  {selectedReport.category === 'MEDICAL' && (
                    <div className="p-4 rounded-card border border-status-rejected-border/30 bg-status-rejected-bg/5 flex items-center gap-3">
                      <div className="p-2 rounded bg-status-rejected-bg/10 text-status-rejected-text"><Flame className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-status-rejected-text">Urgency</p>
                        <p className="text-sm font-bold text-status-rejected-text">{selectedReport.metadata.immediate_assistance ? 'IMMEDIATE ASSISTANCE NEEDED' : 'Medical Attention Required'}</p>
                      </div>
                    </div>
                  )}
                </section>

                {/* User Details */}
                <section>
                  <SectionLabel className="mb-4">Reporter Details</SectionLabel>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 p-6 rounded-card border border-border-subtle bg-bg-raised">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Full Name</p>
                      <p className="text-sm font-bold text-text-primary">{selectedReport.user_details.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Email</p>
                      <p className="text-sm font-bold text-text-primary">{selectedReport.user_details.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Role & Grade</p>
                      <p className="text-sm font-bold text-text-primary">{displayRole(selectedReport.user_details.role)} &middot; Grade {selectedReport.user_details.grade}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Committee</p>
                      <p className="text-sm font-bold text-text-primary">{selectedReport.user_details.committee}</p>
                    </div>
                  </div>
                </section>

                {/* Additional Info */}
                {(selectedReport.metadata.witnesses || selectedReport.metadata.person_responsible || selectedReport.metadata.patient_name) && (
                  <section>
                    <SectionLabel className="mb-4">Additional Information</SectionLabel>
                    <div className="space-y-4">
                      {selectedReport.metadata.patient_name && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Patient Name</p>
                          <p className="text-sm font-medium text-text-primary">{selectedReport.metadata.patient_name}</p>
                        </div>
                      )}
                      {selectedReport.metadata.person_responsible && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Person Responsible</p>
                          <p className="text-sm font-medium text-text-primary">{selectedReport.metadata.person_responsible}</p>
                        </div>
                      )}
                      {selectedReport.metadata.witnesses && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Witnesses</p>
                          <p className="text-sm font-medium text-text-primary">{selectedReport.metadata.witnesses}</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Actions */}
                <section className="pt-8 border-t border-border-subtle flex gap-3">
                  {selectedReport.status === 'PENDING' && (
                    <Button 
                      onClick={() => updateStatus(selectedReport.id, 'REVIEWED')}
                      className="flex-1"
                    >
                      Mark as Reviewed
                    </Button>
                  )}
                  {selectedReport.status !== 'RESOLVED' && (
                    <Button 
                      onClick={() => updateStatus(selectedReport.id, 'RESOLVED')}
                      variant="outline"
                      className="flex-1 border-status-approved-border text-status-approved-text hover:bg-status-approved-bg/10"
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
