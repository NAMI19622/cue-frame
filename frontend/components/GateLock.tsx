'use client';

import React from 'react';
import { gateColor, gateLabel, gateLamp } from '../lib/format';

interface Props {
  gate: string;
  confidenceBps: number;
  animate?: boolean;
}

// The cue gate rendered as a control-desk lamp head. GO outcomes open the
// aperture; HOLD-family outcomes show a half iris; BLOCKED locks it shut.
export default function GateLock({ gate, confidenceBps, animate = true }: Props) {
  const color = gateColor(gate);
  const lamp = gateLamp(gate);
  const open = lamp === 'go' ? 1 : lamp === 'standby' ? 0.45 : 0.08;
  const r = 54;
  const aperture = 16 + open * 34;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          position: 'relative',
          width: 132,
          height: 132,
          animation: animate ? 'cf-stamp 520ms cubic-bezier(0.22,1,0.36,1) both' : 'none',
        }}
      >
        <svg viewBox="0 0 132 132" width="132" height="132">
          <defs>
            <radialGradient id="gatecore" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={color} stopOpacity="0.95" />
              <stop offset="70%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.08" />
            </radialGradient>
          </defs>
          {/* outer bezel */}
          <circle cx="66" cy="66" r={r} fill="rgba(5,5,8,0.6)" stroke={color} strokeWidth="1.6" />
          {/* iris blades */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const inner = aperture;
            const outer = r - 2;
            const x1 = 66 + Math.cos(a) * inner;
            const y1 = 66 + Math.sin(a) * inner;
            const x2 = 66 + Math.cos(a + 0.5) * outer;
            const y2 = 66 + Math.sin(a + 0.5) * outer;
            const x3 = 66 + Math.cos(a) * outer;
            const y3 = 66 + Math.sin(a) * outer;
            return (
              <polygon
                key={i}
                points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                fill={color}
                fillOpacity="0.18"
                stroke={color}
                strokeOpacity="0.4"
                strokeWidth="0.6"
              />
            );
          })}
          {/* aperture core */}
          <circle cx="66" cy="66" r={aperture} fill="url(#gatecore)" />
          <circle cx="66" cy="66" r={aperture} fill="none" stroke={color} strokeWidth="1.4" strokeOpacity="0.7" />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: '0.54rem', letterSpacing: '0.16em', color: 'var(--ink-3)' }}>CUE GATE</span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.7rem',
              lineHeight: 1.05,
              color,
              padding: '0 14px',
            }}
          >
            {gateLabel(gate)}
          </span>
        </div>
      </div>
      <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--ink-3)' }}>
        confidence {(confidenceBps / 100).toFixed(0)}%
      </div>
    </div>
  );
}
