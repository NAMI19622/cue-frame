'use client';

import React from 'react';
import type { ValidatorResult } from '../lib/types';
import { VALIDATOR_LABELS } from '../lib/config';

// The validator panel: each backstop check the contract recomputed on every
// node, with a pass / fail lamp and whether it blocks the cue.
export default function ValidatorPanel({
  validators,
  active = false,
}: {
  validators: ValidatorResult[];
  active?: boolean;
}) {
  if (!validators || validators.length === 0) {
    return (
      <div
        style={{
          fontSize: '0.76rem',
          color: 'var(--ink-3)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-m)',
          padding: 16,
          lineHeight: 1.5,
        }}
      >
        No cue evaluated yet. The validator panel lights up once a cue passes through the gate.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {validators.map((v, i) => {
        const color = v.blocks ? 'var(--hold-red)' : v.passed ? 'var(--go)' : 'var(--amber)';
        return (
          <div
            key={v.validator}
            className={active ? 'rise' : undefined}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '9px 11px',
              borderRadius: 'var(--radius-m)',
              border: '1px solid var(--border)',
              background: 'rgba(246,231,200,0.02)',
              animationDelay: active ? `${i * 70}ms` : undefined,
            }}
          >
            <span
              style={{
                marginTop: 3,
                width: 9,
                height: 9,
                borderRadius: 999,
                background: color,
                boxShadow: `0 0 8px ${color}`,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                {VALIDATOR_LABELS[v.validator] || v.validator}
                {v.blocks && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: '0.58rem',
                      letterSpacing: '0.12em',
                      color: 'var(--hold-red)',
                      border: '1px solid rgba(255,92,115,0.4)',
                      borderRadius: 'var(--radius-s)',
                      padding: '1px 5px',
                    }}
                  >
                    BLOCKS
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-3)', lineHeight: 1.4, marginTop: 2 }}>
                {v.reason}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
