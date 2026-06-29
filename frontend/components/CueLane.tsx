'use client';

import React from 'react';
import type { CueCard } from '../lib/types';
import CueLight from './CueLight';
import { gateLamp, riskColor, gateColor } from '../lib/format';

interface Props {
  cues: CueCard[];
  activeCue: string | null;
  reducedMotion?: boolean;
  onSelectCue: (id: string) => void;
  onNewCue: () => void;
}

// A broadcast gallery lane: cue cards laid out as a horizontal scrolling ribbon
// of call slips, not a vertical side rail. Selecting a slip flares a pointer
// reaction (cf-select) and opens the on-air gate.
export default function CueLane({ cues, activeCue, reducedMotion = false, onSelectCue, onNewCue }: Props) {
  return (
    <div
      className="cue-lane"
      style={{
        display: 'flex',
        gap: 12,
        padding: '4px 2px 12px',
        alignItems: 'stretch',
      }}
    >
      {cues.length === 0 && (
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--ink-4)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-l)',
            padding: '22px 26px',
            lineHeight: 1.5,
            minWidth: 280,
          }}
        >
          No cue slips on this spine yet. Write a cue card to drop a slip into the running order.
        </div>
      )}

      {cues.map((c, i) => {
        const active = c.id === activeCue;
        const lamp = c.evaluated ? gateLamp(c.gate) : 'idle';
        const edge = c.evaluated ? gateColor(c.gate) : 'var(--border)';
        return (
          <button
            key={c.id}
            onClick={() => onSelectCue(c.id)}
            className={active && !reducedMotion ? 'curtain' : undefined}
            style={{
              flex: '0 0 auto',
              width: 232,
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 14,
              borderRadius: 'var(--radius-l)',
              border: active ? '1px solid var(--border-strong)' : '1px solid var(--border)',
              background: active
                ? 'linear-gradient(180deg, rgba(255,184,77,0.12), rgba(24,32,46,0.5))'
                : 'var(--surface)',
              animation: active && !reducedMotion ? 'cf-select 600ms var(--ease)' : undefined,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 4,
                height: '100%',
                background: edge,
                opacity: c.evaluated ? 0.9 : 0.4,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--ink-4)' }}>
                CUE {String(i + 1).padStart(2, '0')}
              </span>
              <CueLight lamp={lamp} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--ink)',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.title}
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--ink-3)' }}>
              {c.segment} | {c.cueType}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
              <span
                style={{ width: 7, height: 7, borderRadius: 999, background: riskColor(c.riskLevel) }}
                title={`risk: ${c.riskLevel}`}
              />
              <span style={{ fontSize: '0.62rem', color: riskColor(c.riskLevel) }}>{c.riskLevel} risk</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'var(--ink-4)' }}>
                {c.evaluated ? c.gate.replace(/_/g, ' ') : 'uncalled'}
              </span>
            </div>
          </button>
        );
      })}

      <button
        onClick={onNewCue}
        style={{
          flex: '0 0 auto',
          width: 132,
          borderRadius: 'var(--radius-l)',
          border: '1px dashed var(--border)',
          background: 'transparent',
          color: 'var(--amber)',
          fontSize: '0.78rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        + Cue slip
      </button>
    </div>
  );
}
