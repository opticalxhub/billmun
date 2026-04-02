'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function ASCII8Ball({ className = '' }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const outerGlowRef = useRef<SVGCircleElement>(null);
  const dashedRingRef = useRef<SVGCircleElement>(null);
  const triangleGroupRef = useRef<SVGGElement>(null);
  const eightRef = useRef<SVGTextElement>(null);
  const orbitGroupRef = useRef<SVGGElement>(null);
  const scanlineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const tweens: gsap.core.Tween[] = [];
    const timelines: gsap.core.Timeline[] = [];

    // Float the entire SVG
    const floatTl = gsap.timeline({ repeat: -1, yoyo: true });
    floatTl.to(svgRef.current, { y: -10, duration: 3.5, ease: 'sine.inOut' });
    timelines.push(floatTl);

    // Outer glow breathe
    if (outerGlowRef.current) {
      tweens.push(gsap.to(outerGlowRef.current, {
        attr: { r: 148 },
        opacity: 0.2,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      }));
    }

    // Rotating dashed ring
    if (dashedRingRef.current) {
      tweens.push(gsap.to(dashedRingRef.current, {
        attr: { 'stroke-dashoffset': 200 },
        duration: 20,
        repeat: -1,
        ease: 'none',
      }));
    }

    // Triangle pulse
    if (triangleGroupRef.current) {
      tweens.push(gsap.to(triangleGroupRef.current, {
        opacity: 0.5,
        scale: 0.97,
        transformOrigin: '150px 155px',
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      }));
    }

    // "8" glow pulse
    if (eightRef.current) {
      tweens.push(gsap.to(eightRef.current, {
        opacity: 0.5,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      }));
    }

    // Orbit group slow rotation
    if (orbitGroupRef.current) {
      tweens.push(gsap.to(orbitGroupRef.current, {
        rotation: 360,
        transformOrigin: '150px 150px',
        duration: 30,
        repeat: -1,
        ease: 'none',
      }));
    }

    // Scanline sweep
    if (scanlineRef.current) {
      const scanTl = gsap.timeline({ repeat: -1, repeatDelay: 4 });
      scanTl.fromTo(scanlineRef.current,
        { attr: { y1: 30, y2: 30 }, opacity: 0 },
        { attr: { y1: 270, y2: 270 }, opacity: 0.12, duration: 1.5, ease: 'power1.in' },
      );
      scanTl.to(scanlineRef.current, { opacity: 0, duration: 0.3 });
      timelines.push(scanTl);
    }

    return () => {
      tweens.forEach(t => t.kill());
      timelines.forEach(t => t.kill());
    };
  }, []);

  // Pre-compute orbit dot positions with consistent precision
  const orbitDots = Array.from({ length: 36 }).map((_, i) => {
    const angle = (i * 10) * (Math.PI / 180);
    const r = 136;
    // Round to 3 decimal places to ensure server/client consistency
    return {
      cx: Number((150 + r * Math.cos(angle)).toFixed(3)),
      cy: Number((150 + r * Math.sin(angle)).toFixed(3)),
      r: i % 4 === 0 ? 2 : i % 2 === 0 ? 1.2 : 0.6,
      opacity: i % 4 === 0 ? 0.7 : i % 2 === 0 ? 0.35 : 0.12,
    };
  });

  // Tick marks at 30° intervals with consistent precision
  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i * 30) * (Math.PI / 180);
    const inner = 125;
    const outer = 131;
    // Round to 3 decimal places to ensure server/client consistency
    return {
      x1: Number((150 + inner * Math.cos(angle)).toFixed(3)),
      y1: Number((150 + inner * Math.sin(angle)).toFixed(3)),
      x2: Number((150 + outer * Math.cos(angle)).toFixed(3)),
      y2: Number((150 + outer * Math.sin(angle)).toFixed(3)),
    };
  });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 300"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer glow ring */}
      <circle
        ref={outerGlowRef}
        cx="150" cy="150" r="144"
        fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.08"
      />

      {/* Main solid ring */}
      <circle
        cx="150" cy="150" r="130"
        fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.75"
      />

      {/* Rotating dashed inner ring */}
      <circle
        ref={dashedRingRef}
        cx="150" cy="150" r="122"
        fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.25"
        strokeDasharray="6 8" strokeDashoffset="0"
      />

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={`tick-${i}`}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="currentColor" strokeWidth="0.8" opacity="0.25"
        />
      ))}

      {/* Highlight arc */}
      <path
        d="M 75 88 Q 150 35 225 88"
        fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.15"
      />

      {/* Shadow arc */}
      <path
        d="M 85 220 Q 150 260 215 220"
        fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.08"
      />

      {/* Triangle window */}
      <g ref={triangleGroupRef} opacity="0.85">
        {/* Outer triangle */}
        <path
          d="M 150 92 L 200 190 L 100 190 Z"
          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        />
        {/* Mid triangle (dashed) */}
        <path
          d="M 150 105 L 191 183 L 109 183 Z"
          fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.35"
          strokeDasharray="3 3"
        />
        {/* Inner triangle (subtle fill) */}
        <path
          d="M 150 118 L 182 176 L 118 176 Z"
          fill="currentColor" fillOpacity="0.03"
          stroke="currentColor" strokeWidth="0.3" opacity="0.2"
        />
      </g>

      {/* "8" numeral */}
      <text
        ref={eightRef}
        x="150" y="158"
        textAnchor="middle" dominantBaseline="middle"
        fill="currentColor" fontSize="36" fontFamily="monospace" fontWeight="bold"
        opacity="0.9"
      >
        8
      </text>

      {/* Orbiting dots */}
      <g ref={orbitGroupRef}>
        {orbitDots.map((d, i) => (
          <circle key={`orb-${i}`}
            cx={d.cx} cy={d.cy} r={d.r}
            fill="currentColor" opacity={d.opacity}
          />
        ))}
      </g>

      {/* Horizontal scanline */}
      <line
        ref={scanlineRef}
        x1="30" y1="30" x2="270" y2="30"
        stroke="currentColor" strokeWidth="0.5" opacity="0"
      />

      {/* Corner glyphs */}
      <text x="16" y="26" fill="currentColor" fontSize="9" fontFamily="monospace" opacity="0.12">&#x250C;</text>
      <text x="276" y="26" fill="currentColor" fontSize="9" fontFamily="monospace" opacity="0.12">&#x2510;</text>
      <text x="16" y="292" fill="currentColor" fontSize="9" fontFamily="monospace" opacity="0.12">&#x2514;</text>
      <text x="276" y="292" fill="currentColor" fontSize="9" fontFamily="monospace" opacity="0.12">&#x2518;</text>

      {/* BILLMUN label */}
      <text
        x="150" y="225"
        textAnchor="middle" fill="currentColor"
        fontSize="7" fontFamily="monospace" letterSpacing="5" opacity="0.2"
      >
        BILLMUN
      </text>

      {/* Tiny "BUILD · INSPIRE · LEAD" */}
      <text
        x="150" y="238"
        textAnchor="middle" fill="currentColor"
        fontSize="4.5" fontFamily="monospace" letterSpacing="1.5" opacity="0.1"
      >
        BUILD · INSPIRE · LEAD
      </text>
    </svg>
  );
}
