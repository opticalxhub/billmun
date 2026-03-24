'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, SectionLabel } from '@/components/ui';
import { Button } from '@/components/button';
import { ChevronDown, ChevronRight, Home, Users, Shield, Camera, Settings, FileText, MessageSquare, CheckCircle, AlertTriangle, Info, ExternalLink, Clock, Globe, Lock, Award, TrendingUp, Target, Zap, BookOpen, UserCheck, Radio, Mail } from 'lucide-react';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Home,
    subsections: [
      {
        title: 'Registration Process',
        description: 'Complete guide to registering for BILLMUN conference',
        details: [
          'Visit the registration page and fill out all required fields',
          'Provide accurate personal information, school details, and committee preferences',
          'Upload a recent photo for your conference badge',
          'Wait for approval from the Executive Board',
          'Check your email for registration confirmation',
          'Complete onboarding process once approved'
        ]
      },
      {
        title: 'Login & Dashboard Access',
        description: 'How to access your personalized conference dashboard',
        details: [
          'Use your registered email and password to login',
          'Delegates are automatically redirected to their dashboard',
          'Chairs, Admin, Media, and Security users access role-specific dashboards',
          'Executive Board members have access to the central EB dashboard',
          'Enable browser notifications for real-time updates',
          'Bookmark your dashboard for quick access during conference'
        ]
      },
      {
        title: 'Profile Setup',
        description: 'Complete your profile for optimal conference experience',
        details: [
          'Update your personal information and contact details',
          'Select your preferred committee (if not pre-assigned)',
          'Add dietary restrictions and special requirements',
          'Upload a professional profile photo',
          'Set your display preferences and notification settings',
          'Review and accept the conference code of conduct'
        ]
      }
    ]
  },
  {
    id: 'delegate-guide',
    title: 'Delegate Guide',
    icon: Users,
    subsections: [
      {
        title: 'Dashboard Overview',
        description: 'Navigate your delegate workspace efficiently',
        details: [
          'Overview Tab: Real-time activity feed, conference countdown, quick stats',
          'My Committee Tab: Committee information, session status, delegate roster',
          'Documents Tab: Upload position papers, track review status, access approved documents',
          'AI Feedback Tab: Get AI analysis on your documents, improve diplomatic language',
          'Speeches Tab: Draft and practice your speeches with AI assistance',
          'Blocs Tab: Form diplomatic blocs, collaborate with allies, coordinate strategies',
          'Resolution Builder Tab: Draft and edit resolution clauses, export to PDF/Word',
          'Schedule Tab: View conference schedule, manage personal tasks and deadlines',
          'Research Tab: Access research tools, committee background guides, topic resources'
        ]
      },
      {
        title: 'Document Submission',
        description: 'Submit and manage your position papers and other documents',
        details: [
          'Upload position papers in PDF format (maximum 25MB)',
          'Use AI analysis to check for formatting, content quality, and diplomatic language',
          'Track document status: Submitted → Under Review → Approved/Revision Requested',
          'Respond to feedback and revise documents as requested by chairs',
          'Download approved documents for reference during committee sessions',
          'Access AI-generated suggestions for improving document quality'
        ]
      },
      {
        title: 'Bloc Management',
        description: 'Form and manage diplomatic blocs for effective negotiation',
        details: [
          'Create or join blocs using unique join codes',
          'Invite other delegates to join your bloc by sharing the code',
          'Collaborate on strategy and coordinate voting positions',
          'Share resolution drafts and get feedback from bloc members',
          'Use private messaging for secure bloc communication',
          'Monitor bloc activity and member participation',
          'Note: All bloc communications are accessible to conference organizers for oversight'
        ]
      },
      {
        title: 'Resolution Writing',
        description: 'Draft comprehensive resolutions using the built-in editor',
        details: [
          'Create resolution drafts with proper preambulatory and operative clauses',
          'Use clause templates and diplomatic language suggestions',
          'Add co-sponsors from your committee or other blocs',
          'Preview formatted resolutions in real-time',
          'Export resolutions to PDF or Word format for submission',
          'Share drafts with bloc members for collaboration and feedback',
          'Track revision history and document changes'
        ]
      },
      {
        title: 'Speech Preparation',
        description: 'Prepare and practice your speeches with AI assistance',
        details: [
          'Draft speeches using AI-powered writing assistance',
          'Check for diplomatic language and appropriate tone',
          'Practice timing with built-in speech timer',
          'Access research materials and background information',
          'Review AI feedback on argument strength and clarity',
          'Save multiple speech versions for different speaking opportunities',
          'Get suggestions for improving persuasive arguments'
        ]
      }
    ]
  },
  {
    id: 'chair-guide',
    title: 'Chair Guide',
    icon: Award,
    subsections: [
      {
        title: 'Session Management',
        description: 'Control committee sessions and maintain debate flow',
        details: [
          'Start and manage committee sessions with proper procedures',
          'Control speaking time and enforce debate rules',
          'Manage moderated and unmoderated caucuses',
          'Handle points and motions according to parliamentary procedure',
          'Monitor delegate presence and attendance',
          'Adjust session settings for optimal debate flow',
          'Access real-time session analytics and participation metrics'
        ]
      },
      {
        title: 'Speaker List Management',
        description: 'Efficiently manage the speaker list and speaking time',
        details: [
          'Add delegates to the speaker list in proper order',
          'Set and enforce speaking time limits',
          'Handle yield requests and speaker transitions',
          'Manage speaker list priority and fairness',
          'Track speaking time for each delegate',
          'Handle emergency speakers and special circumstances',
          'Generate speaker list reports for session documentation'
        ]
      },
      {
        title: 'Document Review',
        description: 'Review and approve delegate submissions efficiently',
        details: [
          'Access all submitted documents for your committee',
          'Use AI analysis to quickly assess document quality',
          'Provide feedback and request revisions when necessary',
          'Track document status and review progress',
          'Approve or reject documents based on committee standards',
          'Generate document review reports',
          'Communicate with delegates about document requirements'
        ]
      },
      {
        title: 'Bloc Oversight',
        description: 'Monitor bloc formation and activities for fair debate',
        details: [
          'View all blocs formed in your committee',
          'Monitor bloc membership and activity levels',
          'Access bloc messages for oversight purposes',
          'Ensure bloc activities comply with conference rules',
          'Identify potential bloc dominance issues',
          'Provide guidance on appropriate bloc behavior',
          'Report any concerning bloc activities to Executive Board'
        ]
      },
      {
        title: 'Voting and Decision Making',
        description: 'Manage voting processes and record outcomes',
        details: [
          'Initiate votes on resolutions and amendments',
          'Track voting results and delegate positions',
          'Manage roll call votes and record individual votes',
          'Handle voting procedure according to conference rules',
          'Generate voting reports and documentation',
          'Announce voting outcomes clearly and accurately',
          'Maintain impartiality during voting processes'
        ]
      }
    ]
  },
  {
    id: 'executive-board',
    title: 'Executive Board Guide',
    icon: Shield,
    subsections: [
      {
        title: 'User Management',
        description: 'Manage all conference participants and their access',
        details: [
          'Review and approve delegate registrations',
          'Assign delegates to committees and countries',
          'Manage chair assignments and committee leadership',
          'Handle admin, media, and security staff assignments',
          'Monitor user activity and account status',
          'Process special requests and accommodations',
          'Generate user reports and analytics',
          'Handle account suspensions and disciplinary actions'
        ]
      },
      {
        title: 'Conference Administration',
        description: 'Oversee all aspects of conference operations',
        details: [
          'Configure conference settings and parameters',
          'Manage committee assignments and country allocations',
          'Set up session schedules and debate topics',
          'Monitor real-time conference activity and participation',
          'Handle emergency situations and security incidents',
          'Generate comprehensive conference reports',
          'Manage conference announcements and communications',
          'Oversee media coverage and press relations'
        ]
      },
      {
        title: 'Document Oversight',
        description: 'Review and manage all conference documents',
        details: [
          'Access all submitted documents across committees',
          'Monitor document review progress and quality',
          'Handle escalated document issues and appeals',
          'Generate document statistics and quality reports',
          'Ensure compliance with conference document standards',
          'Manage document approval workflows',
          'Access AI analysis reports for quality assurance',
          'Generate document archives for conference records'
        ]
      },
      {
        title: 'Security and Emergency Management',
        description: 'Maintain conference safety and handle emergencies',
        details: [
          'Monitor security incidents and access control',
          'Handle emergency situations with 911 override access',
          'Coordinate with security team for incident response',
          'Manage emergency communications and alerts',
          'Access security logs and incident reports',
          'Generate security reports for documentation',
          'Coordinate with venue security and local authorities',
          'Maintain emergency contact information and procedures'
        ]
      },
      {
        title: 'Analytics and Reporting',
        description: 'Generate comprehensive reports and insights',
        details: [
          'Access real-time conference analytics dashboard',
          'Generate participation and engagement reports',
          'Monitor committee progress and session outcomes',
          'Track document submission and approval statistics',
          'Analyze voting patterns and decision outcomes',
          'Generate financial reports and budget tracking',
          'Create post-conference evaluation reports',
          'Export data for external analysis and documentation'
        ]
      }
    ]
  },
  {
    id: 'admin-guide',
    title: 'Admin Guide',
    icon: Settings,
    subsections: [
      {
        title: 'Delegate Logistics',
        description: 'Manage delegate presence and conference logistics',
        details: [
          'Track delegate attendance and session participation',
          'Manage lavatory breaks and delegate movements',
          'Monitor delegate zones and access control',
          'Handle delegate requests and special needs',
          'Generate attendance reports for committee chairs',
          'Coordinate with security for delegate safety',
          'Manage delegate badge printing and distribution',
          'Track delegate meal preferences and dietary restrictions'
        ]
      },
      {
        title: 'Session Support',
        description: 'Provide administrative support for committee sessions',
        details: [
          'Assist chairs with session setup and equipment',
          'Handle technical issues and troubleshooting',
          'Manage session materials and supplies',
          'Coordinate with security for session access',
          'Monitor session timing and schedule adherence',
          'Generate session reports and documentation',
          'Handle delegate requests during sessions',
          'Maintain session records and archives'
        ]
      },
      {
        title: 'Communication Management',
        description: 'Handle conference communications and notifications',
        details: [
          'Send announcements to specific delegate groups',
          'Manage conference-wide notifications',
          'Handle delegate inquiries and support requests',
          'Coordinate with chairs for committee communications',
          'Manage emergency communications and alerts',
          'Generate communication reports and logs',
          'Maintain contact information and messaging records',
          'Coordinate with media for press communications'
        ]
      }
    ]
  },
  {
    id: 'media-press-guide',
    title: 'Media & Press Guide',
    icon: Camera,
    subsections: [
      {
        title: 'Media Coverage Planning',
        description: 'Plan and coordinate comprehensive conference coverage',
        details: [
          'Access conference schedule and event information',
          'Plan coverage strategy for key events and sessions',
          'Coordinate with Executive Board for media access',
          'Schedule interviews with delegates and chairs',
          'Plan photo opportunities and media events',
          'Coordinate with security for venue access',
          'Manage media credentials and press passes',
          'Create coverage timeline and assignment schedule'
        ]
      },
      {
        title: 'Content Management',
        description: 'Upload and manage media content for conference coverage',
        details: [
          'Upload photos and videos to media gallery',
          'Write and publish press releases and articles',
          'Manage content categories and tags',
          'Coordinate content approval with Executive Board',
          'Generate media coverage reports',
          'Manage content rights and permissions',
          'Create content archives for documentation',
          'Coordinate with social media teams for content distribution'
        ]
      },
      {
        title: 'Press Relations',
        description: 'Manage press communications and media relations',
        details: [
          'Write and distribute press releases',
          'Handle media inquiries and interview requests',
          'Coordinate press conferences and media events',
          'Manage media contact database',
          'Generate press coverage reports',
          'Monitor media coverage and sentiment',
          'Handle crisis communications and media issues',
          'Maintain press documentation and archives'
        ]
      }
    ]
  },
  {
    id: 'security-guide',
    title: 'Security Guide',
    icon: Shield,
    subsections: [
      {
        title: 'Access Control',
        description: 'Manage venue access and security protocols',
        details: [
          'Monitor delegate access to different venue areas',
          'Manage security zones and access permissions',
          'Handle access requests and special accommodations',
          'Monitor security camera feeds and alerts',
          'Generate access reports and logs',
          'Coordinate with venue security staff',
          'Handle security incidents and emergencies',
          'Maintain security documentation and procedures'
        ]
      },
      {
        title: 'Incident Management',
        description: 'Handle security incidents and emergency situations',
        details: [
          'Report and document security incidents',
          'Coordinate emergency response procedures',
          'Manage security alerts and notifications',
          'Generate incident reports and follow-up actions',
          'Coordinate with local authorities when necessary',
          'Maintain incident logs and documentation',
          'Handle delegate safety concerns and issues',
          'Provide security updates to Executive Board'
        ]
      },
      {
        title: 'Safety Protocols',
        description: 'Implement and maintain conference safety procedures',
        details: [
          'Monitor delegate safety and well-being',
          'Handle medical emergencies and first aid',
          'Coordinate with venue medical staff and services',
          'Manage emergency evacuation procedures',
          'Generate safety reports and documentation',
          'Maintain emergency contact information',
          'Handle safety incidents and follow-up actions',
          'Provide safety briefings and training'
        ]
      }
    ]
  },
  {
    id: 'technical-guide',
    title: 'Technical Guide',
    icon: Settings,
    subsections: [
      {
        title: 'System Requirements',
        description: 'Ensure your device meets requirements for optimal performance',
        details: [
          'Modern web browser (Chrome, Firefox, Safari, Edge) - latest version',
          'Stable internet connection (minimum 5 Mbps recommended)',
          'Screen resolution: 1024x768 minimum, 1920x1080 recommended',
          'JavaScript and cookies must be enabled',
          'Mobile devices: iOS 12+, Android 8+ with updated browsers',
          'Tablet support with responsive design',
          'Printer access for document downloads',
          'Camera and microphone access for video conferencing (if used)'
        ]
      },
      {
        title: 'Troubleshooting',
        description: 'Resolve common technical issues quickly',
        details: [
          'Clear browser cache and cookies if experiencing issues',
          'Check internet connection stability',
          'Disable browser extensions that may interfere',
          'Try a different browser if issues persist',
          'Ensure JavaScript is enabled in browser settings',
          'Check for browser updates and install if available',
          'Contact technical support for persistent issues',
          'Use incognito mode for testing login issues'
        ]
      },
      {
        title: 'Data Security',
        description: 'Understand data protection and privacy measures',
        details: [
          'All data transmitted using HTTPS encryption',
          'Passwords are hashed and securely stored',
          'Personal information protected by privacy policy',
          'Session management with automatic timeout',
          'Regular security audits and updates',
          'Data backup and recovery procedures',
          'Access limited to authorized personnel',
          'Compliance with data protection regulations'
        ]
      },
      {
        title: 'Performance Tips',
        description: 'Optimize your experience for best performance',
        details: [
          'Close unnecessary browser tabs and applications',
          'Use wired internet connection when possible',
          'Keep browser and system updated',
          'Limit concurrent video streams and downloads',
          'Use device with adequate RAM and processing power',
          'Optimize browser settings for performance',
          'Monitor data usage if on limited connection',
          'Restart browser if experiencing slowdowns'
        ]
      }
    ]
  },
  {
    id: 'emergency-procedures',
    title: 'Emergency Procedures',
    icon: AlertTriangle,
    content: [
      'The BILLMUN Portal includes comprehensive emergency procedures to ensure conference safety and continuity.',
      '',
      '**911 Emergency Override**: In critical situations, authorized personnel can access emergency override functions at /911 using the system passphrase. This provides temporary Executive Board access for 10 minutes.',
      '',
      '**Emergency Sessions**: Temporary elevated access can be granted for critical system maintenance or recovery operations.',
      '',
      '**Security Alerts**: Real-time broadcast system allows for urgent notifications across all user roles.',
      '',
      '**Data Recovery**: Automated backups and point-in-time recovery through Supabase infrastructure.',
      '',
      '**Incident Response**: Security team can coordinate emergency response through the portal with real-time updates.',
      '',
      '**Communication Protocols**: Emergency communication channels ensure all participants receive critical information promptly.',
      '',
      '**Venue Evacuation**: Portal can broadcast evacuation instructions and coordinate emergency response.',
      '',
      '**Medical Emergencies**: Quick access to emergency contacts and medical response coordination.',
      '',
      '**Technical Failures**: Backup systems and procedures ensure continuity during technical issues.',
    ],
  },
  {
    id: 'conference-rules',
    title: 'Conference Rules & Regulations',
    icon: BookOpen,
    subsections: [
      {
        title: 'Code of Conduct',
        description: 'Expected behavior and professional standards',
        details: [
          'Respectful communication with all participants',
          'Professional dress code during conference sessions',
          'Punctuality and attendance requirements',
          'Proper use of conference technology and platforms',
          'Adherence to parliamentary procedure in committee sessions',
          'Respect for diversity and inclusive behavior',
          'No harassment or discrimination of any kind',
          'Compliance with conference staff directions'
        ]
      },
      {
        title: 'Academic Integrity',
        description: 'Maintain high standards of academic honesty',
        details: [
          'Original work for all submitted documents',
          'Proper citation of sources in research',
          'No plagiarism or academic dishonesty',
          'Honest representation of positions and arguments',
          'Respect for intellectual property rights',
          'Proper use of AI tools with disclosure',
          'Authentic representation of credentials',
          'Compliance with academic standards'
        ]
      },
      {
        title: 'Technology Usage',
        description: 'Appropriate use of conference technology',
        details: [
          'Use provided platforms for official communication',
          'No unauthorized recording of sessions',
          'Respect privacy and data protection rules',
          'Appropriate use of AI assistance with disclosure',
          'No sharing of confidential information',
          'Compliance with internet usage policies',
          'Respect for intellectual property online',
          'Proper use of social media guidelines'
        ]
      },
      {
        title: 'Disciplinary Procedures',
        description: 'Process for handling rule violations',
        details: [
          'Warning for minor infractions',
          'Temporary suspension for serious violations',
          'Expulsion for severe or repeated violations',
          'Right to appeal disciplinary actions',
          'Documentation of all incidents',
          'Review by Executive Board or disciplinary committee',
          'Notification of home institutions if necessary',
          'Legal consequences for criminal behavior'
        ]
      }
    ]
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    icon: MessageSquare,
    subsections: [
      {
        title: 'Registration & Login',
        description: 'Common questions about getting started',
        details: [
          'Q: How do I register for BILLMUN?',
          'A: Visit the registration page, fill out the form, and wait for approval.',
          '',
          'Q: What if I forget my password?',
          'A: Use the password reset link on the login page.',
          '',
          'Q: How long does registration approval take?',
          'A: Usually 24-48 hours, depending on volume.',
          '',
          'Q: Can I change my committee preference?',
          'A: Contact the Executive Board for committee changes.',
          '',
          'Q: What documents do I need to register?',
          'A: Personal information, school details, and a photo.'
        ]
      },
      {
        title: 'Technical Issues',
        description: 'Solutions for common technical problems',
        details: [
          'Q: Why can\'t I log in?',
          'A: Check your email/password, clear browser cache, or contact support.',
          '',
          'Q: The portal is running slowly.',
          'A: Check your internet connection, close other tabs, or try a different browser.',
          '',
          'Q: Can I use the portal on mobile?',
          'A: Yes, the portal is mobile-responsive but works best on desktop.',
          '',
          'Q: Why can\'t I upload my document?',
          'A: Check file size (max 25MB) and format (PDF required).',
          '',
          'Q: How do I enable notifications?',
          'A: Allow browser notifications in your browser settings.'
        ]
      },
      {
        title: 'Conference Procedures',
        description: 'Questions about conference operations',
        details: [
          'Q: How do I join a bloc?',
          'A: Get the join code from the bloc creator or create your own.',
          '',
          'Q: When are position papers due?',
          'A: Check the schedule tab for specific deadlines.',
          '',
          'Q: How do I access committee documents?',
          'A: Go to the Documents tab in your dashboard.',
          '',
          'Q: What if I need to miss a session?',
          'A: Notify your chair and the admin team immediately.',
          '',
          'Q: How do voting procedures work?',
          'A: Follow your chair\'s instructions and parliamentary procedure.'
        ]
      },
      {
        title: 'AI Tools',
        description: 'Questions about AI assistance features',
        details: [
          'Q: Is using AI tools allowed?',
          'A: Yes, with proper disclosure of AI assistance.',
          '',
          'Q: How accurate is the AI analysis?',
          'A: It provides guidance but always verify with human review.',
          '',
          'Q: Can AI write my documents for me?',
          'A: No, AI should assist, not replace your work.',
          '',
          'Q: How do I cite AI assistance?',
          'A: Follow the conference guidelines for AI disclosure.',
          '',
          'Q: What languages does AI support?',
          'A: Primarily English, with some multilingual capabilities.'
        ]
      }
    ]
  }
];

