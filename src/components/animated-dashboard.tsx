'use client';

import React from 'react';
import { Card, SectionLabel } from '@/components/ui';
import { Button } from '@/components/button';
import { 
  FadeIn, 
  ScaleIn, 
  StaggerContainer, 
  ScrollReveal, 
  HoverScale, 
  TextReveal,
  PageTransition 
} from './gsap-animations';
import { Users, FileText, MessageSquare, Settings, TrendingUp } from 'lucide-react';

export function AnimatedDashboard() {
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Hero Section */}
        <FadeIn delay={0.2} from="center">
          <div className="text-center py-12">
            <TextReveal delay={0.3}>
              <h1 className="font-jotia-bold text-4xl text-text-primary mb-4">
                BILLMUN Conference Portal
              </h1>
            </TextReveal>
            <FadeIn delay={0.5} from="bottom">
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Your complete conference management platform for debate, diplomacy, and global collaboration
              </p>
            </FadeIn>
          </div>
        </FadeIn>

        {/* Stats Cards */}
        <StaggerContainer stagger={0.1} delay={0.6}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <HoverScale>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold text-text-primary">247</span>
                </div>
                <p className="text-text-secondary">Total Delegates</p>
              </Card>
            </HoverScale>

            <HoverScale>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-green-400" />
                  <span className="text-2xl font-bold text-text-primary">89</span>
                </div>
                <p className="text-text-secondary">Documents</p>
              </Card>
            </HoverScale>

            <HoverScale>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-400" />
                  <span className="text-2xl font-bold text-text-primary">1.2k</span>
                </div>
                <p className="text-text-secondary">Messages</p>
              </Card>
            </HoverScale>

            <HoverScale>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                  <span className="text-2xl font-bold text-text-primary">94%</span>
                </div>
                <p className="text-text-secondary">Session Progress</p>
              </Card>
            </HoverScale>
          </div>
        </StaggerContainer>

        {/* Feature Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScrollReveal delay={0.8} from="left">
            <Card className="p-6">
              <SectionLabel>Real-time Session Management</SectionLabel>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-text-secondary">Live speaker list management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-text-secondary">Automated timing controls</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-text-secondary">Real-time voting system</span>
                </div>
              </div>
              <Button className="mt-6">Manage Sessions</Button>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={1} from="right">
            <Card className="p-6">
              <SectionLabel>AI-Powered Document Analysis</SectionLabel>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-text-secondary">Position paper scoring</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-text-secondary">Speech writing assistance</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-text-secondary">Diplomatic language suggestions</span>
                </div>
              </div>
              <Button className="mt-6">AI Tools</Button>
            </Card>
          </ScrollReveal>
        </div>

        {/* Additional Features */}
        <ScrollReveal delay={1.2} from="bottom">
          <Card className="p-6">
            <SectionLabel>Advanced Features</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <ScaleIn delay={1.3} from={0.9}>
                <div className="text-center">
                  <Settings className="w-12 h-12 text-text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-text-primary mb-2">Multi-Role Access</h3>
                  <p className="text-text-secondary text-sm">
                    Delegates, Chairs, EB, Admin, Security, Media, Press
                  </p>
                </div>
              </ScaleIn>

              <ScaleIn delay={1.4} from={0.9}>
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-text-primary mb-2">Real-time Communication</h3>
                  <p className="text-text-secondary text-sm">
                    Committee channels, bloc messaging, announcements
                  </p>
                </div>
              </ScaleIn>

              <ScaleIn delay={1.5} from={0.9}>
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-text-primary mb-2">Analytics & Reports</h3>
                  <p className="text-text-secondary text-sm">
                    Session analytics, delegate statistics, AI insights
                  </p>
                </div>
              </ScaleIn>
            </div>
          </Card>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}
