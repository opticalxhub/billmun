'use client';

import React, { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { ChevronRight, ChevronLeft, X, Check, Users, FileText, Calendar, MessageSquare, BarChart3, Shield, Clock, Star } from 'lucide-react';

interface InteractiveOnboardingProps {
  userRole: string;
  userName: string;
  onComplete: () => void;
  dashboardType: 'delegate' | 'chair' | 'admin' | 'eb' | 'security' | 'media';
}

const getOnboardingSteps = (dashboardType: string) => {
  const baseSteps = [
    {
      title: `Welcome to BILLMUN, {userName}!`,
      description: `Let's take a quick tour of your ${dashboardType} dashboard.`,
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Star className="w-8 h-8 text-white" />
          </div>
          <p>You're all set for BILLMUN 2026!</p>
        </div>
      )
    },
    {
      title: 'Dashboard Overview',
      description: 'Your dashboard provides all the tools you need.',
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-bg-raised rounded-lg border border-border-subtle">
            <Calendar className="w-5 h-5 text-blue-400 mb-2" />
            <p className="font-semibold text-sm">Schedule & Timeline</p>
          </div>
          <div className="p-3 bg-bg-raised rounded-lg border border-border-subtle">
            <FileText className="w-5 h-5 text-green-400 mb-2" />
            <p className="font-semibold text-sm">Documents & Resources</p>
          </div>
          <div className="p-3 bg-bg-raised rounded-lg border border-border-subtle">
            <MessageSquare className="w-5 h-5 text-purple-400 mb-2" />
            <p className="font-semibold text-sm">Communication Tools</p>
          </div>
        </div>
      )
    },
    {
      title: 'Key Features',
      description: 'Important features to help you succeed.',
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Clock className="w-5 h-5 text-blue-400 mb-2" />
            <p className="font-semibold text-sm">Real-time Updates</p>
            <p className="text-xs">Stay informed with live updates</p>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <BarChart3 className="w-5 h-5 text-green-400 mb-2" />
            <p className="font-semibold text-sm">AI Assistance</p>
            <p className="text-xs">Get help with speeches and documents</p>
          </div>
        </div>
      )
    }
  ];

  if (dashboardType === 'chair') {
    baseSteps.push({
      title: 'Leadership Tools',
      description: 'Special tools for committee management.',
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <Shield className="w-5 h-5 text-purple-400 mb-2" />
            <p className="font-semibold text-sm">Session Control</p>
            <p className="text-xs">Manage debate proceedings</p>
          </div>
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <Users className="w-5 h-5 text-orange-400 mb-2" />
            <p className="font-semibold text-sm">Delegate Management</p>
            <p className="text-xs">Track participant progress</p>
          </div>
        </div>
      )
    });
  }

  baseSteps.push({
    title: 'You\'re Ready!',
    description: 'You now know how to use your dashboard effectively.',
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-white" />
        </div>
        <p className="font-semibold">Onboarding Complete!</p>
        <p className="text-sm text-text-dimmed">Good luck at BILLMUN 2026!</p>
      </div>
    )
  });

  return baseSteps;
};

export default function InteractiveOnboarding({ userRole, userName, onComplete, dashboardType }: InteractiveOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const steps = getOnboardingSteps(dashboardType);
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-96 max-w-[90vw] border-2 border-blue-500 shadow-2xl bg-bg-card">
        {/* Progress indicator */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {currentStep + 1}
            </div>
            <div>
              <h3 className="font-bold text-text-primary">
                {currentStepData.title.replace('{userName}', userName)}
              </h3>
              <p className="text-xs text-text-dimmed">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleComplete}
            className="p-1 text-text-dimmed hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-secondary mb-4">
            {currentStepData.description}
          </p>
          <div className="mb-6">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-500' : 
                    index < currentStep ? 'bg-green-500' : 'bg-border-subtle'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              {currentStep === steps.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