export default function DocumentationPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setExpandedSections(new Set(['overview']));
  }, []);

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const getIcon = (IconComponent: any) => {
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-jotia-bold text-4xl text-text-primary mb-4">BILLMUN Portal Documentation</h1>
          <p className="text-text-secondary text-lg">
            Complete guide for the Model United Nations conference management platform
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Back to Portal
              </Button>
            </Link>
            <Link href="/dev/test">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                System Diagnostics
              </Button>
            </Link>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-6">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const IconComponent = section.icon;

            return (
              <Card key={section.id} className="overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-bg-raised/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-text-primary/10 text-text-primary">
                      {getIcon(IconComponent)}
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">{section.title}</h2>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-text-dimmed" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-text-dimmed" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6">
                    {section.content && (
                      <div className="prose prose-invert max-w-none">
                        {section.content.map((paragraph, idx) => (
                          <p key={idx} className="text-text-secondary mb-4">
                            {paragraph.startsWith('**') ? (
                              <strong>{paragraph.replace(/\*\*/g, '')}</strong>
                            ) : (
                              paragraph
                            )}
                          </p>
                        ))}
                      </div>
                    )}

                    {section.subsections && (
                      <div className="space-y-6">
                        {section.subsections.map((subsection, idx) => (
                          <div key={idx} className="border-l-2 border-border-subtle pl-4">
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                              {subsection.title}
                            </h3>
                            <p className="text-text-secondary mb-3">{subsection.description}</p>
                            
                            {'features' in subsection && Array.isArray(subsection.features) && subsection.features.length > 0 && (
                              <ul className="space-y-2">
                                {(subsection.features as string[]).map((feature: string, fidx: number) => (
                                  <li key={fidx} className="flex items-start gap-2 text-text-secondary">
                                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {'details' in subsection && Array.isArray(subsection.details) && subsection.details.length > 0 && (
                              <ul className="space-y-2">
                                {(subsection.details as string[]).map((detail: string, didx: number) => (
                                  <li key={didx} className="flex items-start gap-2 text-text-secondary">
                                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <code className="bg-bg-raised px-2 py-1 rounded text-xs">{detail}</code>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border-subtle">
          <div className="text-center text-text-dimmed text-sm">
            <p>BILLMUN Portal v1.0.0 — Built for Model United Nations conferences</p>
            <div className="mt-4 flex justify-center gap-6">
              <Link href="/privacy" className="hover:text-text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/acceptable-use" className="hover:text-text-primary transition-colors">
                Acceptable Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
