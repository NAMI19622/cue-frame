'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../lib/store';
import { api, writeAndWait } from '../lib/genlayer';
import type { CueCard, ShowSpine, RoleAck, ShowReceipt } from '../lib/types';
import { bps, downloadJson, gateColor, gateLamp, riskColor, titleCase } from '../lib/format';

import ShowSpineTimeline, { LaneCue } from '../components/ShowSpineTimeline';
import GateLock from '../components/GateLock';
import CueLight from '../components/CueLight';
import ShowReceiptSeal from '../components/ShowReceiptSeal';
import ValidatorPanel from '../components/ValidatorPanel';
import CueRail from '../components/CueRail';
import TransportBar, { TxPhase } from '../components/TransportBar';
import WalletButton from '../components/WalletButton';
import AboutDrawer from '../components/AboutDrawer';
import ShowForm from '../components/ShowForm';
import CueForm from '../components/CueForm';
import AckForm from '../components/AckForm';
import { Button, Toast, Eyebrow } from '../components/ui';

export default function ControlRoomPage() {
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

  // build the timeline lanes from required roles plus responsible roles
  const laneList = useMemo(() => {
    if (!show) return ['stage_manager'];
    const set = new Set<string>(show.requiredRoles);
    cues.forEach((c) => c.responsibleRole && set.add(c.responsibleRole));
    return Array.from(set);
  }, [show, cues]);

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
    }));
  }, [cues, show, laneList, activeCue]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DeskMark />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.02rem', lineHeight: 1 }}>
              CueFrame
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--ink-3)' }}>Run the moment before it happens</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginLeft: 22, fontSize: '0.72rem', color: 'var(--ink-3)' }}>
          <Stat label="Shows" value={summary?.shows} />
          <Stat label="Cues" value={summary?.cues} />
          <Stat label="Ready" value={summary?.ready} />
          <Stat label="Held" value={summary?.held} />
          <Stat label="Blocked" value={summary?.blocked} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            title="Toggle reduced motion"
            style={{
              fontSize: '0.7rem',
              color: 'var(--ink-3)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 11px',
            }}
          >
            {reducedMotion ? 'Motion off' : 'Motion on'}
          </button>
          <button
            onClick={() => setShowAbout(true)}
            style={{
              fontSize: '0.72rem',
              color: 'var(--ink-2)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 13px',
            }}
          >
            Briefing
          </button>
          <WalletButton />
        </div>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 350px', minHeight: 0 }}>
        <aside style={{ borderRight: '1px solid var(--border)', padding: 16, overflow: 'hidden' }}>
          <CueRail
            activeShow={activeShow}
            activeCue={activeCue}
            cues={cues}
            onSelectShow={setActiveShow}
            onSelectCue={setActiveCue}
            onNewShow={() => setShowShowForm(true)}
            onNewCue={() => setShowCueForm(true)}
          />
        </aside>

        <main style={{ overflowY: 'auto', padding: '18px 24px', display: 'grid', gap: 18, alignContent: 'start' }}>
          <section
            style={{
              height: 300,
              borderRadius: 'var(--radius-l)',
              border: '1px solid var(--border)',
              background: 'linear-gradient(180deg, rgba(11,16,32,0.7), rgba(5,5,8,0.4))',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {show ? (
              <ShowSpineTimeline
                lanes={laneList}
                segments={show.segments}
                cues={laneCues}
                reducedMotion={reducedMotion}
                travel={travel}
                travelColor={cue?.evaluated ? gateColor(cue.gate) : '#ffb84d'}
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
              <div style={{ position: 'absolute', left: 14, bottom: 12, fontSize: '0.7rem', color: 'var(--ink-3)' }}>
                <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{show.title}</span>
                <span style={{ marginLeft: 8 }}>{show.showMode} mode</span>
              </div>
            )}
          </section>

          {show && (
            <section
              style={{
                borderRadius: 'var(--radius-l)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: 18,
              }}
            >
              <Eyebrow right={<span style={{ fontSize: '0.66rem', color: 'var(--ink-3)' }}>{show.showRules.length} rules</span>}>
                Show rules
              </Eyebrow>
              <div style={{ display: 'grid', gap: 6 }}>
                {show.showRules.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--ink-2)', lineHeight: 1.4 }}>
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
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {show.requiredRoles.map((r) => (
                  <span
                    key={r}
                    style={{
                      fontSize: '0.68rem',
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
            </section>
          )}

          {cue ? (
            <section
              style={{
                borderRadius: 'var(--radius-l)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: 18,
              }}
            >
              <Eyebrow
                right={
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CueLight lamp={cue.evaluated ? gateLamp(cue.gate) : 'idle'} pulse={busy} />
                    <span style={{ fontSize: '0.66rem', color: riskColor(cue.riskLevel) }}>{cue.riskLevel} risk</span>
                  </span>
                }
              >
                Cue card
              </Eyebrow>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 4 }}>{cue.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginBottom: 12 }}>
                {cue.cueType} | {cue.segment} | {cue.timingWindow} | role: {cue.responsibleRole} |{' '}
                {cue.audienceVisibility.replace(/_/g, ' ')}
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 14 }}>
                {cue.instruction}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <CueList title="Preconditions" items={cue.preconditions} matched={cue.matchedPreconditions} />
                <CueList title="Dependencies" items={cue.dependencies} issues={cue.dependencyIssues} />
              </div>

              {cue.fallbackInstruction && (
                <div style={{ marginTop: 12, fontSize: '0.76rem', color: 'var(--ink-3)' }}>
                  <span style={{ color: 'var(--cyan)' }}>Fallback:</span> {cue.fallbackInstruction}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <Button variant="ghost" onClick={() => setShowAckForm(true)}>
                  Log acknowledgement
                </Button>
                {!cue.evaluated && (
                  <Button onClick={() => evaluateCue(cue)} disabled={busy}>
                    {busy ? 'Calling...' : 'Call cue through gate'}
                  </Button>
                )}
                {cue.evaluated && (cue.gate === 'READY' || cue.gate === 'READY_WITH_CAUTION') && cue.status !== 'complete' && (
                  <Button onClick={() => sealCueReceipt(cue)} disabled={busy}>
                    Seal cue receipt
                  </Button>
                )}
              </div>

              {acks.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: '0.64rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
                    Acknowledgements
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {acks.map((a) => (
                      <span
                        key={a.id}
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--ink-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-pill)',
                          padding: '3px 9px',
                        }}
                        title={a.ackText}
                      >
                        {a.role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : (
            show && (
              <div
                style={{
                  borderRadius: 'var(--radius-l)',
                  border: '1px dashed var(--border)',
                  padding: 36,
                  textAlign: 'center',
                  color: 'var(--ink-3)',
                }}
              >
                <p style={{ marginBottom: 14, lineHeight: 1.6 }}>
                  Select a cue from the stack, or write a new cue card for this spine.
                </p>
                <Button onClick={() => setShowCueForm(true)}>Write a cue card</Button>
              </div>
            )
          )}
        </main>

        <aside style={{ borderLeft: '1px solid var(--border)', padding: 16, overflowY: 'auto' }}>
          <Eyebrow>Cue gate</Eyebrow>
          {cue?.evaluated ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={cue.gate}
                  initial={{ opacity: 0, scale: 0.96 }}
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
                {(cue.riskFlags.length > 0 || cue.requiredActions.length > 0) && (
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

              <Button variant="ghost" onClick={() => downloadJson(`${cue.id}.json`, cue)} style={{ width: '100%' }}>
                Export cue JSON
              </Button>
            </div>
          ) : cue ? (
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--ink-3)',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: 16,
                lineHeight: 1.5,
              }}
            >
              This cue has not been called through the gate yet. Call it to settle a READY, HOLD, REVISION, BLOCK, or
              confirmation outcome under consensus.
            </div>
          ) : (
            <ValidatorPanel validators={[]} />
          )}

          {show && (
            <div style={{ marginTop: 22 }}>
              <Eyebrow
                right={
                  <Button variant="ghost" onClick={sealShowReceipt} disabled={busy} style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                    Seal
                  </Button>
                }
              >
                Run of show
              </Eyebrow>
              {showReceipt ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ShowReceiptSeal receipt={showReceipt} animate={false} />
                </div>
              ) : (
                <div style={{ fontSize: '0.74rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>
                  No run-of-show receipt sealed yet. Seal one to tally how many cues cleared.
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      <TransportBar phase={txPhase} hash={txHash} message={txMessage} />

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

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
      <span className="mono" style={{ color: 'var(--ink)', fontSize: '0.9rem' }}>
        {value ?? '..'}
      </span>
      <span style={{ fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function CueList({
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

function DeskMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <defs>
        <linearGradient id="deskmark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb84d" />
          <stop offset="55%" stopColor="#e85dce" />
          <stop offset="100%" stopColor="#4debff" />
        </linearGradient>
      </defs>
      <rect x="3" y="6" width="28" height="22" rx="4" fill="none" stroke="url(#deskmark)" strokeWidth="1.5" />
      <circle cx="11" cy="17" r="3" fill="#56f29a" />
      <circle cx="17" cy="17" r="3" fill="#ffb84d" />
      <circle cx="23" cy="17" r="3" fill="#ff5c73" />
    </svg>
  );
}
