'use client';

import React from 'react';
import { CONTRACT_ADDRESS, NETWORK } from '../lib/config';
import { shortAddr } from '../lib/format';

export default function AboutDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,3,6,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 70,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(460px, 100%)',
          height: '100%',
          overflowY: 'auto',
          background: 'var(--surface-solid)',
          borderLeft: '1px solid var(--border-strong)',
          padding: 26,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.1rem' }}>The briefing</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--ink-2)',
            }}
          >
            x
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 16 }}>
          CueFrame turns a live event's run-of-show into a semantic show-control protocol. A team defines a Show Spine
          and writes Cue Cards. The cue gate reads each cue against the spine's rules, the dependencies, and the role
          acknowledgements, then settles one of six outcomes under validator consensus.
        </p>

        <Section title="The cue gate">
          <p style={cssP}>
            Given a cue, its preconditions, its dependencies, and the acknowledgements on record, the gate decides which
            coarse outcome is correct: READY, READY WITH CAUTION, HOLD, NEEDS REVISION, BLOCKED, or PRODUCER
            CONFIRMATION REQUIRED. A leader proposes; every validator re-runs the same judgment and must agree on the
            outcome exactly, agree on whether preconditions remain unresolved, and agree on confidence within tolerance.
          </p>
        </Section>

        <Section title="Why GenLayer">
          <p style={cssP}>
            A static contract can check a signature, not whether a cue is safe to fire. Telling a clean go from a hold,
            an ordering breach from a valid dependency, or a high-risk cue with no fallback is a contextual judgment.
            Because the on-chain outcome governs the cue, it must be a decision many validators reproduce, not the
            private verdict of one server.
          </p>
        </Section>

        <Section title="What code reserves">
          <p style={cssP}>
            The model proposes; deterministic backstops dispose. An audience-facing cue missing a required
            acknowledgement is held. A cue depending on an incomplete prior cue is held. An ordering violation is
            blocked. A high-risk cue with no fallback needs revision; one with a usable fallback settles to ready with
            caution. Cited evidence that is not on the cue is dropped, and READY cannot stand while preconditions remain
            unresolved.
          </p>
        </Section>

        <Section title="The wait">
          <p style={cssP}>
            An AI consensus round on the Bradbury testnet can take one to five minutes. The transport bar stages that
            wait as a cue lifecycle: CUEING, then ON AIR, then SETTLED. That pause is expected, not an error.
          </p>
        </Section>

        <Section title="On-chain coordinates">
          <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--ink-3)', lineHeight: 1.8 }}>
            <div>network: {NETWORK}</div>
            <div title={CONTRACT_ADDRESS}>contract: {shortAddr(CONTRACT_ADDRESS)}</div>
          </div>
        </Section>

        <p style={{ fontSize: '0.72rem', color: 'var(--ink-4)', lineHeight: 1.6, marginTop: 18 }}>
          CueFrame never fires real cues or controls real hardware. It classifies whether a described cue would be ready
          to call. No deposits, no staking, no value transfer; users pay network fees only.
        </p>
      </div>
    </div>
  );
}

const cssP: React.CSSProperties = { fontSize: '0.8rem', color: 'var(--ink-3)', lineHeight: 1.6 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: '0.64rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--amber)',
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
