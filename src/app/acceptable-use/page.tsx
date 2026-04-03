'use client';

import React from 'react';
import { Footer } from '@/components/footer';

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">
      <div className="max-w-4xl mx-auto py-20 px-8">
        <h1 className="font-jotia text-5xl mb-12">Acceptable Use Policy and Governance Charter</h1>
        
        <div className="space-y-12 text-text-secondary leading-relaxed text-sm">
          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">1. OBJECTIVE AND SCOPE OF THE POLICY</h2>
            <p>1.1. This Acceptable Use Policy (AUP) is a binding legal agreement describing the rules and guidelines for your use of the BILLMUN platform, services, and associated technologies. Our goal is to ensure a safe, respectful, and productive environment for all delegates, organizers, and staff members. This AUP applies to all users, regardless of their role or relationship with the BILLMUN organization.</p>
            <p>1.2. By accessing or using our services, you agree to comply with this AUP in its entirety. If you disagree with any part of this policy, you are strictly prohibited from using our services.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">2. PROHIBITED ILLEGAL AND HARMFUL USES</h2>
            <p>2.1. You may not use the BILLMUN platform for any activity that is illegal, harmful, or interferes with the operation of our services. These prohibitions include, but are not limited to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Illegal Activity:</strong> Using the platform for any fraudulent, malicious, or otherwise illegal purposes, including the transmission of any content that violates the law.</li>
              <li><strong>Harmful Content:</strong> Uploading, posting, or otherwise transmitting any content that is harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another&apos;s privacy, or otherwise objectionable.</li>
              <li><strong>Malware and Viruses:</strong> Distributing, uploading, or otherwise making available any software viruses, malware, or other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
              <li><strong>Attacks on Systems:</strong> Engaging in any activity that disrupts, impairs, or otherwise interferes with the BILLMUN platform, its servers, or networks, including denial-of-service (DoS) attacks.</li>
              <li><strong>Unauthorized Access:</strong> Attempting to gain unauthorized access to any portion of the platform, other accounts, computer systems, or networks connected to any BILLMUN server through hacking, password mining, or any other means.</li>
              <li><strong>System Vulnerabilities:</strong> Probing, scanning, or testing the vulnerability of our platform or any network connected to our platform, or bypassing any security or authentication measures.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">3. CONTENT AND COMMUNICATION STANDARDS</h2>
            <p>3.1. BILLMUN is an educational platform dedicated to diplomacy and professional discourse. Users must adhere to high standards of communication. The following types of content and communication are strictly prohibited:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Hate Speech:</strong> Any content that promotes violence, incites hatred, or discriminates based on race, religion, gender, sexual orientation, disability, or national origin.</li>
              <li><strong>Harassment and Bullying:</strong> Sending threatening, abusive, or harassing messages to other delegates, staff members, or organizers, either publicly or privately.</li>
              <li><strong>Defamatory Material:</strong> Posting or sharing any information that is false and intended to harm the reputation of another individual or the BILLMUN organization.</li>
              <li><strong>Explicit Material:</strong> Uploading or sharing sexually explicit, pornographic, or excessively violent content.</li>
              <li><strong>Intellectual Property Infringement:</strong> Sharing copyrighted material, including position papers from other delegates or proprietary research, without the proper authorization from the owner.</li>
              <li><strong>Misrepresentation:</strong> Impersonating any person or entity, including any BILLMUN employee or representative, or falsely stating or otherwise misrepresenting your affiliation with a person or entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">4. NETWORK INTEGRITY AND SECURITY</h2>
            <p>4.1. To maintain the integrity and security of our platform, users must strictly comply with the following:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Automated Systems:</strong> You may not use any automated system, such as &quot;robots,&quot; &quot;spiders,&quot; or &quot;offline readers,&quot; to access the platform in a manner that sends more request messages than a human can reasonably produce.</li>
              <li><strong>Scraping and Data Extraction:</strong> Unauthorized harvesting or collection of any data, including user emails, profile information, or conference materials for use outside the BILLMUN ecosystem.</li>
              <li><strong>Network Interference:</strong> Any attempt to inject malicious code, scripts, or instructions into the platform frontend or backend.</li>
              <li><strong>Credential Sharing:</strong> Sharing your account credentials with any third party, or using another user&apos;s credentials to gain access to unauthorized areas of the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">5. SPAM, ADVERTISING, AND MASS MESSAGING</h2>
            <p>5.1. The use of BILLMUN&apos;s communication tools for any purpose other than MUN-related activity is prohibited. This includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Unsolicited Messages:</strong> Sending spam, chain letters, or pyramidal schemes through any of our messaging interfaces.</li>
              <li><strong>Commercial Advertising:</strong> Promoting products, services, or events not officially sanctioned or hosted by BILLMUN.</li>
              <li><strong>Mass Broadcasting:</strong> Sending messages to a large number of users without a valid academic or organizational reason.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">6. MONITORING, SURVEILLANCE, AND ENFORCEMENT</h2>
            <p>6.1. BILLMUN reserves the right, but does not have the obligation, to monitor usage of the platform to ensure compliance with this AUP. We may use automated tools or manual review to identify violations.</p>
            <p>6.2. We may record and archive all communications sent through our platform for educational, safety, and auditing purposes. By using the platform, you provide your explicit consent to such monitoring.</p>
            <p>6.3. Enforcement Actions: If we determine that a user has violated this AUP, we may take any of the following actions, at our sole discretion and without prior notice:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Issuing a formal warning or reprimand via email or in-platform notification.</li>
              <li>Removing or disabling access to any content that violates this policy.</li>
              <li>Temporarily suspending your access to specific features (e.g., messaging, document submission).</li>
              <li>Permanently terminating your BILLMUN account and barring you from future conferences.</li>
              <li>Reporting illegal activity or serious policy violations to relevant law enforcement authorities or your educational institution.</li>
              <li>Initiating legal proceedings against you for breach of contract.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">7. RESPONSIBILITIES OF CONFERENCE ORGANIZERS</h2>
            <p>7.1. Individual conference organizers and Executive Board members are responsible for enforcing this AUP within their respective committees and keeping the conference environment professional and safe for all participants. Failure of an organizer to address a known violation of this AUP may result in their removal from their position.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">8. INTELLECTUAL PROPERTY AND ACADEMIC INTEGRITY</h2>
            <p>8.1. All users must maintain the highest standards of academic integrity. Plagiarism in position papers, resolutions, or any other submitted materials is a violation of this AUP.</p>
            <p>8.2. Users may not use AI tools to generate significant portions of their work without explicit permission and proper citation, as this undermines the educational goals of the conference.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">9. LIMITATION OF LIABILITY AND INDEMNIFICATION</h2>
            <p>9.1. BILLMUN shall not be held liable for any damages, losses, or legal costs incurred by a user as a result of a violation of this AUP by another user. Each user is solely responsible for their own actions and communications on the platform.</p>
            <p>9.2. You agree to indemnify and hold BILLMUN and its organizers harmless from any claims, damages, liabilities, and expenses (including legal fees) arising out of your violation of this AUP.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">10. AMENDMENTS TO THE POLICY</h2>
            <p>10.1. We reserve the right to modify or replace this AUP at any time. We will provide notice of any material changes through the platform. By continuing to access or use our services after those revisions become effective, you agree to be bound by the revised policy. It is your responsibility to review the AUP regularly.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">11. REPORTING SYSTEM AND WHISTLEBLOWER PROTECTION</h2>
            <p>11.1. If you encounter any behavior or content that you believe violates this Acceptable Use Policy, please report it immediately to our team at compliance@billmun.com or through the platform&apos;s reporting features. We take all reports seriously and will investigate them thoroughly.</p>
            <p>11.2. We provide protection for whistleblowers; reporting a violation in good faith will never result in disciplinary action against the reporter, even if the investigation finds no violation occurred.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">12. SEVERABILITY AND ENTIRE AGREEMENT</h2>
            <p>12.1. If any provision of this AUP is found to be invalid or unenforceable under any applicable law, such invalidity or unenforceability shall not render this AUP invalid or unenforceable as a whole, and such provisions shall be deleted without affecting the remaining provisions herein.</p>
          </section>

          <div className="pt-12 border-t border-white/10 space-y-4">
            <p className="font-bold">END OF ACCEPTABLE USE POLICY</p>
            <p className="text-xs">Document ID: B-AUP-2026-V5.1-LEG-A101</p>
            <p className="text-xs italic">All rights reserved to BILLMUN Organization.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}