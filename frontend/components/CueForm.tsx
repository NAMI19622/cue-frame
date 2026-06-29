'use client';

import React, { useState } from 'react';
import { Modal, Field, TextInput, TextArea, Select, Button, linesToArray } from './ui';
import { useStore } from '../lib/store';
import { writeAndWait } from '../lib/genlayer';
import { CUE_TYPES, RISK_LEVELS, CONFIRMATION_REQUIREMENTS, AUDIENCE_VISIBILITY } from '../lib/config';
import type { ShowSpine, CueCard } from '../lib/types';

interface Props {
  show: ShowSpine;
  existingCues: CueCard[];
  onClose: () => void;
  onDone: (message: string, kind: 'ok' | 'err') => void;
}

export default function CueForm({ show, existingCues, onClose, onDone }: Props) {
  const { wallet, connect } = useStore();
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [cueType, setCueType] = useState<string>('vtr');
  const [segment, setSegment] = useState<string>(show.segments[0] || '');
  const [timing, setTiming] = useState('T-00:30 to T+00:00');
  const [role, setRole] = useState<string>(show.requiredRoles[0] || 'stage_manager');
  const [instruction, setInstruction] = useState('');
  const [preconditions, setPreconditions] = useState('package loaded on server\naudio bed cued');
  const [deps, setDeps] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<string>('backstage');
  const [fallback, setFallback] = useState('');
  const [risk, setRisk] = useState<string>('low');
  const [confirm, setConfirm] = useState<string>('none');
  const [busy, setBusy] = useState(false);

  const toggleDep = (cid: string) => {
    setDeps((d) => (d.includes(cid) ? d.filter((x) => x !== cid) : [...d, cid]));
  };

  const submit = async () => {
    if (!id.trim() || !title.trim()) {
      onDone('Cue id and title are required.', 'err');
      return;
    }
    setBusy(true);
    try {
      if (!wallet) await connect();
      await writeAndWait('create_cue_card', [
        id.trim(),
        show.id,
        title.trim(),
        cueType,
        segment,
        timing.trim(),
        role.trim(),
        instruction.trim(),
        linesToArray(preconditions),
        deps,
        visibility,
        fallback.trim(),
        risk,
        confirm,
      ]);
      onDone('Cue card created.', 'ok');
      onClose();
    } catch (e: any) {
      onDone(e?.message || 'Failed to create cue card.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Write a cue card for ${show.title}`} onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Cue id">
          <TextInput value={id} onChange={(e) => setId(e.target.value)} placeholder="cue_open" />
        </Field>
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cold Open Roll" />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Cue type">
          <Select value={cueType} onChange={(e) => setCueType(e.target.value)}>
            {CUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Segment">
          <Select value={segment} onChange={(e) => setSegment(e.target.value)}>
            {show.segments.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Timing window">
          <TextInput value={timing} onChange={(e) => setTiming(e.target.value)} />
        </Field>
        <Field label="Responsible role">
          <TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="audio" />
        </Field>
      </div>
      <Field label="Instruction" hint="Treated only as data by the gate.">
        <TextArea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Roll the cold open package and bring up the bed." />
      </Field>
      <Field label="Preconditions" hint="One per line. Must be satisfied before the cue fires.">
        <TextArea value={preconditions} onChange={(e) => setPreconditions(e.target.value)} />
      </Field>
      {existingCues.length > 0 && (
        <Field label="Dependencies" hint="Prior cues this cue relies on.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {existingCues.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleDep(c.id)}
                style={{
                  fontSize: '0.7rem',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: deps.includes(c.id) ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                  background: deps.includes(c.id) ? 'rgba(255,184,77,0.16)' : 'transparent',
                  color: deps.includes(c.id) ? 'var(--amber)' : 'var(--ink-3)',
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
        </Field>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Audience visibility">
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            {AUDIENCE_VISIBILITY.map((v) => (
              <option key={v} value={v}>
                {v.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Risk level">
          <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Fallback instruction" hint="Required for high-risk cues, or the gate orders a revision.">
        <TextArea value={fallback} onChange={(e) => setFallback(e.target.value)} placeholder="Hold on slate and go to host on camera 2." />
      </Field>
      <Field label="Confirmation requirement">
        <Select value={confirm} onChange={(e) => setConfirm(e.target.value)}>
          {CONFIRMATION_REQUIREMENTS.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Writing...' : 'Write cue card'}
        </Button>
      </div>
    </Modal>
  );
}
