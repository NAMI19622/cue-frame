'use client';

import React from 'react';
import { explorerTx } from '../lib/config';
import { shortAddr } from '../lib/format';
import WalletButton from './WalletButton';

export type TxPhase = 'idle' | 'signing' | 'pending' | 'accepted' | 'error';

interface Props {
  phase: TxPhase;
  hash?: string;
  message?: string;
  // When true, render as an embedded now-line inside the Show Spine hero rather
  // than a bottom strip. The on-air glow (cf-onair) breathes while a round runs.
  embedded?: boolean;
  // The desk control surface. On the fixed bottom bar the transport carries the
  // controls (Motion / Briefing / Connect wallet) so they live at the bottom of
  // CueFrame, never in the top tally readout.
  reducedMotion?: boolean;
  setReducedMotion?: (v: boolean) => void;
  onBriefing?: () => void;
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

export default function TransportBar({
  phase,
  hash,
  message,
  embedded = false,
  reducedMotion,
  setReducedMotion,
  onBriefing,
}: Props) {
  const color = PHASE_COLOR[phase];
  const busy = phase === 'pending' || phase === 'signing';
  const onAir = phase === 'pending';
  // The control cluster only renders on the fixed bottom bar, never embedded.
  const showControls = !embedded && !!setReducedMotion && !!onBriefing;
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
      {showControls && (
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingLeft: 14,
            borderLeft: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <RockerSwitch
            label="Motion"
            on={!reducedMotion}
            onColor="var(--cyan)"
            onToggle={() => setReducedMotion!(!reducedMotion)}
            title="Toggle reduced motion"
          />
          <TallyChip label="Briefing" accent="var(--magenta)" onClick={onBriefing!} />
          <WalletButton dropUp />
        </div>
      )}
    </div>
  );
}

// An illuminated broadcast rocker: a hard rectangular switch that lights its
// active side, not a soft pill toggle. Lives on the bottom transport control
// surface.
function RockerSwitch({
  label,
  on,
  onColor,
  onToggle,
  title,
}: {
  label: string;
  on: boolean;
  onColor: string;
  onToggle: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onToggle}
      title={title}
      aria-pressed={on}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 8px 5px 10px',
        borderRadius: 5,
        border: '1px solid var(--border)',
        background: 'rgba(5,5,8,0.5)',
      }}
    >
      <span
        style={{
          fontSize: '0.58rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink-3)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          position: 'relative',
          width: 42,
          height: 18,
          borderRadius: 4,
          border: `1px solid ${on ? onColor : 'var(--border)'}`,
          background: 'rgba(5,5,8,0.7)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 1,
            bottom: 1,
            left: on ? '50%' : 1,
            width: '50%',
            borderRadius: 3,
            background: on ? onColor : 'var(--ink-4)',
            boxShadow: on ? `0 0 10px ${onColor}` : 'none',
            transition: 'left var(--dur-1) var(--ease)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.5rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#050508',
          }}
        >
          {on ? 'ON' : 'OFF'}
        </span>
      </span>
    </button>
  );
}

// A pressable tally chip used for momentary desk actions.
function TallyChip({
  label,
  accent,
  onClick,
}: {
  label: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 13px',
        borderRadius: 5,
        border: `1px solid ${accent}55`,
        background: 'rgba(5,5,8,0.5)',
        fontSize: '0.62rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--ink-2)',
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: accent,
          boxShadow: `0 0 8px ${accent}`,
        }}
      />
      {label}
    </button>
  );
}
