'use client';

import React from 'react';
import { useStore } from '../lib/store';
import type { CueCard, ShowSpine } from '../lib/types';
import { Button } from './ui';
import CueLight from './CueLight';
import { gateLamp, riskColor } from '../lib/format';

interface Props {
  activeShow: string | null;
  activeCue: string | null;
  cues: CueCard[];
  onSelectShow: (id: string) => void;
  onSelectCue: (id: string) => void;
  onNewShow: () => void;
  onNewCue: () => void;
}

export default function CueRail({
  activeShow,
  activeCue,
  cues,
  onSelectShow,
  onSelectCue,
  onNewShow,
  onNewCue,
}: Props) {
  const { shows } = useStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.64rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Shows
        </span>
        <button
          onClick={onNewShow}
          style={{
            fontSize: '0.7rem',
            color: 'var(--amber)',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            padding: '4px 9px',
          }}
        >
          + Show
        </button>
      </div>

      <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
        {shows.length === 0 && (
          <div style={{ fontSize: '0.74rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>
            No shows yet. Open a show spine to begin the run-of-show.
          </div>
        )}
        {shows.map((s: ShowSpine) => (
          <button
            key={s.id}
            onClick={() => onSelectShow(s.id)}
            style={{
              textAlign: 'left',
              padding: '9px 11px',
              borderRadius: 'var(--radius-m)',
              border: activeShow === s.id ? '1px solid var(--border-strong)' : '1px solid var(--border)',
              background: activeShow === s.id ? 'rgba(255,184,77,0.1)' : 'rgba(246,231,200,0.02)',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>{s.title}</div>
            <div style={{ fontSize: '0.66rem', color: 'var(--ink-3)' }}>
              {s.eventType.replace(/_/g, ' ')} | {s.cueCount} cues
            </div>
          </button>
        ))}
      </div>

      {activeShow && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span
              style={{ fontSize: '0.64rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}
            >
              Cue stack
            </span>
            <button
              onClick={onNewCue}
              style={{
                fontSize: '0.7rem',
                color: 'var(--amber)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 9px',
              }}
            >
              + Cue
            </button>
          </div>
          <div style={{ display: 'grid', gap: 6, overflowY: 'auto', minHeight: 0, flex: 1 }}>
            {cues.length === 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>No cues on this spine yet.</div>
            )}
            {cues.map((c) => {
              const lamp = c.evaluated ? gateLamp(c.gate) : 'idle';
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCue(c.id)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 11px',
                    borderRadius: 'var(--radius-m)',
                    border: activeCue === c.id ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                    background: activeCue === c.id ? 'rgba(77,235,255,0.08)' : 'rgba(246,231,200,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                  }}
                >
                  <CueLight lamp={lamp} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.title}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--ink-3)' }}>
                      {c.segment} | {c.cueType}
                    </span>
                  </span>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: riskColor(c.riskLevel),
                      flexShrink: 0,
                    }}
                    title={`risk: ${c.riskLevel}`}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <Button variant="ghost" onClick={onNewShow} style={{ width: '100%' }}>
          New show spine
        </Button>
      </div>
    </div>
  );
}
