'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Input, Textarea, ErrorMessage } from '@/components/ui';
import { DashboardLoadingState } from '@/components/dashboard-shell';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({
    conference_name: 'BILLMUN 2026',
    conference_date: '2026-03-27',
    conference_location: 'Khobar, Saudi Arabia',
    registration_open: true,
    auto_approve_registrations: false,
    portal_message: 'Welcome to the official BILLMUN 2026 Attendees Portal.',
    maintenance_mode: false,
    ai_analysis_enabled: true,
    max_file_upload_mb: 10,
    emergency_contact_phone: '+966 5X XXX XXXX',
    whatsapp_group_link: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('conference_settings')
          .select('*')
          .eq('id', '1')
          .maybeSingle();
        
        if (error) throw error;
        if (data) {
          // Format date for the input
          const formattedData = { ...data };
          if (formattedData.conference_date) {
            formattedData.conference_date = new Date(formattedData.conference_date).toISOString().split('T')[0];
          }
          setSettings(prev => ({ ...prev, ...formattedData }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = { ...settings };
      // Ensure date is ISO
      if (payload.conference_date && !payload.conference_date.includes('T')) {
        payload.conference_date = new Date(payload.conference_date).toISOString();
      }

      // We use upsert with ID '1'
      const { error: saveError } = await supabase
        .from('conference_settings')
        .upsert({ 
          id: '1', 
          ...payload,
          updated_at: new Date().toISOString()
        });

      if (saveError) throw saveError;
      alert('Settings saved successfully');
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DashboardLoadingState type="overview" />;
  }

  return (
    <div className="max-w-4xl space-y-8 font-inter">
      <div>
        <h1 className="font-jotia-bold text-3xl text-text-primary mb-2 uppercase tracking-tight">Portal Settings</h1>
        <p className="text-text-dimmed">Configure conference-wide parameters and portal behavior.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <Card className="bg-bg-card border-border-subtle">
          <SectionLabel>Conference Identity</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Conference Name</label>
              <Input 
                value={settings.conference_name}
                onChange={(e) => setSettings({...settings, conference_name: e.target.value})}
                className="bg-bg-raised"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Date</label>
              <Input 
                type="date"
                value={settings.conference_date}
                onChange={(e) => setSettings({...settings, conference_date: e.target.value})}
                className="bg-bg-raised"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Location</label>
              <Input 
                value={settings.conference_location}
                onChange={(e) => setSettings({...settings, conference_location: e.target.value})}
                className="bg-bg-raised"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">WhatsApp Group Link</label>
              <Input 
                placeholder="https://chat.whatsapp.com/..."
                value={settings.whatsapp_group_link || ''}
                onChange={(e) => setSettings({...settings, whatsapp_group_link: e.target.value})}
                className="bg-bg-raised"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-bg-card border-border-subtle">
          <SectionLabel>Registration Control</SectionLabel>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-raised rounded-card border border-border-subtle">
              <div>
                <div className="font-bold text-text-primary text-sm uppercase tracking-wide">Public Registration</div>
                <p className="text-xs text-text-dimmed mt-1">When disabled, new signups will be blocked.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({...settings, registration_open: !settings.registration_open})}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.registration_open ? 'bg-status-approved-bg' : 'bg-bg-hover'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.registration_open ? 'left-7 bg-status-approved-text' : 'left-1 bg-text-disabled'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-raised rounded-card border border-border-subtle">
              <div>
                <div className="font-bold text-text-primary text-sm uppercase tracking-wide">Auto-Approve Registrations</div>
                <p className="text-xs text-text-dimmed mt-1">When enabled, new registrations are automatically approved without manual review.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({...settings, auto_approve_registrations: !settings.auto_approve_registrations})}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.auto_approve_registrations ? 'bg-status-approved-bg' : 'bg-bg-hover'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.auto_approve_registrations ? 'left-7 bg-status-approved-text' : 'left-1 bg-text-disabled'}`} />
              </button>
            </div>
          </div>
        </Card>

        <Card className="bg-bg-card border-border-subtle">
          <SectionLabel>Portal Behavior & Security</SectionLabel>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-raised rounded-card border border-border-subtle">
              <div>
                <div className="font-bold text-text-primary text-sm uppercase tracking-wide">AI Position Paper Analysis</div>
                <p className="text-xs text-text-dimmed mt-1">Allow delegates to use AI for document feedback.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({...settings, ai_analysis_enabled: !settings.ai_analysis_enabled})}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.ai_analysis_enabled ? 'bg-status-approved-bg' : 'bg-bg-hover'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.ai_analysis_enabled ? 'left-7 bg-status-approved-text' : 'left-1 bg-text-disabled'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-raised rounded-card border border-border-subtle">
              <div>
                <div className="font-bold text-text-primary text-sm uppercase tracking-wide">Maintenance Mode</div>
                <p className="text-xs text-text-dimmed mt-1">Lock the portal for all non-EB users.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({...settings, maintenance_mode: !settings.maintenance_mode})}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenance_mode ? 'bg-status-rejected-bg' : 'bg-bg-hover'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.maintenance_mode ? 'left-7 bg-status-rejected-text' : 'left-1 bg-text-disabled'}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border-t border-border-subtle">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Max File Size (MB)</label>
                <Input 
                  type="number"
                  value={settings.max_file_upload_mb || 10}
                  onChange={(e) => setSettings({...settings, max_file_upload_mb: parseInt(e.target.value)})}
                  className="bg-bg-raised"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Emergency Contact Number</label>
                <Input 
                  value={settings.emergency_contact_phone || ''}
                  onChange={(e) => setSettings({...settings, emergency_contact_phone: e.target.value})}
                  className="bg-bg-raised"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-bg-card border-border-subtle">
          <SectionLabel>Dashboard Announcement</SectionLabel>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Portal Message</label>
            <Textarea 
              rows={4}
              value={settings.portal_message}
              onChange={(e) => setSettings({...settings, portal_message: e.target.value})}
              className="bg-bg-raised"
              placeholder="Enter a message to be displayed on all delegate dashboards..."
            />
          </div>
        </Card>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-12 py-4 bg-text-primary text-bg-base font-black uppercase tracking-widest text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE ALL CHANGES'}
          </button>
        </div>
      </form>
    </div>
  );
}