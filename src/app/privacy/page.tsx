'use client';

import React from 'react';
import { Footer } from '@/components/footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">
      <div className="max-w-4xl mx-auto py-20 px-8">
        <h1 className="font-jotia text-5xl mb-12">Comprehensive Privacy Policy and Data Processing Agreement</h1>
        
        <div className="space-y-12 text-text-secondary leading-relaxed text-sm">
          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">1. DEFINITIONS AND INTERPRETATION</h2>
            <p>1.1. In this Privacy Policy, the following definitions apply:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>&quot;Agreement&quot; means this Privacy Policy and the Terms of Service.</li>
              <li>&quot;BILLMUN&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot; refers to the BILLMUN organization, its organizers, technology providers, and parent entities.</li>
              <li>&quot;Data Protection Laws&quot; means all applicable privacy and data protection laws, including but not limited to GDPR, CCPA, and local regulations in the jurisdiction of operation.</li>
              <li>&quot;User&quot;, &quot;you&quot;, or &quot;your&quot; refers to any individual accessing the Platform, including Delegates, Advisors, Staff, and Guests.</li>
              <li>&quot;Personal Data&quot; means any information relating to an identified or identifiable natural person.</li>
              <li>&quot;Processing&quot; means any operation or set of operations which is performed on Personal Data.</li>
              <li>&quot;Controller&quot; means the natural or legal person which determines the purposes and means of the processing of Personal Data.</li>
              <li>&quot;Processor&quot; means a natural or legal person which processes Personal Data on behalf of the Controller.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">2. DATA CONTROLLER AND DATA PROTECTION OFFICER</h2>
            <p>2.1. BILLMUN acts as the Data Controller for the Personal Data processed through the Platform. We have appointed a Data Protection Officer (DPO) who is responsible for overseeing questions in relation to this privacy policy. If you have any questions about this privacy policy, including any requests to exercise your legal rights, please contact the DPO using the details set out below.</p>
            <p>2.2. Contact Email: dpo@billmun.com</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">3. THE DATA WE COLLECT ABOUT YOU</h2>
            <p>3.1. We may collect, use, store and transfer different kinds of Personal Data about you which we have grouped together as follows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data:</strong> first name, maiden name, last name, username or similar identifier, marital status, title, date of birth and gender.</li>
              <li><strong>Contact Data:</strong> billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Academic Data:</strong> school name, grade level, MUN experience, position papers, rewards and certificates.</li>
              <li><strong>Financial Data:</strong> bank account and payment card details.</li>
              <li><strong>Transaction Data:</strong> details about payments to and from you and other details of products and services you have purchased from us.</li>
              <li><strong>Technical Data:</strong> internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
              <li><strong>Profile Data:</strong> your username and password, purchases or orders made by you, your interests, preferences, dietary requirements, and feedback.</li>
              <li><strong>Usage Data:</strong> information about how you use our website, products and services.</li>
              <li><strong>Marketing and Communications Data:</strong> your preferences in receiving marketing from us and our third parties and your communication preferences.</li>
            </ul>
            <p>3.2. We also collect, use and share Aggregated Data such as statistical or demographic data for any purpose. Aggregated Data could be derived from your Personal Data but is not considered Personal Data in law as this data will not directly or indirectly reveal your identity.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">4. HOW IS YOUR PERSONAL DATA COLLECTED?</h2>
            <p>4.1. We use different methods to collect data from and about you including through:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Direct interactions:</strong> You may give us your Identity, Contact and Financial Data by filling in forms or by corresponding with us by post, phone, email or otherwise. This includes Personal Data you provide when you: apply for our products or services; create an account on our platform; subscribe to our service or publications; request marketing to be sent to you; enter a competition, promotion or survey; or give us feedback or contact us.</li>
              <li><strong>Automated technologies or interactions:</strong> As you interact with our website, we will automatically collect Technical Data about your equipment, browsing actions and patterns. We collect this Personal Data by using cookies, server logs and other similar technologies. We may also receive Technical Data about you if you visit other websites employing our cookies.</li>
              <li><strong>Third parties or publicly available sources:</strong> We may receive Personal Data about you from various third parties and public sources including: Analytics providers such as Google; Advertising networks; Search information providers; and Technical, Payment and Delivery services providers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">5. HOW WE USE YOUR PERSONAL DATA</h2>
            <p>5.1. We will only use your Personal Data when the law allows us to. Most commonly, we will use your Personal Data in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>
            <p>5.2. Generally, we do not rely on consent as a legal basis for processing your Personal Data although we will get your consent before sending third party direct marketing communications to you via email or text message. You have the right to withdraw consent to marketing at any time by contacting us.</p>
            <p>5.3. Purposes for which we will use your Personal Data:</p>
            <table className="min-w-full border border-white/10 mt-4">
              <thead>
                <tr className="bg-bg-raised">
                  <th className="p-2 border border-white/10">Purpose/Activity</th>
                  <th className="p-2 border border-white/10">Type of data</th>
                  <th className="p-2 border border-white/10">Lawful basis for processing</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-white/10">To register you as a new customer/user</td>
                  <td className="p-2 border border-white/10">(a) Identity (b) Contact</td>
                  <td className="p-2 border border-white/10">Performance of a contract with you</td>
                </tr>
                <tr>
                  <td className="p-2 border border-white/10">To process and deliver your order/registration</td>
                  <td className="p-2 border border-white/10">(a) Identity (b) Contact (c) Financial (d) Transaction (e) Marketing</td>
                  <td className="p-2 border border-white/10">(a) Performance of a contract with you (b) Necessary for our legitimate interests</td>
                </tr>
                <tr>
                  <td className="p-2 border border-white/10">To manage our relationship with you</td>
                  <td className="p-2 border border-white/10">(a) Identity (b) Contact (c) Profile (d) Marketing</td>
                  <td className="p-2 border border-white/10">(a) Performance of a contract with you (b) Necessary to comply with a legal obligation</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">6. COOKIES AND TRACKING TECHNOLOGIES</h2>
            <p>6.1. We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device. Other tracking technologies are also used such as beacons, tags and scripts to collect and track information and to improve and analyze our Service.</p>
            <p>6.2. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>
            <p>6.3. Examples of Cookies we use:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Session Cookies:</strong> We use Session Cookies to operate our Service.</li>
              <li><strong>Preference Cookies:</strong> We use Preference Cookies to remember your preferences and various settings.</li>
              <li><strong>Security Cookies:</strong> We use Security Cookies for security purposes.</li>
              <li><strong>Advertising Cookies:</strong> Advertising Cookies are used to serve you with advertisements that may be relevant to you and your interests.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">7. DISCLOSURE OF YOUR PERSONAL DATA</h2>
            <p>7.1. We may share your Personal Data with the parties set out below for the purposes set out in the table in paragraph 5 above.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Internal Third Parties: Other components within the BILLMUN ecosystem.</li>
              <li>External Third Parties: Service providers acting as processors based in various countries who provide IT and system administration services.</li>
              <li>Professional advisers including lawyers, bankers, auditors and insurers who provide consultancy, banking, legal, insurance and accounting services.</li>
              <li>Public Authorities: Revenue & Customs, regulators and other authorities who require reporting of processing activities in certain circumstances.</li>
              <li>Organizers: Individual conference organizers who need access to delegate data for committee assignments, scheduling, and logistics.</li>
            </ul>
            <p>7.2. We require all third parties to respect the security of your Personal Data and to treat it in accordance with the law. We do not allow our third-party service providers to use your Personal Data for their own purposes and only permit them to process your Personal Data for specified purposes and in accordance with our instructions.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">8. INTERNATIONAL DATA TRANSFERS</h2>
            <p>8.1. We share your Personal Data within the BILLMUN Organisation. This will involve transferring your data outside the European Economic Area (EEA) or your home jurisdiction. Many of our external third parties are based outside the EEA so their processing of your Personal Data will involve a transfer of data outside the EEA.</p>
            <p>8.2. Whenever we transfer your Personal Data out of the EEA, we ensure a similar degree of protection is afforded to it by ensuring at least one of the following safeguards is implemented:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We will only transfer your Personal Data to countries that have been deemed to provide an adequate level of protection for Personal Data by the European Commission.</li>
              <li>Where we use certain service providers, we may use specific contracts approved by the European Commission which give Personal Data the same protection it has in Europe.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">9. DATA SECURITY AND RETENTION</h2>
            <p>9.1. We have put in place appropriate security measures to prevent your Personal Data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your Personal Data to those employees, agents, contractors and other third parties who have a business need to know. They will only process your Personal Data on our instructions and they are subject to a duty of confidentiality.</p>
            <p>9.2. We have put in place procedures to deal with any suspected Personal Data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.</p>
            <p>9.3. We will only retain your Personal Data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the appropriate retention period for Personal Data, we consider the amount, nature, and sensitivity of the Personal Data, the potential risk of harm from unauthorized use or disclosure of your Personal Data, the purposes for which we process your Personal Data and whether we can achieve those purposes through other means, and the applicable legal requirements.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">10. YOUR LEGAL RIGHTS</h2>
            <p>10.1. Under certain circumstances, you have rights under Data Protection Laws in relation to your Personal Data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to your Personal Data.</li>
              <li>Request correction of your Personal Data.</li>
              <li>Request erasure of your Personal Data.</li>
              <li>Object to processing of your Personal Data.</li>
              <li>Request restriction of processing your Personal Data.</li>
              <li>Request transfer of your Personal Data.</li>
              <li>Right to withdraw consent.</li>
            </ul>
            <p>10.2. If you wish to exercise any of the rights set out above, please contact our Data Protection Officer at dpo@billmun.gomarai.com.</p>
            <p>10.3. You will not have to pay a fee to access your Personal Data (or to exercise any of the other rights). However, we may charge a reasonable fee if your request is clearly unfounded, repetitive or excessive. Alternatively, we may refuse to comply with your request in these circumstances.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">11. THIRD-PARTY LINKS AND SERVICES</h2>
            <p>11.1. This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements. When you leave our website, we encourage you to read the privacy notice of every website you visit.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">12. CHILDREN&apos;S PRIVACY</h2>
            <p>12.1. Our platform is intended for use by students who may be under the age of 18. We recognize the special importance of protecting children&apos;s privacy. If you are a parent or guardian and you are aware that your child has provided us with Personal Data without your consent, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">13. CHANGES TO THE PRIVACY POLICY</h2>
            <p>13.1. We keep our privacy policy under regular review. This version was last updated on 20 March 2026. Prior versions can be obtained by contacting us. It is important that the Personal Data we hold about you is accurate and current. Please keep us informed if your Personal Data changes during your relationship with us.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">14. FORCE MAJEURE AND ACCIDENTAL DISCLOSURE</h2>
            <p>14.1. BILLMUN shall not be liable for any accidental disclosure of data resulting from acts of God, war, terrorism, civil unrest, labor disputes, power outages, internet service provider failures, or any other event beyond our reasonable control. While we maintain industry-standard security, no system is 100% secure, and by using the platform, you acknowledge and accept these inherent risks.</p>
          </section>

          <section>
            <h2 className="font-jotia text-2xl text-text-primary mb-4">15. JURISDICTION AND DISPUTE RESOLUTION</h2>
            <p>15.1. Any disputes arising out of or in connection with this Privacy Policy shall be governed by the laws of the jurisdiction in which BILLMUN is headquartered. Any legal action or proceeding relating to your access to, or use of, the platform or this policy shall be instituted in a court in that jurisdiction. You and BILLMUN agree to submit to the jurisdiction of, and agree that venue is proper in, these courts in any such legal action or proceeding.</p>
          </section>

          <div className="pt-12 border-t border-white/10 space-y-4">
            <p className="font-bold">END OF DOCUMENT</p>
            <p className="text-xs">Document ID: B-PRIV-2026-V4.2.1-FULL-993-LEGAL</p>
            <p className="text-xs italic">Proprietary and Confidential to BILLMUN Organization.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}