'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Input, FormLabel, FormGroup, ErrorMessage, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { Check, ChevronLeft } from 'lucide-react';
import { FadeIn, ScaleIn } from '@/components/gsap-animations';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [committees, setCommittees] = useState<any[]>([]);

  useEffect(() => {
    const fetchCommittees = async () => {
      const { data } = await supabase.from('committees').select('*');
      if (data) setCommittees(data);
    }; 
    fetchCommittees();
  }, []);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    grade: '',
    phone_number: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
    dietary_restrictions: '',
    preferred_committee: '',
    allocated_country: '',
    department: 'DELEGATE',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => {
    // Basic validation before moving next
    const stepErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.full_name) stepErrors.full_name = 'Full name is required';
      if (!formData.email) stepErrors.email = 'Email is required';
      if (!formData.password) stepErrors.password = 'Password is required';
      if (formData.password !== formData.confirm_password) stepErrors.confirm_password = 'Passwords do not match';
      if (['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(formData.department) && !['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(formData.department)) {
        if (!formData.preferred_committee) stepErrors.preferred_committee = 'Committee is required';
        if (formData.department === 'DELEGATE' && !formData.allocated_country) stepErrors.allocated_country = 'Country is required';
      }
    } else if (currentStep === 2) {
      if (!formData.date_of_birth) stepErrors.date_of_birth = 'Date of birth is required';
      if (!formData.grade) stepErrors.grade = 'Grade is required';
      if (!formData.phone_number) stepErrors.phone_number = 'Phone number is required';
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name) newErrors.full_name = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.phone_number) newErrors.phone_number = 'Phone number is required';

    if (!formData.emergency_contact_name) newErrors.emergency_contact_name = 'Emergency contact name is required';
    if (!formData.emergency_contact_relation) newErrors.emergency_contact_relation = 'Emergency contact relation is required';
    if (!formData.emergency_contact_phone) newErrors.emergency_contact_phone = 'Emergency contact phone is required';

    if (['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(formData.department) && !['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(formData.department)) {
      if (!formData.preferred_committee) newErrors.preferred_committee = 'Committee preference is required';
      if (formData.department === 'DELEGATE' && !formData.allocated_country) newErrors.allocated_country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      // Navigate to the first step that has errors so the user can see them
      const step1Fields = ['full_name', 'email', 'password', 'confirm_password', 'preferred_committee', 'allocated_country'];
      const step2Fields = ['date_of_birth', 'grade', 'phone_number'];

      // validateForm() already set the errors — read the latest from a fresh check
      const newErrors: Record<string, string> = {};
      if (!formData.full_name) newErrors.full_name = 'Full name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (!formData.grade) newErrors.grade = 'Grade is required';
      if (!formData.phone_number) newErrors.phone_number = 'Phone number is required';
      if (['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(formData.department) && !['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(formData.department)) {
        if (!formData.preferred_committee) newErrors.preferred_committee = 'Committee is required';
        if (formData.department === 'DELEGATE' && !formData.allocated_country) newErrors.allocated_country = 'Country is required';
      }
      if (!formData.emergency_contact_name) newErrors.emergency_contact_name = 'Emergency contact name is required';
      if (!formData.emergency_contact_relation) newErrors.emergency_contact_relation = 'Emergency contact relation is required';
      if (!formData.emergency_contact_phone) newErrors.emergency_contact_phone = 'Emergency contact phone is required';

      // Build a user-visible summary of what's missing
      const missingFields = Object.values(newErrors);
      setErrors({ ...newErrors, submit: `Please fix ${missingFields.length} field(s): ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}` });

      if (step1Fields.some(f => newErrors[f])) {
        setCurrentStep(1);
      } else if (step2Fields.some(f => newErrors[f])) {
        setCurrentStep(2);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const registerUrl =
      typeof window !== 'undefined'
        ? new URL('/api/auth/register', window.location.origin).toString()
        : '/api/auth/register';

    const controller = new AbortController();
    const timeoutMs = 120_000;
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          grade: formData.grade,
          phone_number: formData.phone_number,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_relation: formData.emergency_contact_relation,
          emergency_contact_phone: formData.emergency_contact_phone,
          dietary_restrictions: formData.dietary_restrictions,
          preferred_committee: formData.preferred_committee,
          allocated_country: formData.allocated_country,
          department: formData.department,
        }),
        signal: controller.signal,
      });

      const raw = await res.text();
      let data: { error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string };
        } catch {
          setErrors({
            submit: res.ok
              ? 'Registration succeeded but the response was invalid. Please check your email or try logging in.'
              : 'Registration failed (invalid server response). Try again or use the same URL as in your address bar (correct port).',
          });
          return;
        }
      }

      if (!res.ok) {
        setErrors({ submit: data.error || `Registration failed (${res.status})` });
        return;
      }

      router.push('/register/success');
    } catch (err) {
      console.error('Registration error:', err);
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      const failedFetch = err instanceof TypeError && (err.message === 'Failed to fetch' || err.message.includes('fetch'));
      setErrors({
        submit: aborted
          ? `Request timed out after ${timeoutMs / 1000}s. Is the dev server still running? Try refreshing.`
          : failedFetch
            ? 'Could not reach the server. Confirm the site URL matches your dev server (e.g. localhost:3000 vs :3001), disable VPN/ad-block for this origin, then retry.'
            : err instanceof Error
              ? err.message
              : 'Registration failed',
      });
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-3 sm:p-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-2xl">
        <FadeIn delay={0.1} from="bottom">
          <div className="bg-bg-card border border-border-subtle rounded-lg p-4 sm:p-6 md:p-10 shadow-lg">
            {/* Brand Logo */}
            <div className="flex justify-center mb-6 sm:mb-10">
              <Link href="/" className="flex items-center gap-3 sm:gap-4">
                <img src="/billmun.png" alt="BILLMUN Logo" className="w-24 sm:w-36 h-auto dark:invert" />
                <span className="font-jotia text-lg sm:text-2xl text-text-primary tracking-widest uppercase">
                  Registration
                </span>
              </Link>
            </div>

            {/* Form */}
            <form noValidate onSubmit={handleSubmit} className="space-y-8">
              {/* Step Indicators */}
              <div className="flex justify-between items-center mb-8 relative before:absolute before:top-1/2 before:left-0 before:w-full before:h-0.5 before:bg-border-subtle before:-z-10">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                      currentStep === step 
                        ? 'bg-bg-card border-primary text-primary' 
                        : currentStep > step 
                          ? 'bg-primary border-primary text-bg-card'
                          : 'bg-bg-card border-border-subtle text-text-tertiary'
                    }`}
                  >
                    {currentStep > step ? <Check className="w-5 h-5" /> : step}
                  </div>
                ))}
              </div>

              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <FormGroup>
                    <FormLabel htmlFor="department">Department</FormLabel>
                    <Select id="department" name="department" value={formData.department} onChange={handleInputChange}>
                      <option value="DELEGATE">Delegate</option>
                      <option value="MEDIA">Press / Media</option>
                      <option value="CHAIR">Chair</option>
                      <option value="CO_CHAIR">Co-Chair</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="SECURITY">Security</option>
                      <option value="EXECUTIVE_BOARD">Executive Board</option>
                      <option value="SECRETARY_GENERAL">Secretary General</option>
                      <option value="DEPUTY_SECRETARY_GENERAL">Deputy Secretary General</option>
                    </Select>
                  </FormGroup>

                  <div className="bg-bg-raised border border-border-subtle rounded-card p-4 mb-4">
                    <p className="text-sm text-text-secondary font-medium">
                      <span className="text-status-rejected-text font-bold uppercase tracking-widest mr-2">Important:</span>
                      Please ensure all information provided matches the exact details used during your initial BILLMUN registration. This is for portal access verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup>
                      <FormLabel htmlFor="full_name">Full Name</FormLabel>
                      <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                      {errors.full_name && <ErrorMessage>{errors.full_name}</ErrorMessage>}
                    </FormGroup>
                    <FormGroup>
                      <FormLabel htmlFor="email">Email Address</FormLabel>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                      {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}   
                    </FormGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup>
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                      {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
                    </FormGroup>
                    <FormGroup>
                      <FormLabel htmlFor="confirm_password">Confirm Password</FormLabel>
                      <Input id="confirm_password" name="confirm_password" type="password" value={formData.confirm_password} onChange={handleInputChange} required />    
                      {errors.confirm_password && <ErrorMessage>{errors.confirm_password}</ErrorMessage>}
                    </FormGroup>
                  </div>

                  {['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(formData.department) && !['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(formData.department) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormGroup>
                        <FormLabel htmlFor="preferred_committee">Committee</FormLabel> 
                        <Select id="preferred_committee" name="preferred_committee" value={formData.preferred_committee} onChange={handleInputChange} required>
                          <option value="" disabled>Select Committee</option>
                          {committees.map((c: any) => (
                            <option key={c.id} value={c.abbreviation}>{c.abbreviation} - {c.name}</option>
                          ))}
                        </Select>
                        {errors.preferred_committee && <ErrorMessage>{errors.preferred_committee}</ErrorMessage>}
                      </FormGroup>
                      {formData.department === 'DELEGATE' && (
                        <FormGroup>
                          <FormLabel htmlFor="allocated_country">Country</FormLabel>     
                          <Input id="allocated_country" name="allocated_country" type="text" value={formData.allocated_country} onChange={handleInputChange} placeholder="Assigned Country" required />
                          {errors.allocated_country && <ErrorMessage>{errors.allocated_country}</ErrorMessage>}
                        </FormGroup>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup>
                      <FormLabel htmlFor="date_of_birth">Date of Birth</FormLabel>      
                      <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} required />
                      {errors.date_of_birth && <ErrorMessage>{errors.date_of_birth}</ErrorMessage>}
                    </FormGroup>
                    <FormGroup>
                      <FormLabel htmlFor="grade">Grade</FormLabel>
                      <Select id="grade" name="grade" value={formData.grade} onChange={handleInputChange} required>
                        <option value="" disabled>Select Grade</option>
                        <option value="9th">9th Grade</option>
                        <option value="10th">10th Grade</option>
                        <option value="11th">11th Grade</option>
                        <option value="12th">12th Grade</option>
                        <option value="University">University</option>
                        <option value="Graduate">Graduate</option>
                        <option value="Staff/Faculty">Staff/Faculty</option>
                        <option value="Other">Other</option>
                      </Select>
                      {errors.grade && <ErrorMessage>{errors.grade}</ErrorMessage>}   
                    </FormGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup>
                      <FormLabel htmlFor="phone_number">Phone Number</FormLabel>       
                      <Input id="phone_number" name="phone_number" type="tel" value={formData.phone_number} onChange={handleInputChange} placeholder="+966 5X XXX XXXX" required />
                      {errors.phone_number && <ErrorMessage>{errors.phone_number}</ErrorMessage>}
                    </FormGroup>
                    <FormGroup>
                      <FormLabel htmlFor="dietary_restrictions">Dietary Restrictions</FormLabel>
                      <Input id="dietary_restrictions" name="dietary_restrictions" type="text" value={formData.dietary_restrictions} onChange={handleInputChange} placeholder="e.g. Vegetarian, None" />
                    </FormGroup>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-t border-border-subtle pt-6">
                    <h3 className="font-jotia text-xl mb-6 text-text-primary">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormGroup>
                        <FormLabel htmlFor="emergency_contact_name">Contact Name</FormLabel>
                        <Input id="emergency_contact_name" name="emergency_contact_name" type="text" value={formData.emergency_contact_name} onChange={handleInputChange} required />
                        {errors.emergency_contact_name && <ErrorMessage>{errors.emergency_contact_name}</ErrorMessage>}
                      </FormGroup>
                      <FormGroup>
                        <FormLabel htmlFor="emergency_contact_relation">Relation</FormLabel>
                        <Input id="emergency_contact_relation" name="emergency_contact_relation" type="text" value={formData.emergency_contact_relation} onChange={handleInputChange} placeholder="e.g. Parent" required />
                        {errors.emergency_contact_relation && <ErrorMessage>{errors.emergency_contact_relation}</ErrorMessage>}
                      </FormGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">      
                      <FormGroup>
                        <FormLabel htmlFor="emergency_contact_phone">Contact Phone</FormLabel>
                        <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" value={formData.emergency_contact_phone} onChange={handleInputChange} required />
                        {errors.emergency_contact_phone && <ErrorMessage>{errors.emergency_contact_phone}</ErrorMessage>}
                      </FormGroup>
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="p-4 bg-status-rejected-bg border border-status-rejected-border rounded-md">
                  <ErrorMessage>{errors.submit}</ErrorMessage>
                </div>
              )}

              <div className="flex justify-between pt-8 border-t border-border-subtle">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Continue
                  </Button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      handleSubmit({ preventDefault: () => {} } as any);
                    }}
                    className="inline-flex items-center justify-center rounded-button text-sm font-medium h-10 py-2 px-4 bg-text-primary text-bg-base hover:bg-text-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Complete Registration'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
