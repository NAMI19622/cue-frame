'use client';

import React from 'react';

type Lamp = 'go' | 'standby' | 'hold' | 'idle';

const COLORS: Record<Lamp, string> = {
  go: 'var(--go)',
  standby: 'var(--amber)',
  hold: 'var(--hold-red)',
  idle: 'var(--ink-4)',
};

// A theatrical cue-light: a stacked GO / STANDBY / HOLD lamp head. The active
// lamp glows; the others sit dark. A CuePulse ring animates when live.
export default function CueLight({
  lamp,
  pulse = false,
  size = 14,
  label,
}: {
  lamp: Lamp;
  pulse?: boolean;
  size?: number;
  label?: string;
}) {
  const color = COLORS[lamp];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
        {pulse && (
          <span
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: 999,
              border: `1.5px solid ${color}`,
              animation: 'cf-pulse 1.3s ease-in-out infinite',
            }}
          />
        )}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            background: color,
            boxShadow: lamp === 'idle' ? 'none' : `0 0 10px ${color}`,
          }}
        />
      </span>
      {label && (
        <span
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: lamp === 'idle' ? 'var(--ink-4)' : color,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
