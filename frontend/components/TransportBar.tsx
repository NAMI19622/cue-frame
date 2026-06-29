'use client';

import React from 'react';
import { explorerTx } from '../lib/config';
import { shortAddr } from '../lib/format';

export type TxPhase = 'idle' | 'signing' | 'pending' | 'accepted' | 'error';

interface Props {
  phase: TxPhase;
  hash?: string;
  message?: string;
  // When true, render as an embedded now-line inside the Show Spine hero rather
  // than a bottom strip. The on-air glow (cf-onair) breathes while a round runs.
  embedded?: boolean;
}

// The control-room transport bar. It stages a write as a consensus round:
// CUEING (sign) -> ON AIR (pending, 1 to 5 min) -> SETTLED (accepted).
const PHASE_TEXT: Record<TxPhase, string> = {
  idle: 'Desk standing by. Call a cue through the gate to open a consensus round.',
  signing: 'Cueing. Awaiting wallet signature for the on-chain call.',
  pending: 'On air. Validators are deliberating; an AI gate round runs 1 to 5 minutes.',
  accepted: 'Settled. The cue decision is on-chain and the receipt is sealed.',
  error: 'The cue did not settle.',
};

const PHASE_LABEL: Record<TxPhase, string> = {
  idle: 'STANDBY',
  signing: 'CUEING',
  pending: 'ON AIR',
  accepted: 'SETTLED',
  error: 'FAULT',
};

const PHASE_COLOR: Record<TxPhase, string> = {
  idle: 'var(--ink-4)',
  signing: 'var(--amber)',
  pending: 'var(--cyan)',
  accepted: 'var(--go)',
  error: 'var(--hold-red)',
};

export default function TransportBar({ phase, hash, message, embedded = false }: Props) {
  const color = PHASE_COLOR[phase];
  const busy = phase === 'pending' || phase === 'signing';
  const onAir = phase === 'pending';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: embedded ? '12px 18px' : '10px 18px',
        borderTop: embedded ? 'none' : '1px solid var(--border)',
        border: embedded ? '1px solid var(--border)' : undefined,
        borderRadius: embedded ? 'var(--radius-m)' : undefined,
        background: embedded ? 'rgba(5,5,8,0.55)' : 'rgba(5,5,8,0.7)',
        backdropFilter: 'blur(8px)',
        minHeight: 50,
        animation: onAir ? 'cf-onair 2s ease-in-out infinite' : undefined,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          letterSpacing: '0.16em',
          color,
          border: `1px solid ${color}`,
          borderRadius: 'var(--radius-s)',
          padding: '3px 7px',
          flexShrink: 0,
        }}
      >
        {PHASE_LABEL[phase]}
      </span>
      <span style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            background: color,
            animation: busy ? 'cf-pulse 1.2s ease-in-out infinite' : 'none',
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </span>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--ink-2)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {message || PHASE_TEXT[phase]}
        </div>
      </div>
      {busy && (
        <div
          style={{
            position: 'relative',
            width: 120,
            height: 3,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'rgba(246,231,200,0.1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '45%',
              height: '100%',
              background: color,
              animation: 'cf-sweep 1.6s linear infinite',
            }}
          />
        </div>
      )}
      {hash && (
        <a
          className="mono"
          href={explorerTx(hash)}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '0.72rem', flexShrink: 0 }}
        >
          {shortAddr(hash)}
        </a>
      )}
    </div>
  );
}
