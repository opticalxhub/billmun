'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, SectionLabel, Input } from '@/components/ui';
import { Button } from '@/components/button';
import type { ChairContext } from '../page';

export default function TimersTab({ ctx }: { ctx: ChairContext }) {
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [label, setLabel] = useState('');
  const [timerLogs, setTimerLogs] = useState<any[]>([]);
  const [expired, setExpired] = useState(false);
  const startTimeRef = useRef<Date | null>(null);
  const setDurationRef = useRef(0);

  // Speaking timer
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0);
  const [speakingRunning, setSpeakingRunning] = useState(false);
  const [speakingLimit, setSpeakingLimit] = useState(120);

  useEffect(() => { loadLogs(); }, [ctx.committee?.id]);

  // Main timer
  useEffect(() => {
    let interval: any;
    if (running && !paused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(p => {
          if (p <= 1) {
            setRunning(false);
            setPaused(false);
            setExpired(true);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Timer Expired', { body: label || 'Session timer has ended' });
            }
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running, paused, timeLeft, label]);

  // Speaking timer
  useEffect(() => {
    let interval: any;
    if (speakingRunning && speakingTimeLeft > 0) {
      interval = setInterval(() => {
        setSpeakingTimeLeft(p => {
          if (p <= 1) { setSpeakingRunning(false); return 0; }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [speakingRunning, speakingTimeLeft]);

  const loadLogs = async () => {
    if (!ctx.committee?.id) return;
    const { data } = await supabase
      .from('timer_logs')
      .select('*')
      .eq('committee_id', ctx.committee.id)
      .order('started_at', { ascending: false })
      .limit(20);
    setTimerLogs(data || []);
  };

  const startTimer = () => {
    const total = minutes * 60 + seconds;
    if (total <= 0) return;
    setDurationRef.current = total;
    setTimeLeft(total);
    setRunning(true);
    setPaused(false);
    setExpired(false);
    startTimeRef.current = new Date();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pauseTimer = () => setPaused(true);
  const resumeTimer = () => setPaused(false);

  const resetTimer = async () => {
    // Log the completed timer
    if (startTimeRef.current && ctx.committee?.id) {
      try {
        const actual = setDurationRef.current - timeLeft;
        await supabase.from('timer_logs').insert({
          committee_id: ctx.committee.id,
          session_id: ctx.session?.id,
          label: label || null,
          set_duration: setDurationRef.current,
          actual_duration: actual,
          started_at: startTimeRef.current.toISOString(),
          completed_at: new Date().toISOString(),
          created_by: ctx.user.id,
        });
        loadLogs();
      } catch (err) {
        console.error('Failed to log timer:', err);
      }
    }
    setRunning(false);
    setPaused(false);
    setTimeLeft(0);
    setExpired(false);
    startTimeRef.current = null;
  };

  const add30 = () => { if (running) setTimeLeft(p => p + 30); };

  const startSpeaking = () => {
    setSpeakingTimeLeft(speakingLimit);
    setSpeakingRunning(true);
  };

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Timer */}
      <Card>
        <SectionLabel>Session Timer</SectionLabel>
        <div className="flex flex-col items-center py-8">
          <div className={`text-8xl font-mono tracking-tighter transition-colors ${expired ? 'text-status-rejected-text animate-pulse' : timeLeft <= 15 && running ? 'text-yellow-400' : 'text-text-primary'}`}>
            {fmt(timeLeft)}
          </div>
          {expired && <p className="text-status-rejected-text font-bold text-sm uppercase tracking-widest mt-2 animate-pulse">Time Expired</p>}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Input type="number" min={0} value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="w-20 text-center" disabled={running} />
            <span className="text-text-dimmed text-sm">min</span>
            <Input type="number" min={0} max={59} value={seconds} onChange={e => setSeconds(Number(e.target.value))} className="w-20 text-center" disabled={running} />
            <span className="text-text-dimmed text-sm">sec</span>
          </div>
          <Input placeholder="Timer label (optional)" value={label} onChange={e => setLabel(e.target.value)} className="flex-1" disabled={running} />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {!running && <Button onClick={startTimer} className="min-h-[48px] min-w-[100px]">Start</Button>}
          {running && !paused && <Button onClick={pauseTimer} className="min-h-[48px] min-w-[100px]">Pause</Button>}
          {running && paused && <Button onClick={resumeTimer} className="min-h-[48px] min-w-[100px]">Resume</Button>}
          {running && <Button variant="outline" onClick={add30} className="min-h-[48px]">+30s</Button>}
          {(running || expired) && (
            <Button variant="outline" onClick={resetTimer} className="min-h-[48px] min-w-[100px]">Reset</Button>
          )}
        </div>
      </Card>

      {/* Speaking Timer */}
      <Card>
        <SectionLabel>Speaking Timer</SectionLabel>
        <div className="flex flex-col items-center py-4">
          <div className={`text-6xl font-mono tracking-tighter transition-colors ${speakingTimeLeft <= 15 && speakingRunning ? 'text-status-rejected-text animate-pulse' : 'text-text-primary'}`}>
            {fmt(speakingTimeLeft)}
          </div>
          {speakingTimeLeft <= 15 && speakingRunning && (
            <p className="text-status-rejected-text font-bold text-xs uppercase tracking-widest mt-2">Time Running Out</p>
          )}
        </div>
        <div className="flex items-center gap-4 justify-center mb-4">
          <div className="flex items-center gap-2">
            <Input type="number" min={1} value={speakingLimit} onChange={e => setSpeakingLimit(Number(e.target.value))} className="w-24 text-center" disabled={speakingRunning} />
            <span className="text-text-dimmed text-sm">sec limit</span>
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          {!speakingRunning ? (
            <Button onClick={startSpeaking} className="min-h-[48px]">Start Speaking Timer</Button>
          ) : (
            <Button variant="outline" onClick={() => setSpeakingRunning(false)} className="min-h-[48px]">Stop</Button>
          )}
        </div>
      </Card>

      {/* Timer Log */}
      <Card>
        <SectionLabel>Timer History</SectionLabel>
        {timerLogs.length === 0 && <p className="text-text-dimmed text-sm text-center py-6">No timers recorded this session.</p>}
        <div className="space-y-2">
          {timerLogs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-bg-raised rounded-card border border-border-subtle">
              <div>
                <span className="text-sm font-medium text-text-primary">{log.label || 'Unlabeled'}</span>
                <span className="text-xs text-text-dimmed ml-2">{new Date(log.started_at).toLocaleTimeString()}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono text-text-secondary">{fmt(log.set_duration)} set</span>
                <span className="text-xs text-text-dimmed ml-2">({fmt(log.actual_duration)} actual)</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
