'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, AlertTriangle, Monitor, Users, Flame, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { Input, Textarea } from './ui';

type Category = 'PORTAL' | 'IN_PERSON' | 'MEDICAL';

interface ReportIssueModalProps {
  user: any;
  committeeName?: string;
}

export function ReportIssueModal({ user, committeeName }: ReportIssueModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [requestEngineer, setRequestEngineer] = useState(false);
  const [personResponsible, setPersonResponsible] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [patientName, setPatientName] = useState('');
  const [immediateAssistance, setImmediateAssistance] = useState(false);

  const resetForm = () => {
    setStep(1);
    setCategory(null);
    setIssueType('');
    setDescription('');
    setRequestEngineer(false);
    setPersonResponsible('');
    setLocation('');
    setTime('');
    setWitnesses('');
    setPatientName('');
    setImmediateAssistance(false);
    setSuccess(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const reportData = {
      category,
      issue_type: issueType,
      description,
      user_id: user.id,
      user_details: {
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        committee: committeeName || 'None'
      },
      metadata: {
        request_engineer: category === 'PORTAL' ? requestEngineer : undefined,
        person_responsible: category === 'IN_PERSON' ? personResponsible : undefined,
        location: (category === 'IN_PERSON' || category === 'MEDICAL') ? location : undefined,
        time: category === 'IN_PERSON' ? time : undefined,
        witnesses: category === 'IN_PERSON' ? witnesses : undefined,
        patient_name: category === 'MEDICAL' ? patientName : undefined,
        immediate_assistance: category === 'MEDICAL' ? immediateAssistance : undefined,
      }
    };

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit report');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { id: 'PORTAL', label: 'Portal (Digital Issue)', icon: Monitor, desc: 'Website bugs, broken features, or technical problems.' },
    { id: 'IN_PERSON', label: 'In-Person Issue', icon: Users, desc: 'Misconduct, violations, or incidents during the conference.' },
    { id: 'MEDICAL', label: 'Medical Emergency', icon: Flame, desc: 'Injuries, illness, or urgent health concerns.' },
  ];

  const portalIssueTypes = ['Website Bug', 'Portal Not Working', 'Feature Broken', 'Other'];
  const inPersonIssueTypes = ['Misconduct', 'Violation of Terms', 'Illegal Activity', 'Other'];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 h-10 text-[10px] font-black uppercase tracking-widest text-text-primary bg-bg-raised border border-border-emphasized rounded-button hover:bg-bg-hover transition-all"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
        Report an Issue
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-card border border-border-emphasized bg-bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-subtle bg-bg-raised p-6">
                <div>
                  <h2 className="font-jotia text-xl uppercase tracking-tight text-text-primary">
                    {success ? 'Report Submitted' : 'Report an Issue'}
                  </h2>
                  {!success && <p className="text-xs text-text-dimmed mt-1">Help us maintain a safe and functional conference.</p>}
                </div>
                <button onClick={handleClose} className="p-2 text-text-dimmed hover:text-text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {success ? (
                  <div className="py-12 text-center">
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-status-approved-bg/10 rounded-full flex items-center justify-center border border-status-approved-border/30">
                        <CheckCircle2 className="w-8 h-8 text-status-approved-text" />
                      </div>
                    </div>
                    <h3 className="font-jotia text-2xl uppercase tracking-tight text-text-primary mb-2">Success</h3>
                    <p className="text-text-dimmed mb-8 max-w-sm mx-auto">Your report has been received. The relevant team has been notified and will take action immediately.</p>
                    <Button onClick={handleClose} className="min-w-[200px]">Close</Button>
                  </div>
                ) : step === 1 ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Where is the issue?</p>
                    <div className="grid grid-cols-1 gap-3">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setCategory(cat.id as Category); setStep(2); }}
                          className="flex items-start gap-4 p-4 rounded-card border border-border-subtle bg-bg-raised hover:border-border-emphasized hover:bg-bg-hover transition-all text-left group"
                        >
                          <div className={`p-3 rounded-lg ${cat.id === 'MEDICAL' ? 'bg-status-rejected-bg/10 text-status-rejected-text' : 'bg-text-primary/5 text-text-primary'}`}>
                            <cat.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-text-primary group-hover:translate-x-1 transition-transform">{cat.label}</h4>
                            <p className="text-xs text-text-dimmed mt-1 leading-relaxed">{cat.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-4">
                      <button type="button" onClick={() => setStep(1)} className="hover:text-text-primary transition-colors">Categories</button>
                      <span>/</span>
                      <span className="text-text-primary">{category?.replace('_', ' ')}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Common Auto-Fields */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Full Name</label>
                        <div className="h-10 px-3 flex items-center bg-bg-raised border border-border-subtle rounded-input text-sm text-text-disabled">{user.full_name}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Role</label>
                        <div className="h-10 px-3 flex items-center bg-bg-raised border border-border-subtle rounded-input text-sm text-text-disabled">{user.role}</div>
                      </div>
                    </div>

                    {category === 'PORTAL' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Issue Type</label>
                          <select
                            required
                            value={issueType}
                            onChange={(e) => setIssueType(e.target.value)}
                            className="w-full h-10 px-3 bg-bg-raised border border-border-subtle rounded-input text-sm text-text-primary focus:border-border-emphasized outline-none"
                          >
                            <option value="">Select issue type...</option>
                            {portalIssueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">What went wrong?</label>
                          <Textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please describe the bug or problem in detail..."
                            className="min-h-[120px]"
                          />
                        </div>
                        <label className="flex items-center gap-3 p-4 rounded-card border border-border-subtle bg-bg-raised cursor-pointer hover:bg-bg-hover transition-all">
                          <input
                            type="checkbox"
                            checked={requestEngineer}
                            onChange={(e) => setRequestEngineer(e.target.checked)}
                            className="w-4 h-4 rounded border-border-subtle text-text-primary focus:ring-offset-bg-card"
                          />
                          <span className="text-sm font-medium text-text-primary">Would you like a Web Engineer to assist you in person?</span>
                        </label>
                      </div>
                    )}

                    {category === 'IN_PERSON' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Incident Type</label>
                          <select
                            required
                            value={issueType}
                            onChange={(e) => setIssueType(e.target.value)}
                            className="w-full h-10 px-3 bg-bg-raised border border-border-subtle rounded-input text-sm text-text-primary focus:border-border-emphasized outline-none"
                          >
                            <option value="">Select incident type...</option>
                            {inPersonIssueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Person Responsible</label>
                            <Input required value={personResponsible} onChange={(e) => setPersonResponsible(e.target.value)} placeholder="Full name or description" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Location</label>
                            <Input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room, Hall, etc." />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Time</label>
                            <Input required type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">Witnesses (Optional)</label>
                            <Input value={witnesses} onChange={(e) => setWitnesses(e.target.value)} placeholder="Names of witnesses" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-dimmed">What happened?</label>
                          <Textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please provide a clear account of the incident..."
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>
                    )}

                    {category === 'MEDICAL' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-status-rejected-text">Patient Name</label>
                          <Input required value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Name of person needing help" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-status-rejected-text">Exact Location</label>
                          <Input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where are you right now?" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-status-rejected-text">Description of Emergency</label>
                          <Textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Symptoms, nature of injury, etc..."
                            className="min-h-[100px]"
                          />
                        </div>
                        <label className="flex items-center gap-3 p-4 rounded-card border border-status-rejected-border/30 bg-status-rejected-bg/5 cursor-pointer hover:bg-status-rejected-bg/10 transition-all">
                          <input
                            type="checkbox"
                            checked={immediateAssistance}
                            onChange={(e) => setImmediateAssistance(e.target.checked)}
                            className="w-4 h-4 rounded border-status-rejected-border text-status-rejected-text focus:ring-offset-bg-card"
                          />
                          <span className="text-sm font-bold text-status-rejected-text uppercase tracking-widest">Medical assistance needed immediately!</span>
                        </label>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-border-subtle">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={submitting}>Back</Button>
                      <Button type="submit" className={`flex-1 ${category === 'MEDICAL' ? 'bg-status-rejected-bg text-status-rejected-text border-status-rejected-border hover:bg-status-rejected-bg/80' : ''}`} disabled={submitting}>
                        {submitting ? (
                          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span>
                        ) : 'Submit Report'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
