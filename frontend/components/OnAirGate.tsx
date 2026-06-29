'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CueCard } from '../lib/types';
import { gateColor, riskColor, downloadJson } from '../lib/format';
import GateLock from './GateLock';
import CueLight from './CueLight';
import ValidatorPanel from './ValidatorPanel';
import { Button } from './ui';

interface Props {
  cue: CueCard;
  busy: boolean;
  gateAnim: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onEvaluate: (c: CueCard) => void;
  onSealCue: (c: CueCard) => void;
  onAck: () => void;
}

// The on-air gate. Instead of a fixed right-rail inspector, the cue-gate
// inspector opens as a focused overlay over the gallery: the GateLock iris is
// the dominant surface, with reasons, validators, and call actions framed
// around it. Backed by an on-chain update stamp (cf-stamp) when a gate settles.
export default function OnAirGate({
  cue,
  busy,
  gateAnim,
  reducedMotion,
  onClose,
  onEvaluate,
  onSealCue,
  onAck,
}: Props) {
  const evaluated = cue.evaluated;
  const accent = evaluated ? gateColor(cue.gate) : 'var(--amber)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,3,6,0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 65,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 22,
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxWidth: 940,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--surface-solid)',
          border: `1px solid ${accent}`,
          borderRadius: 'var(--radius-l)',
          boxShadow: 'var(--shadow-2)',
          padding: 0,
        }}
      >
        {/* header strip: on-air marquee */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(180deg, rgba(255,92,115,0.08), transparent)',
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              color: accent,
              border: `1px solid ${accent}`,
              borderRadius: 'var(--radius-s)',
              padding: '3px 8px',
            }}
          >
            ON AIR GATE
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: 'var(--ink-3)' }}>
            <CueLight lamp={evaluated ? (cue.gate === 'BLOCKED' ? 'hold' : cue.gate.startsWith('READY') ? 'go' : 'standby') : 'idle'} pulse={busy} />
            <span style={{ color: riskColor(cue.riskLevel) }}>{cue.riskLevel} risk</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: 'auto',
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--ink-2)',
              fontSize: '1.1rem',
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
            gap: 0,
          }}
        >
          {/* left: cue body */}
          <div style={{ padding: 22, borderRight: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 4 }}>{cue.title}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginBottom: 14 }}>
              {cue.cueType} | {cue.segment} | {cue.timingWindow} | role: {cue.responsibleRole} |{' '}
              {cue.audienceVisibility.replace(/_/g, ' ')}
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 16 }}>
              {cue.instruction}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <GateList title="Preconditions" items={cue.preconditions} matched={cue.matchedPreconditions} />
              <GateList title="Dependencies" items={cue.dependencies} issues={cue.dependencyIssues} />
            </div>

            {cue.fallbackInstruction && (
              <div style={{ marginTop: 12, fontSize: '0.76rem', color: 'var(--ink-3)' }}>
                <span style={{ color: 'var(--cyan)' }}>Fallback:</span> {cue.fallbackInstruction}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <Button variant="ghost" onClick={onAck}>
                Log acknowledgement
              </Button>
              {!evaluated && (
                <Button onClick={() => onEvaluate(cue)} disabled={busy}>
                  {busy ? 'Calling...' : 'Call cue through gate'}
                </Button>
              )}
              {evaluated && (cue.gate === 'READY' || cue.gate === 'READY_WITH_CAUTION') && cue.status !== 'complete' && (
                <Button onClick={() => onSealCue(cue)} disabled={busy}>
                  Seal cue receipt
                </Button>
              )}
              {evaluated && (
                <Button variant="ghost" onClick={() => downloadJson(`${cue.id}.json`, cue)}>
                  Export JSON
                </Button>
              )}
            </div>
          </div>

          {/* right: the iris + verdict */}
          <div style={{ padding: 22, display: 'grid', gap: 16, alignContent: 'start' }}>
            {evaluated ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={cue.gate}
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', justifyContent: 'center' }}
                  >
                    <GateLock gate={cue.gate} confidenceBps={cue.confidenceBps} animate={gateAnim && !reducedMotion} />
                  </motion.div>
                </AnimatePresence>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--ink-2)',
                    lineHeight: 1.5,
                    padding: 12,
                    borderRadius: 'var(--radius-m)',
                    border: '1px solid var(--border)',
                    background: 'rgba(246,231,200,0.02)',
                  }}
                >
                  {cue.shortReason || 'No reason recorded.'}
                  {(cue.riskFlags.length > 0 || cue.requiredActions.length > 0 || cue.unresolvedPreconditions.length > 0) && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.7rem', color: 'var(--ink-3)' }}>
                      {cue.riskFlags.length > 0 && <span>Risk flags: {cue.riskFlags.join(', ')}</span>}
                      {cue.requiredActions.length > 0 && <span>Required actions: {cue.requiredActions.join(', ')}</span>}
                      {cue.unresolvedPreconditions.length > 0 && (
                        <span>Unresolved preconditions: {cue.unresolvedPreconditions.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.64rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
                    Validators
                  </div>
                  <ValidatorPanel validators={cue.validatorSummary} active={gateAnim} />
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--ink-3)',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: 18,
                  lineHeight: 1.55,
                  textAlign: 'center',
                }}
              >
                This cue has not been called through the gate. Call it to settle a READY, HOLD, REVISION, BLOCK, or
                confirmation outcome under validator consensus.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GateList({
  title,
  items,
  matched,
  issues,
}: {
  title: string;
  items: string[];
  matched?: string[];
  issues?: string[];
}) {
  return (
    <div>
      <div style={{ fontSize: '0.64rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
        {title}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>(none)</div>
      ) : (
        <div style={{ display: 'grid', gap: 4 }}>
          {items.map((it, i) => {
            const isMatched = matched?.some((m) => m === String(i) || m === it);
            const isIssue = issues?.some((m) => m === it || m === String(i));
            const color = isIssue ? 'var(--hold-red)' : isMatched ? 'var(--go)' : 'var(--ink-2)';
            return (
              <div key={i} style={{ display: 'flex', gap: 7, fontSize: '0.74rem', color, lineHeight: 1.35 }}>
                <span className="mono" style={{ color: 'var(--ink-4)', flexShrink: 0 }}>
                  {i}
                </span>
                {it}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
