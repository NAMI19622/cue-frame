'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Summary } from '../lib/types';
import WalletButton from './WalletButton';

export type DeskTally = 'on_air' | 'hold' | 'standby' | 'clear';

interface Props {
  showTitle?: string;
  showMode?: string;
  summary: Summary | null;
  held: number;
  blocked: number;
  ready: number;
  liveRound: boolean; // a consensus round is mid-flight
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  onBriefing: () => void;
}

// CueFrame's broadcast-desk chrome. This is deliberately NOT the generic
// "logo + stat strip + pill cluster" sibling header: it is a gallery control
// bar with a hard tally-light sign (ON AIR / STANDBY), a running studio clock,
// a show-mode REC readout, and broadcast rocker switches for the controls.
export default function OnAirBar({
  showTitle,
  showMode,
  summary,
  held,
  blocked,
  ready,
  liveRound,
  reducedMotion,
  setReducedMotion,
  onBriefing,
}: Props) {
  const tally: DeskTally = liveRound
    ? 'on_air'
    : blocked > 0
      ? 'hold'
      : held > 0
        ? 'standby'
        : 'clear';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        background:
          'linear-gradient(180deg, rgba(11,16,32,0.92), rgba(5,5,8,0.96))',
        boxShadow: '0 1px 0 rgba(246,231,200,0.05) inset, 0 10px 30px rgba(0,0,0,0.45)',
      }}
    >
      {/* Tally sign: the dominant identity element on the desk. */}
      <TallySign tally={tally} reducedMotion={reducedMotion} />

      {/* Desk identity + show readout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 18px',
          borderRight: '1px solid var(--border)',
          minWidth: 0,
        }}
      >
        <DeskMark />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.96rem',
              lineHeight: 1,
              letterSpacing: '0.04em',
            }}
          >
            CUEFRAME
          </div>
          <div
            style={{
              fontSize: '0.58rem',
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              marginTop: 3,
            }}
          >
            Gallery Desk
          </div>
        </div>
        <ShowReadout title={showTitle} mode={showMode} reducedMotion={reducedMotion} />
      </div>

      {/* Cue-count gauges, drawn as illuminated meters not a plain strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '0 4px',
          borderRight: '1px solid var(--border)',
        }}
      >
        <Gauge label="Cues" value={summary?.cues} color="var(--ink-2)" />
        <Gauge label="Ready" value={ready} color="var(--go)" lit={ready > 0} />
        <Gauge label="Hold" value={held} color="var(--amber)" lit={held > 0} />
        <Gauge label="Block" value={blocked} color="var(--hold-red)" lit={blocked > 0} />
      </div>

      {/* Studio clock */}
      <StudioClock reducedMotion={reducedMotion} />

      {/* Broadcast switch bank */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
        }}
      >
        <RockerSwitch
          label="Motion"
          on={!reducedMotion}
          onColor="var(--cyan)"
          onToggle={() => setReducedMotion(!reducedMotion)}
          title="Toggle reduced motion"
        />
        <TallyChip label="Briefing" accent="var(--magenta)" onClick={onBriefing} />
        <WalletButton />
      </div>
    </header>
  );
}

const TALLY_META: Record<DeskTally, { text: string; sub: string; color: string; bg: string }> = {
  on_air: { text: 'ON AIR', sub: 'LIVE ROUND', color: '#ff5c73', bg: 'rgba(255,92,115,0.16)' },
  hold: { text: 'HOLD', sub: 'CUE BLOCKED', color: '#ffb84d', bg: 'rgba(255,184,77,0.14)' },
  standby: { text: 'STANDBY', sub: 'CUES HOLDING', color: '#4debff', bg: 'rgba(77,235,255,0.12)' },
  clear: { text: 'CLEAR', sub: 'DESK READY', color: '#56f29a', bg: 'rgba(86,242,154,0.12)' },
};

