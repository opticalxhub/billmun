"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/button";
import { displayRole } from "@/lib/roles";
import { X, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingModalProps {
  role: string;
  full_name: string;
  committee?: string;
  onComplete: () => void;
}

const roleHighlights: Record<string, string[]> = {
  DELEGATE: [
    "Documents - manage your position papers and revisions",
    "AI Feedback - get instant writing analysis and scoring",
    "Blocs - form and coordinate with allies in real time",
  ],
  CHAIR: [
    "Session Controls - change status and manage caucuses",
    "Speakers List - queue speakers and track time",
    "Delegate Review - approve/reject documents and monitor delegates",
  ],
  MEDIA: [
    "Upload - post photos/videos to the media workspace",
    "Press Releases - draft and submit release copy",
    "Gallery - track approved media assets",
  ],
  EXECUTIVE_BOARD: [
    "Registrations - approve and manage delegates",
    "Committees - monitor every committee live",
    "EB Dashboard - control conference-wide settings",
  ],
};

export default function OnboardingModal({ role, full_name, committee, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);

  const roleUpper = role?.toUpperCase?.();
  const highlights = roleHighlights[roleUpper] || ["Explore your dashboard", "Check messages", "Use this guide"]; 

  const stepContent = useMemo(() => {
    if (step === 1) {
      return {
        title: `Welcome, ${full_name}`,
        description: `You are logged in as ${displayRole(role)}. Let's get you set up.`,
      };
    }
    if (step === 2) {
      return {
        title: "Committee assignment",
        description: committee
          ? `You are assigned to ${committee}. All data on your delegate dashboard is scoped to this committee.`
          : "Your committee assignment will appear on your dashboard once synchronized.",
      };
    }
    if (step === 3) {
      return {
        title: "Key features for your role",
        description: "These are the priority tools you’ll use frequently.",
      };
    }
    return {
      title: "You’re all set",
      description: "Close this guide and start using BILLMUN with confidence.",
    };
  }, [step, committee, full_name, roleUpper]);

  const next = () => {
    if (step < 4) setStep(step + 1);
    else onComplete();
  };

  const prev = () => setStep(Math.max(step - 1, 1));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="w-full max-w-2xl rounded-2xl bg-bg-card border border-border-subtle p-8 shadow-modal"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-widest">Onboarding</p>
              <h2 className="text-3xl font-jotia text-text-primary mt-1">{stepContent.title}</h2>
            </div>
            <button
              onClick={onComplete}
              className="text-text-secondary hover:text-text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close onboarding"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-text-secondary leading-relaxed mb-6">{stepContent.description}</p>

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {highlights.map((item) => (
                <div key={item} className="rounded-lg bg-bg-raised p-4 border border-border-input">
                  <p className="text-sm text-text-primary font-semibold">{item}</p>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="bg-bg-raised border border-border-input rounded-lg p-4 mb-6">
              <p className="text-sm text-text-secondary">
                You can always access the help section from the footer and dashboard navigation for quick links.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-text-tertiary">Step {step} of 4</span>
            </div>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" size="sm" onClick={prev} className="text-text-primary">
                  Back
                </Button>
              )}
              <Button onClick={next}>{step === 4 ? "Get Started" : "Next"}</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
