'use client';

import React from 'react';
import type { ShowReceipt } from '../lib/types';

interface Props {
  receipt: ShowReceipt;
  animate?: boolean;
}

// A run-of-show seal: a punched call-sheet medallion stamped when a show
// receipt is recorded. It tallies ready / holding / blocked cues.
export default function ShowReceiptSeal({ receipt, animate = true }: Props) {
  const total = Math.max(receipt.cuesTotal, 1);
  const segs = [
    { v: receipt.cuesReady, c: 'var(--go)' },
    { v: receipt.cuesHeld, c: 'var(--amber)' },
    { v: receipt.cuesBlocked, c: 'var(--hold-red)' },
  ];
  let acc = 0;
  const circ = 2 * Math.PI * 46;

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
          {/* punched edge */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const x = 66 + Math.cos(a) * 58;
            const y = 66 + Math.sin(a) * 58;
            return <circle key={i} cx={x} cy={y} r={2.4} fill="rgba(246,231,200,0.22)" />;
          })}
          <circle cx="66" cy="66" r="52" fill="rgba(5,5,8,0.5)" stroke="rgba(246,231,200,0.18)" strokeWidth="1" />
          {/* tally ring */}
          <g transform="rotate(-90 66 66)">
            {segs.map((s, i) => {
              const frac = s.v / total;
              const len = circ * frac;
              const el = (
                <circle
                  key={i}
                  cx="66"
                  cy="66"
                  r="46"
                  fill="none"
                  stroke={s.c}
                  strokeWidth="6"
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={-acc}
                  strokeLinecap="butt"
                />
              );
              acc += len;
              return el;
            })}
          </g>
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
          }}
        >
          <span style={{ fontSize: '0.52rem', letterSpacing: '0.16em', color: 'var(--ink-3)' }}>RUN OF SHOW</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--ink)' }}>
            {receipt.cuesReady}/{receipt.cuesTotal}
          </span>
          <span style={{ fontSize: '0.56rem', color: 'var(--ink-3)' }}>cues cleared</span>
        </div>
      </div>
      <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--ink-3)' }} title={receipt.proofHash}>
        {receipt.proofHash}
      </div>
    </div>
  );
}
