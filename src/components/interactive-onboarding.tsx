'use client';

import React, { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Clock, 
  Star,
  Settings,
  Globe,
  PenTool,
  ClipboardCheck,
  Zap,
  Lock,
  Search
} from 'lucide-react';

interface InteractiveOnboardingProps {
  userRole: string;
  userName: string;
  onComplete: () => void;
  dashboardType: 'delegate' | 'chair' | 'eb';
}

const getOnboardingSteps = (dashboardType: string, userName: string) => {
  const steps: any[] = [
    {
      title: `Welcome to NXTMUN, ${userName}!`,
      description: `Let's take a quick tour of your ${dashboardType.toUpperCase()} dashboard.`,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Star className="w-10 h-10 text-white" />
          </div>
          <p className="text-text-secondary">We've built a powerful, unified workspace to help you excel during the conference. Everything you need is just a tab away.</p>
        </div>
      )
    }
  ];

  if (dashboardType === 'delegate') {
    steps.push(
      {
        title: 'Overview & My Committee',
        description: 'Your home base and committee info.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 shrink-0"><Globe className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="font-bold text-sm">Real-time Status</p>
                <p className="text-xs text-text-dimmed">The live banner shows if your committee is in session or caucus.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-green-500/10 rounded border border-green-500/20 shrink-0"><Users className="w-5 h-5 text-green-400" /></div>
              <div>
                <p className="font-bold text-sm">Committee Roster</p>
                <p className="text-xs text-text-dimmed">View all delegates and access background guides/ROP in the My Committee tab.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Documents & AI Feedback',
        description: 'Manage your papers with AI insights.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20 shrink-0"><FileText className="w-5 h-5 text-purple-400" /></div>
              <div>
                <p className="font-bold text-sm">Document Management</p>
                <p className="text-xs text-text-dimmed">Upload PDFs, track review status, and view feedback from chairs.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/20 shrink-0"><Zap className="w-5 h-5 text-yellow-400" /></div>
              <div>
                <p className="font-bold text-sm">AI Analysis</p>
                <p className="text-xs text-text-dimmed">Get detailed feedback on argument strength and policy alignment using our AI engine.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Speeches & Research',
        description: 'Craft winning speeches and track your stance.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20 shrink-0"><PenTool className="w-5 h-5 text-orange-400" /></div>
              <div>
                <p className="font-bold text-sm">Speech Workspace</p>
                <p className="text-xs text-text-dimmed">Draft multiple speeches with autosave, word counts, and time estimates.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/20 shrink-0"><Search className="w-5 h-5 text-indigo-400" /></div>
              <div>
                <p className="font-bold text-sm">Research & Stances</p>
                <p className="text-xs text-text-dimmed">Keep private notes on your country profile and track positions for every sub-topic.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Resolutions & Blocs',
        description: 'Collaborate with your fellow delegates.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-pink-500/10 rounded border border-pink-500/20 shrink-0"><MessageSquare className="w-5 h-5 text-pink-400" /></div>
              <div>
                <p className="font-bold text-sm">Bloc Workspaces</p>
                <p className="text-xs text-text-dimmed">Join or create blocs to chat and share documents with co-sponsors.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/20 shrink-0"><Check className="w-5 h-5 text-cyan-400" /></div>
              <div>
                <p className="font-bold text-sm">Resolution Builder</p>
                <p className="text-xs text-text-dimmed">Format operative and preambulatory clauses perfectly for official submission.</p>
              </div>
            </div>
          </div>
        )
      }
    );
  } else if (dashboardType === 'chair') {
    steps.push(
      {
        title: 'Overview & Preparation',
        description: 'Session control and chairing notes.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-red-500/10 rounded border border-red-500/20 shrink-0"><Shield className="w-5 h-5 text-red-400" /></div>
              <div>
                <p className="font-bold text-sm">Command Center</p>
                <p className="text-xs text-text-dimmed">Update session status (Formal, Moderated, etc.) and post committee announcements.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 shrink-0"><ClipboardCheck className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="font-bold text-sm">Preparation Board</p>
                <p className="text-xs text-text-dimmed">Manage your checklist and track country positions before and during session.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Debate & Speakers',
        description: 'Run the room with precision.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-green-500/10 rounded border border-green-500/20 shrink-0"><Clock className="w-5 h-5 text-green-400" /></div>
              <div>
                <p className="font-bold text-sm">Timers & Roll Call</p>
                <p className="text-xs text-text-dimmed">Integrated digital roll call with quorum tracking and a powerful countdown system.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20 shrink-0"><Users className="w-5 h-5 text-purple-400" /></div>
              <div>
                <p className="font-bold text-sm">Speakers List</p>
                <p className="text-xs text-text-dimmed">Drag-and-drop queue management with yield tracking and speaking stats.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Debate Tools & AI',
        description: 'Advanced oversight and analysis.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/20 shrink-0"><Zap className="w-5 h-5 text-yellow-400" /></div>
              <div>
                <p className="font-bold text-sm">AI Speech Analysis</p>
                <p className="text-xs text-text-dimmed">Analyze delegate speeches for diplomatic quality and argument strength instantly.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/20 shrink-0"><BarChart3 className="w-5 h-5 text-indigo-400" /></div>
              <div>
                <p className="font-bold text-sm">Participation Analytics</p>
                <p className="text-xs text-text-dimmed">Monitor participation equality and motion frequency with real-time charts.</p>
              </div>
            </div>
          </div>
        )
      }
    );
  } else if (dashboardType === 'eb') {
    steps.push(
      {
        title: 'Users & Committees',
        description: 'High-level conference management.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 shrink-0"><Users className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="font-bold text-sm">Unified Registration</p>
                <p className="text-xs text-text-dimmed">Approve users, manage roles, and audit every system action in one tab.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-green-500/10 rounded border border-green-500/20 shrink-0"><Shield className="w-5 h-5 text-green-400" /></div>
              <div>
                <p className="font-bold text-sm">Committee Oversight</p>
                <p className="text-xs text-text-dimmed">Manage regular and special committees, assign chairs, and monitor live status.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'System & Communications',
        description: 'Control the entire portal experience.',
        content: (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-red-500/10 rounded border border-red-500/20 shrink-0"><Lock className="w-5 h-5 text-red-400" /></div>
              <div>
                <p className="font-bold text-sm">Maintenance & Control</p>
                <p className="text-xs text-text-dimmed">Enable maintenance mode, lock the portal, and manage global settings.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20 shrink-0"><MessageSquare className="w-5 h-5 text-purple-400" /></div>
              <div>
                <p className="font-bold text-sm">Global Broadcasts</p>
                <p className="text-xs text-text-dimmed">Send notifications to all users or specific roles via the Communications tab.</p>
              </div>
            </div>
          </div>
        )
      }
    );
  }

  steps.push({
    title: 'You\'re All Set!',
    description: 'Good luck at NXTMUN. Make your mark!',
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-10 h-10 text-white" />
        </div>
        <p className="text-text-secondary">Your journey begins now. If you ever need help, look for the tutorial icon in your profile settings.</p>
      </div>
    )
  });

  return steps;
};

export default function InteractiveOnboarding({ userRole, userName, onComplete, dashboardType }: InteractiveOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = getOnboardingSteps(dashboardType, userName);
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-lg overflow-hidden shadow-2xl border-border-emphasized/30 bg-bg-card flex flex-col max-h-[90vh]">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-bg-raised">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-jotia-bold text-text-primary tracking-tight uppercase">{step.title}</h2>
              <p className="text-text-dimmed text-sm">{step.description}</p>
            </div>
            <button onClick={onComplete} className="p-2 text-text-tertiary hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {step.content}
          </div>
        </div>

        <div className="p-6 bg-bg-raised/50 border-t border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentStep ? 'bg-text-primary w-4' : 'bg-text-tertiary/30'}`}
              />
            ))}
          </div>
          
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack} className="h-10 px-4">
                <ChevronLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="h-10 px-6 font-bold shadow-lg shadow-blue-500/20">
              {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1.5" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