function TallySign({ tally, reducedMotion }: { tally: DeskTally; reducedMotion: boolean }) {
  const m = TALLY_META[tally];
  const blink = tally === 'on_air' && !reducedMotion;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
        padding: '0 18px',
        minWidth: 132,
        borderRight: `1px solid ${m.color}55`,
        background: m.bg,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1.12rem',
          letterSpacing: '0.16em',
          color: m.color,
          borderRadius: 4,
          padding: '5px 10px',
          border: `1px solid ${m.color}`,
          background: 'rgba(5,5,8,0.55)',
          animation: blink ? 'cf-tally 1.1s steps(1, end) infinite' : undefined,
          boxShadow: blink ? undefined : `0 0 14px ${m.color}40`,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: m.color,
            boxShadow: `0 0 10px ${m.color}`,
          }}
        />
        {m.text}
      </div>
      <span
        className="mono"
        style={{
          fontSize: '0.54rem',
          letterSpacing: '0.18em',
          color: 'var(--ink-3)',
          textAlign: 'center',
        }}
      >
        {m.sub}
      </span>
    </div>
  );
}

const MODE_META: Record<string, { text: string; color: string; rec: boolean }> = {
  live: { text: 'LIVE', color: '#ff5c73', rec: true },
  as_live: { text: 'AS-LIVE', color: '#ffb84d', rec: true },
  rehearsal: { text: 'REHEARSAL', color: '#4debff', rec: false },
  hybrid: { text: 'HYBRID', color: '#9b7cff', rec: false },
};

function ShowReadout({
  title,
  mode,
  reducedMotion,
}: {
  title?: string;
  mode?: string;
  reducedMotion: boolean;
}) {
  if (!title) return null;
  const meta = (mode && MODE_META[mode]) || { text: (mode || 'OFF').toUpperCase(), color: 'var(--ink-3)', rec: false };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        paddingLeft: 14,
        marginLeft: 2,
        borderLeft: '1px solid var(--border)',
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: '0.78rem',
          color: 'var(--ink)',
          fontWeight: 600,
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {meta.rec && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: meta.color,
              boxShadow: `0 0 8px ${meta.color}`,
              animation: reducedMotion ? undefined : 'cf-rec 1.4s ease-in-out infinite',
            }}
          />
        )}
        <span
          className="mono"
          style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: meta.color }}
        >
          {meta.text} MODE
        </span>
      </span>
    </div>
  );
}

function Gauge({
  label,
  value,
  color,
  lit = true,
}: {
  label: string;
  value?: number;
  color: string;
  lit?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '0 12px',
        minWidth: 50,
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: '1.04rem',
          fontWeight: 500,
          lineHeight: 1,
          color: lit ? color : 'var(--ink-4)',
          textShadow: lit ? `0 0 12px ${color}66` : 'none',
        }}
      >
        {value ?? '--'}
      </span>
      <span
        style={{
          fontSize: '0.52rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-3)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StudioClock({ reducedMotion }: { reducedMotion: boolean }) {
  const [now, setNow] = useState<string>('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      setNow(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    fmt();
    const start = () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(fmt, 1000);
    };
    const stop = () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        fmt();
        start();
      } else {
        stop();
      }
    };
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        padding: '0 16px',
        borderRight: '1px solid var(--border)',
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: '0.96rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: 'var(--ink)',
        }}
      >
        {now || '--:--:--'}
      </span>
      <span
        style={{
          fontSize: '0.52rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink-3)',
        }}
      >
        Studio
      </span>
    </div>
  );
}

// An illuminated broadcast rocker: a hard rectangular switch that lights its
// active side, not a soft pill toggle.
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

function DeskMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 34 34" aria-hidden style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="onairmark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb84d" />
          <stop offset="55%" stopColor="#e85dce" />
          <stop offset="100%" stopColor="#4debff" />
        </linearGradient>
      </defs>
      <rect x="3" y="6" width="28" height="22" rx="4" fill="none" stroke="url(#onairmark)" strokeWidth="1.5" />
      <circle cx="11" cy="17" r="3" fill="#56f29a" />
      <circle cx="17" cy="17" r="3" fill="#ffb84d" />
      <circle cx="23" cy="17" r="3" fill="#ff5c73" />
    </svg>
  );
}
