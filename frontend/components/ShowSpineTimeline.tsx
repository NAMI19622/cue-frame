'use client';

import React, { useMemo } from 'react';

export interface LaneCue {
  id: string;
  title: string;
  laneIndex: number; // which role lane
  segmentIndex: number; // position along the spine
  color: string; // gate color
  active: boolean; // currently selected
  evaluated: boolean;
  cueType?: string;
  riskColor?: string;
  riskLevel?: string;
  gateLabel?: string;
  ackCount?: number;
  onSelect?: () => void;
}

interface Props {
  lanes: string[]; // role lane labels
  segments: string[]; // segment columns
  cues: LaneCue[];
  reducedMotion?: boolean;
  // travel: 0..1 of a cue pulse traveling along the spine during evaluation.
  travel?: number;
  travelColor?: string;
  onAddCue?: () => void;
}

// The Show Spine rundown. A real run-of-show grid: segment columns across the
// top, role lanes down the side, and cue blocks plotted at their segment/role
// position with title, cue-light state, and risk. A now-line playhead runs
// down the grid. When a show has no cues, a seeded skeleton run-of-show is
// rendered with a clear call to add cues, never a blank grid.
export default function ShowSpineTimeline({
  lanes,
  segments,
  cues,
  reducedMotion = false,
  travel = -1,
  travelColor = '#ffb84d',
  onAddCue,
}: Props) {
  const segCount = Math.max(segments.length, 1);
  const laneCount = Math.max(lanes.length, 1);
  const isEmpty = cues.length === 0;

  // Group cues into grid cells keyed by lane:segment.
  const cellMap = useMemo(() => {
    const m = new Map<string, LaneCue[]>();
    for (const c of cues) {
      const lane = Math.min(Math.max(c.laneIndex, 0), laneCount - 1);
      const seg = Math.min(Math.max(c.segmentIndex, 0), segCount - 1);
      const key = `${lane}:${seg}`;
      const arr = m.get(key) || [];
      arr.push(c);
      m.set(key, arr);
    }
    return m;
  }, [cues, laneCount, segCount]);

  // Skeleton placement for the empty state, spread across the rundown so it
  // reads like a populated run-of-show waiting for real cues.
  const skeleton = useMemo(() => {
    if (!isEmpty) return [] as { lane: number; seg: number; label: string }[];
    const picks: { lane: number; seg: number; label: string }[] = [];
    const labels = ['Top of show', 'Roll package', 'Talent live', 'Transition', 'Audience moment', 'Wrap'];
    const count = Math.min(labels.length, Math.max(3, Math.min(segCount, 6)));
    for (let i = 0; i < count; i++) {
      const seg = Math.floor((i / Math.max(count - 1, 1)) * (segCount - 1));
      const lane = laneCount > 1 ? i % laneCount : 0;
      picks.push({ lane, seg, label: labels[i] });
    }
    return picks;
  }, [isEmpty, segCount, laneCount]);

  const gridTemplateColumns = `132px repeat(${segCount}, minmax(96px, 1fr))`;
  const playheadPct = travel >= 0 ? travel : 0.5;

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'auto',
        padding: '6px 14px 12px',
      }}
    >
      <div style={{ position: 'relative', minWidth: segCount * 96 + 132, height: '100%' }}>
        {/* now-line playhead overlaid on the grid track area */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 26,
            bottom: 6,
            left: `calc(132px + (100% - 132px) * ${playheadPct})`,
            width: 0,
            borderLeft:
              travel >= 0
                ? `2px solid ${travelColor}`
                : '1px dashed rgba(246,231,200,0.22)',
            boxShadow: travel >= 0 ? `0 0 14px ${travelColor}` : 'none',
            zIndex: 3,
            pointerEvents: 'none',
            animation: travel < 0 && !reducedMotion ? 'cf-playhead 3.4s ease-in-out infinite' : undefined,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: -18,
              left: -16,
              fontSize: '0.5rem',
              letterSpacing: '0.14em',
              color: travel >= 0 ? travelColor : 'var(--ink-3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            NOW
          </span>
        </div>

        {/* segment header row */}
        <div style={{ display: 'grid', gridTemplateColumns, alignItems: 'end', gap: 0 }}>
          <div
            style={{
              fontSize: '0.52rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              padding: '4px 8px',
            }}
          >
            Role / Segment
          </div>
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderLeft: '1px solid var(--border)',
                minWidth: 0,
              }}
            >
              <span className="mono" style={{ fontSize: '0.5rem', color: 'var(--amber)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--ink-2)',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={seg}
              >
                {seg}
              </span>
            </div>
          ))}
        </div>

        {/* role lane rows */}
        {lanes.map((lane, li) => (
          <div
            key={li}
            style={{
              display: 'grid',
              gridTemplateColumns,
              borderTop: '1px solid var(--border)',
              minHeight: 58,
            }}
          >
            {/* lane label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                background: 'rgba(5,5,8,0.35)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 28,
                  borderRadius: 2,
                  background: 'var(--cyan)',
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--ink-2)',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={lane}
              >
                {lane}
              </span>
            </div>

            {/* segment cells for this lane */}
            {Array.from({ length: segCount }).map((_, si) => {
              const cell = cellMap.get(`${li}:${si}`) || [];
              const ghost = skeleton.filter((s) => s.lane === li && s.seg === si);
              return (
                <div
                  key={si}
                  style={{
                    position: 'relative',
                    borderLeft: '1px solid var(--border)',
                    padding: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    background: si % 2 === 0 ? 'transparent' : 'rgba(246,231,200,0.012)',
                  }}
                >
                  {cell.map((c) => (
                    <CueBlock key={c.id} cue={c} reducedMotion={reducedMotion} />
                  ))}
                  {ghost.map((g, gi) => (
                    <GhostBlock key={gi} label={g.label} onClick={onAddCue} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* empty-state call to action, floated over the seeded skeleton */}
      {isEmpty && (
        <div
          style={{
            position: 'absolute',
            right: 18,
            bottom: 14,
            maxWidth: 280,
            background: 'rgba(5,5,8,0.78)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-m)',
            padding: '12px 14px',
            zIndex: 4,
            boxShadow: 'var(--shadow-2)',
          }}
        >
          <div
            style={{
              fontSize: '0.58rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--amber)',
              marginBottom: 6,
            }}
          >
            Empty rundown
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 10 }}>
            This is a seeded run-of-show skeleton. Drop real cue slips into the
            segments and role lanes to build the rundown.
          </p>
          {onAddCue && (
            <button
              onClick={onAddCue}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '6px 13px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-strong)',
                background: 'linear-gradient(180deg, rgba(255,184,77,0.28), rgba(255,184,77,0.1))',
                color: 'var(--ink)',
              }}
            >
              + Add first cue
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CueBlock({ cue, reducedMotion }: { cue: LaneCue; reducedMotion: boolean }) {
  const lampColor = cue.evaluated ? cue.color : 'var(--ink-3)';
  return (
    <button
      onClick={cue.onSelect}
      title={cue.title}
      className={cue.active && !reducedMotion ? 'rise' : undefined}
      style={{
        position: 'relative',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: '6px 8px 6px 10px',
        borderRadius: 6,
        border: cue.active ? `1px solid ${cue.color}` : '1px solid var(--border)',
        background: cue.active
          ? 'linear-gradient(180deg, rgba(255,184,77,0.16), rgba(24,32,46,0.6))'
          : 'rgba(24,32,46,0.7)',
        boxShadow: cue.active ? `0 0 16px ${cue.color}44` : 'none',
        overflow: 'hidden',
        cursor: cue.onSelect ? 'pointer' : 'default',
        width: '100%',
      }}
    >
      {/* gate/status edge */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: lampColor,
          opacity: cue.evaluated ? 0.95 : 0.5,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: lampColor,
            boxShadow: cue.evaluated ? `0 0 8px ${lampColor}` : 'none',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '0.66rem',
            fontWeight: 600,
            color: 'var(--ink)',
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {cue.title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {cue.riskLevel && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: cue.riskColor || 'var(--ink-3)',
              }}
            />
            <span style={{ fontSize: '0.52rem', color: cue.riskColor || 'var(--ink-3)' }}>
              {cue.riskLevel}
            </span>
          </span>
        )}
        <span
          className="mono"
          style={{ fontSize: '0.5rem', color: cue.evaluated ? lampColor : 'var(--ink-4)' }}
        >
          {cue.evaluated ? cue.gateLabel || 'settled' : 'uncalled'}
        </span>
      </div>
    </button>
  );
}

function GhostBlock({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: '6px 8px',
        borderRadius: 6,
        border: '1px dashed var(--border)',
        background: 'rgba(246,231,200,0.02)',
        cursor: onClick ? 'pointer' : 'default',
        width: '100%',
      }}
    >
      <span style={{ fontSize: '0.62rem', color: 'var(--ink-3)', fontWeight: 600, lineHeight: 1.15 }}>
        {label}
      </span>
      <span className="mono" style={{ fontSize: '0.5rem', color: 'var(--ink-4)' }}>
        cue slot
      </span>
    </button>
  );
}
