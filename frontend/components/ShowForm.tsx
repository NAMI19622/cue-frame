'use client';

import React, { useState } from 'react';
import { Modal, Field, TextInput, TextArea, Select, Button, linesToArray } from './ui';
import { useStore } from '../lib/store';
import { writeAndWait } from '../lib/genlayer';
import { EVENT_TYPES, SHOW_MODES } from '../lib/config';

interface Props {
  onClose: () => void;
  onDone: (message: string, kind: 'ok' | 'err') => void;
}

export default function ShowForm({ onClose, onDone }: Props) {
  const { wallet, connect, refresh } = useStore();
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<string>('awards_show');
  const [showMode, setShowMode] = useState<string>('live');
  const [segments, setSegments] = useState('cold_open\ncategory_block\nq_and_a\nwinner_reveal\ncredits');
  const [rules, setRules] = useState(
    'do not announce the winner before the q_and_a segment ends\nno pyro cue may fire without safety officer confirmation\naudience-facing cues require the responsible role to acknowledge',
  );
  const [roles, setRoles] = useState('stage_manager\naudio\nlighting\ntalent');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!id.trim() || !title.trim()) {
      onDone('Show id and title are required.', 'err');
      return;
    }
    setBusy(true);
    try {
      if (!wallet) await connect();
      await writeAndWait('create_show_spine', [
        id.trim(),
        title.trim(),
        eventType,
        showMode,
        linesToArray(segments),
        linesToArray(rules),
        linesToArray(roles),
      ]);
      await refresh();
      onDone('Show spine created.', 'ok');
      onClose();
    } catch (e: any) {
      onDone(e?.message || 'Failed to create show spine.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Open a show spine" onClose={onClose} wide>
      <Field label="Show id" hint="A short unique slug, for example aurora_finale.">
        <TextInput value={id} onChange={(e) => setId(e.target.value)} placeholder="aurora_finale" />
      </Field>
      <Field label="Title">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Aurora Awards Live Finale" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Event type">
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Show mode">
          <Select value={showMode} onChange={(e) => setShowMode(e.target.value)}>
            {SHOW_MODES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Segment order" hint="One segment per line, in running order.">
        <TextArea value={segments} onChange={(e) => setSegments(e.target.value)} style={{ minHeight: 90 }} />
      </Field>
      <Field label="Show rules" hint="Ordering and safety constraints, one per line.">
        <TextArea value={rules} onChange={(e) => setRules(e.target.value)} style={{ minHeight: 90 }} />
      </Field>
      <Field label="Required roles" hint="Roles that must acknowledge audience-facing cues.">
        <TextArea value={roles} onChange={(e) => setRoles(e.target.value)} style={{ minHeight: 70 }} />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Opening...' : 'Open show spine'}
        </Button>
      </div>
    </Modal>
  );
}
