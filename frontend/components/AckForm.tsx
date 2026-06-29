'use client';

import React, { useState } from 'react';
import { Modal, Field, TextInput, Button } from './ui';
import { useStore } from '../lib/store';
import { writeAndWait } from '../lib/genlayer';
import type { CueCard, ShowSpine } from '../lib/types';

interface Props {
  cue: CueCard;
  show: ShowSpine;
  onClose: () => void;
  onDone: (message: string, kind: 'ok' | 'err') => void;
}

export default function AckForm({ cue, show, onClose, onDone }: Props) {
  const { wallet, connect } = useStore();
  const roleOptions = Array.from(new Set([cue.responsibleRole, ...show.requiredRoles].filter(Boolean)));
  const [role, setRole] = useState<string>(cue.responsibleRole || roleOptions[0] || '');
  const [text, setText] = useState('Standing by, ready on my mark.');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!role.trim()) {
      onDone('Role is required.', 'err');
      return;
    }
    setBusy(true);
    try {
      if (!wallet) await connect();
      const ackId = 'ack_' + cue.id + '_' + role.trim() + '_' + Date.now().toString(36);
      await writeAndWait('submit_role_acknowledgement', [ackId, cue.id, role.trim(), text.trim()]);
      onDone('Acknowledgement logged for ' + role + '.', 'ok');
      onClose();
    } catch (e: any) {
      onDone(e?.message || 'Failed to log acknowledgement.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Acknowledge cue: ${cue.title}`} onClose={onClose}>
      <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 14 }}>
        Only acknowledgements from the cue's responsible role or a required show role count toward readiness. A wrong
        role does not clear the gate.
      </p>
      <Field label="Role" hint="Pick the role you are calling in as.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {roleOptions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                fontSize: '0.7rem',
                padding: '5px 10px',
                borderRadius: 'var(--radius-pill)',
                border: role === r ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                background: role === r ? 'rgba(255,184,77,0.16)' : 'transparent',
                color: role === r ? 'var(--amber)' : 'var(--ink-3)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="audio" />
      </Field>
      <Field label="Acknowledgement">
        <TextInput value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Logging...' : 'Log acknowledgement'}
        </Button>
      </div>
    </Modal>
  );
}
