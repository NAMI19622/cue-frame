'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { api, writeAndWait } from '../lib/genlayer';
import type { CueCard, ShowSpine, RoleAck, ShowReceipt } from '../lib/types';
import { gateColor, gateLabel, riskColor } from '../lib/format';

import ShowSpineTimeline, { LaneCue } from '../components/ShowSpineTimeline';
import GateLock from '../components/GateLock';
import ShowReceiptSeal from '../components/ShowReceiptSeal';
import ValidatorPanel from '../components/ValidatorPanel';
import CueLane from '../components/CueLane';
import OnAirGate from '../components/OnAirGate';
import OnAirBar from '../components/OnAirBar';
import TransportBar, { TxPhase } from '../components/TransportBar';
import AboutDrawer from '../components/AboutDrawer';
import ShowForm from '../components/ShowForm';
import CueForm from '../components/CueForm';
import AckForm from '../components/AckForm';
import { Button, Toast, Eyebrow } from '../components/ui';

export default function CommandCenterPage() {
  const store = useStore();
  const { shows, summary, wallet, reducedMotion, setReducedMotion, refresh } = store;

  const [activeShow, setActiveShow] = useState<string | null>(null);
  const [activeCue, setActiveCue] = useState<string | null>(null);
  const [cues, setCues] = useState<CueCard[]>([]);
  const [acks, setAcks] = useState<RoleAck[]>([]);
  const [showReceipt, setShowReceipt] = useState<ShowReceipt | null>(null);

  const [txPhase, setTxPhase] = useState<TxPhase>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [txMessage, setTxMessage] = useState<string | undefined>();
  const [travel, setTravel] = useState(-1);
  const [gateAnim, setGateAnim] = useState(false);

  const [gateOpen, setGateOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showShowForm, setShowShowForm] = useState(false);
  const [showCueForm, setShowCueForm] = useState(false);
  const [showAckForm, setShowAckForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: 'ok' | 'err' } | null>(null);
  const travelTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = useCallback((message: string, kind: 'ok' | 'err') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    if (!activeShow && shows.length > 0) setActiveShow(shows[0].id);
  }, [shows, activeShow]);

  const show: ShowSpine | undefined = useMemo(
    () => shows.find((s) => s.id === activeShow),
    [shows, activeShow],
  );
  const cue: CueCard | undefined = useMemo(() => cues.find((c) => c.id === activeCue), [cues, activeCue]);

  const loadCues = useCallback(async (showId: string) => {
    try {
      const page = await api.getCuesForShow(showId, 0, 20);
      setCues(page.items);
    } catch {
      setCues([]);
    }
  }, []);

  const loadShowReceipt = useCallback(async (showId: string) => {
    try {
      const rc = await api.getReceiptForShow(showId);
      setShowReceipt(rc);
    } catch {
      setShowReceipt(null);
    }
  }, []);

  useEffect(() => {
    if (activeShow) {
      loadCues(activeShow);
      loadShowReceipt(activeShow);
      setActiveCue(null);
    }
  }, [activeShow, loadCues, loadShowReceipt]);

  const loadAcks = useCallback(async (cueId: string) => {
    try {
      const page = await api.getAcksForCue(cueId, 0, 20);
      setAcks(page.items);
    } catch {
      setAcks([]);
    }
  }, []);

  useEffect(() => {
    if (activeCue) loadAcks(activeCue);
    else setAcks([]);
    setGateAnim(false);
  }, [activeCue, loadAcks]);

  // Build the timeline lanes from required roles plus responsible roles.
  const laneList = useMemo(() => {
    if (!show) return ['stage_manager'];
    const set = new Set<string>(show.requiredRoles);
    cues.forEach((c) => c.responsibleRole && set.add(c.responsibleRole));
    return Array.from(set);
  }, [show, cues]);

  const selectCue = useCallback((id: string) => {
    setActiveCue(id);
    setGateOpen(true);
  }, []);

  const laneCues: LaneCue[] = useMemo(() => {
    if (!show) return [];
    return cues.map((c) => ({
      id: c.id,
      title: c.title,
      laneIndex: Math.max(0, laneList.indexOf(c.responsibleRole)),
      segmentIndex: Math.max(0, show.segments.indexOf(c.segment)),
      color: c.evaluated ? gateColor(c.gate) : '#8c8597',
      active: c.id === activeCue,
      evaluated: c.evaluated,
      cueType: c.cueType,
      riskColor: riskColor(c.riskLevel),
      riskLevel: c.riskLevel,
      gateLabel: c.evaluated ? gateLabel(c.gate) : undefined,
      ackCount: c.ackCount,
      onSelect: () => selectCue(c.id),
    }));
  }, [cues, show, laneList, activeCue, selectCue]);

  const startTravel = useCallback(() => {
    setTravel(0);
    if (travelTimer.current) clearInterval(travelTimer.current);
    travelTimer.current = setInterval(() => {
      setTravel((p) => {
        if (p < 0) return p;
        const next = p + 0.02;
        return next >= 0.98 ? 0.04 : next;
      });
    }, 90);
  }, []);

  const stopTravel = useCallback(() => {
    if (travelTimer.current) clearInterval(travelTimer.current);
    setTravel(-1);
  }, []);

  const evaluateCue = useCallback(
    async (target: CueCard) => {
      if (!show) return;
      try {
        if (!wallet) await store.connect();
        setTxPhase('signing');
        setTxMessage('Calling the cue through the gate.');
        startTravel();
        const { hash } = await writeAndWait('evaluate_cue_gate', [target.id], (p) => {
          if (p.hash) setTxHash(p.hash);
          if (p.statusName === 'PENDING') {
            setTxPhase('pending');
            setTxMessage('The gate is deliberating. An AI consensus round can take 1 to 5 minutes.');
          }
        });
        stopTravel();
        setTxPhase('accepted');
        setTxHash(hash);
        setTxMessage('Cue decision settled on-chain.');
        await loadCues(show.id);
        const updated = await api.getCue(target.id);
        setActiveCue(updated.id);
        setGateAnim(true);
        await refresh();
        notify('Gate settled: ' + updated.gate.replace(/_/g, ' '), 'ok');
      } catch (e: any) {
        stopTravel();
        setTxPhase('error');
        setTxMessage(e?.message || 'The cue did not settle.');
        notify(e?.message || 'Transaction failed.', 'err');
      }
    },
    [show, wallet, store, loadCues, refresh, notify, startTravel, stopTravel],
  );

  const sealCueReceipt = useCallback(
    async (target: CueCard) => {
      if (!show) return;
      try {
        if (!wallet) await store.connect();
        setTxPhase('signing');
        setTxMessage('Sealing the cue receipt on-chain.');
        await writeAndWait('record_cue_receipt', [target.id], (p) => {
          if (p.hash) setTxHash(p.hash);
          if (p.statusName === 'PENDING') setTxPhase('pending');
        });
        setTxPhase('accepted');
        setTxMessage('Cue receipt sealed.');
        await loadCues(show.id);
        await refresh();
        notify('Cue receipt sealed.', 'ok');
      } catch (e: any) {
        setTxPhase('error');
        notify(e?.message || 'Failed to seal receipt.', 'err');
      }
    },
    [show, wallet, store, loadCues, refresh, notify],
  );

  const sealShowReceipt = useCallback(async () => {
    if (!show) return;
    try {
      if (!wallet) await store.connect();
      setTxPhase('signing');
      setTxMessage('Sealing the run-of-show receipt.');
      await writeAndWait('record_show_receipt', [show.id], (p) => {
        if (p.hash) setTxHash(p.hash);
        if (p.statusName === 'PENDING') setTxPhase('pending');
      });
      setTxPhase('accepted');
      setTxMessage('Run-of-show receipt sealed.');
      await loadShowReceipt(show.id);
      await refresh();
      notify('Run-of-show receipt sealed.', 'ok');
    } catch (e: any) {
      setTxPhase('error');
      notify(e?.message || 'Failed to seal show receipt.', 'err');
    }
  }, [show, wallet, store, loadShowReceipt, refresh, notify]);

  const busy = txPhase === 'pending' || txPhase === 'signing';

  // Acknowledgement tally per role lane, drawn as lanes under the spine.
  const ackByRole = useMemo(() => {
    const m = new Map<string, number>();
    cues.forEach((c) => {
      if (c.responsibleRole) m.set(c.responsibleRole, (m.get(c.responsibleRole) || 0) + c.ackCount);
    });
    return m;
  }, [cues]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <OnAirBar
        showTitle={show?.title}
        showMode={show?.showMode}
        summary={summary}
        held={summary?.held ?? 0}
        blocked={summary?.blocked ?? 0}
        ready={summary?.ready ?? 0}
        liveRound={busy}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        onBriefing={() => setShowAbout(true)}
      />

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '16px 22px 28px',
        }}
      >
        {/* ============ ZONE 1: full-width Show Spine hero ============ */}
        <section
          className={reducedMotion ? undefined : 'curtain'}
          style={{
            borderRadius: 'var(--radius-l)',
            border: '1px solid var(--border)',
            background: 'linear-gradient(180deg, rgba(11,16,32,0.72), rgba(5,5,8,0.42))',
            overflow: 'hidden',
          }}
        >
          {/* show selector + transport now-line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              padding: '14px 18px 10px',
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                Show spine
              </span>
              {shows.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveShow(s.id)}
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    padding: '6px 13px',
                    borderRadius: 'var(--radius-pill)',
                    border: activeShow === s.id ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                    background: activeShow === s.id ? 'rgba(255,184,77,0.14)' : 'transparent',
                    color: activeShow === s.id ? 'var(--ink)' : 'var(--ink-3)',
                  }}
                >
                  {s.title}
                </button>
              ))}
              <button
                onClick={() => setShowShowForm(true)}
                style={{
                  fontSize: '0.74rem',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                  color: 'var(--amber)',
                }}
              >
                + Show
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <TransportBar phase={txPhase} hash={txHash} message={txMessage} embedded />
            </div>
          </div>

          {/* full-viewport-width canvas timeline: the dominant hero surface */}
          <div style={{ position: 'relative', height: 320 }}>
            {show ? (
              <ShowSpineTimeline
                lanes={laneList}
                segments={show.segments}
                cues={laneCues}
                reducedMotion={reducedMotion}
                travel={travel}
                travelColor={cue?.evaluated ? gateColor(cue.gate) : '#ffb84d'}
                onAddCue={() => setShowCueForm(true)}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-3)',
                  fontSize: '0.85rem',
                }}
              >
                Open a show spine to lay out the timeline.
              </div>
            )}
            {show && (
              <div style={{ position: 'absolute', left: 16, bottom: 12, fontSize: '0.7rem', color: 'var(--ink-3)' }}>
                <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{show.title}</span>
                <span style={{ marginLeft: 8 }}>{show.showMode} mode</span>
              </div>
            )}
          </div>

          {/* role / acknowledgement lanes beneath the spine */}
          {show && laneList.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                padding: '10px 18px 16px',
                borderTop: '1px solid var(--border)',
              }}
            >
              {laneList.map((role) => (
                <span
                  key={role}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.68rem',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 11px',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--cyan)' }} />
                  {role}
                  <span className="mono" style={{ color: 'var(--ink-4)' }}>
                    {ackByRole.get(role) || 0} ack
                  </span>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ============ ZONE 2: broadcast gallery ============ */}
        {show ? (
          <>
            {/* horizontal cue lane */}
            <section>
              <Eyebrow right={<span style={{ fontSize: '0.66rem', color: 'var(--ink-3)' }}>{cues.length} cues in running order</span>}>
                Cue ribbon
              </Eyebrow>
              <CueLane
                cues={cues}
                activeCue={activeCue}
                reducedMotion={reducedMotion}
                onSelectCue={selectCue}
                onNewCue={() => setShowCueForm(true)}
              />
            </section>

            {/* large central GATE panel */}
            <section
              style={{
                borderRadius: 'var(--radius-l)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: 20,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                gap: 22,
                alignItems: 'center',
              }}
            >
              <div>
                <Eyebrow>On-air gate</Eyebrow>
                {cue ? (
                  <>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 4 }}>{cue.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginBottom: 12 }}>
                      {cue.cueType} | {cue.segment} | role: {cue.responsibleRole}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 14, maxWidth: 620 }}>
                      {cue.evaluated ? cue.shortReason || cue.instruction : cue.instruction}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Button onClick={() => setGateOpen(true)}>Open on-air gate</Button>
                      {!cue.evaluated && (
                        <Button variant="ghost" onClick={() => evaluateCue(cue)} disabled={busy}>
                          {busy ? 'Calling...' : 'Call through gate'}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 560 }}>
                    Pick a cue slip from the ribbon to bring it up on the gate. The cue gate settles a READY, HOLD,
                    REVISION, BLOCK, or confirmation outcome under validator consensus.
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', minWidth: 160 }}>
                {cue?.evaluated ? (
                  <GateLock gate={cue.gate} confidenceBps={cue.confidenceBps} animate={gateAnim && !reducedMotion} />
                ) : (
                  <GateLock gate="" confidenceBps={0} animate={false} />
                )}
              </div>
            </section>

            {/* bottom bento row: validators + run-of-show receipt + show rules */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
                alignItems: 'start',
              }}
            >
              <BentoCard title="Validators">
                {cue?.evaluated ? (
                  <ValidatorPanel validators={cue.validatorSummary} active={gateAnim} />
                ) : (
                  <ValidatorPanel validators={[]} />
                )}
              </BentoCard>

              <BentoCard
                title="Run of show"
                right={
                  <Button variant="ghost" onClick={sealShowReceipt} disabled={busy} style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                    Seal
                  </Button>
                }
              >
                {showReceipt ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ShowReceiptSeal receipt={showReceipt} animate={false} />
                  </div>
                ) : (
                  <div style={{ fontSize: '0.74rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>
                    No run-of-show receipt sealed yet. Seal one to tally how many cues cleared.
                  </div>
                )}
              </BentoCard>

              <BentoCard title="Show rules" right={<span style={{ fontSize: '0.66rem', color: 'var(--ink-3)' }}>{show.showRules.length}</span>}>
                <div style={{ display: 'grid', gap: 6 }}>
                  {show.showRules.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.76rem', color: 'var(--ink-2)', lineHeight: 1.4 }}>
                      <span className="mono" style={{ color: 'var(--amber)', flexShrink: 0 }}>
                        R{i + 1}
                      </span>
                      {r}
                    </div>
                  ))}
                  {show.showRules.length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--ink-4)' }}>No rules declared on this spine.</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  {show.requiredRoles.map((r) => (
                    <span
                      key={r}
                      style={{
                        fontSize: '0.66rem',
                        color: 'var(--cyan)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '3px 9px',
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </BentoCard>
            </section>
          </>
        ) : (
          <div
            style={{
              borderRadius: 'var(--radius-l)',
              border: '1px dashed var(--border)',
              padding: 48,
              textAlign: 'center',
              color: 'var(--ink-3)',
            }}
          >
            <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
              No show spine open. Open one to lay out a running order and start calling cues through the gate.
            </p>
            <Button onClick={() => setShowShowForm(true)}>Open a show spine</Button>
          </div>
        )}
      </main>

      {/* on-air gate overlay: the cue inspector, not a side rail */}
      {gateOpen && cue && (
        <OnAirGate
          cue={cue}
          busy={busy}
          gateAnim={gateAnim}
          reducedMotion={reducedMotion}
          onClose={() => setGateOpen(false)}
          onEvaluate={evaluateCue}
          onSealCue={sealCueReceipt}
          onAck={() => setShowAckForm(true)}
        />
      )}

      {showAbout && <AboutDrawer onClose={() => setShowAbout(false)} />}
      {showShowForm && <ShowForm onClose={() => setShowShowForm(false)} onDone={notify} />}
      {showCueForm && show && (
        <CueForm show={show} existingCues={cues} onClose={() => setShowCueForm(false)} onDone={notify} />
      )}
      {showAckForm && cue && show && (
        <AckForm
          cue={cue}
          show={show}
          onClose={() => setShowAckForm(false)}
          onDone={(m, k) => {
            notify(m, k);
            if (activeCue) loadAcks(activeCue);
          }}
        />
      )}
      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
    </div>
  );
}

function BentoCard({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-l)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: 18,
        minHeight: 0,
      }}
    >
      <Eyebrow right={right}>{title}</Eyebrow>
      {children}
    </div>
  );
}
