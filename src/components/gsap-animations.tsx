'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: 'left' | 'right' | 'top' | 'bottom' | 'center';
  className?: string;
}

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: number;
  className?: string;
}

interface StaggerProps {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

// Fade In Animation
export function FadeIn({ children, delay = 0, duration = 0.8, from = 'bottom', className = '' }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const fromConfig = {
      left: { x: -50, opacity: 0 },
      right: { x: 50, opacity: 0 },
      top: { y: -50, opacity: 0 },
      bottom: { y: 50, opacity: 0 },
      center: { scale: 0.8, opacity: 0 },
    };

    gsap.fromTo(
      element,
      fromConfig[from],
      {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration,
        delay,
        ease: 'power3.out',
      }
    );
  }, [delay, duration, from]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Scale In Animation
export function ScaleIn({ children, delay = 0, duration = 0.6, from = 0.8, className = '' }: ScaleInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.fromTo(
      element,
      { scale: from, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration,
        delay,
        ease: 'back.out(1.7)',
      }
    );
  }, [delay, duration, from]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Stagger Animation for Lists
export function StaggerContainer({ children, stagger = 0.1, delay = 0, duration = 0.6, className = '' }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const children = element.children;
    
    gsap.fromTo(
      children,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        delay,
        stagger,
        ease: 'power2.out',
      }
    );
  }, [delay, duration, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Scroll-triggered Animation
export function ScrollReveal({ children, delay = 0, duration = 0.8, from = 'bottom', className = '' }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const fromConfig = {
      left: { x: -50, opacity: 0 },
      right: { x: 50, opacity: 0 },
      top: { y: -50, opacity: 0 },
      bottom: { y: 50, opacity: 0 },
      center: { scale: 0.8, opacity: 0 },
    };

    gsap.fromTo(
      element,
      fromConfig[from],
      {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [delay, duration, from]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Hover Animation
export function HoverScale({ children, scale = 1.05, duration = 0.3, className = '' }: { 
  children: React.ReactNode; 
  scale?: number; 
  duration?: number; 
  className?: string; 
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => {
      gsap.to(element, { scale, duration, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(element, { scale: 1, duration, ease: 'power2.out' });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scale, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Text Animation
export function TextReveal({ children, delay = 0, stagger = 0.05, className = '' }: {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Split text into words
    const text = element.textContent || '';
    const words = text.split(' ');
    
    // Clear original text
    element.innerHTML = '';
    
    // Wrap each word in a span
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = word + ' ';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';
      element.appendChild(span);
    });

    // Animate words
    gsap.to(element.children, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay,
      stagger,
      ease: 'power2.out',
    });
  }, [delay, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Page Transition
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.fromTo(
      element,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
}
